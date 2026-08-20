import type { MatchEvent } from "@wizzard/game-core/contracts";
import type {
  ClientRoomMessage,
  RequestErrorCode,
} from "@wizzard/room-protocol";
import type { RoomRepository } from "../persistence/types.js";
import type { RoomServiceConfig } from "../config.js";
import { RoomServiceError } from "./errors.js";
import type {
  BoundRoomSession,
  RoomPlayerRecord,
  RoomRecord,
} from "./model.js";
import { RoomQueue } from "./RoomQueue.js";

// Re-exported types ─ the facade re-exports CoordinatorUpdate from
// RoomCoordinator.ts, so room-shared uses a type-only import to avoid a
// runtime circular dependency.
import type { CoordinatorUpdate } from "./RoomCoordinator.js";

// ─── Shared types ────────────────────────────────────────────────────

export type Clock = () => number;

export type MutationDecision = {
  ackCommandId?: string;
  changed: boolean;
  invalidateSession?: boolean;
  matchEvents?: MatchEvent[];
  visibility?: "actor" | "room";
};

/**
 * Bundle of shared room infrastructure owned by the RoomCoordinator facade.
 * Every extracted service receives this context so it can reach the shared
 * queue, repository, config, clock, id factory, and the synchronizeMatch
 * pure function without instantiating its own copies.
 */
export type RoomContext = {
  clock: Clock;
  config: RoomServiceConfig;
  idFactory: () => string;
  queue: RoomQueue;
  repository: RoomRepository<RoomRecord>;
  synchronizeMatch: (room: RoomRecord, now: number, config: RoomServiceConfig) => void;
};

// ─── Shared constants ────────────────────────────────────────────────

export const MAX_COMMAND_HISTORY = 128;

// ─── Shared pure functions ──────────────────────────────────────────

export function prepareSave(
  room: RoomRecord,
  expectedRevision: number,
  now: number,
  expiresAt: number,
): void {
  room.revision = expectedRevision + 1;
  room.updatedAt = now;
  room.expiresAt = expiresAt;
}

export function expiryFor(
  room: RoomRecord,
  now: number,
  config: RoomServiceConfig,
): number {
  if (room.lifecycle === "closed") {
    return Math.min(room.expiresAt, now + 5 * 60 * 1_000);
  }
  if (room.lifecycle === "finished") {
    return now + config.finishedRoomTtlMs;
  }
  if (room.lifecycle === "playing") {
    const hardExpiry = room.createdAt + config.matchRoomTtlMs;
    const hasConnectedHuman = room.players.some(
      (player) => !player.isAi && player.session && player.connected,
    );
    return hasConnectedHuman
      ? hardExpiry
      : Math.min(
          hardExpiry,
          room.expiresAt,
          now + config.offlineRoomTtlMs,
        );
  }
  return now + config.lobbyRoomTtlMs;
}

export function firstOpenSeat(room: RoomRecord): number {
  const occupied = new Set(room.players.map((player) => player.seatIndex));
  for (let index = 0; index < room.maxPlayers; index += 1) {
    if (!occupied.has(index)) {
      return index;
    }
  }
  throw new RoomServiceError("ROOM_FULL", "This room is full.");
}

export function requirePlayer(
  room: RoomRecord,
  playerId: string,
): RoomPlayerRecord {
  const player = room.players.find((candidate) => candidate.playerId === playerId);
  if (!player) {
    throw new RoomServiceError("PLAYER_NOT_FOUND", "Player not found.");
  }
  return player;
}

export function requireLifecycle(
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

export function rememberRoomCommand(
  room: RoomRecord,
  commandKey: string,
  messageType: string,
): void {
  room.commandHistory.push({ commandKey, messageType });
  if (room.commandHistory.length > MAX_COMMAND_HISTORY) {
    room.commandHistory.splice(0, room.commandHistory.length - MAX_COMMAND_HISTORY);
  }
}

export function matchIntentReceipt(
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

export function roomCommandReceipt(
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
  if (message.type === "room.set-ai-count") {
    return `${message.type}|${message.payload.aiCount}`;
  }
  return message.type;
}

export async function requireRoom(
  repository: RoomRepository<RoomRecord>,
  roomId: string,
  code: RequestErrorCode = "ROOM_NOT_FOUND",
): Promise<RoomRecord> {
  const room = await repository.loadById(roomId);
  if (!room) {
    throw new RoomServiceError(code, "Friend room not found.");
  }
  return room;
}

/**
 * Serialized optimistic-concurrency transaction. All room mutations go
 * through this function so per-room serialization (RoomQueue) and CAS
 * retry (4 attempts) remain shared invariants.
 */
export async function mutateRoom(
  ctx: Pick<RoomContext, "queue" | "repository" | "config">,
  roomId: string,
  now: number,
  decide: (room: RoomRecord) => MutationDecision,
): Promise<CoordinatorUpdate> {
  return ctx.queue.run(roomId, async () => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const current = await requireRoom(ctx.repository, roomId);
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

      prepareSave(room, current.revision, now, expiryFor(room, now, ctx.config));
      const saveResult = await ctx.repository.compareAndSwap(
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
