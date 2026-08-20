import {
  decodeServerMessage,
  encodeClientMessage,
  PROTOCOL_VERSION,
  type ClientRoomMessage,
  type CreateRoomMessage,
  type JoinRoomMessage,
  type RequestErrorCode,
  type RoomUpdatePayload,
} from "@wizzard/room-protocol";
import type {
  RoomSessionStore,
  StoredRoomSession,
} from "../platform/SessionStore";
import type {
  TextSocket,
  TextSocketFactory,
  TextSocketTarget,
} from "../platform/SocketTransport";

const DEFAULT_RECONNECT_BASE_MS = 500;
const DEFAULT_RECONNECT_MAX_MS = 8_000;
const MIN_HEARTBEAT_INTERVAL_MS = 1_000;
const MAX_HEARTBEAT_INTERVAL_MS = 60_000;

export type RoomBinding =
  | { payload: CreateRoomMessage["payload"]; type: "create" }
  | { payload: JoinRoomMessage["payload"]; type: "join" }
  | { type: "resume" };

export type RoomSocketConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type RoomSocketEvent =
  | {
      state: RoomSocketConnectionState;
      type: "connection";
    }
  | {
      code: RequestErrorCode | "PROTOCOL_ERROR" | "TRANSPORT_ERROR";
      message: string;
      requestId?: string;
      type: "error";
    }
  | {
      payload: RoomUpdatePayload;
      serverTime: number;
      type: "update";
    };

export type RoomSocketListener = (event: RoomSocketEvent) => void;

export type RoomSocketClientOptions = {
  binding: RoomBinding;
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
  sessionStore: RoomSessionStore;
  socketFactory: TextSocketFactory;
  target: TextSocketTarget;
};

function clampHeartbeatInterval(value: number): number {
  return Math.min(
    MAX_HEARTBEAT_INTERVAL_MS,
    Math.max(MIN_HEARTBEAT_INTERVAL_MS, value),
  );
}

function isTerminalSessionError(code: RequestErrorCode): boolean {
  return (
    code === "AUTH_REQUIRED" ||
    code === "SESSION_NOT_FOUND" ||
    code === "ROOM_NOT_FOUND" ||
    code === "PLAYER_NOT_FOUND"
  );
}

export class RoomSocketClient {
  private bindingRequestId: string | null = null;
  private connectionGeneration = 0;
  private connectionState: RoomSocketConnectionState = "disconnected";
  private disposed = false;
  private heartbeatIntervalMs = 15_000;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessageAt = 0;
  private lastUpdateId = -1;
  private latestUpdate: RoomUpdatePayload | null = null;
  private latestUpdateServerTime = 0;
  private readonly listeners = new Set<RoomSocketListener>();
  private pendingCommands = new Map<string, ClientRoomMessage>();
  private pendingInitialBinding: ClientRoomMessage | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private requestCounter = 0;
  private session: StoredRoomSession | null = null;
  private socket: TextSocket | null = null;
  private started = false;
  private streamId: string | null = null;
  private terminal = false;

  public constructor(private readonly options: RoomSocketClientOptions) {}

  public dispose(): void {
    this.disposed = true;
    this.started = false;
    this.terminal = true;
    this.clearTimers();
    this.connectionGeneration += 1;
    this.socket?.close(1000, "client disposed");
    this.socket = null;
    this.listeners.clear();
  }

  public getConnectionState(): RoomSocketConnectionState {
    return this.connectionState;
  }

  public getInviteToken(): string | null {
    return this.session?.inviteToken ?? null;
  }

  public getLatestUpdate(): RoomUpdatePayload | null {
    return this.latestUpdate;
  }

  public nextRequestId(): string {
    if (!this.streamId) {
      throw new Error("ROOM_STREAM_NOT_READY");
    }

    this.requestCounter += 1;
    const streamPrefix = this.streamId.slice(0, 48);
    return `${streamPrefix}:${this.requestCounter.toString(36)}`;
  }

  public sendTracked(message: ClientRoomMessage): boolean {
    this.pendingCommands.set(message.requestId, message);

    if (this.connectionState !== "connected") {
      return false;
    }

    return this.send(message);
  }

  public start(): void {
    if (this.started && !this.disposed) {
      return;
    }

    this.started = true;
    this.disposed = false;
    this.terminal = false;
    this.session =
      this.options.binding.type === "resume"
        ? this.options.sessionStore.load()
        : null;

    if (this.options.binding.type === "resume" && !this.session) {
      this.emitError(
        "SESSION_NOT_FOUND",
        "No saved friend-room session is available.",
      );
      this.setConnectionState("disconnected");
      this.terminal = true;
      return;
    }

    this.connect(false);
  }

  public subscribe(listener: RoomSocketListener): () => void {
    this.listeners.add(listener);
    listener({ state: this.connectionState, type: "connection" });

    if (this.latestUpdate) {
      listener({
        payload: this.latestUpdate,
        serverTime: this.latestUpdateServerTime,
        type: "update",
      });
    }

    return () => this.listeners.delete(listener);
  }

  private bindSession(): void {
    let message: ClientRoomMessage;

    if (this.session) {
      const requestId = this.nextRequestId();
      message = {
        payload: { resumeToken: this.session.resumeToken },
        requestId,
        type: "session.resume",
        v: PROTOCOL_VERSION,
      };
    } else if (this.pendingInitialBinding) {
      message = this.pendingInitialBinding;
    } else if (this.options.binding.type === "create") {
      const requestId = this.nextRequestId();
      message = {
        payload: this.options.binding.payload,
        requestId,
        type: "room.create",
        v: PROTOCOL_VERSION,
      };
      this.pendingInitialBinding = message;
    } else if (this.options.binding.type === "join") {
      const requestId = this.nextRequestId();
      message = {
        payload: this.options.binding.payload,
        requestId,
        type: "room.join",
        v: PROTOCOL_VERSION,
      };
      this.pendingInitialBinding = message;
    } else {
      this.failTerminal(
        "SESSION_NOT_FOUND",
        "The saved friend-room session is no longer available.",
      );
      return;
    }

    this.bindingRequestId = message.requestId;
    this.send(message);
  }

  private clearTimers(): void {
    if (this.heartbeatTimer !== null) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private connect(isReconnect: boolean): void {
    if (this.disposed || this.terminal) {
      return;
    }

    this.clearTimers();
    const generation = ++this.connectionGeneration;
    const previousSocket = this.socket;
    this.socket = null;
    this.streamId = null;
    this.lastUpdateId = -1;
    this.requestCounter = 0;
    this.bindingRequestId = null;
    this.setConnectionState(isReconnect ? "reconnecting" : "connecting");
    previousSocket?.close(1000, "replaced by a new connection");

    try {
      const socket = this.options.socketFactory.connect(
        this.options.target,
        {
          onClose: () => {
            if (generation !== this.connectionGeneration) {
              return;
            }

            this.socket = null;
            this.scheduleReconnect();
          },
          onError: (error) => {
            if (generation !== this.connectionGeneration) {
              return;
            }

            this.emitError("TRANSPORT_ERROR", error.message);
            this.socket?.close(4001, "transport error");
          },
          onMessage: (text) => {
            if (generation === this.connectionGeneration) {
              this.handleMessage(text);
            }
          },
          onOpen: () => {
            if (generation === this.connectionGeneration) {
              this.lastMessageAt = Date.now();
            }
          },
        },
      );

      if (generation !== this.connectionGeneration) {
        socket.close(1000, "stale connection");
        return;
      }

      this.socket = socket;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emitError("TRANSPORT_ERROR", message);
      this.scheduleReconnect();
    }
  }

  private emit(event: RoomSocketEvent): void {
    // A lobby-to-match handoff can subscribe the match adapter while an update
    // is being dispatched. Iterate a snapshot so the new listener receives the
    // cached update once through subscribe(), not twice in the same dispatch.
    for (const listener of Array.from(this.listeners)) {
      listener(event);
    }
  }

  private emitError(
    code: RequestErrorCode | "PROTOCOL_ERROR" | "TRANSPORT_ERROR",
    message: string,
    requestId?: string,
  ): void {
    this.emit({
      code,
      message,
      ...(requestId ? { requestId } : {}),
      type: "error",
    });
  }

  private failTerminal(
    code: RequestErrorCode | "PROTOCOL_ERROR",
    message: string,
    requestId?: string,
  ): void {
    this.terminal = true;
    this.clearTimers();
    this.connectionGeneration += 1;
    this.socket?.close(4002, message.slice(0, 32));
    this.socket = null;
    this.emitError(code, message, requestId);
    this.setConnectionState("disconnected");
  }

  private handleMessage(raw: string): void {
    this.lastMessageAt = Date.now();
    const decoded = decodeServerMessage(raw);

    if (!decoded.ok) {
      this.failTerminal("PROTOCOL_ERROR", decoded.error);
      return;
    }

    const message = decoded.value;

    if (message.type === "connection.ready") {
      this.streamId = message.streamId;
      this.lastUpdateId = -1;
      this.requestCounter = 0;
      this.heartbeatIntervalMs = clampHeartbeatInterval(
        message.heartbeatIntervalMs,
      );
      this.scheduleHeartbeat();
      this.bindSession();
      return;
    }

    if (message.type === "connection.pong") {
      return;
    }

    if (message.type === "protocol.error") {
      this.failTerminal("PROTOCOL_ERROR", message.message);
      return;
    }

    if (message.type === "request.error") {
      this.pendingCommands.delete(message.requestId);

      if (isTerminalSessionError(message.code)) {
        this.options.sessionStore.clear();
        this.session = null;
        this.failTerminal(message.code, message.message, message.requestId);
        return;
      }

      if (message.requestId === this.bindingRequestId) {
        this.failTerminal(message.code, message.message, message.requestId);
        return;
      }

      this.emitError(message.code, message.message, message.requestId);
      return;
    }

    if (message.type === "session.established") {
      const bindingInviteToken =
        this.options.binding.type === "join"
          ? this.options.binding.payload.inviteToken
          : undefined;
      const inviteToken =
        message.session.inviteToken ??
        (this.session?.roomId === message.session.roomId
          ? this.session.inviteToken
          : undefined) ??
        bindingInviteToken;
      const session: StoredRoomSession = {
        ...(inviteToken ? { inviteToken } : {}),
        playerId: message.session.playerId,
        resumeToken: message.session.resumeToken,
        roomCode: message.session.roomCode,
        roomId: message.session.roomId,
      };

      if (!this.handleRoomUpdate(message.update, message.serverTime)) {
        if (!this.terminal) {
          this.failTerminal(
            "PROTOCOL_ERROR",
            "Session update does not belong to the active socket stream.",
          );
        }
        return;
      }

      this.bindingRequestId = null;
      this.pendingInitialBinding = null;
      this.session = session;
      this.options.sessionStore.save(session);
      this.reconnectAttempt = 0;
      this.setConnectionState("connected");
      this.resendPendingCommands();
      return;
    }

    this.handleRoomUpdate(message, message.serverTime);
  }

  private handleRoomUpdate(
    payload: RoomUpdatePayload,
    serverTime: number,
  ): boolean {
    if (!this.streamId || payload.streamId !== this.streamId) {
      return false;
    }

    if (payload.updateId <= this.lastUpdateId) {
      return false;
    }

    if (
      payload.match &&
      payload.room.selfPlayerId !== payload.match.snapshot.privateState.playerId
    ) {
      this.failTerminal(
        "PROTOCOL_ERROR",
        "Room viewer and match viewer identities do not match.",
      );
      return false;
    }

    this.lastUpdateId = payload.updateId;
    this.latestUpdate = payload;
    this.latestUpdateServerTime = serverTime;

    if (payload.ackCommandId) {
      const acknowledged = this.pendingCommands.get(payload.ackCommandId);
      this.pendingCommands.delete(payload.ackCommandId);
      if (acknowledged?.type === "room.leave") {
        this.options.sessionStore.clear();
        this.session = null;
      }
    }

    this.emit({ payload, serverTime, type: "update" });
    return true;
  }

  private resendPendingCommands(): void {
    for (const message of this.pendingCommands.values()) {
      this.send(message);
    }
  }

  private scheduleHeartbeat(): void {
    if (this.disposed || this.terminal || !this.streamId) {
      return;
    }

    if (this.heartbeatTimer !== null) {
      clearTimeout(this.heartbeatTimer);
    }

    this.heartbeatTimer = setTimeout(() => {
      this.heartbeatTimer = null;

      if (Date.now() - this.lastMessageAt > this.heartbeatIntervalMs * 2.5) {
        this.socket?.close(4000, "heartbeat timeout");
        return;
      }

      const requestId = this.nextRequestId();
      this.send({
        payload: { clientTime: Date.now() },
        requestId,
        type: "connection.ping",
        v: PROTOCOL_VERSION,
      });
      this.scheduleHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  private scheduleReconnect(): void {
    if (
      this.disposed ||
      this.terminal ||
      this.reconnectTimer !== null
    ) {
      return;
    }

    this.setConnectionState("reconnecting");
    const base = this.options.reconnectBaseMs ?? DEFAULT_RECONNECT_BASE_MS;
    const maximum = this.options.reconnectMaxMs ?? DEFAULT_RECONNECT_MAX_MS;
    const exponential = Math.min(
      maximum,
      base * 2 ** Math.min(this.reconnectAttempt, 8),
    );
    const delay = Math.round(exponential * (0.5 + Math.random() * 0.5));
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(true);
    }, delay);
  }

  private send(message: ClientRoomMessage): boolean {
    if (!this.socket) {
      return false;
    }

    try {
      return this.socket.send(encodeClientMessage(message));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.emitError("PROTOCOL_ERROR", reason, message.requestId);
      return false;
    }
  }

  private setConnectionState(state: RoomSocketConnectionState): void {
    if (this.connectionState === state) {
      return;
    }

    this.connectionState = state;
    this.emit({ state, type: "connection" });
  }
}
