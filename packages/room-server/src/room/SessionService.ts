import { createHash } from "node:crypto";
import type {
  CreateRoomMessage,
  JoinRoomMessage,
  RequestErrorCode,
  ResumeSessionMessage,
  SessionGrant,
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
import {
  createHmacCounterRandomState,
} from "../random/index.js";
import { RoomServiceError } from "./errors.js";
import type {
  BoundRoomSession,
  HumanSessionRecord,
  RoomPlayerRecord,
  RoomRecord,
} from "./model.js";
import type {
  CoordinatorUpdate,
  EstablishedRoomSession,
} from "./RoomCoordinator.js";
import {
  expiryFor,
  firstOpenSeat,
  mutateRoom,
  prepareSave,
  requirePlayer,
  requireRoom,
  type RoomContext,
} from "./room-shared.js";

/**
 * SessionService — session/identity management extracted from RoomCoordinator.
 *
 * Owns room creation, joining, session resumption, disconnection, and
 * session rotation. All shared infrastructure (RoomQueue, repository,
 * config, clock, idFactory, synchronizeMatch) is injected via RoomContext
 * so the facade retains ownership.
 */
export class SessionService {
  public constructor(private readonly ctx: RoomContext) {}

  public async createRoom(
    message: CreateRoomMessage,
    now: number,
  ): Promise<EstablishedRoomSession> {
    // Reclaim expired rooms before checking the active-room cap so that
    // stale rooms do not artificially inflate the count.
    await this.ctx.repository.sweepExpired(now);
    const activeCount = await this.ctx.repository.countActive(now);
    if (activeCount >= this.ctx.config.maxActiveRooms) {
      throw new RoomServiceError(
        "ROOM_LIMIT_REACHED",
        "The room service has reached its active room capacity.",
      );
    }

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const roomId = this.ctx.idFactory();
      const playerId = this.ctx.idFactory();
      const sessionId = this.ctx.idFactory();
      const invite = issueInviteToken(roomId);
      const resume = issueResumeToken(roomId, playerId);
      const sessionRecord: HumanSessionRecord = {
        expiresAt: now + this.ctx.config.sessionTtlMs,
        generation: 1,
        resumeTokenHash: resume.tokenHash,
        sessionId,
      };
      const room: RoomRecord = {
        code: generateRoomCode(),
        commandHistory: [],
        createdAt: now,
        deadline: null,
        expiresAt: now + this.ctx.config.lobbyRoomTtlMs,
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
        // Older v1 clients omit this field and retain their established
        // 30-second room behavior. The current client sends false explicitly.
        turnTimerEnabled: message.payload.turnTimerEnabled ?? true,
        updatedAt: now,
      };

      if (!(await this.ctx.repository.create(room))) {
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
    now: number,
  ): Promise<EstablishedRoomSession> {
    const located = await this.locateJoinRoom(message);

    if (!located) {
      throw new RoomServiceError("ROOM_NOT_FOUND", "Friend room not found.");
    }

    return this.ctx.queue.run(located.id, async () => {
      const current = await requireRoom(this.ctx.repository, located.id);
      const requestFingerprint = fingerprintJoinRequest(message);
      const replayedPlayer = current.players.find(
        (player) =>
          !player.isAi && player.joinRequestId === message.requestId,
      );

      if (replayedPlayer) {
        if (replayedPlayer.joinRequestFingerprint !== requestFingerprint) {
          throw new RoomServiceError(
            "COMMAND_REJECTED",
            "The join request id was already used with different room details.",
          );
        }
        if (
          !replayedPlayer.session ||
          replayedPlayer.session.expiresAt <= now ||
          current.lifecycle === "closed"
        ) {
          throw new RoomServiceError(
            "SESSION_NOT_FOUND",
            "The retried join session is no longer active.",
          );
        }

        const room = structuredClone(current);
        const rotated = this.rotatePlayerSession(
          room,
          replayedPlayer.playerId,
          now,
        );
        prepareSave(room, current.revision, now, expiryFor(room, now, this.ctx.config));
        await this.saveOrThrow(room, current.revision);
        return { ...rotated, room };
      }

      if (current.lifecycle !== "lobby") {
        throw new RoomServiceError(
          "ROOM_NOT_JOINABLE",
          "This room has already started.",
        );
      }

      const room = structuredClone(current);
      let replacedAiSeatIndex: number | null = null;
      if (room.players.length >= room.maxPlayers) {
        const replaceableAi = room.players
          .filter((player) => player.isAi)
          .sort((left, right) => right.seatIndex - left.seatIndex)[0];
        if (!replaceableAi) {
          throw new RoomServiceError("ROOM_FULL", "This room is full.");
        }
        replacedAiSeatIndex = replaceableAi.seatIndex;
        room.players = room.players.filter(
          (player) => player.playerId !== replaceableAi.playerId,
        );
      }

      const playerId = this.ctx.idFactory();
      const sessionId = this.ctx.idFactory();
      const resume = issueResumeToken(current.id, playerId);
      const seatIndex = replacedAiSeatIndex ?? firstOpenSeat(room);
      room.players.push({
        avatarKey: message.payload.avatarKey,
        connected: true,
        consecutiveTimeouts: 0,
        control: "human",
        isAi: false,
        joinRequestFingerprint: requestFingerprint,
        joinRequestId: message.requestId,
        joinedAt: now,
        name: message.payload.displayName,
        playerId,
        ready: false,
        seatIndex,
        session: {
          expiresAt: now + this.ctx.config.sessionTtlMs,
          generation: 1,
          resumeTokenHash: resume.tokenHash,
          sessionId,
        },
      });
      prepareSave(room, current.revision, now, expiryFor(room, now, this.ctx.config));
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
    now: number,
  ): Promise<EstablishedRoomSession> {
    const parsed = parseResumeToken(message.payload.resumeToken);

    if (!parsed) {
      throw new RoomServiceError(
        "SESSION_NOT_FOUND",
        "The resume credential is invalid.",
      );
    }

    return this.ctx.queue.run(parsed.roomId, async () => {
      const current = await requireRoom(
        this.ctx.repository,
        parsed.roomId,
        "SESSION_NOT_FOUND",
      );
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
      const rotated = this.rotatePlayerSession(room, parsed.playerId, now);
      prepareSave(room, current.revision, now, expiryFor(room, now, this.ctx.config));
      await this.saveOrThrow(room, current.revision);

      return { ...rotated, room };
    });
  }

  public async disconnect(
    session: BoundRoomSession,
    now: number,
  ): Promise<CoordinatorUpdate | null> {
    try {
      return await mutateRoom(this.ctx, session.roomId, now, (room) => {
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
        if (
          room.lifecycle === "playing" &&
          room.turnTimerEnabled === false &&
          room.match?.currentPlayerId === player.playerId
        ) {
          this.ctx.synchronizeMatch(room, now, this.ctx.config);
        }
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

  public rotatePlayerSession(
    room: RoomRecord,
    playerId: string,
    now: number,
  ): Pick<EstablishedRoomSession, "grant" | "session"> {
    const player = requirePlayer(room, playerId);
    if (!player.session) {
      throw new RoomServiceError(
        "SESSION_NOT_FOUND",
        "The room session is no longer active.",
      );
    }

    const resume = issueResumeToken(room.id, player.playerId);
    const nextGeneration = player.session.generation + 1;
    player.connected = true;
    player.consecutiveTimeouts = 0;
    player.control = "human";
    player.session = {
      expiresAt: now + this.ctx.config.sessionTtlMs,
      generation: nextGeneration,
      resumeTokenHash: resume.tokenHash,
      sessionId: player.session.sessionId,
    };
    if (
      room.lifecycle === "playing" &&
      room.turnTimerEnabled === false &&
      room.match?.currentPlayerId === player.playerId
    ) {
      this.ctx.synchronizeMatch(room, now, this.ctx.config);
    }

    return {
      grant: {
        playerId: player.playerId,
        resumeToken: resume.token,
        roomCode: room.code,
        roomId: room.id,
      },
      session: {
        generation: nextGeneration,
        playerId: player.playerId,
        roomId: room.id,
        sessionId: player.session.sessionId,
      },
    };
  }

  private async locateJoinRoom(
    message: JoinRoomMessage,
  ): Promise<RoomRecord | null> {
    if (message.payload.roomCode) {
      return this.ctx.repository.loadByCode(message.payload.roomCode);
    }

    const token = message.payload.inviteToken;
    const parsed = token ? parseInviteToken(token) : null;
    if (!token || !parsed) {
      throw new RoomServiceError(
        "INVITE_TOKEN_INVALID",
        "The invite token is invalid.",
      );
    }

    const room = await this.ctx.repository.loadByInviteHash(hashToken(token));
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

  private async saveOrThrow(
    room: RoomRecord,
    expectedRevision: number,
  ): Promise<void> {
    const result = await this.ctx.repository.compareAndSwap(
      room,
      expectedRevision,
    );
    if (result !== "saved") {
      throw new RoomServiceError(
        "INTERNAL_ERROR",
        "The room changed while the command was being saved.",
      );
    }
  }
}

// ─── Module-level functions ──────────────────────────────────────────

export function assertBoundSession(
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

export function fingerprintJoinRequest(message: JoinRoomMessage): string {
  const canonicalPayload = JSON.stringify({
    avatarKey: message.payload.avatarKey,
    displayName: message.payload.displayName,
    inviteToken: message.payload.inviteToken ?? null,
    roomCode: message.payload.roomCode ?? null,
  });
  return createHash("sha256")
    .update("wizzard-room-join:v1\0", "utf8")
    .update(canonicalPayload, "utf8")
    .digest("hex");
}
