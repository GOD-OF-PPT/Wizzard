import { chooseAiIntent } from "@wizzard/game-core";
import { createPlayerSnapshot } from "@wizzard/game-core/authority";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  type BoundRoomSession,
  type RoomRecord,
  type RoomServiceConfig,
} from "../src/index.js";
import { MemoryRoomRepository } from "../src/persistence/index.js";
import type { RoomRepository } from "../src/persistence/types.js";
import { RoomQueue } from "../src/room/RoomQueue.js";
import type { RoomContext } from "../src/room/room-shared.js";
import { SessionService } from "../src/room/SessionService.js";
import { LobbyService } from "../src/room/LobbyService.js";
import {
  MatchScheduler,
  synchronizeMatch,
  deadlineMatches,
} from "../src/room/MatchScheduler.js";
import { RoomServiceError } from "../src/room/errors.js";

// ─── Test config ──────────────────────────────────────────────────────

const FAST_CONFIG: Partial<RoomServiceConfig> = {
  aiActionDelayMs: 25,
  turnTimeoutMs: 100,
  trickResultDelayMs: 50,
  roundScoreDelayMs: 50,
};

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Directly modify a room in the repository, bypassing the service.
 * Handles revision increment and CAS correctly.
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

type SchedulerHandle = {
  scheduler: MatchScheduler;
  session: SessionService;
  lobby: LobbyService;
  repository: MemoryRoomRepository<RoomRecord>;
  context: RoomContext;
  roomId: string;
  sessions: Map<string, BoundRoomSession>;
  hostPlayerId: string;
};

/**
 * Create a room with `playerCount` human players, ready all, and start
 * the match. Returns a handle with the MatchScheduler, sessions, and room ID.
 */
async function createStartedRoom(
  now: number,
  playerCount: 3 | 4 | 5 | 6 = 3,
  config?: Partial<RoomServiceConfig>,
  turnTimerEnabled?: boolean,
): Promise<SchedulerHandle> {
  const repository = new MemoryRoomRepository<RoomRecord>(() => now);
  const context: RoomContext = {
    clock: () => now,
    config: { ...DEFAULT_ROOM_SERVICE_CONFIG, ...config ?? FAST_CONFIG },
    idFactory: (() => {
      let n = 0;
      return () => `id-${++n}`;
    })(),
    queue: new RoomQueue(),
    repository,
    synchronizeMatch,
  };
  const session = new SessionService(context);
  const lobby = new LobbyService(context);
  const scheduler = new MatchScheduler(context);

  const host = await session.createRoom(
    { ...createMessage("Host", { maxPlayers: playerCount, turnTimerEnabled }) },
    now,
  );
  const sessions = new Map<string, BoundRoomSession>([
    [host.session.playerId, host.session],
  ]);
  for (let i = 1; i < playerCount; i++) {
    const player = await joinByInvite(
      session,
      host.grant.inviteToken!,
      `P${i + 1}`,
      now,
    );
    sessions.set(player.session.playerId, player.session);
  }

  // Ready all players and start the match on the in-memory room
  const room = (await repository.loadById(host.grant.roomId))!;
  for (const player of room.players) {
    if (!player.isAi) {
      lobby.setReady(room, player, true);
    }
  }

  // Start the match (creates match via createMatch + sets deadline via synchronizeMatch)
  lobby.startMatch(room, host.grant.playerId, false, now);

  // Persist the started room back to the repository so wake() and
  // subsequent repository loads see the match.
  const expectedRevision = room.revision;
  room.revision = expectedRevision + 1;
  await repository.compareAndSwap(room, expectedRevision);

  return {
    scheduler,
    session,
    lobby,
    repository,
    context,
    roomId: host.grant.roomId,
    sessions,
    hostPlayerId: host.grant.playerId,
  };
}

/**
 * Advance the match to a specific phase by repeatedly calling wake at
 * each deadline's dueAt.
 */
async function advanceToPhase(
  handle: SchedulerHandle,
  targetPhase: string,
  startTime: number,
  maxIterations = 200,
): Promise<RoomRecord> {
  let now = startTime;
  for (let i = 0; i < maxIterations; i++) {
    const room = (await handle.repository.loadById(handle.roomId))!;
    if (!room.match) break;
    if (room.match.phase === targetPhase) return room;
    if (room.lifecycle === "finished" || room.lifecycle === "closed") break;
    if (!room.deadline) break;
    now = Math.max(now, room.deadline.dueAt);
    await handle.scheduler.wake(handle.roomId, now);
  }
  const room = (await handle.repository.loadById(handle.roomId))!;
  return room;
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("MatchScheduler", () => {
  // ═══ synchronizeMatch (module-level) ═══

  describe("synchronizeMatch", () => {
    it("match-end transitions to finished with null deadline", async () => {
      const now = 1_000_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;

      // Simulate match-end by directly setting the phase
      await modifyRoomDirect(handle.repository, handle.roomId, (r) => {
        if (r.match) {
          r.match = { ...r.match, phase: "match-end" };
        }
      });

      const updated = (await handle.repository.loadById(handle.roomId))!;
      synchronizeMatch(updated, now, handle.context.config);

      expect(updated.lifecycle).toBe("finished");
      expect(updated.deadline).toBeNull();
    });

    it("no match yields null deadline without changing lifecycle", async () => {
      const now = 1_010_000;
      const repository = new MemoryRoomRepository<RoomRecord>(() => now);
      const context: RoomContext = {
        clock: () => now,
        config: { ...DEFAULT_ROOM_SERVICE_CONFIG, ...FAST_CONFIG },
        idFactory: (() => {
          let n = 0;
          return () => `id-${++n}`;
        })(),
        queue: new RoomQueue(),
        repository,
        synchronizeMatch,
      };
      const session = new SessionService(context);
      const host = await session.createRoom(createMessage("Host"), now);

      const room = (await repository.loadById(host.grant.roomId))!;
      const originalLifecycle = room.lifecycle;
      synchronizeMatch(room, now, context.config);

      expect(room.match).toBeNull();
      expect(room.deadline).toBeNull();
      expect(room.lifecycle).toBe(originalLifecycle);
    });

    it("active match yields playing lifecycle with a new deadline", async () => {
      const now = 1_020_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;

      // synchronizeMatch was already called by startMatch; verify the result
      expect(room.lifecycle).toBe("playing");
      expect(room.match).not.toBeNull();
      expect(room.deadline).not.toBeNull();
      expect(room.deadline!.matchVersion).toBe(room.match!.version);

      // Call again to verify idempotent behavior
      synchronizeMatch(room, now + 50, handle.context.config);
      expect(room.lifecycle).toBe("playing");
      expect(room.deadline).not.toBeNull();
    });

    it("no-timer connected human yields null deadline", async () => {
      const now = 1_030_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG, false);
      const room = (await handle.repository.loadById(handle.roomId))!;

      // In no-timer mode with a connected human as current player,
      // synchronizeMatch should set deadline to null
      expect(room.turnTimerEnabled).toBe(false);
      const currentPlayer = room.players.find(
        (p) => p.playerId === room.match!.currentPlayerId,
      )!;
      expect(currentPlayer.connected).toBe(true);

      synchronizeMatch(room, now, handle.context.config);
      expect(room.deadline).toBeNull();
    });
  });

  // ═══ deadlineMatches (module-level) ═══

  describe("deadlineMatches", () => {
    it("version mismatch returns false", async () => {
      const now = 2_000_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const deadline = room.deadline!;

      const staleDeadline = {
        ...deadline,
        matchVersion: deadline.matchVersion - 1,
      };
      expect(deadlineMatches(room, staleDeadline)).toBe(false);
    });

    it("phase mismatch returns false", async () => {
      const now = 2_010_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const deadline = room.deadline!;

      // Create a deadline with a kind that doesn't match the current phase
      const mismatchedDeadline = {
        ...deadline,
        kind: "resolve-trick" as const,
      };
      expect(deadlineMatches(room, mismatchedDeadline)).toBe(false);
    });

    it("no match returns false", async () => {
      const now = 2_020_000;
      const repository = new MemoryRoomRepository<RoomRecord>(() => now);
      const context: RoomContext = {
        clock: () => now,
        config: { ...DEFAULT_ROOM_SERVICE_CONFIG, ...FAST_CONFIG },
        idFactory: (() => {
          let n = 0;
          return () => `id-${++n}`;
        })(),
        queue: new RoomQueue(),
        repository,
        synchronizeMatch,
      };
      const session = new SessionService(context);
      const host = await session.createRoom(createMessage("Host"), now);
      const room = (await repository.loadById(host.grant.roomId))!;

      const fakeDeadline = {
        dueAt: now,
        kind: "turn" as const,
        matchVersion: 1,
        playerId: "fake",
      };
      expect(deadlineMatches(room, fakeDeadline)).toBe(false);
    });

    it("matching version and phase returns true", async () => {
      const now = 2_030_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const deadline = room.deadline!;

      expect(deadlineMatches(room, deadline)).toBe(true);
    });

    it("resolve-trick deadline matches trick-result phase", async () => {
      const now = 2_040_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      // Advance to trick-result phase
      const room = await advanceToPhase(handle, "trick-result", now);
      expect(room.match!.phase).toBe("trick-result");

      const resolveDeadline = {
        dueAt: now,
        kind: "resolve-trick" as const,
        matchVersion: room.match!.version,
        playerId: null,
      };
      expect(deadlineMatches(room, resolveDeadline)).toBe(true);
    });
  });

  // ═══ applyPlayerIntent ═══

  describe("applyPlayerIntent", () => {
    it("cached command returns changed:false", async () => {
      const now = 3_000_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const currentPlayerId = room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const actor = room.players.find((p) => p.playerId === currentPlayerId)!;
      const snapshot = createPlayerSnapshot(room.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "cache-test")!;

      const message = {
        payload: { intent },
        requestId: "cache-test",
        type: "match.intent" as const,
        v: 1 as const,
      };

      const first = handle.scheduler.applyPlayerIntent(
        room,
        actor,
        currentSession,
        message,
        now,
      );
      expect(first.changed).toBe(true);

      // Re-submit the same intent — should be cached
      const second = handle.scheduler.applyPlayerIntent(
        room,
        actor,
        currentSession,
        message,
        now,
      );
      expect(second.changed).toBe(false);
    });

    it("commandId mismatch rejects", async () => {
      const now = 3_010_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const currentPlayerId = room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const actor = room.players.find((p) => p.playerId === currentPlayerId)!;
      const snapshot = createPlayerSnapshot(room.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "intent-id")!;

      expect(() =>
        handle.scheduler.applyPlayerIntent(
          room,
          actor,
          currentSession,
          {
            payload: { intent },
            requestId: "different-request-id",
            type: "match.intent",
            v: 1,
          },
          now,
        ),
      ).toThrow(RoomServiceError);
    });

    it("expired deadline rejects", async () => {
      const now = 3_020_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const currentPlayerId = room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const actor = room.players.find((p) => p.playerId === currentPlayerId)!;
      const deadline = room.deadline!;
      const snapshot = createPlayerSnapshot(room.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "expired-test")!;

      expect(() =>
        handle.scheduler.applyPlayerIntent(
          room,
          actor,
          currentSession,
          {
            payload: { intent },
            requestId: "expired-test",
            type: "match.intent",
            v: 1,
          },
          deadline.dueAt, // exactly at deadline = expired
        ),
      ).toThrow(RoomServiceError);
    });

    it("receipt type conflict rejects", async () => {
      const now = 3_030_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const currentPlayerId = room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const actor = room.players.find((p) => p.playerId === currentPlayerId)!;

      // Manually add a command history entry with a conflicting receipt type
      const coreCommandId = `${currentSession.sessionId}:conflict-test`;
      room.commandHistory.push({
        commandKey: coreCommandId,
        messageType: "match.intent|choose-trump|0|spade",
      });

      const snapshot = createPlayerSnapshot(room.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "conflict-test")!;

      expect(() =>
        handle.scheduler.applyPlayerIntent(
          room,
          actor,
          currentSession,
          {
            payload: { intent },
            requestId: "conflict-test",
            type: "match.intent",
            v: 1,
          },
          now,
        ),
      ).toThrow(RoomServiceError);
    });

    it("success resets consecutiveTimeouts and control", async () => {
      const now = 3_040_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const currentPlayerId = room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const actor = room.players.find((p) => p.playerId === currentPlayerId)!;

      // Set stale state
      actor.consecutiveTimeouts = 1;
      actor.control = "ai";

      const snapshot = createPlayerSnapshot(room.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "reset-test")!;

      const result = handle.scheduler.applyPlayerIntent(
        room,
        actor,
        currentSession,
        {
          payload: { intent },
          requestId: "reset-test",
          type: "match.intent",
          v: 1,
        },
        now,
      );

      expect(result.changed).toBe(true);
      expect(actor.consecutiveTimeouts).toBe(0);
      expect(actor.control).toBe("human");
    });

    it("rejects when not in playing lifecycle", async () => {
      const now = 3_050_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const currentPlayerId = room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const actor = room.players.find((p) => p.playerId === currentPlayerId)!;

      room.lifecycle = "lobby";

      const snapshot = createPlayerSnapshot(room.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "lifecycle-test")!;

      expect(() =>
        handle.scheduler.applyPlayerIntent(
          room,
          actor,
          currentSession,
          {
            payload: { intent },
            requestId: "lifecycle-test",
            type: "match.intent",
            v: 1,
          },
          now,
        ),
      ).toThrow(RoomServiceError);
    });
  });

  // ═══ continueRound ═══

  describe("continueRound", () => {
    it("advances from round-score phase", async () => {
      const now = 4_000_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      // Advance to round-score phase
      const room = await advanceToPhase(handle, "round-score", now);
      expect(room.match!.phase).toBe("round-score");

      const events = handle.scheduler.continueRound(room, now + 1);

      expect(events).toBeDefined();
      expect(room.lifecycle).toBe("playing");
      // After continue-round, the match should have advanced
      expect(room.match).not.toBeNull();
    });

    it("rejects when not in playing lifecycle", async () => {
      const now = 4_010_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;

      room.lifecycle = "lobby";

      expect(() => handle.scheduler.continueRound(room, now)).toThrow(
        RoomServiceError,
      );
    });

    it("rejects when match phase is not round-score", async () => {
      const now = 4_020_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;

      // Match is in trump-select or bid phase, not round-score
      expect(room.match!.phase).not.toBe("round-score");

      expect(() => handle.scheduler.continueRound(room, now)).toThrow(
        RoomServiceError,
      );
    });

    it("rejects when match is null", async () => {
      const now = 4_030_000;
      const repository = new MemoryRoomRepository<RoomRecord>(() => now);
      const context: RoomContext = {
        clock: () => now,
        config: { ...DEFAULT_ROOM_SERVICE_CONFIG, ...FAST_CONFIG },
        idFactory: (() => {
          let n = 0;
          return () => `id-${++n}`;
        })(),
        queue: new RoomQueue(),
        repository,
        synchronizeMatch,
      };
      const session = new SessionService(context);
      const scheduler = new MatchScheduler(context);
      const host = await session.createRoom(createMessage("Host"), now);
      const room = (await repository.loadById(host.grant.roomId))!;

      expect(room.match).toBeNull();
      expect(() => scheduler.continueRound(room, now)).toThrow(RoomServiceError);
    });
  });

  // ═══ wake ═══

  describe("wake", () => {
    it("future deadline is a no-op (changed: false)", async () => {
      const now = 5_000_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const deadline = room.deadline!;

      const result = await handle.scheduler.wake(
        handle.roomId,
        deadline.dueAt - 1,
      );

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(false);
    });

    it("expired deadline advances the match", async () => {
      const now = 5_010_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const originalVersion = room.match!.version;
      const deadline = room.deadline!;

      const result = await handle.scheduler.wake(handle.roomId, deadline.dueAt);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.room.match!.version).toBeGreaterThan(originalVersion);
      expect(result!.matchEvents).not.toHaveLength(0);
    });

    it("stale deadline re-plans without advancing", async () => {
      const now = 5_020_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const originalVersion = room.match!.version;
      const deadline = room.deadline!;

      // Make the deadline stale by changing the match version
      await modifyRoomDirect(handle.repository, handle.roomId, (r) => {
        if (r.deadline) {
          r.deadline = {
            ...r.deadline,
            matchVersion: r.deadline.matchVersion - 1,
            dueAt: now,
          };
        }
      });

      const result = await handle.scheduler.wake(handle.roomId, now);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.room.match!.version).toBe(originalVersion);
      expect(result!.room.deadline).not.toBeNull();
    });

    it("returns null for a missing room", async () => {
      const now = 5_030_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);

      // Delete the room
      await handle.repository.delete(handle.roomId);

      const result = await handle.scheduler.wake(handle.roomId, now);
      expect(result).toBeNull();
    });

    it("no-op when match is null", async () => {
      const now = 5_040_000;
      const repository = new MemoryRoomRepository<RoomRecord>(() => now);
      const context: RoomContext = {
        clock: () => now,
        config: { ...DEFAULT_ROOM_SERVICE_CONFIG, ...FAST_CONFIG },
        idFactory: (() => {
          let n = 0;
          return () => `id-${++n}`;
        })(),
        queue: new RoomQueue(),
        repository,
        synchronizeMatch,
      };
      const session = new SessionService(context);
      const scheduler = new MatchScheduler(context);
      const host = await session.createRoom(createMessage("Host"), now);

      // Set an artificial deadline on a room with no match
      await modifyRoomDirect(repository, host.grant.roomId, (room) => {
        room.deadline = {
          dueAt: now,
          kind: "turn",
          matchVersion: 1,
          playerId: "fake-player",
        };
      });

      const result = await scheduler.wake(host.grant.roomId, now);
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(false);
    });

    it("consecutive timeout takeover flips control to ai after 2", async () => {
      const now = 5_050_000;
      const handle = await createStartedRoom(now, 3, FAST_CONFIG);
      const room = (await handle.repository.loadById(handle.roomId))!;
      const currentPlayerId = room.match!.currentPlayerId!;
      const deadline = room.deadline!;

      // Verify the current player is a human (not AI)
      const currentPlayer = room.players.find(
        (p) => p.playerId === currentPlayerId,
      )!;
      expect(currentPlayer.isAi).toBe(false);
      expect(currentPlayer.control).toBe("human");

      // Pre-set consecutiveTimeouts to 1 so one timeout wake brings it to 2
      await modifyRoomDirect(handle.repository, handle.roomId, (r) => {
        const player = r.players.find((p) => p.playerId === currentPlayerId)!;
        player.consecutiveTimeouts = 1;
        player.control = "human";
      });

      const result = await handle.scheduler.wake(handle.roomId, deadline.dueAt);
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);

      const updatedPlayer = result!.room.players.find(
        (p) => p.playerId === currentPlayerId,
      );
      expect(updatedPlayer).toBeDefined();
      expect(updatedPlayer!.consecutiveTimeouts).toBe(2);
      expect(updatedPlayer!.control).toBe("ai");
    });
  });
});
