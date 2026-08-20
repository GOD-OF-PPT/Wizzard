import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  type RoomRecord,
  type RoomServiceConfig,
} from "../src/index.js";
import { MemoryRoomRepository } from "../src/persistence/index.js";
import { RoomQueue } from "../src/room/RoomQueue.js";
import type { RoomContext } from "../src/room/room-shared.js";
import { SessionService } from "../src/room/SessionService.js";
import { LobbyService } from "../src/room/LobbyService.js";
import { RoomServiceError } from "../src/room/errors.js";
import type { RoomRepository } from "../src/persistence/types.js";

// ─── Test helpers ────────────────────────────────────────────────────

/**
 * Directly modify a room in the repository, bypassing the service.
 * Handles revision increment and CAS correctly.
 * Returns the updated room record.
 */
async function modifyRoomDirect(
  repository: RoomRepository<RoomRecord>,
  roomId: string,
  modifier: (room: RoomRecord) => void,
): Promise<RoomRecord> {
  const room = await repository.loadById(roomId);
  if (!room) throw new Error("Room not found");
  const expectedRevision = room.revision;
  modifier(room);
  room.revision = expectedRevision + 1;
  const result = await repository.compareAndSwap(room, expectedRevision);
  if (result !== "saved") throw new Error(`Direct save failed: ${result}`);
  return room;
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

function createServices(
  now: number,
  config?: Partial<RoomServiceConfig>,
): {
  lobby: LobbyService;
  session: SessionService;
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
  const session = new SessionService(context);
  const lobby = new LobbyService(context);
  return { lobby, session, repository, sync, context };
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

/**
 * Create a room with `humanCount` human players in a `maxPlayers`-seat room.
 * Returns the loaded room record (fresh from the repository).
 */
async function createRoomWithHumans(
  now: number,
  maxPlayers: 3 | 4 | 5 | 6,
  humanCount: number,
  config?: Partial<RoomServiceConfig>,
): Promise<{
  lobby: LobbyService;
  repository: MemoryRoomRepository<RoomRecord>;
  sync: ReturnType<typeof createMockSynchronizeMatch>;
  room: RoomRecord;
  hostPlayerId: string;
  inviteToken: string;
}> {
  const { lobby, session, repository, sync } = createServices(now, config);
  const host = await session.createRoom(
    { ...createMessage("Host", { maxPlayers }) },
    now,
  );
  const inviteToken = host.grant.inviteToken!;
  for (let i = 1; i < humanCount; i++) {
    await joinByInvite(session, inviteToken, `P${i + 1}`, now);
  }
  const room = (await repository.loadById(host.grant.roomId))!;
  return {
    lobby,
    repository,
    sync,
    room,
    hostPlayerId: host.grant.playerId,
    inviteToken,
  };
}

/** Set all human players ready in the room. */
function readyAllHumans(room: RoomRecord): void {
  for (const player of room.players) {
    if (!player.isAi) {
      player.ready = true;
    }
  }
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("LobbyService", () => {
  // ═══ setReady ═══

  describe("setReady", () => {
    it("sets ready=true for a lobby player", async () => {
      const now = 1_000_000;
      const { lobby, room } = await createRoomWithHumans(now, 3, 2);
      const actor = room.players[0];

      lobby.setReady(room, actor, true);

      expect(actor.ready).toBe(true);
    });

    it("sets ready=false for a lobby player", async () => {
      const now = 1_010_000;
      const { lobby, room } = await createRoomWithHumans(now, 3, 2);
      const actor = room.players[0];
      actor.ready = true;

      lobby.setReady(room, actor, false);

      expect(actor.ready).toBe(false);
    });

    it("rejects setReady when not in lobby lifecycle", async () => {
      const now = 1_020_000;
      const { lobby, repository, room } = await createRoomWithHumans(now, 3, 2);
      const updated = await modifyRoomDirect(repository, room.id, (r) => {
        r.lifecycle = "playing";
      });

      expect(() => lobby.setReady(updated, updated.players[0], true)).toThrow(
        expect.objectContaining({ code: "WRONG_ROOM_PHASE" }),
      );
    });
  });

  // ═══ setAiCount ═══

  describe("setAiCount", () => {
    it("lets the host add AI after two humans join", async () => {
      const now = 2_000_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        6,
        2,
      );

      lobby.setAiCount(room, hostPlayerId, 2, now);

      const aiPlayers = room.players.filter((p) => p.isAi);
      expect(aiPlayers).toHaveLength(2);
      expect(aiPlayers[0].control).toBe("ai");
      expect(aiPlayers[0].ready).toBe(true);
      expect(aiPlayers[0].session).toBeNull();
    });

    it("rejects setAiCount from a non-host", async () => {
      const now = 2_010_000;
      const { lobby, room } = await createRoomWithHumans(now, 6, 2);

      const guestPlayerId = room.players[1].playerId;
      expect(() =>
        lobby.setAiCount(room, guestPlayerId, 1, now),
      ).toThrow(
        expect.objectContaining({ code: "NOT_HOST" }),
      );
    });

    it("rejects adding AI before two humans join", async () => {
      const now = 2_020_000;
      const { lobby, session, repository } = createServices(now);
      const host = await session.createRoom(
        { ...createMessage("Host", { maxPlayers: 6 }) },
        now,
      );
      const room = (await repository.loadById(host.grant.roomId))!;

      expect(() =>
        lobby.setAiCount(room, host.grant.playerId, 1, now),
      ).toThrow(
        expect.objectContaining({ code: "NOT_ENOUGH_PLAYERS" }),
      );
    });

    it("rejects a negative AI count", async () => {
      const now = 2_030_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        6,
        2,
      );

      expect(() =>
        lobby.setAiCount(room, hostPlayerId, -1, now),
      ).toThrow(
        expect.objectContaining({ code: "COMMAND_REJECTED" }),
      );
    });

    it("rejects a non-integer AI count", async () => {
      const now = 2_040_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        6,
        2,
      );

      expect(() =>
        lobby.setAiCount(room, hostPlayerId, 2.5, now),
      ).toThrow(
        expect.objectContaining({ code: "COMMAND_REJECTED" }),
      );
    });

    it("rejects AI count exceeding remaining capacity", async () => {
      const now = 2_050_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        3,
        3,
      );

      // 3 humans in a 3-seat room → 0 AI capacity
      expect(() =>
        lobby.setAiCount(room, hostPlayerId, 1, now),
      ).toThrow(
        expect.objectContaining({ code: "COMMAND_REJECTED" }),
      );
    });

    it("removes AI players when count is decreased", async () => {
      const now = 2_060_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        6,
        2,
      );

      lobby.setAiCount(room, hostPlayerId, 4, now);
      expect(room.players.filter((p) => p.isAi)).toHaveLength(4);

      lobby.setAiCount(room, hostPlayerId, 1, now);
      expect(room.players.filter((p) => p.isAi)).toHaveLength(1);
    });

    it("is idempotent when setting the same count", async () => {
      const now = 2_070_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        6,
        2,
      );

      lobby.setAiCount(room, hostPlayerId, 2, now);
      const playersAfterFirst = room.players.map((p) => p.playerId);

      lobby.setAiCount(room, hostPlayerId, 2, now);
      const playersAfterSecond = room.players.map((p) => p.playerId);

      // Same count → no new AI players added or removed
      expect(playersAfterSecond).toEqual(playersAfterFirst);
      expect(room.players.filter((p) => p.isAi)).toHaveLength(2);
    });

    it("rejects setAiCount when not in lobby lifecycle", async () => {
      const now = 2_080_000;
      const { lobby, repository, room, hostPlayerId } =
        await createRoomWithHumans(now, 6, 2);
      const updated = await modifyRoomDirect(repository, room.id, (r) => {
        r.lifecycle = "playing";
      });

      expect(() =>
        lobby.setAiCount(updated, hostPlayerId, 1, now),
      ).toThrow(
        expect.objectContaining({ code: "WRONG_ROOM_PHASE" }),
      );
    });
  });

  // ═══ startMatch ═══

  describe("startMatch", () => {
    it("starts a match with all humans ready and connected", async () => {
      const now = 3_000_000;
      const { lobby, sync, room, hostPlayerId } = await createRoomWithHumans(
        now,
        3,
        3,
        FAST_CONFIG,
      );
      readyAllHumans(room);

      lobby.startMatch(room, hostPlayerId, false, now);

      expect(room.lifecycle).toBe("playing");
      expect(room.match).not.toBeNull();
      expect(sync.calls).toHaveLength(1);
      expect(sync.calls[0].now).toBe(now);
    });

    it("rejects start from a non-host", async () => {
      const now = 3_010_000;
      const { lobby, room } = await createRoomWithHumans(now, 3, 3, FAST_CONFIG);
      readyAllHumans(room);

      const guestPlayerId = room.players[1].playerId;
      expect(() =>
        lobby.startMatch(room, guestPlayerId, false, now),
      ).toThrow(
        expect.objectContaining({ code: "NOT_HOST" }),
      );
    });

    it("rejects start without enough connected humans", async () => {
      const now = 3_020_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        3,
        3,
        FAST_CONFIG,
      );
      readyAllHumans(room);
      // Disconnect two of three humans → only 1 connected < MIN_HUMAN_PLAYERS (2)
      room.players[1].connected = false;
      room.players[2].connected = false;

      expect(() =>
        lobby.startMatch(room, hostPlayerId, false, now),
      ).toThrow(
        expect.objectContaining({ code: "NOT_ENOUGH_PLAYERS" }),
      );
    });

    it("rejects start when players are not ready", async () => {
      const now = 3_030_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        3,
        3,
        FAST_CONFIG,
      );
      // Don't ready anyone

      expect(() =>
        lobby.startMatch(room, hostPlayerId, false, now),
      ).toThrow(
        expect.objectContaining({ code: "PLAYERS_NOT_READY" }),
      );
    });

    it("fills remaining seats with AI when fillWithAi is true", async () => {
      const now = 3_040_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        4,
        3,
        FAST_CONFIG,
      );
      readyAllHumans(room);

      lobby.startMatch(room, hostPlayerId, true, now);

      expect(room.players).toHaveLength(4);
      expect(room.players.filter((p) => p.isAi)).toHaveLength(1);
      expect(room.lifecycle).toBe("playing");
    });

    it("rejects start without fill when seats are empty", async () => {
      const now = 3_050_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        4,
        3,
        FAST_CONFIG,
      );
      readyAllHumans(room);

      expect(() =>
        lobby.startMatch(room, hostPlayerId, false, now),
      ).toThrow(
        expect.objectContaining({ code: "NOT_ENOUGH_PLAYERS" }),
      );
    });

    it("creates a match and transitions lifecycle to playing", async () => {
      const now = 3_060_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        3,
        3,
        FAST_CONFIG,
      );
      readyAllHumans(room);

      lobby.startMatch(room, hostPlayerId, false, now);

      expect(room.match).not.toBeNull();
      expect(room.lifecycle).toBe("playing");
      expect(room.players).toHaveLength(3);
    });

    it("rejects start when not in lobby lifecycle", async () => {
      const now = 3_070_000;
      const { lobby, repository, room, hostPlayerId } =
        await createRoomWithHumans(now, 3, 3, FAST_CONFIG);
      readyAllHumans(room);
      const updated = await modifyRoomDirect(repository, room.id, (r) => {
        r.lifecycle = "playing";
      });

      expect(() =>
        lobby.startMatch(updated, hostPlayerId, false, now),
      ).toThrow(
        expect.objectContaining({ code: "WRONG_ROOM_PHASE" }),
      );
    });
  });

  // ═══ returnToLobby ═══

  describe("returnToLobby", () => {
    it("resets from finished to lobby, filters AI, and resets state", async () => {
      const now = 4_000_000;
      const { lobby, room, hostPlayerId } =
        await createRoomWithHumans(now, 4, 3, FAST_CONFIG);
      readyAllHumans(room);

      // Start the match with AI fill, then simulate match-end → finished
      lobby.startMatch(room, hostPlayerId, true, now);
      // startMatch added 1 AI player (4-seat room, 3 humans, fillWithAi=true).
      // Simulate match-end by setting lifecycle directly on the in-memory room.
      room.lifecycle = "finished";

      lobby.returnToLobby(room, hostPlayerId);

      expect(room.lifecycle).toBe("lobby");
      expect(room.match).toBeNull();
      expect(room.deadline).toBeNull();
      // AI players filtered out, only humans remain
      expect(room.players.every((p) => !p.isAi)).toBe(true);
      expect(room.players).toHaveLength(3);
      // State reset
      expect(room.players.every((p) => p.ready === false)).toBe(true);
      expect(room.players.every((p) => p.consecutiveTimeouts === 0)).toBe(true);
      expect(room.players.every((p) => p.control === "human")).toBe(true);
      // Seats re-indexed contiguously
      room.players.forEach((p, i) => {
        expect(p.seatIndex).toBe(i);
      });
    });

    it("rejects returnToLobby when not in finished lifecycle", async () => {
      const now = 4_010_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        3,
        3,
        FAST_CONFIG,
      );
      // Room is in "lobby" lifecycle

      expect(() => lobby.returnToLobby(room, hostPlayerId)).toThrow(
        expect.objectContaining({ code: "WRONG_ROOM_PHASE" }),
      );
    });

    it("rejects returnToLobby from a non-host", async () => {
      const now = 4_020_000;
      const { lobby, room, hostPlayerId } =
        await createRoomWithHumans(now, 3, 3, FAST_CONFIG);
      readyAllHumans(room);
      lobby.startMatch(room, hostPlayerId, false, now);
      // Simulate match-end by setting lifecycle directly on the in-memory room.
      room.lifecycle = "finished";

      const guestPlayerId = room.players.find(
        (p) => p.playerId !== hostPlayerId,
      )!.playerId;
      expect(() => lobby.returnToLobby(room, guestPlayerId)).toThrow(
        expect.objectContaining({ code: "NOT_HOST" }),
      );
    });
  });

  // ═══ leaveRoom ═══

  describe("leaveRoom", () => {
    it("removes a player from the lobby and re-indexes seats", async () => {
      const now = 5_000_000;
      const { lobby, room } = await createRoomWithHumans(now, 4, 3);
      // 3 players: seats 0, 1, 2
      expect(room.players).toHaveLength(3);

      const middlePlayerId = room.players[1].playerId;
      lobby.leaveRoom(room, middlePlayerId, now);

      expect(room.players).toHaveLength(2);
      expect(room.players.find((p) => p.playerId === middlePlayerId)).toBeUndefined();
      // Seats re-indexed contiguously
      room.players.forEach((p, i) => {
        expect(p.seatIndex).toBe(i);
      });
    });

    it("converts a non-host human to AI during a match", async () => {
      const now = 5_010_000;
      const { lobby, room, hostPlayerId } =
        await createRoomWithHumans(now, 3, 3, FAST_CONFIG);
      readyAllHumans(room);
      lobby.startMatch(room, hostPlayerId, false, now);
      // startMatch already set lifecycle="playing" and room.match on the
      // in-memory room object; no need to reload from repository.

      const guest = room.players.find((p) => p.playerId !== hostPlayerId)!;
      lobby.leaveRoom(room, guest.playerId, now);

      // Player is retained but converted to AI
      const retained = room.players.find((p) => p.playerId === guest.playerId)!;
      expect(retained).toBeDefined();
      expect(retained.control).toBe("ai");
      expect(retained.session).toBeNull();
      expect(retained.connected).toBe(false);
    });

    it("reassigns host when the host leaves", async () => {
      const now = 5_020_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        4,
        3,
      );

      lobby.leaveRoom(room, hostPlayerId, now);

      expect(room.hostPlayerId).not.toBe(hostPlayerId);
      expect(room.hostPlayerId).not.toBe("");
      // New host should be the lowest-seatIndex remaining human
      const remainingHumans = room.players.filter((p) => !p.isAi && p.session);
      const lowestSeat = [...remainingHumans].sort(
        (a, b) => a.seatIndex - b.seatIndex,
      )[0];
      expect(room.hostPlayerId).toBe(lowestSeat.playerId);
    });

    it("closes the room when the last human leaves", async () => {
      const now = 5_030_000;
      const { lobby, session, repository } = createServices(now);
      const host = await session.createRoom(
        { ...createMessage("Solo", { maxPlayers: 3 }) },
        now,
      );
      const room = (await repository.loadById(host.grant.roomId))!;

      lobby.leaveRoom(room, host.grant.playerId, now);

      expect(room.lifecycle).toBe("closed");
      expect(room.deadline).toBeNull();
      expect(room.hostPlayerId).toBe("");
      expect(room.expiresAt).toBe(now + 5 * 60 * 1_000);
    });

    it("calls synchronizeMatch when the current player leaves during a match", async () => {
      const now = 5_040_000;
      const { lobby, sync, room, hostPlayerId } =
        await createRoomWithHumans(now, 3, 3, FAST_CONFIG);
      readyAllHumans(room);
      lobby.startMatch(room, hostPlayerId, false, now);
      // startMatch already set lifecycle="playing" and room.match on the
      // in-memory room object; no need to reload from repository.

      // Set a non-host as the current player
      const guest = room.players.find((p) => p.playerId !== hostPlayerId)!;
      if (room.match) {
        room.match.currentPlayerId = guest.playerId;
      }

      sync.calls.length = 0;
      lobby.leaveRoom(room, guest.playerId, now);

      expect(sync.calls).toHaveLength(1);
    });

    it("does not call synchronizeMatch when a non-current player leaves", async () => {
      const now = 5_050_000;
      const { lobby, sync, room, hostPlayerId } =
        await createRoomWithHumans(now, 3, 3, FAST_CONFIG);
      readyAllHumans(room);
      lobby.startMatch(room, hostPlayerId, false, now);
      // startMatch already set lifecycle="playing" and room.match on the
      // in-memory room object; no need to reload from repository.

      // The current player is the host; the guest is not current
      if (room.match) {
        room.match.currentPlayerId = hostPlayerId;
      }
      const guest = room.players.find((p) => p.playerId !== hostPlayerId)!;

      sync.calls.length = 0;
      lobby.leaveRoom(room, guest.playerId, now);

      expect(sync.calls).toHaveLength(0);
    });

    it("throws PLAYER_NOT_FOUND for a non-existent player", async () => {
      const now = 5_060_000;
      const { lobby, room } = await createRoomWithHumans(now, 3, 3);

      expect(() => lobby.leaveRoom(room, "nonexistent", now)).toThrow(
        expect.objectContaining({ code: "PLAYER_NOT_FOUND" }),
      );
    });
  });

  // ═══ createAiPlayer (tested indirectly via setAiCount/startMatch) ═══

  describe("createAiPlayer (via setAiCount)", () => {
    it("creates an AI player with correct defaults", async () => {
      const now = 6_000_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        6,
        2,
      );

      lobby.setAiCount(room, hostPlayerId, 1, now);

      const ai = room.players.find((p) => p.isAi)!;
      expect(ai).toBeDefined();
      expect(ai.isAi).toBe(true);
      expect(ai.control).toBe("ai");
      expect(ai.ready).toBe(true);
      expect(ai.connected).toBe(true);
      expect(ai.consecutiveTimeouts).toBe(0);
      expect(ai.session).toBeNull();
      expect(ai.playerId).toMatch(/^ai-/);
      expect(ai.name).toMatch(/^茶灵 /);
    });

    it("assigns sequential avatar keys by seat index", async () => {
      const now = 6_010_000;
      const { lobby, room, hostPlayerId } = await createRoomWithHumans(
        now,
        6,
        2,
      );

      lobby.setAiCount(room, hostPlayerId, 3, now);

      const aiPlayers = room.players.filter((p) => p.isAi);
      // Each AI should have a distinct avatar key based on seat index
      const avatarKeys = aiPlayers.map((p) => p.avatarKey);
      expect(new Set(avatarKeys).size).toBe(avatarKeys.length);
    });
  });
});
