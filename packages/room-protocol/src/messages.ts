import type {
  GameMode,
  MatchEvent,
  MatchIntent,
  PlayerMatchSnapshot,
} from "@wizzard/game-core/contracts";

export const AVATAR_KEYS = [
  "bamboo-cat",
  "wandering-crane",
  "flower-fox",
  "ink-panda",
  "sleepy-star-cat",
  "masked-traveler",
] as const;
export const PROTOCOL_VERSION = 1 as const;
export const MIN_HUMAN_PLAYERS = 2 as const;
export const MAX_AI_PLAYERS = 4 as const;
export const ROOM_CODE_LENGTH = 6 as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];
export type RoomPhase = "lobby" | "playing" | "finished";

export type RoomPlayerSnapshot = {
  avatarKey: AvatarKey;
  connected: boolean;
  isAi: boolean;
  joinedAt: number;
  name: string;
  playerId: string;
  ready: boolean;
};

export type RoomPermissions = {
  canContinueRound: boolean;
  canRematch: boolean;
  canSetReady: boolean;
  canStart: boolean;
};

export type FriendRoomSnapshot = {
  createdAt: number;
  hostPlayerId: string;
  maxPlayers: 3 | 4 | 5 | 6;
  mode: GameMode;
  phase: RoomPhase;
  players: RoomPlayerSnapshot[];
  revision: number;
  roomCode: string;
  roomId: string;
  selfPlayerId: string;
  updatedAt: number;
};

export type ViewerMatchUpdate = {
  events: MatchEvent[];
  snapshot: PlayerMatchSnapshot;
  turnDeadlineAt: number | null;
};

export type SessionGrant = {
  inviteToken?: string;
  playerId: string;
  resumeToken: string;
  roomCode: string;
  roomId: string;
};

export type CreateRoomMessage = {
  payload: {
    avatarKey: AvatarKey;
    displayName: string;
    maxPlayers: 3 | 4 | 5 | 6;
    mode: GameMode;
  };
  requestId: string;
  type: "room.create";
  v: 1;
};

export type JoinRoomMessage = {
  payload: {
    avatarKey: AvatarKey;
    displayName: string;
    inviteToken?: string;
    roomCode?: string;
  };
  requestId: string;
  type: "room.join";
  v: 1;
};

export type ResumeSessionMessage = {
  payload: { resumeToken: string };
  requestId: string;
  type: "session.resume";
  v: 1;
};

export type SetReadyMessage = {
  payload: { ready: boolean };
  requestId: string;
  type: "room.set-ready";
  v: 1;
};

export type SetAiCountMessage = {
  payload: { aiCount: number };
  requestId: string;
  type: "room.set-ai-count";
  v: 1;
};

export type StartRoomMessage = {
  payload: { fillWithAi: boolean };
  requestId: string;
  type: "room.start";
  v: 1;
};

export type LeaveRoomMessage = {
  payload: Record<string, never>;
  requestId: string;
  type: "room.leave";
  v: 1;
};

export type SubmitMatchIntentMessage = {
  payload: { intent: MatchIntent };
  requestId: string;
  type: "match.intent";
  v: 1;
};

export type ContinueRoundMessage = {
  payload: Record<string, never>;
  requestId: string;
  type: "match.continue-round";
  v: 1;
};

export type RematchMessage = {
  payload: Record<string, never>;
  requestId: string;
  type: "room.rematch";
  v: 1;
};

export type PingMessage = {
  payload: { clientTime: number };
  requestId: string;
  type: "connection.ping";
  v: 1;
};

export type ClientRoomMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | ResumeSessionMessage
  | SetReadyMessage
  | SetAiCountMessage
  | StartRoomMessage
  | LeaveRoomMessage
  | SubmitMatchIntentMessage
  | ContinueRoundMessage
  | RematchMessage
  | PingMessage;

export type SessionEstablishedMessage = {
  requestId: string;
  serverTime: number;
  session: SessionGrant;
  type: "session.established";
  update: RoomUpdatePayload;
  v: 1;
};

export type RoomUpdatePayload = {
  ackCommandId?: string;
  match: ViewerMatchUpdate | null;
  permissions: RoomPermissions;
  room: FriendRoomSnapshot;
  streamId: string;
  updateId: number;
};

export type RoomUpdateMessage = RoomUpdatePayload & {
  requestId?: string;
  serverTime: number;
  type: "room.update";
  v: 1;
};

export type RequestErrorCode =
  | "AUTH_REQUIRED"
  | "SESSION_NOT_FOUND"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "ROOM_NOT_JOINABLE"
  | "NOT_HOST"
  | "PLAYERS_NOT_READY"
  | "NOT_ENOUGH_PLAYERS"
  | "WRONG_ROOM_PHASE"
  | "PLAYER_NOT_FOUND"
  | "NAME_INVALID"
  | "ROOM_CODE_INVALID"
  | "INVITE_TOKEN_INVALID"
  | "COMMAND_REJECTED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type RequestErrorMessage = {
  code: RequestErrorCode;
  message: string;
  requestId: string;
  serverTime: number;
  type: "request.error";
  v: 1;
};

export type ProtocolErrorMessage = {
  code: "INVALID_JSON" | "INVALID_MESSAGE" | "MESSAGE_TOO_LARGE";
  message: string;
  serverTime: number;
  type: "protocol.error";
  v: 1;
};

export type ConnectionReadyMessage = {
  heartbeatIntervalMs: number;
  serverTime: number;
  streamId: string;
  type: "connection.ready";
  v: 1;
};

export type PongMessage = {
  clientTime: number;
  requestId: string;
  serverTime: number;
  type: "connection.pong";
  v: 1;
};

export type ServerRoomMessage =
  | ConnectionReadyMessage
  | SessionEstablishedMessage
  | RoomUpdateMessage
  | RequestErrorMessage
  | ProtocolErrorMessage
  | PongMessage;

export type DecodeFailure = {
  error: string;
  ok: false;
};

export type DecodeSuccess<T> = {
  ok: true;
  value: T;
};

export type DecodeResult<T> = DecodeFailure | DecodeSuccess<T>;
