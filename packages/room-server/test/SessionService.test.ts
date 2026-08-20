import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  type BoundRoomSession,
  type RoomRecord,
  type RoomServiceConfig,
} from "../src/index.js";
import { MemoryRoomRepository } from "../src/persistence/index.js";
import { RoomQueue } from "../src/room/RoomQueue.js";
import type { RoomContext } from "../src/room/room-shared.js";
import {
  SessionService,
  assertBoundSession,
  fingerprintJoinRequest,
} from "../src/room/SessionService.js";
import { RoomServiceError } from "../src/room/errors.js";
import type { RoomRepository } from "../src/persistence/types.js";

// ─── Test helpers ────────────────────────────────────────────────────

/**
 * Directly modify a room in the repository, bypassing the service.
 * Handles revision increment and CAS correctly.
 */
async function modifyRoomDirect(
  repository: RoomRepository<RoomRecord>,
  roomId: string,
  modifier: (room: RoomRecord) => void,
): Promise<void> {
  const room = await repository.loadById(roomId);
  if (!room) throw new Error("Room not found");
  const expectedRevision = room.revision;
  modifier(room);
  room.revision = expectedRevision + 1;
  const result = await repository.compareAndSwap(room, expectedRevision);
  if (result !== "saved") throw new Error(`Direct save failed: ${result}`);
}

const FAST_CONFIG: Partial<RoomServiceConfig> = {
  aiActionDelayMs: 25,
  turnTimeoutMs: 100,
  trickResultDelayMs: 50,
  roundScoreDelayMs: 50,
};

type MockSyncCall = { room: RoomRecord; now: number };

function createMockSynchronizeMatch(): {
  fn: RoomContext["synchronizeMatch"];
  calls: MockSyncCall[];
} {
  const calls: MockSyncCall[] = [];
  const fn: RoomContext["synchronizeMatch"] = (room, now, _config) => {
    calls.push({ room, now });
    // Simulate the real synchronizeMatch: set a turn deadline when a match
    // is active with a current player, otherwise clear the deadline.
    if (room.match && room.match.currentPlayerId) {
      room.deadline = {
        dueAt: now + _config.turnTimeoutMs,
        kind: "turn",
        matchVersion: room.match.version,
        playerId: room.match.currentPlayerId,
      };
    } else {
      room.deadline = null;
    }
  };
  return { fn, calls };
}

function createSessionService(
  now: number,
  config?: Partial<RoomServiceConfig>,
): {
  service: SessionService;
  repository: MemoryRoomRepository<RoomRecord>;
  sync: ReturnType<typeof createMockSynchronizeMatch>;
  context: RoomContext;
} {
  const repository = new MemoryRoomRepository<RoomRecord>(() => now);
  const sync = createMockSynchronizeMatch();
  const context: RoomContext = {
    clock: () => now,
    config: { ...DEFAULT_ROOM_SERVICE_CONFIG, ...config },
    idFactory: (() => {
      let n = 0;
      return () => `id-${++n}`;
    })(),
    queue: new RoomQueue(),
    repository,
    synchronizeMatch: sync.fn,
  };
  const service = new SessionService(context);
  return { service, repository, sync, context };
}

function createMessage(name: string, overrides?: {
  maxPlayers?: 3 | 4 | 5 | 6;
  turnTimerEnabled?: boolean;
}) {
  return {
    payload: {
      avatarKey: "bamboo-cat" as const,
      displayName: name,
      maxPlayers: overrides?.maxPlayers ?? (3 as const),
      mode: "quick" as const,
      turnTimerEnabled: overrides?.turnTimerEnabled ?? true,
    },
    requestId: `create-${name}`,
    type: "room.create" as const,
    v: 1 as const,
  };
}

async function joinByInvite(
  service: SessionService,
  inviteToken: string,
  name: string,
  now: number,
) {
  return service.joinRoom(
    {
      payload: {
        avatarKey: "flower-fox",
        displayName: name,
        inviteToken,
      },
      requestId: `join-${name}`,
      type: "room.join",
      v: 1,
    },
    now,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("SessionService", () => {
  // ═══ createRoom ═══

  describe("createRoom", () => {
    it("creates a room with valid tokens and session", async () => {
      const now = 1_000_000;
      const { service } = createSessionService(now);

      const result = await service.createRoom(createMessage("Host"), now);

      expect(result.grant.inviteToken).toBeTruthy();
      expect(result.grant.resumeToken).toBeTruthy();
      expect(result.grant.roomCode).toMatch(/^\d{6}$/);
      expect(result.grant.playerId).toBeTruthy();
      expect(result.session.generation).toBe(1);
      expect(result.session.playerId).toBe(result.grant.playerId);
      expect(result.session.roomId).toBe(result.grant.roomId);
      expect(result.session.sessionId).toBeTruthy();
    });

    it("initializes room with correct lifecycle and player state", async () => {
      const now = 1_010_000;
      const { service } = createSessionService(now);

      const result = await service.createRoom(createMessage("Host"), now);

      expect(result.room.lifecycle).toBe("lobby");
      expect(result.room.match).toBeNull();
      expect(result.room.deadline).toBeNull();
      expect(result.room.hostPlayerId).toBe(result.grant.playerId);
      expect(result.room.players).toHaveLength(1);
      expect(result.room.players[0]).toMatchObject({
        connected: true,
        control: "human",
        isAi: false,
        name: "Host",
        ready: false,
        seatIndex: 0,
      });
      expect(result.room.players[0].session).not.toBeNull();
      expect(result.room.players[0].session!.generation).toBe(1);
    });

    it("sets turnTimerEnabled from payload", async () => {
      const now = 1_020_000;
      const { service } = createSessionService(now);

      const timed = await service.createRoom(createMessage("Timed"), now);
      expect(timed.room.turnTimerEnabled).toBe(true);

      const noTimer = await service.createRoom(
        { ...createMessage("NoTimer"), payload: { ...createMessage("NoTimer").payload, turnTimerEnabled: false } },
        now,
      );
      expect(noTimer.room.turnTimerEnabled).toBe(false);
    });

    it("defaults turnTimerEnabled to true when omitted (legacy)", async () => {
      const now = 1_030_000;
      const { service } = createSessionService(now);

      const msg = createMessage("Legacy");
      const { turnTimerEnabled: _omit, ...legacyPayload } = msg.payload;
      const result = await service.createRoom(
        { ...msg, payload: legacyPayload },
        now,
      );
      expect(result.room.turnTimerEnabled).toBe(true);
    });
  });

  // ═══ joinRoom ═══

  describe("joinRoom", () => {
    it("seats a second player by invite token", async () => {
      const now = 2_000_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      const result = await joinByInvite(
        service,
        host.grant.inviteToken!,
        "Guest",
        now,
      );

      expect(result.room.players).toHaveLength(2);
      expect(result.room.players.map((p) => p.name)).toContain("Guest");
      expect(result.grant.playerId).not.toBe(host.grant.playerId);
      expect(result.session.generation).toBe(1);
      expect(result.grant.resumeToken).toBeTruthy();
    });

    it("rejects join with invalid invite token", async () => {
      const now = 2_010_000;
      const { service } = createSessionService(now);

      await expect(
        service.joinRoom(
          {
            payload: {
              avatarKey: "flower-fox",
              displayName: "Guest",
              inviteToken: "not-a-valid-token",
            },
            requestId: "join-bad-token",
            type: "room.join",
            v: 1,
          },
          now,
        ),
      ).rejects.toMatchObject({ code: "INVITE_TOKEN_INVALID" });
    });

    it("rejects join when room has already started", async () => {
      const now = 2_020_000;
      const { service, repository } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      // Manually set lifecycle to playing
      await modifyRoomDirect(repository, host.grant.roomId, (room) => {
        room.lifecycle = "playing";
      });

      await expect(
        joinByInvite(service, host.grant.inviteToken!, "Late", now),
      ).rejects.toMatchObject({ code: "ROOM_NOT_JOINABLE" });
    });

    it("replays the same join with same fingerprint and rotates session", async () => {
      const now = 2_030_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      const message = {
        payload: {
          avatarKey: "flower-fox" as const,
          displayName: "Replayer",
          inviteToken: host.grant.inviteToken!,
        },
        requestId: "replay-join",
        type: "room.join" as const,
        v: 1 as const,
      };

      const first = await service.joinRoom(message, now);
      const second = await service.joinRoom(message, now);

      expect(second.session.playerId).toBe(first.session.playerId);
      expect(second.session.sessionId).toBe(first.session.sessionId);
      expect(second.session.generation).toBe(first.session.generation + 1);
      expect(second.grant.resumeToken).not.toBe(first.grant.resumeToken);
    });

    it("rejects a reused join request id with a different payload", async () => {
      const now = 2_040_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      const message = {
        payload: {
          avatarKey: "flower-fox" as const,
          displayName: "Original",
          inviteToken: host.grant.inviteToken!,
        },
        requestId: "conflicting-join",
        type: "room.join" as const,
        v: 1 as const,
      };

      await service.joinRoom(message, now);

      await expect(
        service.joinRoom(
          { ...message, payload: { ...message.payload, displayName: "Changed" } },
          now,
        ),
      ).rejects.toMatchObject({ code: "COMMAND_REJECTED" });
    });

    it("replaces a lobby AI when room is full", async () => {
      const now = 2_050_000;
      const { service, repository } = createSessionService(now);
      const host = await service.createRoom(
        { ...createMessage("Host"), payload: { ...createMessage("Host").payload, maxPlayers: 3 } },
        now,
      );
      await joinByInvite(service, host.grant.inviteToken!, "Second", now);

      // Add an AI player to fill the last seat
      await modifyRoomDirect(repository, host.grant.roomId, (room) => {
        room.players.push({
          avatarKey: "bamboo-cat",
          connected: true,
          consecutiveTimeouts: 0,
          control: "ai",
          isAi: true,
          joinedAt: now,
          name: "茶灵 3",
          playerId: "ai-test",
          ready: true,
          seatIndex: 2,
          session: null,
        });
      });

      const result = await joinByInvite(
        service,
        host.grant.inviteToken!,
        "Third",
        now,
      );

      expect(result.room.players).toHaveLength(3);
      expect(result.room.players.filter((p) => p.isAi)).toHaveLength(0);
      expect(result.room.players.map((p) => p.name)).toContain("Third");
    });
  });

  // ═══ resumeSession ═══

  describe("resumeSession", () => {
    it("resumes a session with a valid resume token", async () => {
      const now = 3_000_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      const resumed = await service.resumeSession(
        {
          payload: { resumeToken: host.grant.resumeToken },
          requestId: "resume",
          type: "session.resume",
          v: 1,
        },
        now + 100,
      );

      expect(resumed.session.playerId).toBe(host.session.playerId);
      expect(resumed.session.generation).toBe(2);
      expect(resumed.grant.resumeToken).not.toBe(host.grant.resumeToken);
    });

    it("rejects an invalid resume token", async () => {
      const now = 3_010_000;
      const { service } = createSessionService(now);

      await expect(
        service.resumeSession(
          {
            payload: { resumeToken: "invalid-token" },
            requestId: "resume-bad",
            type: "session.resume",
            v: 1,
          },
          now,
        ),
      ).rejects.toMatchObject({ code: "SESSION_NOT_FOUND" });
    });

    it("rejects a resume for a non-existent room", async () => {
      const now = 3_020_000;
      const { service, repository } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      await repository.delete(host.grant.roomId);

      await expect(
        service.resumeSession(
          {
            payload: { resumeToken: host.grant.resumeToken },
            requestId: "resume-deleted",
            type: "session.resume",
            v: 1,
          },
          now,
        ),
      ).rejects.toMatchObject({ code: "SESSION_NOT_FOUND" });
    });
  });

  // ═══ disconnect ═══

  describe("disconnect", () => {
    it("marks a connected player as disconnected", async () => {
      const now = 4_000_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      const result = await service.disconnect(host.session, now);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.room.players[0].connected).toBe(false);
    });

    it("returns changed:false for an already-disconnected player", async () => {
      const now = 4_010_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      await service.disconnect(host.session, now);
      const second = await service.disconnect(host.session, now);

      expect(second).not.toBeNull();
      expect(second!.changed).toBe(false);
    });

    it("returns null for a missing room", async () => {
      const now = 4_020_000;
      const { service, repository } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      await repository.delete(host.grant.roomId);

      const result = await service.disconnect(host.session, now);
      expect(result).toBeNull();
    });

    it("calls synchronizeMatch when no-timer current player disconnects", async () => {
      const now = 4_030_000;
      const { service, repository, sync } = createSessionService(now, FAST_CONFIG);
      const host = await service.createRoom(
        { ...createMessage("Host"), payload: { ...createMessage("Host").payload, turnTimerEnabled: false } },
        now,
      );

      // Set up a playing room where the host is the current player
      await modifyRoomDirect(repository, host.grant.roomId, (room) => {
        room.lifecycle = "playing";
        room.turnTimerEnabled = false;
        room.match = {
          version: 1,
          phase: "trick-play",
          currentPlayerId: host.session.playerId,
          commandEventCache: {},
        } as unknown as RoomRecord["match"];
      });

      sync.calls.length = 0;
      const result = await service.disconnect(host.session, now);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(sync.calls).toHaveLength(1);
      expect(sync.calls[0].now).toBe(now);
    });

    it("does not call synchronizeMatch for a non-current player disconnect", async () => {
      const now = 4_040_000;
      const { service, repository, sync } = createSessionService(now, FAST_CONFIG);
      const host = await service.createRoom(createMessage("Host"), now);
      const guest = await joinByInvite(service, host.grant.inviteToken!, "Guest", now);

      // Set up a playing room where the host (not guest) is the current player
      await modifyRoomDirect(repository, host.grant.roomId, (room) => {
        room.lifecycle = "playing";
        room.turnTimerEnabled = false;
        room.match = {
          version: 1,
          phase: "trick-play",
          currentPlayerId: host.session.playerId,
          commandEventCache: {},
        } as unknown as RoomRecord["match"];
      });

      sync.calls.length = 0;
      const result = await service.disconnect(guest.session, now);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(sync.calls).toHaveLength(0);
    });
  });

  // ═══ rotatePlayerSession ═══

  describe("rotatePlayerSession", () => {
    it("bumps generation and issues a new resume token", async () => {
      const now = 5_000_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      const room = host.room;
      const rotated = service.rotatePlayerSession(
        room,
        host.session.playerId,
        now + 100,
      );

      expect(rotated.session.generation).toBe(2);
      expect(rotated.grant.resumeToken).not.toBe(host.grant.resumeToken);
      expect(rotated.grant.playerId).toBe(host.session.playerId);
      expect(rotated.session.sessionId).toBe(host.session.sessionId);
    });

    it("resets connected, consecutiveTimeouts, and control", async () => {
      const now = 5_010_000;
      const { service, repository } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      // Modify player state to simulate a stale session
      await modifyRoomDirect(repository, host.grant.roomId, (room) => {
        const player = room.players[0];
        player.connected = false;
        player.consecutiveTimeouts = 2;
        player.control = "ai";
      });

      const updatedRoom = (await repository.loadById(host.grant.roomId))!;
      service.rotatePlayerSession(
        updatedRoom,
        host.session.playerId,
        now + 100,
      );

      expect(updatedRoom.players[0].connected).toBe(true);
      expect(updatedRoom.players[0].consecutiveTimeouts).toBe(0);
      expect(updatedRoom.players[0].control).toBe("human");
    });

    it("throws SESSION_NOT_FOUND for a player without a session", async () => {
      const now = 5_020_000;
      const { service, repository } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      // Remove the player's session
      await modifyRoomDirect(repository, host.grant.roomId, (room) => {
        room.players[0].session = null;
      });

      const updatedRoom = (await repository.loadById(host.grant.roomId))!;
      expect(() =>
        service.rotatePlayerSession(updatedRoom, host.session.playerId, now),
      ).toThrow(RoomServiceError);
    });
  });

  // ═══ assertBoundSession ═══

  describe("assertBoundSession", () => {
    it("returns the player for a valid bound session", async () => {
      const now = 6_000_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      const player = assertBoundSession(host.room, host.session, now);

      expect(player.playerId).toBe(host.session.playerId);
      expect(player.connected).toBe(true);
    });

    it("throws SESSION_NOT_FOUND for an unbound player", async () => {
      const now = 6_010_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      const fakeSession: BoundRoomSession = {
        generation: 1,
        playerId: "nonexistent",
        roomId: host.grant.roomId,
        sessionId: "fake",
      };

      expect(() => assertBoundSession(host.room, fakeSession, now)).toThrow(
        RoomServiceError,
      );
    });

    it("throws SESSION_NOT_FOUND for a disconnected player", async () => {
      const now = 6_020_000;
      const { service, repository } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      // Disconnect the player
      await modifyRoomDirect(repository, host.grant.roomId, (room) => {
        room.players[0].connected = false;
      });

      const updatedRoom = (await repository.loadById(host.grant.roomId))!;
      expect(() => assertBoundSession(updatedRoom, host.session, now)).toThrow(
        RoomServiceError,
      );
    });

    it("throws SESSION_NOT_FOUND for a stale generation", async () => {
      const now = 6_030_000;
      const { service } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      const staleSession: BoundRoomSession = {
        ...host.session,
        generation: 99,
      };

      expect(() => assertBoundSession(host.room, staleSession, now)).toThrow(
        RoomServiceError,
      );
    });

    it("throws SESSION_NOT_FOUND for an expired session", async () => {
      const now = 6_040_000;
      const { service, repository } = createSessionService(now);
      const host = await service.createRoom(createMessage("Host"), now);

      // Expire the session
      await modifyRoomDirect(repository, host.grant.roomId, (room) => {
        if (room.players[0].session) {
          room.players[0].session.expiresAt = now - 1;
        }
      });

      const updatedRoom = (await repository.loadById(host.grant.roomId))!;
      expect(() => assertBoundSession(updatedRoom, host.session, now)).toThrow(
        RoomServiceError,
      );
    });
  });

  // ═══ fingerprintJoinRequest ═══

  describe("fingerprintJoinRequest", () => {
    it("produces the same fingerprint for identical payloads", () => {
      const msg = {
        payload: {
          avatarKey: "flower-fox" as const,
          displayName: "Player",
          inviteToken: "token-abc",
        },
        requestId: "req-1",
        type: "room.join" as const,
        v: 1 as const,
      };

      const fp1 = fingerprintJoinRequest(msg);
      const fp2 = fingerprintJoinRequest({ ...msg });
      expect(fp1).toBe(fp2);
      expect(fp1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("produces different fingerprints for different display names", () => {
      const base = {
        payload: {
          avatarKey: "flower-fox" as const,
          displayName: "Player",
          inviteToken: "token-abc",
        },
        requestId: "req-1",
        type: "room.join" as const,
        v: 1 as const,
      };

      const fp1 = fingerprintJoinRequest(base);
      const fp2 = fingerprintJoinRequest({
        ...base,
        payload: { ...base.payload, displayName: "Other" },
      });
      expect(fp1).not.toBe(fp2);
    });

    it("produces different fingerprints for different avatar keys", () => {
      const base = {
        payload: {
          avatarKey: "flower-fox" as const,
          displayName: "Player",
          inviteToken: "token-abc",
        },
        requestId: "req-1",
        type: "room.join" as const,
        v: 1 as const,
      };

      const fp1 = fingerprintJoinRequest(base);
      const fp2 = fingerprintJoinRequest({
        ...base,
        payload: { ...base.payload, avatarKey: "bamboo-cat" as const },
      });
      expect(fp1).not.toBe(fp2);
    });

    it("produces different fingerprints for different invite tokens", () => {
      const base = {
        payload: {
          avatarKey: "flower-fox" as const,
          displayName: "Player",
          inviteToken: "token-abc",
        },
        requestId: "req-1",
        type: "room.join" as const,
        v: 1 as const,
      };

      const fp1 = fingerprintJoinRequest(base);
      const fp2 = fingerprintJoinRequest({
        ...base,
        payload: { ...base.payload, inviteToken: "token-xyz" },
      });
      expect(fp1).not.toBe(fp2);
    });

    it("normalizes omitted inviteToken and roomCode consistently", () => {
      const msg = {
        payload: {
          avatarKey: "flower-fox" as const,
          displayName: "Player",
        },
        requestId: "req-1",
        type: "room.join" as const,
        v: 1 as const,
      };

      const fp1 = fingerprintJoinRequest(msg);
      const fp2 = fingerprintJoinRequest({
        ...msg,
        payload: { ...msg.payload, inviteToken: undefined, roomCode: undefined },
      });
      // Omitting the fields and explicitly setting undefined should produce
      // the same fingerprint because ?? normalizes both to null
      expect(fp1).toBe(fp2);
    });
  });
});
