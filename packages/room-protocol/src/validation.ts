import {
  AVATAR_KEYS,
  PROTOCOL_VERSION,
  type AvatarKey,
  type ClientRoomMessage,
  type DecodeResult,
  type FriendRoomSnapshot,
  type RoomPermissions,
  type RoomPlayerSnapshot,
  type RoomUpdatePayload,
  type ServerRoomMessage,
  type SessionGrant,
  type ViewerMatchUpdate,
} from "./messages.js";
import {
  isMatchEvent,
  isPlayerMatchSnapshot,
  parseMatchIntent,
} from "./game-validation.js";
import {
  hasOnlyKeys,
  hasOwn,
  isArrayOf,
  isBoundedString,
  isFiniteNumber,
  isIdentifier,
  isNonNegativeInteger,
  isRecord,
  isRequestId,
  type JsonRecord,
} from "./guards.js";

const MAX_FRAME_CHARACTERS = 16_384;

const CLIENT_TYPES = [
  "room.create",
  "room.join",
  "session.resume",
  "room.set-ready",
  "room.start",
  "room.leave",
  "match.intent",
  "match.continue-round",
  "room.rematch",
  "connection.ping",
] as const;

const REQUEST_ERROR_CODES = [
  "AUTH_REQUIRED",
  "SESSION_NOT_FOUND",
  "ROOM_NOT_FOUND",
  "ROOM_FULL",
  "ROOM_NOT_JOINABLE",
  "NOT_HOST",
  "PLAYERS_NOT_READY",
  "NOT_ENOUGH_PLAYERS",
  "WRONG_ROOM_PHASE",
  "PLAYER_NOT_FOUND",
  "NAME_INVALID",
  "ROOM_CODE_INVALID",
  "INVITE_TOKEN_INVALID",
  "COMMAND_REJECTED",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

const PROTOCOL_ERROR_CODES = [
  "INVALID_JSON",
  "INVALID_MESSAGE",
  "MESSAGE_TOO_LARGE",
] as const;

const ROOM_PHASES = ["lobby", "playing", "finished"] as const;

function success<T>(value: T): DecodeResult<T> {
  return { ok: true, value };
}

function failure<T>(error: string): DecodeResult<T> {
  return { error, ok: false };
}

function parseJson(raw: string): DecodeResult<unknown> {
  if (raw.length > MAX_FRAME_CHARACTERS) {
    return failure("Message exceeds the protocol frame limit.");
  }

  try {
    return success(JSON.parse(raw) as unknown);
  } catch {
    return failure("Message is not valid JSON.");
  }
}

function hasVersionOne(value: JsonRecord): boolean {
  return hasOwn(value, "v") && value.v === PROTOCOL_VERSION;
}

function isAvatarKey(value: unknown): value is AvatarKey {
  return (
    typeof value === "string" &&
    (AVATAR_KEYS as readonly string[]).includes(value)
  );
}

function isMaxPlayers(value: unknown): value is 3 | 4 | 5 | 6 {
  return value === 3 || value === 4 || value === 5 || value === 6;
}

function isMode(value: unknown): value is "classic" | "quick" {
  return value === "classic" || value === "quick";
}

function isServerTime(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isToken(value: unknown): value is string {
  return (
    isBoundedString(value, 16, 512) && /^[A-Za-z0-9._-]+$/.test(value)
  );
}

function isRoomCode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(value)
  );
}

function parseDisplayName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (
    trimmed.length < 1 ||
    trimmed.length > 16 ||
    /[\u0000-\u001f\u007f]/.test(trimmed)
  ) {
    return null;
  }

  return trimmed;
}

function parseEmptyPayload(payload: unknown): payload is Record<string, never> {
  return isRecord(payload) && Object.keys(payload).length === 0;
}

function decodeClientValue(value: unknown): DecodeResult<ClientRoomMessage> {
  if (
    !isRecord(value) ||
    !hasVersionOne(value) ||
    typeof value.type !== "string" ||
    !(CLIENT_TYPES as readonly string[]).includes(value.type) ||
    !isRequestId(value.requestId)
  ) {
    return failure("Message envelope or protocol version is invalid.");
  }

  if (value.type === "room.create") {
    if (
      !hasOnlyKeys(value, ["v", "type", "requestId", "payload"]) ||
      !isRecord(value.payload) ||
      !hasOnlyKeys(value.payload, [
        "avatarKey",
        "displayName",
        "maxPlayers",
        "mode",
      ]) ||
      !isAvatarKey(value.payload.avatarKey) ||
      !isMaxPlayers(value.payload.maxPlayers) ||
      !isMode(value.payload.mode)
    ) {
      return failure("room.create payload is invalid.");
    }

    const displayName = parseDisplayName(value.payload.displayName);

    if (!displayName) {
      return failure("displayName is invalid.");
    }

    return success({
      payload: {
        avatarKey: value.payload.avatarKey,
        displayName,
        maxPlayers: value.payload.maxPlayers,
        mode: value.payload.mode,
      },
      requestId: value.requestId,
      type: "room.create",
      v: PROTOCOL_VERSION,
    });
  }

  if (value.type === "room.join") {
    if (
      !hasOnlyKeys(value, ["v", "type", "requestId", "payload"]) ||
      !isRecord(value.payload) ||
      !hasOnlyKeys(
        value.payload,
        ["avatarKey", "displayName"],
        ["inviteToken", "roomCode"],
      ) ||
      !isAvatarKey(value.payload.avatarKey)
    ) {
      return failure("room.join payload is invalid.");
    }

    const displayName = parseDisplayName(value.payload.displayName);
    const hasInviteToken = hasOwn(value.payload, "inviteToken");
    const hasRoomCode = hasOwn(value.payload, "roomCode");

    if (!displayName || hasInviteToken === hasRoomCode) {
      return failure("room.join requires exactly one room locator.");
    }

    if (hasInviteToken && !isToken(value.payload.inviteToken)) {
      return failure("inviteToken is invalid.");
    }

    if (hasRoomCode && !isRoomCode(value.payload.roomCode)) {
      return failure("roomCode is invalid.");
    }

    return success({
      payload: {
        avatarKey: value.payload.avatarKey,
        displayName,
        ...(hasInviteToken
          ? { inviteToken: value.payload.inviteToken as string }
          : { roomCode: value.payload.roomCode as string }),
      },
      requestId: value.requestId,
      type: "room.join",
      v: PROTOCOL_VERSION,
    });
  }

  if (value.type === "session.resume") {
    if (
      !hasOnlyKeys(value, ["v", "type", "requestId", "payload"]) ||
      !isRecord(value.payload) ||
      !hasOnlyKeys(value.payload, ["resumeToken"]) ||
      !isToken(value.payload.resumeToken)
    ) {
      return failure("session.resume payload is invalid.");
    }

    return success({
      payload: { resumeToken: value.payload.resumeToken },
      requestId: value.requestId,
      type: "session.resume",
      v: PROTOCOL_VERSION,
    });
  }

  if (value.type === "room.set-ready") {
    if (
      !hasOnlyKeys(value, ["v", "type", "requestId", "payload"]) ||
      !isRecord(value.payload) ||
      !hasOnlyKeys(value.payload, ["ready"]) ||
      typeof value.payload.ready !== "boolean"
    ) {
      return failure("room.set-ready payload is invalid.");
    }

    return success({
      payload: { ready: value.payload.ready },
      requestId: value.requestId,
      type: "room.set-ready",
      v: PROTOCOL_VERSION,
    });
  }

  if (value.type === "room.start") {
    if (
      !hasOnlyKeys(value, ["v", "type", "requestId", "payload"]) ||
      !isRecord(value.payload) ||
      !hasOnlyKeys(value.payload, ["fillWithAi"]) ||
      typeof value.payload.fillWithAi !== "boolean"
    ) {
      return failure("room.start payload is invalid.");
    }

    return success({
      payload: { fillWithAi: value.payload.fillWithAi },
      requestId: value.requestId,
      type: "room.start",
      v: PROTOCOL_VERSION,
    });
  }

  if (value.type === "match.intent") {
    if (
      !hasOnlyKeys(value, ["v", "type", "requestId", "payload"]) ||
      !isRecord(value.payload) ||
      !hasOnlyKeys(value.payload, ["intent"])
    ) {
      return failure("match.intent payload is invalid.");
    }

    const intent = parseMatchIntent(value.payload.intent, value.requestId);

    if (!intent) {
      return failure(
        "Match intent is invalid, has a mismatched command ID, or contains forbidden fields.",
      );
    }

    return success({
      payload: { intent },
      requestId: value.requestId,
      type: "match.intent",
      v: PROTOCOL_VERSION,
    });
  }

  if (value.type === "connection.ping") {
    if (
      !hasOnlyKeys(value, ["v", "type", "requestId", "payload"]) ||
      !isRecord(value.payload) ||
      !hasOnlyKeys(value.payload, ["clientTime"]) ||
      !isServerTime(value.payload.clientTime)
    ) {
      return failure("connection.ping payload is invalid.");
    }

    return success({
      payload: { clientTime: value.payload.clientTime },
      requestId: value.requestId,
      type: "connection.ping",
      v: PROTOCOL_VERSION,
    });
  }

  if (
    !hasOnlyKeys(value, ["v", "type", "requestId", "payload"]) ||
    !parseEmptyPayload(value.payload)
  ) {
    return failure(`${value.type} payload must be an empty object.`);
  }

  return success({
    payload: {},
    requestId: value.requestId,
    type: value.type,
    v: PROTOCOL_VERSION,
  } as ClientRoomMessage);
}

function isRoomPlayer(value: unknown): value is RoomPlayerSnapshot {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      "avatarKey",
      "connected",
      "isAi",
      "joinedAt",
      "name",
      "playerId",
      "ready",
    ]) &&
    isAvatarKey(value.avatarKey) &&
    typeof value.connected === "boolean" &&
    typeof value.isAi === "boolean" &&
    isServerTime(value.joinedAt) &&
    typeof value.name === "string" &&
    parseDisplayName(value.name) === value.name &&
    isIdentifier(value.playerId) &&
    typeof value.ready === "boolean"
  );
}

function isRoomSnapshot(value: unknown): value is FriendRoomSnapshot {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "createdAt",
      "hostPlayerId",
      "maxPlayers",
      "mode",
      "phase",
      "players",
      "revision",
      "roomCode",
      "roomId",
      "selfPlayerId",
      "updatedAt",
    ]) ||
    !isServerTime(value.createdAt) ||
    !isIdentifier(value.hostPlayerId) ||
    !isMaxPlayers(value.maxPlayers) ||
    !isMode(value.mode) ||
    typeof value.phase !== "string" ||
    !(ROOM_PHASES as readonly string[]).includes(value.phase) ||
    !isArrayOf(value.players, isRoomPlayer) ||
    value.players.length < 1 ||
    value.players.length > value.maxPlayers ||
    !isNonNegativeInteger(value.revision) ||
    !isRoomCode(value.roomCode) ||
    !isIdentifier(value.roomId) ||
    !isIdentifier(value.selfPlayerId) ||
    !isServerTime(value.updatedAt) ||
    value.updatedAt < value.createdAt
  ) {
    return false;
  }

  const playerIds = value.players.map((player) => player.playerId);

  return (
    new Set(playerIds).size === playerIds.length &&
    playerIds.includes(value.hostPlayerId) &&
    playerIds.includes(value.selfPlayerId)
  );
}

function isPermissions(value: unknown): value is RoomPermissions {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      "canContinueRound",
      "canRematch",
      "canSetReady",
      "canStart",
    ]) &&
    typeof value.canContinueRound === "boolean" &&
    typeof value.canRematch === "boolean" &&
    typeof value.canSetReady === "boolean" &&
    typeof value.canStart === "boolean"
  );
}

function isViewerMatchUpdate(value: unknown): value is ViewerMatchUpdate {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["events", "snapshot", "turnDeadlineAt"]) &&
    isArrayOf(value.events, isMatchEvent) &&
    isPlayerMatchSnapshot(value.snapshot) &&
    (value.turnDeadlineAt === null || isServerTime(value.turnDeadlineAt))
  );
}

function isRoomUpdatePayload(value: unknown): value is RoomUpdatePayload {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(
      value,
      ["updateId", "streamId", "room", "permissions", "match"],
      ["ackCommandId"],
    ) ||
    !isNonNegativeInteger(value.updateId) ||
    !isRequestId(value.streamId) ||
    !isRoomSnapshot(value.room) ||
    !isPermissions(value.permissions) ||
    (value.match !== null && !isViewerMatchUpdate(value.match)) ||
    (value.ackCommandId !== undefined &&
      !isRequestId(value.ackCommandId))
  ) {
    return false;
  }

  return (
    value.match === null ||
    value.match.snapshot.privateState.playerId === value.room.selfPlayerId
  );
}

function isSessionGrant(value: unknown): value is SessionGrant {
  return (
    isRecord(value) &&
    hasOnlyKeys(
      value,
      ["playerId", "resumeToken", "roomCode", "roomId"],
      ["inviteToken"],
    ) &&
    isIdentifier(value.playerId) &&
    isToken(value.resumeToken) &&
    isRoomCode(value.roomCode) &&
    isIdentifier(value.roomId) &&
    (value.inviteToken === undefined || isToken(value.inviteToken))
  );
}

function decodeServerValue(value: unknown): DecodeResult<ServerRoomMessage> {
  if (
    !isRecord(value) ||
    !hasVersionOne(value) ||
    typeof value.type !== "string"
  ) {
    return failure("Server message envelope or protocol version is invalid.");
  }

  if (value.type === "connection.ready") {
    if (
      !hasOnlyKeys(value, [
        "v",
        "type",
        "heartbeatIntervalMs",
        "serverTime",
        "streamId",
      ]) ||
      !isFiniteNumber(value.heartbeatIntervalMs) ||
      value.heartbeatIntervalMs <= 0 ||
      !isServerTime(value.serverTime) ||
      !isRequestId(value.streamId)
    ) {
      return failure("connection.ready message is invalid.");
    }

    return success(value as ServerRoomMessage);
  }

  if (value.type === "room.update") {
    const updatePayload = {
      ...(value.ackCommandId === undefined
        ? {}
        : { ackCommandId: value.ackCommandId }),
      match: value.match,
      permissions: value.permissions,
      room: value.room,
      streamId: value.streamId,
      updateId: value.updateId,
    };

    if (
      !hasOnlyKeys(
        value,
        [
          "v",
          "type",
          "serverTime",
          "updateId",
          "streamId",
          "room",
          "permissions",
          "match",
        ],
        ["requestId", "ackCommandId"],
      ) ||
      !isServerTime(value.serverTime) ||
      (value.requestId !== undefined && !isRequestId(value.requestId)) ||
      !isRoomUpdatePayload(updatePayload)
    ) {
      return failure("room.update message is invalid.");
    }

    return success(value as ServerRoomMessage);
  }

  if (value.type === "session.established") {
    if (
      !hasOnlyKeys(value, [
        "v",
        "type",
        "requestId",
        "serverTime",
        "session",
        "update",
      ]) ||
      !isRequestId(value.requestId) ||
      !isServerTime(value.serverTime) ||
      !isSessionGrant(value.session) ||
      !isRoomUpdatePayload(value.update) ||
      value.session.playerId !== value.update.room.selfPlayerId ||
      value.session.roomId !== value.update.room.roomId ||
      value.session.roomCode !== value.update.room.roomCode
    ) {
      return failure("session.established message is invalid.");
    }

    return success(value as ServerRoomMessage);
  }

  if (value.type === "request.error") {
    if (
      !hasOnlyKeys(value, [
        "v",
        "type",
        "requestId",
        "serverTime",
        "code",
        "message",
      ]) ||
      !isRequestId(value.requestId) ||
      !isServerTime(value.serverTime) ||
      typeof value.code !== "string" ||
      !(REQUEST_ERROR_CODES as readonly string[]).includes(value.code) ||
      !isBoundedString(value.message, 1, 256)
    ) {
      return failure("request.error message is invalid.");
    }

    return success(value as ServerRoomMessage);
  }

  if (value.type === "protocol.error") {
    if (
      !hasOnlyKeys(value, [
        "v",
        "type",
        "serverTime",
        "code",
        "message",
      ]) ||
      !isServerTime(value.serverTime) ||
      typeof value.code !== "string" ||
      !(PROTOCOL_ERROR_CODES as readonly string[]).includes(value.code) ||
      !isBoundedString(value.message, 1, 256)
    ) {
      return failure("protocol.error message is invalid.");
    }

    return success(value as ServerRoomMessage);
  }

  if (value.type === "connection.pong") {
    if (
      !hasOnlyKeys(value, [
        "v",
        "type",
        "requestId",
        "serverTime",
        "clientTime",
      ]) ||
      !isRequestId(value.requestId) ||
      !isServerTime(value.serverTime) ||
      !isServerTime(value.clientTime)
    ) {
      return failure("connection.pong message is invalid.");
    }

    return success(value as ServerRoomMessage);
  }

  return failure("Unknown server message type.");
}

export class ProtocolEncodeError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ProtocolEncodeError";
  }
}

function encodeValidated<T>(
  value: T,
  decode: (raw: string) => DecodeResult<T>,
): string {
  let raw: string | undefined;

  try {
    raw = JSON.stringify(value);
  } catch {
    throw new ProtocolEncodeError("Message is not JSON serializable.");
  }

  if (raw === undefined) {
    throw new ProtocolEncodeError("Message is not JSON serializable.");
  }

  const result = decode(raw);

  if (!result.ok) {
    throw new ProtocolEncodeError(result.error);
  }

  return JSON.stringify(result.value);
}

export function decodeClientMessage(
  raw: string,
): DecodeResult<ClientRoomMessage> {
  const decoded = parseJson(raw);

  return decoded.ok ? decodeClientValue(decoded.value) : decoded;
}

export function decodeServerMessage(
  raw: string,
): DecodeResult<ServerRoomMessage> {
  const decoded = parseJson(raw);

  return decoded.ok ? decodeServerValue(decoded.value) : decoded;
}

export function encodeClientMessage(message: ClientRoomMessage): string {
  return encodeValidated(message, decodeClientMessage);
}

export function encodeServerMessage(message: ServerRoomMessage): string {
  return encodeValidated(message, decodeServerMessage);
}
