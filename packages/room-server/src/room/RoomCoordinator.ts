import { randomUUID } from "node:crypto";
import type { MatchEvent } from "@wizzard/game-core/contracts";
import {
  type ClientRoomMessage,
  type CreateRoomMessage,
  type JoinRoomMessage,
  type ResumeSessionMessage,
  type SessionGrant,
} from "@wizzard/room-protocol";
import type { RoomRepository } from "../persistence/types.js";
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  type RoomServiceConfig,
} from "../config.js";
import { RoomServiceError } from "./errors.js";
import type {
  BoundRoomSession,
  RoomRecord,
} from "./model.js";
import { RoomQueue } from "./RoomQueue.js";
import {
  type Clock,
  type MutationDecision,
  type RoomContext,
  mutateRoom,
  rememberRoomCommand,
  roomCommandReceipt,
} from "./room-shared.js";
import {
  SessionService,
  assertBoundSession,
} from "./SessionService.js";
import { LobbyService } from "./LobbyService.js";
import { MatchScheduler, synchronizeMatch } from "./MatchScheduler.js";

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
  private readonly sessionService: SessionService;
  private readonly lobbyService: LobbyService;
  private readonly matchScheduler: MatchScheduler;
  private readonly sessionContext: RoomContext;

  public constructor(options: RoomCoordinatorOptions) {
    this.clock = options.clock ?? Date.now;
    this.config = { ...DEFAULT_ROOM_SERVICE_CONFIG, ...options.config };
    this.idFactory = options.idFactory ?? randomUUID;
    this.repository = options.repository;

    this.sessionContext = {
      clock: this.clock,
      config: this.config,
      idFactory: this.idFactory,
      queue: this.queue,
      repository: this.repository,
      synchronizeMatch,
    };
    this.sessionService = new SessionService(this.sessionContext);
    this.lobbyService = new LobbyService(this.sessionContext);
    this.matchScheduler = new MatchScheduler(this.sessionContext);
  }

  // ─── Session/identity delegation (SessionService) ──────────────────

  public async createRoom(
    message: CreateRoomMessage,
    now = this.clock(),
  ): Promise<EstablishedRoomSession> {
    return this.sessionService.createRoom(message, now);
  }

  public async joinRoom(
    message: JoinRoomMessage,
    now = this.clock(),
  ): Promise<EstablishedRoomSession> {
    return this.sessionService.joinRoom(message, now);
  }

  public async resumeSession(
    message: ResumeSessionMessage,
    now = this.clock(),
  ): Promise<EstablishedRoomSession> {
    return this.sessionService.resumeSession(message, now);
  }

  public async disconnect(
    session: BoundRoomSession,
    now = this.clock(),
  ): Promise<CoordinatorUpdate | null> {
    return this.sessionService.disconnect(session, now);
  }

  // ─── Bound-session command dispatch (facade-owned) ─────────────────

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
        return this.matchScheduler.applyPlayerIntent(room, actor, session, message, now);
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
        this.lobbyService.setReady(room, actor, message.payload.ready);
      } else if (message.type === "room.set-ai-count") {
        this.lobbyService.setAiCount(room, actor.playerId, message.payload.aiCount, now);
      } else if (message.type === "room.start") {
        this.lobbyService.startMatch(room, actor.playerId, message.payload.fillWithAi, now);
      } else if (message.type === "match.continue-round") {
        matchEvents = this.matchScheduler.continueRound(room, now);
      } else if (message.type === "room.rematch") {
        this.lobbyService.returnToLobby(room, actor.playerId);
      } else if (message.type === "room.leave") {
        this.lobbyService.leaveRoom(room, actor.playerId, now);
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

  public async wake(
    roomId: string,
    now = this.clock(),
  ): Promise<CoordinatorUpdate | null> {
    return this.matchScheduler.wake(roomId, now);
  }

  public loadRoom(roomId: string): Promise<RoomRecord | null> {
    return this.repository.loadById(roomId);
  }

  // ─── Match scheduling delegation (MatchScheduler) ──────────────────

  // ─── Shared infrastructure (facade-owned) ──────────────────────────

  private async mutateRoom(
    roomId: string,
    now: number,
    decide: (room: RoomRecord) => MutationDecision,
  ): Promise<CoordinatorUpdate> {
    return mutateRoom(this.sessionContext, roomId, now, decide);
  }
}
