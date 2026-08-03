import type { AuthoritativeMatchState } from "@wizzard/game-core/authority";
import type { GameMode, MatchEvent } from "@wizzard/game-core/contracts";
import { AVATAR_KEYS, type AvatarKey } from "@wizzard/room-protocol";
import type { RevisionedRoom } from "../persistence/types.js";
import type { HmacCounterRandomState } from "../random/index.js";

export type RoomLifecycle = "closed" | "finished" | "lobby" | "playing";
export type SeatControl = "ai" | "human";

export type HumanSessionRecord = {
  expiresAt: number;
  generation: number;
  resumeTokenHash: string;
  sessionId: string;
};

export type RoomPlayerRecord = {
  avatarKey: AvatarKey;
  connected: boolean;
  consecutiveTimeouts: number;
  control: SeatControl;
  isAi: boolean;
  joinedAt: number;
  name: string;
  playerId: string;
  ready: boolean;
  seatIndex: number;
  session: HumanSessionRecord | null;
};

export type RoomDeadline = {
  dueAt: number;
  kind: "continue-round" | "resolve-trick" | "turn";
  matchVersion: number;
  playerId: string | null;
};

export type ProcessedRoomCommand = {
  commandKey: string;
  messageType: string;
};

export type RoomRecord = RevisionedRoom & {
  commandHistory: ProcessedRoomCommand[];
  createdAt: number;
  deadline: RoomDeadline | null;
  hostPlayerId: string;
  lifecycle: RoomLifecycle;
  match: AuthoritativeMatchState | null;
  maxPlayers: 3 | 4 | 5 | 6;
  mode: GameMode;
  players: RoomPlayerRecord[];
  randomState: HmacCounterRandomState;
  schemaVersion: 1;
  updatedAt: number;
};

export type BoundRoomSession = {
  generation: number;
  playerId: string;
  roomId: string;
  sessionId: string;
};

export type MatchBroadcast = {
  events: MatchEvent[];
  visibility: "actor" | "room";
};

export function isRoomRecord(value: unknown): value is RoomRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const room = value as Partial<RoomRecord>;
  if (
    !(
    room.schemaVersion === 1 &&
    typeof room.id === "string" &&
    typeof room.code === "string" &&
    typeof room.inviteTokenHash === "string" &&
    Number.isSafeInteger(room.revision) &&
    (room.revision as number) >= 0 &&
    Number.isSafeInteger(room.expiresAt) &&
    Number.isSafeInteger(room.createdAt) &&
    Number.isSafeInteger(room.updatedAt) &&
    typeof room.hostPlayerId === "string" &&
    (room.lifecycle === "closed" ||
      room.lifecycle === "finished" ||
      room.lifecycle === "lobby" ||
      room.lifecycle === "playing") &&
    (room.mode === "classic" || room.mode === "quick") &&
    (room.maxPlayers === 3 ||
      room.maxPlayers === 4 ||
      room.maxPlayers === 5 ||
      room.maxPlayers === 6) &&
    Array.isArray(room.players) &&
    room.players.every(isRoomPlayerRecord) &&
    Array.isArray(room.commandHistory) &&
    room.commandHistory.every(isProcessedRoomCommand) &&
    isRandomState(room.randomState) &&
    (room.match === null ||
      (typeof room.match === "object" && room.match !== null)) &&
    (room.deadline === null || isRoomDeadline(room.deadline))
    )
  ) {
    return false;
  }

  const playerIds = room.players.map((player) => player.playerId);
  const seatIndexes = room.players.map((player) => player.seatIndex);
  return (
    new Set(playerIds).size === playerIds.length &&
    new Set(seatIndexes).size === seatIndexes.length &&
    (room.lifecycle === "closed" || playerIds.includes(room.hostPlayerId))
  );
}

function isRoomPlayerRecord(value: unknown): value is RoomPlayerRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const player = value as Partial<RoomPlayerRecord>;
  return (
    typeof player.playerId === "string" &&
    typeof player.name === "string" &&
    typeof player.avatarKey === "string" &&
    (AVATAR_KEYS as readonly string[]).includes(player.avatarKey) &&
    typeof player.connected === "boolean" &&
    typeof player.isAi === "boolean" &&
    typeof player.ready === "boolean" &&
    Number.isSafeInteger(player.seatIndex) &&
    (player.seatIndex as number) >= 0 &&
    Number.isSafeInteger(player.joinedAt) &&
    (player.joinedAt as number) >= 0 &&
    Number.isSafeInteger(player.consecutiveTimeouts) &&
    (player.consecutiveTimeouts as number) >= 0 &&
    (player.control === "ai" || player.control === "human") &&
    (player.session === null || isHumanSession(player.session))
  );
}

function isHumanSession(value: unknown): value is HumanSessionRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const session = value as Partial<HumanSessionRecord>;
  return (
    Number.isSafeInteger(session.expiresAt) &&
    Number.isSafeInteger(session.generation) &&
    (session.generation as number) > 0 &&
    typeof session.resumeTokenHash === "string" &&
    /^[a-f0-9]{64}$/.test(session.resumeTokenHash) &&
    typeof session.sessionId === "string" &&
    session.sessionId.length > 0
  );
}

function isProcessedRoomCommand(value: unknown): value is ProcessedRoomCommand {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const command = value as Partial<ProcessedRoomCommand>;
  return (
    typeof command.commandKey === "string" &&
    command.commandKey.length > 0 &&
    typeof command.messageType === "string" &&
    command.messageType.length > 0
  );
}

function isRandomState(value: unknown): value is HmacCounterRandomState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const random = value as Partial<HmacCounterRandomState>;
  return (
    random.algorithm === "hmac-sha256-counter-v1" &&
    Number.isSafeInteger(random.counter) &&
    (random.counter as number) >= 0 &&
    typeof random.keyBase64 === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(random.keyBase64)
  );
}

function isRoomDeadline(value: unknown): value is RoomDeadline {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const deadline = value as Partial<RoomDeadline>;
  return (
    (deadline.kind === "turn" ||
      deadline.kind === "resolve-trick" ||
      deadline.kind === "continue-round") &&
    Number.isSafeInteger(deadline.dueAt) &&
    Number.isSafeInteger(deadline.matchVersion) &&
    (deadline.playerId === null || typeof deadline.playerId === "string")
  );
}
