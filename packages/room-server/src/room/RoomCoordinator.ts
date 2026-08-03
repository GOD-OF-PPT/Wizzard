import { randomUUID } from "node:crypto";
import { chooseAiIntent } from "@wizzard/game-core";
import {
  advanceAuthoritativeMatch,
  applyMatchIntent,
  createMatch,
  createPlayerSnapshot,
} from "@wizzard/game-core/authority";
import type { MatchEvent } from "@wizzard/game-core/contracts";
import {
  AVATAR_KEYS,
  type ClientRoomMessage,
  type CreateRoomMessage,
  type JoinRoomMessage,
  type RequestErrorCode,
  type ResumeSessionMessage,
  type SessionGrant,
} from "@wizzard/room-protocol";
import {
  hashToken,
  issueInviteToken,
  issueResumeToken,
  parseInviteToken,
  parseResumeToken,
  verifyInviteToken,
  verifyResumeToken,
  generateRoomCode,
} from "../identity/index.js";
import type { RoomRepository } from "../persistence/types.js";
import {
  createHmacCounterRandomState,
  withHmacCounterRandom,
} from "../random/index.js";
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  type RoomServiceConfig,
} from "../config.js";
import { RoomServiceError } from "./errors.js";
import type {
  BoundRoomSession,
  HumanSessionRecord,
  RoomDeadline,
  RoomPlayerRecord,
  RoomRecord,
} from "./model.js";
import { RoomQueue } from "./RoomQueue.js";

const MAX_COMMAND_HISTORY = 128;

type Clock = () => number;

export type EstablishedRoomSession = {
  grant: SessionGrant;
  room: RoomRecord;
  session: BoundRoomSession;
};

export type CoordinatorUpdate = {
  ackCommandId?: string;
  changed: boolean;
  invalidateSession?: boolean;
  matchEvents: MatchEvent[];
  room: RoomRecord;
  visibility: "actor" | "room";
};

type MutationDecision = {
  ackCommandId?: string;
  changed: boolean;
  invalidateSession?: boolean;
  matchEvents?: MatchEvent[];
  visibility?: "actor" | "room";
};

export type RoomCoordinatorOptions = {
  clock?: Clock;
  config?: Partial<RoomServiceConfig>;
  idFactory?: () => string;
  repository: RoomRepository<RoomRecord>;
};

export class RoomCoordinator {
  private readonly clock: Clock;
  private readonly config: RoomServiceConfig;
  private readonly idFactory: () => string;
  private readonly queue = new RoomQueue();
  private readonly repository: RoomRepository<RoomRecord>;

  public constructor(options: RoomCoordinatorOptions) {
    this.clock = options.clock ?? Date.now;
    this.config = { ...DEFAULT_ROOM_SERVICE_CONFIG, ...options.config };
    this.idFactory = options.idFactory ?? randomUUID;
    this.repository = options.repository;
  }

  public async createRoom(
    message: CreateRoomMessage,
    now = this.clock(),
  ): Promise<EstablishedRoomSession> {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const roomId = this.idFactory();
      const playerId = this.idFactory();
      const sessionId = this.idFactory();
      const invite = issueInviteToken(roomId);
      const resume = issueResumeToken(roomId, playerId);
      const sessionRecord: HumanSessionRecord = {
        expiresAt: now + this.config.sessionTtlMs,
        generation: 1,
        resumeTokenHash: resume.tokenHash,
        sessionId,
      };
      const room: RoomRecord = {
        code: generateRoomCode(),
        commandHistory: [],
        createdAt: now,
        deadline: null,
        expiresAt: now + this.config.lobbyRoomTtlMs,
        hostPlayerId: playerId,
        id: roomId,
        inviteTokenHash: invite.tokenHash,
        lifecycle: "lobby",
        match: null,
        maxPlayers: message.payload.maxPlayers,
        mode: message.payload.mode,
        players: [
          {
            avatarKey: message.payload.avatarKey,
            connected: true,
            consecutiveTimeouts: 0,
            control: "human",
            isAi: false,
            joinedAt: now,
            name: message.payload.displayName,
            playerId,
            ready: false,
            seatIndex: 0,
            session: sessionRecord,
          },
        ],
        randomState: createHmacCounterRandomState(),
        revision: 0,
        schemaVersion: 1,
        updatedAt: now,
      };

      if (!(await this.repository.create(room))) {
        continue;
      }

      return {
        grant: {
          inviteToken: invite.token,
          playerId,
          resumeToken: resume.token,
          roomCode: room.code,
          roomId,
        },
        room,
        session: {
          generation: 1,
          playerId,
          roomId,
          sessionId,
        },
      };
    }

    throw new RoomServiceError(
      "INTERNAL_ERROR",
      "Could not allocate a unique friend room.",
    );
  }

  public async joinRoom(
    message: JoinRoomMessage,
    now = this.clock(),
  ): Promise<EstablishedRoomSession> {
    const located = await this.locateJoinRoom(message);

    if (!located) {
      throw new RoomServiceError("ROOM_NOT_FOUND", "Friend room not found.");
    }

    return this.queue.run(located.id, async () => {
      const current = await this.requireRoom(located.id);

      if (current.lifecycle !== "lobby") {
        throw new RoomServiceError(
          "ROOM_NOT_JOINABLE",
          "This room has already started.",
        );
      }

      if (current.players.length >= current.maxPlayers) {
        throw new RoomServiceError("ROOM_FULL", "This room is full.");
      }

      const playerId = this.idFactory();
      const sessionId = this.idFactory();
      const resume = issueResumeToken(current.id, playerId);
      const seatIndex = firstOpenSeat(current);
      const room = structuredClone(current);
      room.players.push({
        avatarKey: message.payload.avatarKey,
        connected: true,
        consecutiveTimeouts: 0,
        control: "human",
        isAi: false,
        joinedAt: now,
        name: message.payload.displayName,
        playerId,
        ready: false,
        seatIndex,
        session: {
          expiresAt: now + this.config.sessionTtlMs,
          generation: 1,
          resumeTokenHash: resume.tokenHash,
          sessionId,
        },
      });
      prepareSave(room, current.revision, now, this.expiryFor(room, now));
      await this.saveOrThrow(room, current.revision);

      return {
        grant: {
          playerId,
          resumeToken: resume.token,
          roomCode: room.code,
          roomId: room.id,
        },
        room,
        session: {
          generation: 1,
          playerId,
          roomId: room.id,
          sessionId,
        },
      };
    });
  }

  public async resumeSession(
    message: ResumeSessionMessage,
    now = this.clock(),
  ): Promise<EstablishedRoomSession> {
    const parsed = parseResumeToken(message.payload.resumeToken);

    if (!parsed) {
      throw new RoomServiceError(
        "SESSION_NOT_FOUND",
        "The resume credential is invalid.",
      );
    }

    return this.queue.run(parsed.roomId, async () => {
      const current = await this.requireRoom(parsed.roomId, "SESSION_NOT_FOUND");
      const currentPlayer = current.players.find(
        (player) => player.playerId === parsed.playerId && !player.isAi,
      );

      if (
        !currentPlayer?.session ||
        currentPlayer.session.expiresAt <= now ||
        !verifyResumeToken(
          message.payload.resumeToken,
          currentPlayer.session.resumeTokenHash,
        ) ||
        current.lifecycle === "closed"
      ) {
        throw new RoomServiceError(
          "SESSION_NOT_FOUND",
          "The session has expired or was replaced.",
        );
      }

      const room = structuredClone(current);
      const player = requirePlayer(room, parsed.playerId);
      const resume = issueResumeToken(room.id, player.playerId);
      const nextGeneration = player.session!.generation + 1;
      player.connected = true;
      player.consecutiveTimeouts = 0;
      player.control = "human";
      player.session = {
        expiresAt: now + this.config.sessionTtlMs,
        generation: nextGeneration,
        resumeTokenHash: resume.tokenHash,
        sessionId: player.session!.sessionId,
      };
      prepareSave(room, current.revision, now, this.expiryFor(room, now));
      await this.saveOrThrow(room, current.revision);

      return {
        grant: {
          playerId: player.playerId,
          resumeToken: resume.token,
          roomCode: room.code,
          roomId: room.id,
        },
        room,
        session: {
          generation: nextGeneration,
          playerId: player.playerId,
          roomId: room.id,
          sessionId: player.session.sessionId,
        },
      };
    });
  }

  public async execute(
    session: BoundRoomSession,
    message: ClientRoomMessage,
    now = this.clock(),
  ): Promise<CoordinatorUpdate> {
    if (
      message.type === "room.create" ||
      message.type === "room.join" ||
      message.type === "session.resume" ||
      message.type === "connection.ping"
    ) {
      throw new RoomServiceError(
        "COMMAND_REJECTED",
        "This command is not valid for a bound room session.",
      );
    }

    return this.mutateRoom(session.roomId, now, (room) => {
      const actor = assertBoundSession(room, session, now);

      if (message.type === "match.intent") {
        return this.applyPlayerIntent(room, actor, session, message, now);
      }

      const commandKey = `${session.sessionId}:${message.requestId}`;
      const receiptType = roomCommandReceipt(message);
      const cached = room.commandHistory.find(
        (entry) => entry.commandKey === commandKey,
      );

      if (cached) {
        if (cached.messageType !== receiptType) {
          throw new RoomServiceError(
            "COMMAND_REJECTED",
            "The command id was already used for another action.",
          );
        }

        return {
          ackCommandId: message.requestId,
          changed: false,
          visibility: "actor",
        };
      }

      let matchEvents: MatchEvent[] = [];

      if (message.type === "room.set-ready") {
        requireLifecycle(room, "lobby");
        actor.ready = message.payload.ready;
      } else if (message.type === "room.start") {
        this.startMatch(room, actor.playerId, message.payload.fillWithAi, now);
      } else if (message.type === "match.continue-round") {
        matchEvents = this.continueRound(room, now);
      } else if (message.type === "room.rematch") {
        this.returnToLobby(room, actor.playerId);
      } else if (message.type === "room.leave") {
        this.leaveRoom(room, actor.playerId, now);
      }

      rememberRoomCommand(room, commandKey, receiptType);
      return {
        ackCommandId: message.requestId,
        changed: true,
        invalidateSession: message.type === "room.leave",
        matchEvents,
        visibility: "room",
      };
    });
  }

  public async disconnect(
    session: BoundRoomSession,
    now = this.clock(),
  ): Promise<CoordinatorUpdate | null> {
    try {
      return await this.mutateRoom(session.roomId, now, (room) => {
        const player = room.players.find(
          (candidate) => candidate.playerId === session.playerId,
        );

        if (
          !player?.session ||
          player.session.sessionId !== session.sessionId ||
          player.session.generation !== session.generation ||
          !player.connected
        ) {
          return { changed: false, visibility: "actor" };
        }

        player.connected = false;
        return { changed: true, visibility: "room" };
      });
    } catch (error) {
      if (
        error instanceof RoomServiceError &&
        (error.code === "ROOM_NOT_FOUND" || error.code === "SESSION_NOT_FOUND")
      ) {
        return null;
      }
      throw error;
    }
  }

  public async wake(
    roomId: string,
    now = this.clock(),
  ): Promise<CoordinatorUpdate | null> {
    try {
      const update = await this.mutateRoom(roomId, now, (room) => {
        if (!room.match || !room.deadline || room.deadline.dueAt > now) {
          return { changed: false, visibility: "actor" };
        }

        if (!deadlineMatches(room, room.deadline)) {
          room.deadline = planDeadline(room, now, this.config);
          return { changed: true, visibility: "room" };
        }

        const deadline = room.deadline;
        let events: MatchEvent[] = [];

        if (deadline.kind === "turn") {
          const player = requirePlayer(room, deadline.playerId ?? "");
          const snapshot = createPlayerSnapshot(room.match, player.playerId);
          const intent = chooseAiIntent(
            snapshot,
            `server:${room.id}:${player.playerId}:${room.match.version}`,
          );

          if (!intent) {
            room.deadline = planDeadline(room, now, this.config);
            return { changed: true, visibility: "room" };
          }

          const transition = applyMatchIntent(room.match, player.playerId, intent);
          room.match = transition.state;
          events = transition.events;
          if (!player.isAi && player.control === "human") {
            player.consecutiveTimeouts += 1;
            if (player.consecutiveTimeouts >= 2) {
              player.control = "ai";
            }
          }
        } else {
          const advance =
            deadline.kind === "resolve-trick"
              ? "resolve-trick"
              : "continue-round";
          const transitioned = withHmacCounterRandom(
            room.randomState,
            (random) => advanceAuthoritativeMatch(room.match!, advance, random),
          );
          room.randomState = transitioned.state;
          room.match = transitioned.result.state;
          events = transitioned.result.events;
        }

        synchronizeMatch(room, now, this.config);
        return {
          changed: true,
          matchEvents: events,
          visibility: "room",
        };
      });

      return update.matchEvents.length > 0 || update.room.deadline
        ? update
        : update;
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

  public loadRoom(roomId: string): Promise<RoomRecord | null> {
    return this.repository.loadById(roomId);
  }

  private applyPlayerIntent(
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
    synchronizeMatch(room, now, this.config);
    return {
      ackCommandId: message.requestId,
      changed: true,
      matchEvents,
      visibility: "room",
    };
  }

  private startMatch(
    room: RoomRecord,
    actorPlayerId: string,
    fillWithAi: boolean,
    now: number,
  ): void {
    requireLifecycle(room, "lobby");

    if (room.hostPlayerId !== actorPlayerId) {
      throw new RoomServiceError("NOT_HOST", "Only the host can start.");
    }

    const humans = room.players.filter((player) => !player.isAi);
    if (!humans.every((player) => player.ready)) {
      throw new RoomServiceError(
        "PLAYERS_NOT_READY",
        "Every human player must be ready.",
      );
    }

    if (!fillWithAi && humans.length !== room.maxPlayers) {
      throw new RoomServiceError(
        "NOT_ENOUGH_PLAYERS",
        "Fill every seat or enable AI fill.",
      );
    }

    while (fillWithAi && room.players.length < room.maxPlayers) {
      const seatIndex = firstOpenSeat(room);
      room.players.push({
        avatarKey: AVATAR_KEYS[seatIndex % AVATAR_KEYS.length],
        connected: true,
        consecutiveTimeouts: 0,
        control: "ai",
        isAi: true,
        joinedAt: now,
        name: `茶灵 ${seatIndex + 1}`,
        playerId: `ai-${this.idFactory()}`,
        ready: true,
        seatIndex,
        session: null,
      });
    }

    if (room.players.length < 3) {
      throw new RoomServiceError(
        "NOT_ENOUGH_PLAYERS",
        "At least three seats are required.",
      );
    }

    room.players.sort((left, right) => left.seatIndex - right.seatIndex);
    const created = withHmacCounterRandom(room.randomState, (random) =>
      createMatch(
        {
          matchId: `match-${this.idFactory()}`,
          mode: room.mode,
          players: room.players.map((player) => ({
            avatarKey: player.avatarKey,
            id: player.playerId,
            isHuman: !player.isAi,
            name: player.name,
          })),
        },
        random,
      ),
    );
    room.randomState = created.state;
    room.match = created.result;
    room.lifecycle = "playing";
    synchronizeMatch(room, now, this.config);
  }

  private continueRound(room: RoomRecord, now: number): MatchEvent[] {
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
    synchronizeMatch(room, now, this.config);
    return transitioned.result.events;
  }

  private returnToLobby(room: RoomRecord, actorPlayerId: string): void {
    if (room.lifecycle !== "finished") {
      throw new RoomServiceError(
        "WRONG_ROOM_PHASE",
        "A rematch is only available after the match ends.",
      );
    }
    if (room.hostPlayerId !== actorPlayerId) {
      throw new RoomServiceError("NOT_HOST", "Only the host can rematch.");
    }

    room.players = room.players
      .filter((player) => !player.isAi && player.session)
      .map((player, seatIndex) => ({
        ...player,
        connected: player.connected,
        consecutiveTimeouts: 0,
        control: "human" as const,
        ready: false,
        seatIndex,
      }));
    room.lifecycle = "lobby";
    room.match = null;
    room.deadline = null;
  }

  private leaveRoom(room: RoomRecord, actorPlayerId: string, now: number): void {
    const actor = requirePlayer(room, actorPlayerId);
    actor.connected = false;
    actor.session = null;

    if (room.lifecycle === "lobby") {
      room.players = room.players.filter(
        (player) => player.playerId !== actorPlayerId,
      );
      room.players
        .sort((left, right) => left.seatIndex - right.seatIndex)
        .forEach((player, seatIndex) => {
          player.seatIndex = seatIndex;
        });
    } else {
      actor.control = "ai";
    }

    const remainingHumans = room.players.filter(
      (player) => !player.isAi && player.session,
    );
    if (remainingHumans.length === 0) {
      room.lifecycle = "closed";
      room.deadline = null;
      room.expiresAt = now + 5 * 60 * 1_000;
      room.hostPlayerId = "";
      return;
    }

    if (room.hostPlayerId === actorPlayerId) {
      room.hostPlayerId = [...remainingHumans].sort(
        (left, right) => left.seatIndex - right.seatIndex,
      )[0].playerId;
    }
  }

  private async mutateRoom(
    roomId: string,
    now: number,
    decide: (room: RoomRecord) => MutationDecision,
  ): Promise<CoordinatorUpdate> {
    return this.queue.run(roomId, async () => {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const current = await this.requireRoom(roomId);
        const room = structuredClone(current);
        const decision = decide(room);

        if (!decision.changed) {
          return {
            ...(decision.ackCommandId
              ? { ackCommandId: decision.ackCommandId }
              : {}),
            ...(decision.invalidateSession
              ? { invalidateSession: true }
              : {}),
            changed: false,
            matchEvents: decision.matchEvents ?? [],
            room: current,
            visibility: decision.visibility ?? "actor",
          };
        }

        prepareSave(room, current.revision, now, this.expiryFor(room, now));
        const saveResult = await this.repository.compareAndSwap(
          room,
          current.revision,
        );
        if (saveResult === "conflict") {
          continue;
        }
        if (saveResult === "missing") {
          throw new RoomServiceError("ROOM_NOT_FOUND", "Friend room not found.");
        }

        return {
          ...(decision.ackCommandId
            ? { ackCommandId: decision.ackCommandId }
            : {}),
          ...(decision.invalidateSession
            ? { invalidateSession: true }
            : {}),
          changed: true,
          matchEvents: decision.matchEvents ?? [],
          room,
          visibility: decision.visibility ?? "room",
        };
      }

      throw new RoomServiceError(
        "INTERNAL_ERROR",
        "The room changed concurrently; retry the command.",
      );
    });
  }

  private async locateJoinRoom(
    message: JoinRoomMessage,
  ): Promise<RoomRecord | null> {
    if (message.payload.roomCode) {
      return this.repository.loadByCode(message.payload.roomCode);
    }

    const token = message.payload.inviteToken;
    const parsed = token ? parseInviteToken(token) : null;
    if (!token || !parsed) {
      throw new RoomServiceError(
        "INVITE_TOKEN_INVALID",
        "The invite token is invalid.",
      );
    }

    const room = await this.repository.loadByInviteHash(hashToken(token));
    if (
      !room ||
      room.id !== parsed.roomId ||
      !verifyInviteToken(token, room.inviteTokenHash)
    ) {
      throw new RoomServiceError(
        "INVITE_TOKEN_INVALID",
        "The invite token is invalid or expired.",
      );
    }

    return room;
  }

  private async requireRoom(
    roomId: string,
    code: RequestErrorCode = "ROOM_NOT_FOUND",
  ): Promise<RoomRecord> {
    const room = await this.repository.loadById(roomId);
    if (!room) {
      throw new RoomServiceError(code, "Friend room not found.");
    }
    return room;
  }

  private async saveOrThrow(
    room: RoomRecord,
    expectedRevision: number,
  ): Promise<void> {
    const result = await this.repository.compareAndSwap(room, expectedRevision);
    if (result !== "saved") {
      throw new RoomServiceError(
        "INTERNAL_ERROR",
        "The room changed while the command was being saved.",
      );
    }
  }

  private expiryFor(room: RoomRecord, now: number): number {
    if (room.lifecycle === "closed") {
      return Math.min(room.expiresAt, now + 5 * 60 * 1_000);
    }
    if (room.lifecycle === "finished") {
      return now + this.config.finishedRoomTtlMs;
    }
    if (room.lifecycle === "playing") {
      const hardExpiry = room.createdAt + this.config.matchRoomTtlMs;
      const hasConnectedHuman = room.players.some(
        (player) => !player.isAi && player.session && player.connected,
      );
      return hasConnectedHuman
        ? hardExpiry
        : Math.min(
            hardExpiry,
            room.expiresAt,
            now + this.config.offlineRoomTtlMs,
          );
    }
    return now + this.config.lobbyRoomTtlMs;
  }
}

function prepareSave(
  room: RoomRecord,
  expectedRevision: number,
  now: number,
  expiresAt: number,
): void {
  room.revision = expectedRevision + 1;
  room.updatedAt = now;
  room.expiresAt = expiresAt;
}

function firstOpenSeat(room: RoomRecord): number {
  const occupied = new Set(room.players.map((player) => player.seatIndex));
  for (let index = 0; index < room.maxPlayers; index += 1) {
    if (!occupied.has(index)) {
      return index;
    }
  }
  throw new RoomServiceError("ROOM_FULL", "This room is full.");
}

function requirePlayer(room: RoomRecord, playerId: string): RoomPlayerRecord {
  const player = room.players.find((candidate) => candidate.playerId === playerId);
  if (!player) {
    throw new RoomServiceError("PLAYER_NOT_FOUND", "Player not found.");
  }
  return player;
}

function assertBoundSession(
  room: RoomRecord,
  session: BoundRoomSession,
  now: number,
): RoomPlayerRecord {
  const player = room.players.find(
    (candidate) => candidate.playerId === session.playerId && !candidate.isAi,
  );
  if (
    !player?.session ||
    player.session.sessionId !== session.sessionId ||
    player.session.generation !== session.generation ||
    player.session.expiresAt <= now ||
    !player.connected
  ) {
    throw new RoomServiceError(
      "SESSION_NOT_FOUND",
      "The room session is no longer active.",
    );
  }
  return player;
}

function requireLifecycle(
  room: RoomRecord,
  lifecycle: RoomRecord["lifecycle"],
): void {
  if (room.lifecycle !== lifecycle) {
    throw new RoomServiceError(
      "WRONG_ROOM_PHASE",
      `Room must be in ${lifecycle}.`,
    );
  }
}

function rememberRoomCommand(
  room: RoomRecord,
  commandKey: string,
  messageType: string,
): void {
  room.commandHistory.push({ commandKey, messageType });
  if (room.commandHistory.length > MAX_COMMAND_HISTORY) {
    room.commandHistory.splice(0, room.commandHistory.length - MAX_COMMAND_HISTORY);
  }
}

function matchIntentReceipt(
  intent: Extract<ClientRoomMessage, { type: "match.intent" }>["payload"]["intent"],
): string {
  if (intent.type === "choose-trump") {
    return `match.intent|choose-trump|${intent.expectedVersion}|${intent.trump}`;
  }
  if (intent.type === "submit-bid") {
    return `match.intent|submit-bid|${intent.expectedVersion}|${intent.bid}`;
  }
  return `match.intent|play-card|${intent.expectedVersion}|${intent.cardId}`;
}

function roomCommandReceipt(
  message: Exclude<
    ClientRoomMessage,
    | { type: "connection.ping" }
    | { type: "match.intent" }
    | { type: "room.create" }
    | { type: "room.join" }
    | { type: "session.resume" }
  >,
): string {
  if (message.type === "room.set-ready") {
    return `${message.type}|${message.payload.ready}`;
  }
  if (message.type === "room.start") {
    return `${message.type}|${message.payload.fillWithAi}`;
  }
  return message.type;
}

function synchronizeMatch(
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
  room.deadline = planDeadline(room, now, config);
}

function planDeadline(
  room: RoomRecord,
  now: number,
  config: RoomServiceConfig,
): RoomDeadline | null {
  const match = room.match;
  if (!match || match.phase === "match-end") {
    return null;
  }
  if (match.phase === "trick-result") {
    return {
      dueAt: now + config.trickResultDelayMs,
      kind: "resolve-trick",
      matchVersion: match.version,
      playerId: null,
    };
  }
  if (match.phase === "round-score") {
    return {
      dueAt: now + config.roundScoreDelayMs,
      kind: "continue-round",
      matchVersion: match.version,
      playerId: null,
    };
  }
  if (!match.currentPlayerId) {
    return null;
  }
  const current = room.players.find(
    (player) => player.playerId === match.currentPlayerId,
  );
  const automated = current?.isAi || current?.control === "ai";
  return {
    dueAt: now + (automated ? config.aiActionDelayMs : config.turnTimeoutMs),
    kind: "turn",
    matchVersion: match.version,
    playerId: match.currentPlayerId,
  };
}

function deadlineMatches(room: RoomRecord, deadline: RoomDeadline): boolean {
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
