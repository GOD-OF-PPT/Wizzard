import { createPlayerSnapshot } from "@wizzard/game-core/authority";
import type { MatchEvent } from "@wizzard/game-core/contracts";
import type {
  FriendRoomSnapshot,
  RoomPermissions,
  RoomUpdatePayload,
} from "@wizzard/room-protocol";
import type { RoomRecord } from "./model.js";

function toPublicPhase(
  lifecycle: RoomRecord["lifecycle"],
): FriendRoomSnapshot["phase"] {
  if (lifecycle === "playing") {
    return "playing";
  }

  if (lifecycle === "finished" || lifecycle === "closed") {
    return "finished";
  }

  return "lobby";
}

export function createRoomSnapshot(
  room: RoomRecord,
  viewerPlayerId: string,
): FriendRoomSnapshot {
  return {
    createdAt: room.createdAt,
    hostPlayerId: room.hostPlayerId,
    maxPlayers: room.maxPlayers,
    mode: room.mode,
    phase: toPublicPhase(room.lifecycle),
    players: [...room.players]
      .sort((left, right) => left.seatIndex - right.seatIndex)
      .map((player) => ({
        avatarKey: player.avatarKey,
        connected: player.isAi || player.connected,
        isAi: player.isAi,
        joinedAt: player.joinedAt,
        name: player.name,
        playerId: player.playerId,
        ready: player.ready,
      })),
    revision: room.revision,
    roomCode: room.code,
    roomId: room.id,
    selfPlayerId: viewerPlayerId,
    updatedAt: room.updatedAt,
  };
}

export function createRoomPermissions(
  room: RoomRecord,
  viewerPlayerId: string,
): RoomPermissions {
  const viewer = room.players.find(
    (player) => player.playerId === viewerPlayerId && !player.isAi,
  );
  const isMember = viewer !== undefined;

  return {
    canContinueRound:
      isMember &&
      room.lifecycle === "playing" &&
      room.match?.phase === "round-score",
    canRematch:
      isMember &&
      room.lifecycle === "finished" &&
      room.hostPlayerId === viewerPlayerId,
    canSetReady: isMember && room.lifecycle === "lobby",
    canStart:
      isMember &&
      room.lifecycle === "lobby" &&
      room.hostPlayerId === viewerPlayerId,
  };
}

export function createRoomUpdatePayload(
  room: RoomRecord,
  viewerPlayerId: string,
  streamId: string,
  updateId: number,
  events: readonly MatchEvent[] = [],
  ackCommandId?: string,
): RoomUpdatePayload {
  const canViewMatch =
    room.match !== null &&
    room.match.players.some((player) => player.id === viewerPlayerId);

  return {
    ...(ackCommandId ? { ackCommandId } : {}),
    match:
      room.match && canViewMatch
        ? {
            events: events.map((event) => structuredClone(event)),
            snapshot: createPlayerSnapshot(room.match, viewerPlayerId),
            turnDeadlineAt:
              room.turnTimerEnabled !== false &&
              room.deadline?.kind === "turn"
                ? room.deadline.dueAt
                : null,
          }
        : null,
    permissions: createRoomPermissions(room, viewerPlayerId),
    room: createRoomSnapshot(room, viewerPlayerId),
    streamId,
    updateId,
  };
}
