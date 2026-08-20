/**
 * Characterization tests for RoomCoordinator — pin currently-untested behaviors
 * BEFORE the M3 split. These tests exercise the public RoomCoordinator API
 * (createRoom, joinRoom, resumeSession, execute, disconnect, wake, loadRoom)
 * so they survive the extraction into SessionService / LobbyService /
 * MatchScheduler.
 *
 * Covers validation assertions VAL-RC-015 through VAL-RC-065.
 */

import { chooseAiIntent } from "@wizzard/game-core";
import { createPlayerSnapshot } from "@wizzard/game-core/authority";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  RoomCoordinator,
  type BoundRoomSession,
  type CoordinatorUpdate,
  type RoomRecord,
  type RoomServiceConfig,
} from "../src/index.js";
import { MemoryRoomRepository } from "../src/persistence/index.js";
import type {
  RoomRepository,
  SaveRoomResult,
} from "../src/persistence/types.js";

// ─── Test config ──────────────────────────────────────────────────────

const FAST_CONFIG: Partial<RoomServiceConfig> = {
  aiActionDelayMs: 25,
  turnTimeoutMs: 100,
  trickResultDelayMs: 50,
  roundScoreDelayMs: 50,
};

// ─── Message helpers ──────────────────────────────────────────────────

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

function readyMessage(requestId: string, ready = true) {
  return {
    payload: { ready },
    requestId,
    type: "room.set-ready" as const,
    v: 1 as const,
  };
}

function leaveMessage(requestId: string) {
  return {
    payload: {} as Record<string, never>,
    requestId,
    type: "room.leave" as const,
    v: 1 as const,
  };
}

function rematchMessage(requestId: string) {
  return {
    payload: {} as Record<string, never>,
    requestId,
    type: "room.rematch" as const,
    v: 1 as const,
  };
}

function startMessage(requestId: string, fillWithAi: boolean) {
  return {
    payload: { fillWithAi },
    requestId,
    type: "room.start" as const,
    v: 1 as const,
  };
}

async function join(
  coordinator: RoomCoordinator,
  inviteToken: string,
  name: string,
) {
  return coordinator.joinRoom({
    payload: {
      avatarKey: "flower-fox",
      displayName: name,
      inviteToken,
    },
    requestId: `join-${name}`,
    type: "room.join",
    v: 1,
  });
}

// ─── Room setup helpers ──────────────────────────────────────────────

type CoordinatorHandle = {
  coordinator: RoomCoordinator;
  repository: MemoryRoomRepository<RoomRecord>;
  host: { session: BoundRoomSession; grant: { inviteToken?: string; roomId: string } };
  members: Array<{
    session: BoundRoomSession;
    grant: { inviteToken?: string; roomId: string; playerId: string };
  }>;
  sessions: Map<string, BoundRoomSession>;
  roomId: string;
};

async function createRoomWithPlayers(
  now: number,
  playerCount: 3 | 4 | 5 | 6,
  config?: Partial<RoomServiceConfig>,
  turnTimerEnabled?: boolean,
): Promise<CoordinatorHandle> {
  const repository = new MemoryRoomRepository<RoomRecord>(() => now);
  const coordinator = new RoomCoordinator({
    clock: () => now,
    config: config ?? FAST_CONFIG,
    repository,
  });
  const host = await coordinator.createRoom({
    ...createMessage("Host", { maxPlayers: playerCount, turnTimerEnabled }),
  });
  const members = [
    {
      session: host.session,
      grant: host.grant,
    },
  ];
  const sessions = new Map<string, BoundRoomSession>([
    [host.session.playerId, host.session],
  ]);
  for (let i = 1; i < playerCount; i++) {
    const player = await join(coordinator, host.grant.inviteToken!, `P${i + 1}`);
    members.push({ session: player.session, grant: player.grant });
    sessions.set(player.session.playerId, player.session);
  }
  return {
    coordinator,
    repository,
    host: { session: host.session, grant: host.grant },
    members,
    sessions,
    roomId: host.grant.roomId,
  };
}

async function readyAllPlayers(
  handle: CoordinatorHandle,
  now: number,
): Promise<void> {
  for (const member of handle.members) {
    await handle.coordinator.execute(
      member.session,
      readyMessage(`ready-${member.session.playerId}`),
      now,
    );
  }
}

async function startMatch(
  handle: CoordinatorHandle,
  now: number,
  fillWithAi = false,
): Promise<CoordinatorUpdate> {
  return handle.coordinator.execute(
    handle.host.session,
    startMessage("start-match", fillWithAi),
    now,
  );
}

/** Create a room, ready all players, and start the match. */
async function createStartedRoom(
  now: number,
  playerCount: 3 | 4 | 5 | 6 = 3,
  config?: Partial<RoomServiceConfig>,
  turnTimerEnabled?: boolean,
  fillWithAi = false,
): Promise<{ handle: CoordinatorHandle; started: CoordinatorUpdate }> {
  const handle = await createRoomWithPlayers(
    now,
    playerCount,
    config,
    turnTimerEnabled,
  );
  await readyAllPlayers(handle, now);
  const started = await startMatch(handle, now, fillWithAi);
  return { handle, started };
}

// ─── Match advancement helpers ───────────────────────────────────────

/**
 * Repeatedly call `wake` at each deadline's dueAt until the match ends
 * (lifecycle becomes "finished" or "closed") or the iteration limit is hit.
 */
async function advanceToCompletion(
  coordinator: RoomCoordinator,
  roomId: string,
  startTime: number,
  maxIterations = 5000,
): Promise<{ lastUpdate: CoordinatorUpdate | null; endTime: number }> {
  let now = startTime;
  let lastUpdate: CoordinatorUpdate | null = null;
  for (let i = 0; i < maxIterations; i++) {
    const room = await coordinator.loadRoom(roomId);
    if (!room || !room.match) break;
    if (room.lifecycle === "finished" || room.lifecycle === "closed") break;
    if (!room.deadline) break;
    now = Math.max(now, room.deadline.dueAt);
    const update = await coordinator.wake(roomId, now);
    if (update === null) break;
    lastUpdate = update;
  }
  return { lastUpdate, endTime: now };
}

// ─── Repository helpers ──────────────────────────────────────────────

/**
 * Directly modify a room in the repository, bypassing the coordinator.
 * Used to set up artificial states for characterization tests.
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

/**
 * Repository wrapper that conflicts N times before delegating to the inner
 * repository. Only conflicts when `enabled` is true (so setup calls succeed).
 */
class ConflictingRepository implements RoomRepository<RoomRecord> {
  private conflictCount = 0;
  public casCallCount = 0;
  public enabled = false;

  constructor(
    private readonly inner: RoomRepository<RoomRecord>,
    private readonly maxConflicts: number,
  ) {}

  async compareAndSwap(
    room: RoomRecord,
    expectedRevision: number,
  ): Promise<SaveRoomResult> {
    this.casCallCount++;
    if (this.enabled && this.conflictCount < this.maxConflicts) {
      this.conflictCount++;
      return "conflict";
    }
    return this.inner.compareAndSwap(room, expectedRevision);
  }

  async countActive(now: number): Promise<number> {
    return this.inner.countActive(now);
  }
  async create(room: RoomRecord): Promise<boolean> {
    return this.inner.create(room);
  }
  async delete(id: string): Promise<void> {
    return this.inner.delete(id);
  }
  async loadByCode(code: string): Promise<RoomRecord | null> {
    return this.inner.loadByCode(code);
  }
  async loadById(id: string): Promise<RoomRecord | null> {
    return this.inner.loadById(id);
  }
  async loadByInviteHash(inviteTokenHash: string): Promise<RoomRecord | null> {
    return this.inner.loadByInviteHash(inviteTokenHash);
  }
  async sweepExpired(now: number): Promise<number> {
    return this.inner.sweepExpired(now);
  }
}

/**
 * Repository wrapper that tracks call ordering for serialization tests.
 */
class TrackingRepository implements RoomRepository<RoomRecord> {
  public events: string[] = [];

  constructor(private readonly inner: RoomRepository<RoomRecord>) {}

  async compareAndSwap(
    room: RoomRecord,
    expectedRevision: number,
  ): Promise<SaveRoomResult> {
    this.events.push(`cas:${room.id}`);
    return this.inner.compareAndSwap(room, expectedRevision);
  }

  async countActive(now: number): Promise<number> {
    return this.inner.countActive(now);
  }
  async create(room: RoomRecord): Promise<boolean> {
    return this.inner.create(room);
  }
  async delete(id: string): Promise<void> {
    return this.inner.delete(id);
  }
  async loadByCode(code: string): Promise<RoomRecord | null> {
    return this.inner.loadByCode(code);
  }
  async loadById(id: string): Promise<RoomRecord | null> {
    this.events.push(`load:${id}`);
    return this.inner.loadById(id);
  }
  async loadByInviteHash(inviteTokenHash: string): Promise<RoomRecord | null> {
    return this.inner.loadByInviteHash(inviteTokenHash);
  }
  async sweepExpired(now: number): Promise<number> {
    return this.inner.sweepExpired(now);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("RoomCoordinator characterization", () => {
  // ═══ synchronizeMatch lifecycle transitions (VAL-RC-015..017) ═══

  describe("synchronizeMatch lifecycle transitions", () => {
    it("match-end transitions to finished with null deadline (VAL-RC-015)", async () => {
      const now = 5_000_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;

      const { lastUpdate } = await advanceToCompletion(
        handle.coordinator,
        roomId,
        now,
      );

      const finishedRoom = lastUpdate?.room ?? (await handle.coordinator.loadRoom(roomId))!;
      expect(finishedRoom.lifecycle).toBe("finished");
      expect(finishedRoom.deadline).toBeNull();
      expect(finishedRoom.match).not.toBeNull();
      expect(finishedRoom.match!.phase).toBe("match-end");
    });

    it("no match yields null deadline without changing lifecycle (VAL-RC-016)", async () => {
      const now = 5_100_000;
      const handle = await createRoomWithPlayers(now, 3, FAST_CONFIG);
      const room = await handle.coordinator.loadRoom(handle.roomId);
      expect(room!.match).toBeNull();
      expect(room!.deadline).toBeNull();
      expect(room!.lifecycle).toBe("lobby");
    });

    it("active match yields playing lifecycle with a new deadline (VAL-RC-017)", async () => {
      const now = 5_200_000;
      const { started } = await createStartedRoom(now, 3, FAST_CONFIG);
      expect(started.room.lifecycle).toBe("playing");
      expect(started.room.match).not.toBeNull();
      expect(started.room.deadline).not.toBeNull();
      expect(started.room.deadline!.matchVersion).toBe(started.room.match!.version);
    });
  });

  // ═══ planDeadline per-phase decisions (VAL-RC-018..024) ═══

  describe("planDeadline per-phase decisions", () => {
    it("trick-result phase returns resolve-trick deadline (VAL-RC-018)", async () => {
      const now = 5_300_000;
      const { handle, started } = await createStartedRoom(now, 3, {
        ...FAST_CONFIG,
        trickResultDelayMs: 50,
      });
      const roomId = handle.roomId;

      let room = started.room;
      let currentTime = now;
      for (let i = 0; i < 200; i++) {
        if (room.match!.phase === "trick-result") break;
        if (!room.deadline) break;
        currentTime = Math.max(currentTime, room.deadline.dueAt);
        const update = await handle.coordinator.wake(roomId, currentTime);
        if (!update) break;
        room = update.room;
      }

      expect(room.match!.phase).toBe("trick-result");
      expect(room.deadline).not.toBeNull();
      expect(room.deadline!.kind).toBe("resolve-trick");
      expect(room.deadline!.dueAt).toBe(currentTime + 50);
      expect(room.deadline!.playerId).toBeNull();
    });

    it("round-score phase returns continue-round deadline (VAL-RC-019)", async () => {
      const now = 5_400_000;
      const { handle, started } = await createStartedRoom(now, 3, {
        ...FAST_CONFIG,
        roundScoreDelayMs: 80,
      });
      const roomId = handle.roomId;

      let room = started.room;
      let currentTime = now;
      for (let i = 0; i < 500; i++) {
        if (room.match!.phase === "round-score") break;
        if (!room.deadline) break;
        currentTime = Math.max(currentTime, room.deadline.dueAt);
        const update = await handle.coordinator.wake(roomId, currentTime);
        if (!update) break;
        room = update.room;
      }

      expect(room.match!.phase).toBe("round-score");
      expect(room.deadline).not.toBeNull();
      expect(room.deadline!.kind).toBe("continue-round");
      expect(room.deadline!.dueAt).toBe(currentTime + 80);
      expect(room.deadline!.playerId).toBeNull();
    });

    it("match-end phase returns null deadline (VAL-RC-020)", async () => {
      const now = 5_500_000;
      const { handle } = await createStartedRoom(now, 3, FAST_CONFIG);
      const { lastUpdate } = await advanceToCompletion(
        handle.coordinator,
        handle.roomId,
        now,
      );
      const room = lastUpdate?.room ?? (await handle.coordinator.loadRoom(handle.roomId))!;
      expect(room.match!.phase).toBe("match-end");
      expect(room.deadline).toBeNull();
    });

    it("AI current player returns turn deadline at aiActionDelayMs (VAL-RC-021)", async () => {
      const now = 5_600_000;
      const { handle, started } = await createStartedRoom(now, 3, {
        ...FAST_CONFIG,
        aiActionDelayMs: 25,
      }, undefined, true);
      const roomId = handle.roomId;

      let room = started.room;
      let currentTime = now;
      for (let i = 0; i < 200; i++) {
        const currentPlayerId = room.match!.currentPlayerId;
        const player = room.players.find((p) => p.playerId === currentPlayerId);
        if (player?.isAi || player?.control === "ai") break;
        if (!room.deadline) break;
        currentTime = Math.max(currentTime, room.deadline.dueAt);
        const update = await handle.coordinator.wake(roomId, currentTime);
        if (!update) break;
        room = update.room;
      }

      const currentPlayerId = room.match!.currentPlayerId!;
      const currentPlayer = room.players.find((p) => p.playerId === currentPlayerId)!;
      const isAutomated = currentPlayer.isAi || currentPlayer.control === "ai";
      expect(isAutomated).toBe(true);
      expect(room.deadline).not.toBeNull();
      expect(room.deadline!.kind).toBe("turn");
      expect(room.deadline!.playerId).toBe(currentPlayerId);
      expect(room.deadline!.dueAt).toBe(currentTime + 25);
    });

    it("connected human in timer room returns turn deadline at turnTimeoutMs (VAL-RC-022)", async () => {
      const now = 5_700_000;
      const { started } = await createStartedRoom(now, 3, {
        ...FAST_CONFIG,
        turnTimeoutMs: 100,
      }, true);

      const currentPlayerId = started.room.match!.currentPlayerId!;
      const currentPlayer = started.room.players.find(
        (p) => p.playerId === currentPlayerId,
      )!;
      expect(currentPlayer.isAi).toBe(false);
      expect(currentPlayer.control).toBe("human");
      expect(currentPlayer.connected).toBe(true);
      expect(started.room.deadline).not.toBeNull();
      expect(started.room.deadline!.kind).toBe("turn");
      expect(started.room.deadline!.playerId).toBe(currentPlayerId);
      expect(started.room.deadline!.dueAt).toBe(now + 100);
    });

    it("connected human in no-timer room returns null deadline (VAL-RC-023)", async () => {
      const now = 5_800_000;
      const { started } = await createStartedRoom(now, 3, FAST_CONFIG, false);
      expect(started.room.turnTimerEnabled).toBe(false);
      expect(started.room.deadline).toBeNull();
      expect(started.room.match).not.toBeNull();
      expect(started.room.lifecycle).toBe("playing");
    });

    it("disconnected human in no-timer room returns turn deadline (VAL-RC-024)", async () => {
      const startTime = 5_900_000;
      const { handle, started } = await createStartedRoom(
        startTime,
        3,
        { ...FAST_CONFIG, turnTimeoutMs: 100 },
        false,
      );
      const currentPlayerId = started.room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;

      const disconnected = await handle.coordinator.disconnect(
        currentSession,
        startTime,
      );
      expect(disconnected).not.toBeNull();
      expect(disconnected!.changed).toBe(true);
      expect(disconnected!.room.deadline).not.toBeNull();
      expect(disconnected!.room.deadline!.kind).toBe("turn");
      expect(disconnected!.room.deadline!.playerId).toBe(currentPlayerId);
      expect(disconnected!.room.deadline!.dueAt).toBe(startTime + 100);
    });
  });

  // ═══ expiryFor per lifecycle (VAL-RC-025..029) ═══

  describe("expiryFor per lifecycle", () => {
    it("closed lifecycle returns min(expiresAt, now + 5min) (VAL-RC-025)", async () => {
      const now = 6_000_000;
      const handle = await createRoomWithPlayers(now, 3, undefined, true);
      await readyAllPlayers(handle, now);

      for (let i = 1; i < handle.members.length; i++) {
        await handle.coordinator.execute(
          handle.members[i].session,
          leaveMessage(`leave-${i}`),
          now,
        );
      }
      const result = await handle.coordinator.execute(
        handle.host.session,
        leaveMessage("last-leave"),
        now,
      );
      expect(result.room.lifecycle).toBe("closed");
      expect(result.room.expiresAt).toBe(now + 5 * 60 * 1_000);
      expect(result.room.deadline).toBeNull();
      expect(result.room.hostPlayerId).toBe("");
    });

    it("finished lifecycle returns now + finishedRoomTtlMs (VAL-RC-026)", async () => {
      const now = 6_100_000;
      const { handle } = await createStartedRoom(now, 3, FAST_CONFIG);
      const { lastUpdate } = await advanceToCompletion(
        handle.coordinator,
        handle.roomId,
        now,
      );
      const finishedRoom = lastUpdate?.room ?? (await handle.coordinator.loadRoom(handle.roomId))!;
      expect(finishedRoom.lifecycle).toBe("finished");
      const expectedExpiry = lastUpdate!.room.updatedAt + DEFAULT_ROOM_SERVICE_CONFIG.finishedRoomTtlMs;
      expect(finishedRoom.expiresAt).toBe(expectedExpiry);
    });

    it("playing with connected human returns createdAt + matchRoomTtlMs (VAL-RC-027)", async () => {
      const now = 6_200_000;
      const { started } = await createStartedRoom(now, 3, undefined, true);
      const createdAt = started.room.createdAt;
      expect(started.room.lifecycle).toBe("playing");
      expect(started.room.expiresAt).toBe(createdAt + DEFAULT_ROOM_SERVICE_CONFIG.matchRoomTtlMs);
    });

    it("playing with no connected human returns three-way min (VAL-RC-028)", async () => {
      const now = 6_300_000;
      const { handle, started } = await createStartedRoom(now, 3, undefined, true);
      for (const member of handle.members) {
        await handle.coordinator.disconnect(member.session, now);
      }
      const updatedRoom = await handle.coordinator.loadRoom(handle.roomId);
      expect(updatedRoom!.lifecycle).toBe("playing");
      const expectedMin = Math.min(
        started.room.createdAt + DEFAULT_ROOM_SERVICE_CONFIG.matchRoomTtlMs,
        started.room.expiresAt,
        now + DEFAULT_ROOM_SERVICE_CONFIG.offlineRoomTtlMs,
      );
      expect(updatedRoom!.expiresAt).toBe(expectedMin);
    });

    it("lobby lifecycle returns now + lobbyRoomTtlMs (VAL-RC-029)", async () => {
      const now = 6_400_000;
      const handle = await createRoomWithPlayers(now, 3, undefined, true);
      const room = await handle.coordinator.loadRoom(handle.roomId);
      expect(room!.lifecycle).toBe("lobby");
      expect(room!.expiresAt).toBe(now + DEFAULT_ROOM_SERVICE_CONFIG.lobbyRoomTtlMs);
    });
  });

  // ═══ leaveRoom (VAL-RC-030..034) ═══

  describe("leaveRoom", () => {
    it("host reassignment when host leaves with remaining humans (VAL-RC-030)", async () => {
      const now = 7_000_000;
      const handle = await createRoomWithPlayers(now, 3, FAST_CONFIG);

      const result = await handle.coordinator.execute(
        handle.host.session,
        leaveMessage("host-leave"),
        now,
      );
      const remainingHumans = result.room.players.filter(
        (p) => !p.isAi && p.session,
      );
      expect(remainingHumans.length).toBe(2);
      const lowestSeat = [...remainingHumans].sort(
        (a, b) => a.seatIndex - b.seatIndex,
      )[0];
      expect(result.room.hostPlayerId).toBe(lowestSeat.playerId);
      expect(result.room.hostPlayerId).not.toBe(handle.host.session.playerId);
      expect(
        result.room.players.find((p) => p.playerId === handle.host.session.playerId),
      ).toBeUndefined();
    });

    it("room closure when last human leaves (VAL-RC-031)", async () => {
      const now = 7_100_000;
      const handle = await createRoomWithPlayers(now, 3, FAST_CONFIG);
      for (let i = 1; i < handle.members.length; i++) {
        await handle.coordinator.execute(
          handle.members[i].session,
          leaveMessage(`leave-${i}`),
          now,
        );
      }
      const result = await handle.coordinator.execute(
        handle.host.session,
        leaveMessage("last-leave"),
        now,
      );
      expect(result.room.lifecycle).toBe("closed");
      expect(result.room.deadline).toBeNull();
      expect(result.room.expiresAt).toBe(now + 5 * 60 * 1_000);
      expect(result.room.hostPlayerId).toBe("");
    });

    it("AI conversion when non-host leaves during match (VAL-RC-032)", async () => {
      const now = 7_200_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const nonHostMember = handle.members[1];
      const nonHostPlayerId = nonHostMember.session.playerId;

      const result = await handle.coordinator.execute(
        nonHostMember.session,
        leaveMessage("non-host-leave"),
        now,
      );
      expect(result.room.lifecycle).toBe("playing");
      const leavingPlayer = result.room.players.find(
        (p) => p.playerId === nonHostPlayerId,
      );
      expect(leavingPlayer).toBeDefined();
      expect(leavingPlayer!.control).toBe("ai");
      expect(leavingPlayer!.session).toBeNull();
      expect(leavingPlayer!.connected).toBe(false);
    });

    it("lobby removal re-indexes seats contiguously (VAL-RC-033)", async () => {
      const now = 7_300_000;
      const handle = await createRoomWithPlayers(now, 3, FAST_CONFIG);
      const middleMember = handle.members[1];
      await handle.coordinator.execute(
        middleMember.session,
        leaveMessage("middle-leave"),
        now,
      );
      const room = await handle.coordinator.loadRoom(handle.roomId);
      expect(room!.lifecycle).toBe("lobby");
      const seatIndexes = room!.players.map((p) => p.seatIndex);
      expect(seatIndexes).toEqual([0, 1]);
    });

    it("current player leaving during match re-syncs deadline (VAL-RC-034)", async () => {
      const now = 7_400_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;
      const currentPlayerId = started.room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const originalDeadlineDueAt = started.room.deadline!.dueAt;

      // Current player leaves
      const result = await handle.coordinator.execute(
        currentSession,
        leaveMessage("current-leave"),
        now,
      );
      expect(result.room.lifecycle).toBe("playing");
      // The departing player should be converted to AI
      const departingPlayer = result.room.players.find(
        (p) => p.playerId === currentPlayerId,
      );
      expect(departingPlayer!.control).toBe("ai");
      // Deadline should be recomputed (synchronizeMatch called)
      expect(result.room.deadline).not.toBeNull();
      // The new deadline should reflect the AI conversion (aiActionDelayMs, not turnTimeoutMs)
      expect(result.room.deadline!.dueAt).not.toBe(originalDeadlineDueAt);
    });
  });

  // ═══ returnToLobby (VAL-RC-035..037) ═══

  describe("returnToLobby", () => {
    it("rematch resets: filters AI, resets ready/timeouts/control, re-indexes seats (VAL-RC-035)", async () => {
      const now = 8_000_000;
      const { handle } = await createStartedRoom(now, 4, FAST_CONFIG, undefined, true);
      const { lastUpdate } = await advanceToCompletion(
        handle.coordinator,
        handle.roomId,
        now,
      );
      const finishedRoom = lastUpdate?.room ?? (await handle.coordinator.loadRoom(handle.roomId))!;
      expect(finishedRoom.lifecycle).toBe("finished");

      const result = await handle.coordinator.execute(
        handle.host.session,
        rematchMessage("rematch"),
        lastUpdate!.room.updatedAt,
      );
      expect(result.room.lifecycle).toBe("lobby");
      expect(result.room.match).toBeNull();
      expect(result.room.deadline).toBeNull();
      expect(result.room.players.every((p) => !p.isAi)).toBe(true);
      for (const player of result.room.players) {
        expect(player.ready).toBe(false);
        expect(player.consecutiveTimeouts).toBe(0);
        expect(player.control).toBe("human");
      }
      const seatIndexes = result.room.players.map((p) => p.seatIndex);
      expect(seatIndexes).toEqual(seatIndexes.map((_, i) => i));
    });

    it("rejects rematch when lifecycle is not finished (VAL-RC-036)", async () => {
      const now = 8_100_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      expect(started.room.lifecycle).toBe("playing");
      await expect(
        handle.coordinator.execute(
          handle.host.session,
          rematchMessage("rematch-during-playing"),
          now,
        ),
      ).rejects.toMatchObject({ code: "WRONG_ROOM_PHASE" });
    });

    it("rejects rematch from non-host actor (VAL-RC-037)", async () => {
      const now = 8_200_000;
      const { handle } = await createStartedRoom(now, 3, FAST_CONFIG, undefined, true);
      const { lastUpdate } = await advanceToCompletion(
        handle.coordinator,
        handle.roomId,
        now,
      );
      const finishedRoom = lastUpdate?.room ?? (await handle.coordinator.loadRoom(handle.roomId))!;
      expect(finishedRoom.lifecycle).toBe("finished");

      const nonHostSession = handle.members[1].session;
      await expect(
        handle.coordinator.execute(
          nonHostSession,
          rematchMessage("non-host-rematch"),
          lastUpdate!.room.updatedAt,
        ),
      ).rejects.toMatchObject({ code: "NOT_HOST" });
    });
  });

  // ═══ mutateRoom CAS retry (VAL-RC-038..041) ═══

  describe("mutateRoom CAS retry", () => {
    it("succeeds within 4 attempts when CAS conflicts 3 times (VAL-RC-038)", async () => {
      const now = 9_000_000;
      const inner = new MemoryRoomRepository<RoomRecord>(() => now);
      const conflicting = new ConflictingRepository(inner, 3);
      const coordinator = new RoomCoordinator({
        clock: () => now,
        config: FAST_CONFIG,
        repository: conflicting,
      });
      const host = await coordinator.createRoom(createMessage("Host"));
      await join(coordinator, host.grant.inviteToken!, "Second");

      // Enable conflicting only for the execute call
      conflicting.enabled = true;
      conflicting.casCallCount = 0;
      const result = await coordinator.execute(
        host.session,
        readyMessage("ready-after-conflicts"),
        now,
      );
      expect(result.changed).toBe(true);
      // 4 CAS calls: 3 conflicts + 1 save
      expect(conflicting.casCallCount).toBe(4);
    });

    it("throws INTERNAL_ERROR after 4 CAS conflicts (VAL-RC-039)", async () => {
      const now = 9_100_000;
      const inner = new MemoryRoomRepository<RoomRecord>(() => now);
      const alwaysConflicting = new ConflictingRepository(inner, Infinity);
      const coordinator = new RoomCoordinator({
        clock: () => now,
        config: FAST_CONFIG,
        repository: alwaysConflicting,
      });
      const host = await coordinator.createRoom(createMessage("Host"));
      await join(coordinator, host.grant.inviteToken!, "Second");

      alwaysConflicting.enabled = true;
      alwaysConflicting.casCallCount = 0;
      await expect(
        coordinator.execute(
          host.session,
          readyMessage("ready-never-saves"),
          now,
        ),
      ).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
      expect(alwaysConflicting.casCallCount).toBe(4);
    });

    it("changed:false short-circuits without calling compareAndSwap (VAL-RC-040)", async () => {
      const now = 9_200_000;
      const inner = new MemoryRoomRepository<RoomRecord>(() => now);
      const tracking = new ConflictingRepository(inner, 0);
      const coordinator = new RoomCoordinator({
        clock: () => now,
        config: FAST_CONFIG,
        repository: tracking,
      });
      const host = await coordinator.createRoom(createMessage("Host"));

      tracking.casCallCount = 0;
      await coordinator.execute(
        host.session,
        readyMessage("first-ready"),
        now,
      );
      expect(tracking.casCallCount).toBeGreaterThan(0);

      // Submit the same command again (changed: false — duplicate)
      tracking.casCallCount = 0;
      const duplicate = await coordinator.execute(
        host.session,
        readyMessage("first-ready"),
        now,
      );
      expect(duplicate.changed).toBe(false);
      expect(tracking.casCallCount).toBe(0);
    });

    it("per-room serialization via RoomQueue (VAL-RC-041)", async () => {
      const now = 9_300_000;
      const inner = new MemoryRoomRepository<RoomRecord>(() => now);
      const tracking = new TrackingRepository(inner);
      const coordinator = new RoomCoordinator({
        clock: () => now,
        config: FAST_CONFIG,
        repository: tracking,
      });
      const host = await coordinator.createRoom(createMessage("Host"));
      const second = await join(coordinator, host.grant.inviteToken!, "Second");

      tracking.events.length = 0;

      const [result1, result2] = await Promise.all([
        coordinator.execute(
          host.session,
          readyMessage("concurrent-ready-1"),
          now,
        ),
        coordinator.execute(
          second.session,
          readyMessage("concurrent-ready-2"),
          now,
        ),
      ]);

      expect(result1.changed).toBe(true);
      expect(result2.changed).toBe(true);

      // Verify serialization: events should follow load→cas→load→cas pattern
      // (not load→load→cas→cas which would indicate overlap)
      const order = tracking.events.map((e) => e.split(":")[0]);
      const firstCasIdx = order.indexOf("cas");
      const secondLoadIdx = order.indexOf("load", firstCasIdx + 1);
      // In serialized order, the first cas comes before the second load
      expect(firstCasIdx).toBeGreaterThan(-1);
      expect(secondLoadIdx).toBeGreaterThan(-1);
      expect(firstCasIdx).toBeLessThan(secondLoadIdx);
    });
  });

  // ═══ disconnect (VAL-RC-042..044) ═══

  describe("disconnect", () => {
    it("already-disconnected player is a no-op (VAL-RC-042)", async () => {
      const now = 10_000_000;
      const handle = await createRoomWithPlayers(now, 3, FAST_CONFIG);
      const session = handle.members[1].session;

      const first = await handle.coordinator.disconnect(session, now);
      expect(first!.changed).toBe(true);

      const second = await handle.coordinator.disconnect(session, now);
      expect(second).not.toBeNull();
      expect(second!.changed).toBe(false);
    });

    it("returns null for missing room (VAL-RC-043)", async () => {
      const now = 10_100_000;
      const inner = new MemoryRoomRepository<RoomRecord>(() => now);
      const coordinator = new RoomCoordinator({
        clock: () => now,
        config: FAST_CONFIG,
        repository: inner,
      });
      const host = await coordinator.createRoom(createMessage("Host"));

      await inner.delete(host.grant.roomId);

      const result = await coordinator.disconnect(host.session, now);
      expect(result).toBeNull();
    });

    it("no-timer current player schedules hidden grace on disconnect (VAL-RC-044)", async () => {
      const startTime = 10_200_000;
      const { handle, started } = await createStartedRoom(
        startTime,
        3,
        { ...FAST_CONFIG, turnTimeoutMs: 100 },
        false,
      );
      expect(started.room.deadline).toBeNull();

      const currentPlayerId = started.room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;

      const result = await handle.coordinator.disconnect(
        currentSession,
        startTime,
      );
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.room.deadline).not.toBeNull();
      expect(result!.room.deadline!.kind).toBe("turn");
      expect(result!.room.deadline!.playerId).toBe(currentPlayerId);
      expect(result!.room.deadline!.dueAt).toBe(startTime + 100);
    });
  });

  // ═══ applyPlayerIntent (VAL-RC-045..049) ═══

  describe("applyPlayerIntent", () => {
    it("cached command returns changed:false (VAL-RC-045)", async () => {
      const now = 11_000_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const currentPlayerId = started.room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const snapshot = createPlayerSnapshot(started.room.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "cache-test")!;

      const first = await handle.coordinator.execute(
        currentSession,
        {
          payload: { intent },
          requestId: "cache-test",
          type: "match.intent",
          v: 1,
        },
        now,
      );
      expect(first.changed).toBe(true);

      const second = await handle.coordinator.execute(
        currentSession,
        {
          payload: { intent },
          requestId: "cache-test",
          type: "match.intent",
          v: 1,
        },
        now,
      );
      expect(second.changed).toBe(false);
    });

    it("commandId mismatch rejects (VAL-RC-046)", async () => {
      const now = 11_100_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const currentPlayerId = started.room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const snapshot = createPlayerSnapshot(started.room.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "intent-id")!;

      await expect(
        handle.coordinator.execute(
          currentSession,
          {
            payload: { intent },
            requestId: "different-request-id",
            type: "match.intent",
            v: 1,
          },
          now,
        ),
      ).rejects.toMatchObject({ code: "COMMAND_REJECTED" });
    });

    it("expired deadline rejects (VAL-RC-047)", async () => {
      const now = 11_200_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const currentPlayerId = started.room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;
      const deadline = started.room.deadline!;
      const snapshot = createPlayerSnapshot(started.room.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "expired-test")!;

      const expiredTime = deadline.dueAt;
      await expect(
        handle.coordinator.execute(
          currentSession,
          {
            payload: { intent },
            requestId: "expired-test",
            type: "match.intent",
            v: 1,
          },
          expiredTime,
        ),
      ).rejects.toMatchObject({ code: "COMMAND_REJECTED" });
    });

    it("receipt type conflict rejects (VAL-RC-048)", async () => {
      const now = 11_300_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;
      const currentPlayerId = started.room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;

      // Manually add a command history entry with a conflicting receipt type
      const coreCommandId = `${currentSession.sessionId}:conflict-test`;
      await modifyRoomDirect(handle.repository, roomId, (room) => {
        room.commandHistory.push({
          commandKey: coreCommandId,
          messageType: "match.intent|choose-trump|0|spade",
        });
      });

      // Now submit a different intent type with the same commandId
      const roomBefore = await handle.coordinator.loadRoom(roomId);
      const snapshot = createPlayerSnapshot(roomBefore!.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "conflict-test")!;

      await expect(
        handle.coordinator.execute(
          currentSession,
          {
            payload: { intent },
            requestId: "conflict-test",
            type: "match.intent",
            v: 1,
          },
          now,
        ),
      ).rejects.toMatchObject({ code: "COMMAND_REJECTED" });
    });

    it("success resets consecutiveTimeouts and control (VAL-RC-049)", async () => {
      const now = 11_400_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;
      const currentPlayerId = started.room.match!.currentPlayerId!;
      const currentSession = handle.sessions.get(currentPlayerId)!;

      // Set the current player's consecutiveTimeouts and control via direct manipulation
      await modifyRoomDirect(handle.repository, roomId, (room) => {
        const player = room.players.find((p) => p.playerId === currentPlayerId)!;
        player.consecutiveTimeouts = 1;
        player.control = "ai";
      });

      const roomBefore = await handle.coordinator.loadRoom(roomId);
      const snapshot = createPlayerSnapshot(roomBefore!.match!, currentPlayerId);
      const intent = chooseAiIntent(snapshot, "reset-test")!;

      const result = await handle.coordinator.execute(
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
      const player = result.room.players.find(
        (p) => p.playerId === currentPlayerId,
      )!;
      expect(player.consecutiveTimeouts).toBe(0);
      expect(player.control).toBe("human");
    });
  });

  // ═══ deadlineMatches (VAL-RC-050..053) ═══

  describe("deadlineMatches", () => {
    it("version mismatch returns false — wake re-plans without advancing (VAL-RC-050)", async () => {
      const now = 12_000_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;
      const originalVersion = started.room.match!.version;
      const deadline = started.room.deadline!;

      await modifyRoomDirect(handle.repository, roomId, (room) => {
        room.deadline = {
          ...deadline,
          matchVersion: deadline.matchVersion - 1,
          dueAt: now,
        };
      });

      const result = await handle.coordinator.wake(roomId, now);
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.room.match!.version).toBe(originalVersion);
      expect(result!.room.deadline).not.toBeNull();
      expect(result!.room.deadline!.matchVersion).toBe(originalVersion);
    });

    it("phase mismatch returns false — wake re-plans without advancing (VAL-RC-051)", async () => {
      const now = 12_100_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;
      const originalVersion = started.room.match!.version;
      const deadline = started.room.deadline!;

      await modifyRoomDirect(handle.repository, roomId, (room) => {
        room.deadline = { ...deadline, dueAt: now };
        if (room.match) {
          room.match = { ...room.match, phase: "trick-result" };
        }
      });

      const result = await handle.coordinator.wake(roomId, now);
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.room.match!.version).toBe(originalVersion);
      expect(result!.room.deadline).not.toBeNull();
      expect(result!.room.deadline!.kind).toBe("resolve-trick");
    });

    it("no match returns false — wake is a no-op when match is null (VAL-RC-052)", async () => {
      const now = 12_200_000;
      const handle = await createRoomWithPlayers(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;

      // Set an artificial deadline on a room with no match
      await modifyRoomDirect(handle.repository, roomId, (room) => {
        room.deadline = {
          dueAt: now,
          kind: "turn",
          matchVersion: 1,
          playerId: "fake-player",
        };
      });

      // wake checks !room.match before calling deadlineMatches, so it
      // short-circuits to a no-op (changed: false) when match is null.
      // This is the observable effect of deadlineMatches returning false
      // for a null match — the deadline is left untouched.
      const result = await handle.coordinator.wake(roomId, now);
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(false);
    });

    it("matching version and phase returns true — wake executes the action (VAL-RC-053)", async () => {
      const now = 12_300_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;
      const originalVersion = started.room.match!.version;
      const deadline = started.room.deadline!;

      expect(deadline.matchVersion).toBe(originalVersion);

      const result = await handle.coordinator.wake(roomId, deadline.dueAt);
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.room.match!.version).toBeGreaterThan(originalVersion);
      expect(result!.matchEvents).not.toHaveLength(0);
    });
  });

  // ═══ wake (VAL-RC-060..063) ═══

  describe("wake", () => {
    it("future deadline is a no-op (VAL-RC-060)", async () => {
      const now = 13_000_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const deadline = started.room.deadline!;

      const result = await handle.coordinator.wake(
        handle.roomId,
        deadline.dueAt - 1,
      );
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(false);
    });

    it("stale deadline re-plans without advancing match (VAL-RC-061)", async () => {
      const now = 13_100_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;
      const originalVersion = started.room.match!.version;

      await modifyRoomDirect(handle.repository, roomId, (room) => {
        if (room.deadline) {
          room.deadline = {
            ...room.deadline,
            matchVersion: room.deadline.matchVersion - 1,
            dueAt: now,
          };
        }
      });

      const result = await handle.coordinator.wake(roomId, now);
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.room.match!.version).toBe(originalVersion);
      expect(result!.room.deadline).not.toBeNull();
      expect(result!.room.deadline!.matchVersion).toBe(originalVersion);
    });

    it("consecutive timeout takeover flips control to ai after 2 timeouts (VAL-RC-062)", async () => {
      const now = 13_200_000;
      const { handle, started } = await createStartedRoom(now, 3, FAST_CONFIG);
      const roomId = handle.roomId;
      const currentPlayerId = started.room.match!.currentPlayerId!;
      const deadline = started.room.deadline!;

      await modifyRoomDirect(handle.repository, roomId, (room) => {
        const player = room.players.find((p) => p.playerId === currentPlayerId)!;
        player.consecutiveTimeouts = 1;
        player.control = "human";
      });

      const result = await handle.coordinator.wake(roomId, deadline.dueAt);
      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);

      const player = result!.room.players.find(
        (p) => p.playerId === currentPlayerId,
      );
      expect(player).toBeDefined();
      expect(player!.consecutiveTimeouts).toBe(2);
      expect(player!.control).toBe("ai");
    });

    it("returns null for missing room (VAL-RC-063)", async () => {
      const now = 13_300_000;
      const inner = new MemoryRoomRepository<RoomRecord>(() => now);
      const coordinator = new RoomCoordinator({
        clock: () => now,
        config: FAST_CONFIG,
        repository: inner,
      });
      const host = await coordinator.createRoom(createMessage("Host"));

      await inner.delete(host.grant.roomId);

      const result = await coordinator.wake(host.grant.roomId, now);
      expect(result).toBeNull();
    });
  });

  // ═══ duplicate room commands (VAL-RC-064..065) ═══

  describe("duplicate room commands", () => {
    it("re-submitting same command with matching receipt returns changed:false (VAL-RC-064)", async () => {
      const now = 14_000_000;
      const handle = await createRoomWithPlayers(now, 3, FAST_CONFIG);

      const first = await handle.coordinator.execute(
        handle.host.session,
        readyMessage("dup-ready"),
        now,
      );
      expect(first.changed).toBe(true);

      const second = await handle.coordinator.execute(
        handle.host.session,
        readyMessage("dup-ready"),
        now,
      );
      expect(second.changed).toBe(false);
      expect(second.ackCommandId).toBe("dup-ready");
    });

    it("re-submitting same requestId with conflicting type rejects (VAL-RC-065)", async () => {
      const now = 14_100_000;
      const handle = await createRoomWithPlayers(now, 3, FAST_CONFIG);

      const first = await handle.coordinator.execute(
        handle.host.session,
        readyMessage("shared-id"),
        now,
      );
      expect(first.changed).toBe(true);

      await expect(
        handle.coordinator.execute(
          handle.host.session,
          leaveMessage("shared-id"),
          now,
        ),
      ).rejects.toMatchObject({ code: "COMMAND_REJECTED" });
    });
  });
});
