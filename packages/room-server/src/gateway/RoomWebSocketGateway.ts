import { randomUUID } from "node:crypto";
import type { Server as HttpServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { MatchEvent } from "@wizzard/game-core/contracts";
import {
  WebSocket,
  WebSocketServer,
  type RawData,
} from "ws";
import {
  decodeClientMessage,
  encodeServerMessage,
  PROTOCOL_VERSION,
  type ClientRoomMessage,
  type RequestErrorCode,
  type ServerRoomMessage,
} from "@wizzard/room-protocol";
import type { RoomServiceConfig } from "../config.js";
import type { BoundRoomSession, RoomRecord } from "../room/model.js";
import {
  RoomCoordinator,
  type CoordinatorUpdate,
  type EstablishedRoomSession,
} from "../room/RoomCoordinator.js";
import {
  isRoomServiceError,
  RoomServiceError,
} from "../room/errors.js";
import { createRoomUpdatePayload } from "../room/projection.js";

type ConnectionContext = {
  lastSeenAt: number;
  lastRoomRevision: number;
  processing: Promise<void>;
  rateCount: number;
  rateWindowStartedAt: number;
  sequence: number;
  session: BoundRoomSession | null;
  socket: WebSocket;
  streamId: string;
};

export type RoomWebSocketGatewayOptions = {
  allowedOrigins?: readonly string[];
  config: RoomServiceConfig;
  coordinator: RoomCoordinator;
  httpServer: HttpServer;
  now?: () => number;
};

export class RoomWebSocketGateway {
  private readonly allowedOrigins: Set<string> | null;
  private readonly boundConnections = new Map<string, ConnectionContext>();
  private readonly config: RoomServiceConfig;
  private readonly connections = new Set<ConnectionContext>();
  private readonly coordinator: RoomCoordinator;
  private readonly heartbeatTimer: NodeJS.Timeout;
  private readonly now: () => number;
  private readonly roomTimers = new Map<string, NodeJS.Timeout>();
  private readonly webSocketServer: WebSocketServer;

  public constructor(options: RoomWebSocketGatewayOptions) {
    this.allowedOrigins = options.allowedOrigins?.length
      ? new Set(options.allowedOrigins)
      : null;
    this.config = options.config;
    this.coordinator = options.coordinator;
    this.now = options.now ?? Date.now;
    this.webSocketServer = new WebSocketServer({
      clientTracking: false,
      maxPayload: this.config.maxFrameBytes,
      noServer: true,
      perMessageDeflate: false,
    });

    options.httpServer.on("upgrade", (request, socket, head) => {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      if (pathname !== "/ws" || !this.isOriginAllowed(request)) {
        socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }

      this.webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
        this.accept(webSocket);
      });
    });

    this.heartbeatTimer = setInterval(
      () => this.checkHeartbeats(),
      this.config.heartbeatIntervalMs,
    );
    this.heartbeatTimer.unref();
  }

  public async close(): Promise<void> {
    clearInterval(this.heartbeatTimer);
    for (const timer of this.roomTimers.values()) {
      clearTimeout(timer);
    }
    this.roomTimers.clear();

    for (const context of this.connections) {
      context.session = null;
      context.socket.close(1001, "Server shutting down");
    }
    this.connections.clear();
    this.boundConnections.clear();

    await new Promise<void>((resolve) => {
      this.webSocketServer.close(() => resolve());
    });
  }

  private accept(socket: WebSocket): void {
    const now = this.now();
    const context: ConnectionContext = {
      lastSeenAt: now,
      lastRoomRevision: -1,
      processing: Promise.resolve(),
      rateCount: 0,
      rateWindowStartedAt: now,
      sequence: 0,
      session: null,
      socket,
      streamId: randomUUID(),
    };
    this.connections.add(context);

    socket.on("message", (data, isBinary) => {
      context.processing = context.processing
        .then(() => this.handleFrame(context, data, isBinary))
        .catch(() => {
          this.sendRequestError(
            context,
            "internal",
            "INTERNAL_ERROR",
            "The room service could not process the command.",
          );
        });
    });
    socket.on("pong", () => {
      context.lastSeenAt = this.now();
    });
    socket.on("close", () => {
      void this.handleClose(context);
    });
    socket.on("error", () => {
      // The close handler owns room presence transitions. Never log frames or tokens.
    });

    this.send(context, {
      heartbeatIntervalMs: this.config.heartbeatIntervalMs,
      serverTime: now,
      streamId: context.streamId,
      type: "connection.ready",
      v: PROTOCOL_VERSION,
    });
  }

  private async handleFrame(
    context: ConnectionContext,
    data: RawData,
    isBinary: boolean,
  ): Promise<void> {
    context.lastSeenAt = this.now();

    if (isBinary) {
      this.sendProtocolError(
        context,
        "INVALID_MESSAGE",
        "Binary WebSocket frames are not supported.",
      );
      context.socket.close(1003, "Text frames only");
      return;
    }

    const raw = data.toString();
    if (Buffer.byteLength(raw, "utf8") > this.config.maxFrameBytes) {
      this.sendProtocolError(
        context,
        "MESSAGE_TOO_LARGE",
        "The WebSocket message exceeds 16 KiB.",
      );
      context.socket.close(1009, "Message too large");
      return;
    }

    const decoded = decodeClientMessage(raw);
    if (!decoded.ok) {
      this.sendProtocolError(
        context,
        decoded.error.toLowerCase().includes("json")
          ? "INVALID_JSON"
          : "INVALID_MESSAGE",
        decoded.error,
      );
      return;
    }

    const message = decoded.value;
    if (!this.consumeRateLimit(context)) {
      this.sendRequestError(
        context,
        message.requestId,
        "RATE_LIMITED",
        "Too many room commands; retry shortly.",
      );
      return;
    }

    if (message.type === "connection.ping") {
      this.send(context, {
        clientTime: message.payload.clientTime,
        requestId: message.requestId,
        serverTime: this.now(),
        type: "connection.pong",
        v: PROTOCOL_VERSION,
      });
      return;
    }

    try {
      if (
        message.type === "room.create" ||
        message.type === "room.join" ||
        message.type === "session.resume"
      ) {
        await this.establish(context, message);
        return;
      }

      if (!context.session) {
        throw new RoomServiceError(
          "AUTH_REQUIRED",
          "Create, join, or resume a room before sending commands.",
        );
      }

      const departureProjection =
        message.type === "room.leave"
          ? await this.coordinator.loadRoom(context.session.roomId)
          : null;
      const update = await this.coordinator.execute(
        context.session,
        message,
        this.now(),
      );
      if (message.type === "room.leave") {
        if (departureProjection) {
          this.sendRoomUpdate(
            context,
            departureProjection,
            [],
            update.ackCommandId,
            true,
          );
        }
        this.unbind(context);
        if (update.room.players.length > 0 && update.room.hostPlayerId) {
          this.broadcast(update, context, true);
        }
        this.scheduleRoom(update.room);
        return;
      }

      if (update.visibility === "room" && update.changed) {
        this.broadcast(update, context);
      } else {
        this.sendRoomUpdate(context, update.room, update.matchEvents, update.ackCommandId);
      }

      if (update.invalidateSession) {
        this.unbind(context);
      }
      this.scheduleRoom(update.room);
    } catch (error) {
      this.handleCommandError(context, message.requestId, error);
    }
  }

  private async establish(
    context: ConnectionContext,
    message: Extract<
      ClientRoomMessage,
      { type: "room.create" | "room.join" | "session.resume" }
    >,
  ): Promise<void> {
    if (context.session) {
      throw new RoomServiceError(
        "COMMAND_REJECTED",
        "This socket is already bound to a room session.",
      );
    }

    let established: EstablishedRoomSession;
    if (message.type === "room.create") {
      established = await this.coordinator.createRoom(message, this.now());
    } else if (message.type === "room.join") {
      established = await this.coordinator.joinRoom(message, this.now());
    } else {
      established = await this.coordinator.resumeSession(message, this.now());
    }

    this.bind(context, established.session);
    const updateId = ++context.sequence;
    context.lastRoomRevision = established.room.revision;
    this.send(context, {
      requestId: message.requestId,
      serverTime: this.now(),
      session: established.grant,
      type: "session.established",
      update: createRoomUpdatePayload(
        established.room,
        established.session.playerId,
        context.streamId,
        updateId,
        [],
        message.requestId,
      ),
      v: PROTOCOL_VERSION,
    });

    this.broadcast(
      {
        changed: true,
        matchEvents: [],
        room: established.room,
        visibility: "room",
      },
      context,
      true,
    );
    this.scheduleRoom(established.room);
  }

  private bind(context: ConnectionContext, session: BoundRoomSession): void {
    const key = sessionKey(session.roomId, session.playerId);
    const previous = this.boundConnections.get(key);
    if (previous && previous !== context) {
      previous.session = null;
      previous.socket.close(4001, "Session replaced by a newer connection");
    }
    context.session = session;
    context.lastRoomRevision = -1;
    this.boundConnections.set(key, context);
  }

  private unbind(context: ConnectionContext): void {
    const session = context.session;
    if (!session) {
      return;
    }
    const key = sessionKey(session.roomId, session.playerId);
    if (this.boundConnections.get(key) === context) {
      this.boundConnections.delete(key);
    }
    context.session = null;
  }

  private async handleClose(context: ConnectionContext): Promise<void> {
    this.connections.delete(context);
    const session = context.session;
    this.unbind(context);
    if (!session) {
      return;
    }

    const update = await this.coordinator.disconnect(session, this.now());
    if (update?.changed) {
      this.broadcast(update);
      this.scheduleRoom(update.room);
    }
  }

  private broadcast(
    update: CoordinatorUpdate,
    actor?: ConnectionContext,
    excludeActor = false,
  ): void {
    for (const context of this.connections) {
      if (
        (excludeActor && context === actor) ||
        !context.session ||
        context.session.roomId !== update.room.id ||
        context.socket.readyState !== WebSocket.OPEN
      ) {
        continue;
      }

      this.sendRoomUpdate(
        context,
        update.room,
        update.matchEvents,
        context === actor ? update.ackCommandId : undefined,
      );
    }
  }

  private sendRoomUpdate(
    context: ConnectionContext,
    room: RoomRecord,
    events: readonly MatchEvent[],
    ackCommandId?: string,
    allowOlderRevision = false,
  ): void {
    const session = context.session;
    if (!session || context.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    if (!allowOlderRevision && room.revision < context.lastRoomRevision) {
      return;
    }
    context.lastRoomRevision = Math.max(
      context.lastRoomRevision,
      room.revision,
    );

    const payload = createRoomUpdatePayload(
      room,
      session.playerId,
      context.streamId,
      ++context.sequence,
      events,
      ackCommandId,
    );
    this.send(context, {
      ...payload,
      serverTime: this.now(),
      type: "room.update",
      v: PROTOCOL_VERSION,
    });
  }

  private scheduleRoom(room: RoomRecord): void {
    const existing = this.roomTimers.get(room.id);
    if (existing) {
      clearTimeout(existing);
      this.roomTimers.delete(room.id);
    }
    if (!room.deadline || room.lifecycle !== "playing") {
      return;
    }

    const delay = Math.max(0, room.deadline.dueAt - this.now());
    const timer = setTimeout(() => {
      this.roomTimers.delete(room.id);
      void this.coordinator
        .wake(room.id, this.now())
        .then((update) => {
          if (!update) {
            return;
          }
          if (update.changed) {
            this.broadcast(update);
          }
          this.scheduleRoom(update.room);
        })
        .catch(() => {
          // A later room command or restart will reschedule from persisted dueAt.
        });
    }, Math.min(delay, 2_147_483_647));
    timer.unref();
    this.roomTimers.set(room.id, timer);
  }

  private checkHeartbeats(): void {
    const now = this.now();
    for (const context of this.connections) {
      if (now - context.lastSeenAt > this.config.idleConnectionTimeoutMs) {
        context.socket.close(4000, "Heartbeat timeout");
        continue;
      }
      if (context.socket.readyState === WebSocket.OPEN) {
        context.socket.ping();
      }
    }
  }

  private consumeRateLimit(context: ConnectionContext): boolean {
    const now = this.now();
    if (now - context.rateWindowStartedAt >= 10_000) {
      context.rateWindowStartedAt = now;
      context.rateCount = 0;
    }
    context.rateCount += 1;
    return context.rateCount <= 60;
  }

  private isOriginAllowed(request: IncomingMessage): boolean {
    if (!this.allowedOrigins) {
      return true;
    }
    const origin = request.headers.origin;
    return typeof origin === "string" && this.allowedOrigins.has(origin);
  }

  private handleCommandError(
    context: ConnectionContext,
    requestId: string,
    error: unknown,
  ): void {
    if (isRoomServiceError(error)) {
      this.sendRequestError(context, requestId, error.code, error.message);
      if (
        error.code === "SESSION_NOT_FOUND" ||
        error.code === "ROOM_NOT_FOUND" ||
        error.code === "PLAYER_NOT_FOUND"
      ) {
        this.unbind(context);
        context.socket.close(4002, "Room session is no longer valid");
      }
      return;
    }
    this.sendRequestError(
      context,
      requestId,
      "INTERNAL_ERROR",
      "The room service could not process the command.",
    );
  }

  private sendRequestError(
    context: ConnectionContext,
    requestId: string,
    code: RequestErrorCode,
    message: string,
  ): void {
    this.send(context, {
      code,
      message,
      requestId,
      serverTime: this.now(),
      type: "request.error",
      v: PROTOCOL_VERSION,
    });
  }

  private sendProtocolError(
    context: ConnectionContext,
    code: "INVALID_JSON" | "INVALID_MESSAGE" | "MESSAGE_TOO_LARGE",
    message: string,
  ): void {
    this.send(context, {
      code,
      message: message.slice(0, 256),
      serverTime: this.now(),
      type: "protocol.error",
      v: PROTOCOL_VERSION,
    });
  }

  private send(context: ConnectionContext, message: ServerRoomMessage): void {
    if (context.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    context.socket.send(encodeServerMessage(message));
  }
}

function sessionKey(roomId: string, playerId: string): string {
  return `${roomId}:${playerId}`;
}
