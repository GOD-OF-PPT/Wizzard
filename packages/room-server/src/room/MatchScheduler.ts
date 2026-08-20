import {
  executeMatchAction,
  planNextMatchAction,
  type MatchActionExecution,
  type MatchPacingConfig,
  type PlayerPacingInfo,
  type ScheduledMatchAction,
} from "@wizzard/game-core";
import {
  advanceAuthoritativeMatch,
  applyMatchIntent,
} from "@wizzard/game-core/authority";
import type { MatchEvent } from "@wizzard/game-core/contracts";
import type { ClientRoomMessage } from "@wizzard/room-protocol";
import type { RoomServiceConfig } from "../config.js";
import { withHmacCounterRandom } from "../random/index.js";
import { RoomServiceError } from "./errors.js";
import type {
  BoundRoomSession,
  RoomDeadline,
  RoomPlayerRecord,
  RoomRecord,
} from "./model.js";
import {
  type MutationDecision,
  type RoomContext,
  matchIntentReceipt,
  mutateRoom,
  rememberRoomCommand,
} from "./room-shared.js";
import type { CoordinatorUpdate } from "./RoomCoordinator.js";

/**
 * MatchScheduler — match scheduling extracted from RoomCoordinator.
 *
 * Owns match intent application, round continuation, and deadline firing
 * (wake). All shared infrastructure (RoomQueue, repository, config, clock,
 * idFactory, synchronizeMatch) is injected via RoomContext so the facade
 * retains ownership.
 */
export class MatchScheduler {
  public constructor(private readonly ctx: RoomContext) {}

  public applyPlayerIntent(
    room: RoomRecord,
    actor: RoomPlayerRecord,
    session: BoundRoomSession,
    message: Extract<ClientRoomMessage, { type: "match.intent" }>,
    now: number,
  ): MutationDecision {
    if (
      message.requestId !== message.payload.intent.commandId ||
      room.lifecycle !== "playing" ||
      !room.match
    ) {
      throw new RoomServiceError(
        "COMMAND_REJECTED",
        "The match command is not valid in the current room state.",
      );
    }
    if (
      room.deadline?.kind === "turn" &&
      room.deadline.dueAt <= now
    ) {
      throw new RoomServiceError(
        "COMMAND_REJECTED",
        "The authoritative turn deadline has expired.",
      );
    }

    const coreCommandId = `${session.sessionId}:${message.payload.intent.commandId}`;
    const receiptType = matchIntentReceipt(message.payload.intent);
    const receipt = room.commandHistory.find(
      (entry) => entry.commandKey === coreCommandId,
    );
    if (receipt && receipt.messageType !== receiptType) {
      throw new RoomServiceError(
        "COMMAND_REJECTED",
        "The command id was already used for another match intent.",
      );
    }
    const wasCached = room.match.commandEventCache[coreCommandId] !== undefined;
    const transition = applyMatchIntent(room.match, actor.playerId, {
      ...message.payload.intent,
      commandId: coreCommandId,
    });
    const matchEvents = transition.events.map((event) =>
      event.type === "intent-rejected"
        ? { ...event, commandId: message.payload.intent.commandId }
        : event,
    );

    if (wasCached || transition.state === room.match) {
      return {
        ackCommandId: message.requestId,
        changed: false,
        matchEvents,
        visibility: "actor",
      };
    }

    room.match = transition.state;
    rememberRoomCommand(room, coreCommandId, receiptType);
    actor.consecutiveTimeouts = 0;
    actor.control = "human";
    this.ctx.synchronizeMatch(room, now, this.ctx.config);
    return {
      ackCommandId: message.requestId,
      changed: true,
      matchEvents,
      visibility: "room",
    };
  }

  public continueRound(room: RoomRecord, now: number): MatchEvent[] {
    if (
      room.lifecycle !== "playing" ||
      !room.match ||
      room.match.phase !== "round-score"
    ) {
      throw new RoomServiceError(
        "WRONG_ROOM_PHASE",
        "The round cannot continue right now.",
      );
    }

    const transitioned = withHmacCounterRandom(
      room.randomState,
      (random) =>
        advanceAuthoritativeMatch(room.match!, "continue-round", random),
    );
    room.randomState = transitioned.state;
    room.match = transitioned.result.state;
    this.ctx.synchronizeMatch(room, now, this.ctx.config);
    return transitioned.result.events;
  }

  public async wake(
    roomId: string,
    now: number,
  ): Promise<CoordinatorUpdate | null> {
    try {
      const update = await mutateRoom(this.ctx, roomId, now, (room) => {
        if (!room.match || !room.deadline || room.deadline.dueAt > now) {
          return { changed: false, visibility: "actor" };
        }

        if (!deadlineMatches(room, room.deadline)) {
          this.ctx.synchronizeMatch(room, now, this.ctx.config);
          return { changed: true, visibility: "room" };
        }

        const action = deadlineToAction(room, room.deadline);
        const players = buildPlayerPacingInfo(room);
        const match = room.match;
        const commandIdPrefix =
          action.kind === "turn"
            ? `server:${room.id}:${action.playerId}:${match.version}`
            : `server:${room.id}:${match.version}`;

        let execution: MatchActionExecution;
        if (action.kind === "turn") {
          // Turn actions (AI intent / human timeout) don't consume the HMAC
          // counter random — chooseAiIntent and applyMatchIntent are
          // deterministic. Pass a placeholder; executeMatchAction ignores it.
          execution = executeMatchAction(
            match,
            action,
            () => 0,
            players,
            commandIdPrefix,
          );
        } else {
          // resolve-trick and continue-round use advanceAuthoritativeMatch,
          // which draws from the HMAC counter random state.
          const transitioned = withHmacCounterRandom(
            room.randomState,
            (random) =>
              executeMatchAction(
                match,
                action,
                random,
                players,
                commandIdPrefix,
              ),
          );
          room.randomState = transitioned.state;
          execution = transitioned.result;
        }

        // If the action produced no state change (e.g. the AI had no intent),
        // re-plan the deadline without advancing the match.
        if (execution.transition.state === match) {
          this.ctx.synchronizeMatch(room, now, this.ctx.config);
          return { changed: true, visibility: "room" };
        }

        room.match = execution.transition.state;
        const events = execution.transition.events;

        // Apply consecutive-timeout takeover (human → AI after 2 timeouts).
        if (execution.playerPacingChanges) {
          for (const change of execution.playerPacingChanges) {
            const player = room.players.find(
              (candidate) => candidate.playerId === change.playerId,
            );
            if (player) {
              if (change.consecutiveTimeouts !== undefined) {
                player.consecutiveTimeouts = change.consecutiveTimeouts;
              }
              if (change.control !== undefined) {
                player.control = change.control;
              }
            }
          }
        }

        this.ctx.synchronizeMatch(room, now, this.ctx.config);
        return {
          changed: true,
          matchEvents: events,
          visibility: "room",
        };
      });

      return update;
    } catch (error) {
      if (
        error instanceof RoomServiceError &&
        error.code === "ROOM_NOT_FOUND"
      ) {
        return null;
      }
      throw error;
    }
  }
}

// ─── Shared pure functions (module-level, callable by any service) ──

function buildPacingConfig(config: RoomServiceConfig): MatchPacingConfig {
  return {
    aiActionDelayMs: config.aiActionDelayMs,
    trickResultDelayMs: config.trickResultDelayMs,
    roundScoreDelayMs: config.roundScoreDelayMs,
    turnTimeoutMs: config.turnTimeoutMs,
  };
}

function buildPlayerPacingInfo(room: RoomRecord): PlayerPacingInfo[] {
  return room.players.map((player) => ({
    playerId: player.playerId,
    isAi: player.isAi,
    control: player.control,
    connected: player.connected,
    consecutiveTimeouts: player.consecutiveTimeouts,
  }));
}

function toDeadline(
  action: ScheduledMatchAction,
  matchVersion: number,
): RoomDeadline {
  if (action.kind === "resolve-trick") {
    return {
      dueAt: action.dueAt,
      kind: "resolve-trick",
      matchVersion,
      playerId: null,
    };
  }
  if (action.kind === "continue-round") {
    return {
      dueAt: action.dueAt,
      kind: "continue-round",
      matchVersion,
      playerId: null,
    };
  }
  return {
    dueAt: action.dueAt,
    kind: "turn",
    matchVersion,
    playerId: action.playerId,
  };
}

function deadlineToAction(
  room: RoomRecord,
  deadline: RoomDeadline,
): ScheduledMatchAction {
  if (deadline.kind === "resolve-trick") {
    return { kind: "resolve-trick", dueAt: deadline.dueAt };
  }
  if (deadline.kind === "continue-round") {
    return { kind: "continue-round", dueAt: deadline.dueAt };
  }
  const playerId = deadline.playerId ?? "";
  const player = room.players.find(
    (candidate) => candidate.playerId === playerId,
  );
  const isTimeout = player
    ? !(player.isAi || player.control === "ai")
    : false;
  return { kind: "turn", playerId, dueAt: deadline.dueAt, isTimeout };
}

/**
 * Synchronizes the room lifecycle and deadline with the current match state.
 *
 * This is a shared pure function (not owned by any single service) that
 * mutates only `room.lifecycle` and `room.deadline` atomically. It delegates
 * deadline planning to `planNextMatchAction` from the shared match-driver
 * module.
 */
export function synchronizeMatch(
  room: RoomRecord,
  now: number,
  config: RoomServiceConfig,
): void {
  if (!room.match) {
    room.deadline = null;
    return;
  }
  if (room.match.phase === "match-end") {
    room.lifecycle = "finished";
    room.deadline = null;
    return;
  }
  room.lifecycle = "playing";
  const action = planNextMatchAction(
    room.match,
    buildPlayerPacingInfo(room),
    now,
    buildPacingConfig(config),
    { turnTimerEnabled: room.turnTimerEnabled ?? true },
  );
  room.deadline = action ? toDeadline(action, room.match.version) : null;
}

/**
 * Checks whether a deadline is still valid for the current match state.
 * Returns false when the match version or phase has drifted from the
 * deadline's expectations, indicating the deadline is stale.
 */
export function deadlineMatches(
  room: RoomRecord,
  deadline: RoomDeadline,
): boolean {
  const match = room.match;
  if (!match || match.version !== deadline.matchVersion) {
    return false;
  }
  if (deadline.kind === "resolve-trick") {
    return match.phase === "trick-result";
  }
  if (deadline.kind === "continue-round") {
    return match.phase === "round-score";
  }
  return (
    match.currentPlayerId === deadline.playerId &&
    (match.phase === "trump-select" ||
      match.phase === "bid" ||
      match.phase === "trick-play")
  );
}
