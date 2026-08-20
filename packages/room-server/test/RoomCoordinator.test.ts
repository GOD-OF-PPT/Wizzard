import { chooseAiIntent } from "@wizzard/game-core";
import { createPlayerSnapshot } from "@wizzard/game-core/authority";
import { describe, expect, it } from "vitest";
import {
  RoomCoordinator,
  type BoundRoomSession,
  type RoomRecord,
} from "../src/index.js";
import { MemoryRoomRepository } from "../src/persistence/index.js";

function createMessage(name: string) {
  return {
    payload: {
      avatarKey: "bamboo-cat" as const,
      displayName: name,
      maxPlayers: 3 as const,
      mode: "quick" as const,
      turnTimerEnabled: true,
    },
    requestId: `create-${name}`,
    type: "room.create" as const,
    v: 1 as const,
  };
}

function readyMessage(requestId: string) {
  return {
    payload: { ready: true },
    requestId,
    type: "room.set-ready" as const,
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

describe("RoomCoordinator", () => {
  it("lets the host add and remove lobby AI only after two humans join", async () => {
    const now = 1_400_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom({
      ...createMessage("Host"),
      payload: { ...createMessage("Host").payload, maxPlayers: 6 },
    });

    await expect(
      coordinator.execute(
        host.session,
        {
          payload: { aiCount: 1 },
          requestId: "ai-before-second-human",
          type: "room.set-ai-count",
          v: 1,
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "NOT_ENOUGH_PLAYERS" });

    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "Second",
    );
    await expect(
      coordinator.execute(
        second.session,
        {
          payload: { aiCount: 1 },
          requestId: "guest-ai-count",
          type: "room.set-ai-count",
          v: 1,
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "NOT_HOST" });

    const filled = await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 4 },
        requestId: "host-add-four-ai",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );
    expect(filled.room.players.filter((player) => player.isAi)).toHaveLength(4);
    expect(filled.room.players).toHaveLength(6);

    const reduced = await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 1 },
        requestId: "host-remove-three-ai",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );
    expect(reduced.room.players.filter((player) => player.isAi)).toHaveLength(1);
    expect(reduced.room.players.filter((player) => !player.isAi)).toHaveLength(2);
  });

  it("lets a joining human replace a lobby AI when every seat is occupied", async () => {
    const now = 1_450_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom(createMessage("Host"), now);
    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "Second",
    );
    await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 1 },
        requestId: "fill-final-seat-with-ai",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );

    const third = await join(
      coordinator,
      host.grant.inviteToken!,
      "Third",
    );

    expect(third.room.players).toHaveLength(3);
    expect(third.room.players.filter((player) => player.isAi)).toHaveLength(0);
    expect(third.room.players.map((player) => player.name)).toContain("Third");
    expect(third.room.players.map((player) => player.playerId)).toContain(
      second.session.playerId,
    );
  });

  it("replays the same full-lobby join without replacing another AI", async () => {
    const now = 1_460_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom({
      ...createMessage("Host"),
      payload: { ...createMessage("Host").payload, maxPlayers: 6 },
    });
    await join(coordinator, host.grant.inviteToken!, "Second");
    await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 4 },
        requestId: "fill-lobby-before-retried-join",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );
    const message = {
      payload: {
        avatarKey: "flower-fox" as const,
        displayName: "Retrying",
        inviteToken: host.grant.inviteToken!,
      },
      requestId: "same-full-lobby-join",
      type: "room.join" as const,
      v: 1 as const,
    };

    const first = await coordinator.joinRoom(message, now);
    const restartedCoordinator = new RoomCoordinator({
      clock: () => now,
      repository,
    });
    const replayed = await restartedCoordinator.joinRoom(message, now);

    expect(replayed.session.playerId).toBe(first.session.playerId);
    expect(replayed.session.sessionId).toBe(first.session.sessionId);
    expect(replayed.session.generation).toBe(first.session.generation + 1);
    expect(replayed.grant.resumeToken).not.toBe(first.grant.resumeToken);
    expect(replayed.room.players).toHaveLength(6);
    expect(
      replayed.room.players.filter((player) => player.name === "Retrying"),
    ).toHaveLength(1);
    expect(replayed.room.players.filter((player) => player.isAi)).toHaveLength(3);
    await expect(
      restartedCoordinator.execute(
        first.session,
        readyMessage("stale-join-session"),
        now,
      ),
    ).rejects.toMatchObject({ code: "SESSION_NOT_FOUND" });
    await expect(
      restartedCoordinator.execute(
        replayed.session,
        readyMessage("replayed-join-session"),
        now,
      ),
    ).resolves.toMatchObject({ changed: true });
  });

  it("rejects a reused join request id with a different payload", async () => {
    const now = 1_470_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom({
      ...createMessage("Host"),
      payload: { ...createMessage("Host").payload, maxPlayers: 6 },
    });
    await join(coordinator, host.grant.inviteToken!, "Second");
    await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 4 },
        requestId: "fill-before-conflicting-join",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );
    const message = {
      payload: {
        avatarKey: "flower-fox" as const,
        displayName: "Original",
        inviteToken: host.grant.inviteToken!,
      },
      requestId: "conflicting-full-lobby-join",
      type: "room.join" as const,
      v: 1 as const,
    };
    const joined = await coordinator.joinRoom(message, now);

    await expect(
      coordinator.joinRoom(
        {
          ...message,
          payload: { ...message.payload, displayName: "Changed" },
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "COMMAND_REJECTED" });

    const room = await coordinator.loadRoom(host.grant.roomId);
    expect(room?.players).toHaveLength(6);
    expect(room?.players.filter((player) => player.isAi)).toHaveLength(3);
    expect(
      room?.players.filter((player) => player.playerId === joined.session.playerId),
    ).toHaveLength(1);
    expect(room?.players.some((player) => player.name === "Changed")).toBe(false);
  });

  it("starts a full room with pre-added AI without requesting another fill", async () => {
    const now = 1_475_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom(createMessage("Host"), now);
    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "Second",
    );
    const withAi = await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 1 },
        requestId: "pre-add-start-ai",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );
    const aiPlayerId = withAi.room.players.find((player) => player.isAi)!
      .playerId;
    await coordinator.execute(
      host.session,
      readyMessage("pre-add-host-ready"),
      now,
    );
    await coordinator.execute(
      second.session,
      readyMessage("pre-add-second-ready"),
      now,
    );

    const started = await coordinator.execute(
      host.session,
      {
        payload: { fillWithAi: false },
        requestId: "start-with-pre-added-ai",
        type: "room.start",
        v: 1,
      },
      now,
    );

    expect(started.room.lifecycle).toBe("playing");
    expect(started.room.players.find((player) => player.playerId === aiPlayerId))
      .toMatchObject({ isAi: true });
    expect(started.room.match?.players.find((player) => player.id === aiPlayerId))
      .toMatchObject({ isHuman: false });
    await expect(
      coordinator.execute(
        host.session,
        {
          payload: { aiCount: 0 },
          requestId: "remove-ai-after-start",
          type: "room.set-ai-count",
          v: 1,
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "WRONG_ROOM_PHASE" });
  });

  it("preserves pre-added AI while filling only the remaining seats at start", async () => {
    const now = 1_480_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom({
      ...createMessage("Host"),
      payload: { ...createMessage("Host").payload, maxPlayers: 6 },
    });
    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "Second",
    );
    const prefilled = await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 2 },
        requestId: "pre-add-partial-ai-roster",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );
    const prefilledAiIds = prefilled.room.players
      .filter((player) => player.isAi)
      .map((player) => player.playerId);
    await coordinator.execute(
      host.session,
      readyMessage("partial-ai-host-ready"),
      now,
    );
    await coordinator.execute(
      second.session,
      readyMessage("partial-ai-second-ready"),
      now,
    );

    const started = await coordinator.execute(
      host.session,
      {
        payload: { fillWithAi: true },
        requestId: "start-and-fill-partial-ai-roster",
        type: "room.start",
        v: 1,
      },
      now,
    );
    const startedAiIds = started.room.players
      .filter((player) => player.isAi)
      .map((player) => player.playerId);
    expect(started.room.players).toHaveLength(6);
    expect(startedAiIds).toHaveLength(4);
    expect(startedAiIds).toEqual(expect.arrayContaining(prefilledAiIds));
  });

  it("reconciles an absolute AI count deterministically and idempotently", async () => {
    const now = 1_490_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom({
      ...createMessage("Host"),
      payload: { ...createMessage("Host").payload, maxPlayers: 6 },
    });
    await join(coordinator, host.grant.inviteToken!, "Second");
    const message = {
      payload: { aiCount: 4 },
      requestId: "absolute-ai-count",
      type: "room.set-ai-count" as const,
      v: 1 as const,
    };
    const filled = await coordinator.execute(host.session, message, now);
    const initialAiIds = filled.room.players
      .filter((player) => player.isAi)
      .map((player) => player.playerId);

    const duplicate = await coordinator.execute(host.session, message, now);
    expect(duplicate.changed).toBe(false);
    expect(
      duplicate.room.players
        .filter((player) => player.isAi)
        .map((player) => player.playerId),
    ).toEqual(initialAiIds);
    await expect(
      coordinator.execute(
        host.session,
        { ...message, payload: { aiCount: 3 } },
        now,
      ),
    ).rejects.toMatchObject({ code: "COMMAND_REJECTED" });

    const reduced = await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 2 },
        requestId: "reduce-absolute-ai-count",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );
    expect(
      reduced.room.players
        .filter((player) => player.isAi)
        .map((player) => player.seatIndex),
    ).toEqual([2, 3]);
    expect(reduced.room.randomState).toEqual(filled.room.randomState);
  });

  it("lets the host remove lobby AI after the second human leaves", async () => {
    const now = 1_495_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom(createMessage("Host"), now);
    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "Second",
    );
    await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 1 },
        requestId: "add-ai-before-human-leaves",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );
    await coordinator.execute(
      second.session,
      {
        payload: {},
        requestId: "second-leaves-ai-lobby",
        type: "room.leave",
        v: 1,
      },
      now,
    );

    const cleared = await coordinator.execute(
      host.session,
      {
        payload: { aiCount: 0 },
        requestId: "clear-ai-after-human-leaves",
        type: "room.set-ai-count",
        v: 1,
      },
      now,
    );
    expect(cleared.room.players).toHaveLength(1);
    expect(cleared.room.players[0].playerId).toBe(host.session.playerId);
  });

  it("requires two real players before AI fills the remaining seats", async () => {
    const now = 1_500_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom(createMessage("Host"), now);
    await coordinator.execute(
      host.session,
      readyMessage("ready-host-for-ai"),
      now,
    );

    await expect(
      coordinator.execute(
        host.session,
        {
          payload: { fillWithAi: true },
          requestId: "start-with-only-one-human",
          type: "room.start",
          v: 1,
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "NOT_ENOUGH_PLAYERS" });

    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "Second",
    );
    await coordinator.execute(
      second.session,
      readyMessage("ready-second-for-ai"),
      now,
    );
    const started = await coordinator.execute(
      host.session,
      {
        payload: { fillWithAi: true },
        requestId: "start-with-two-humans",
        type: "room.start",
        v: 1,
      },
      now,
    );

    expect(started.room.players.filter((player) => !player.isAi)).toHaveLength(
      2,
    );
    expect(started.room.players.filter((player) => player.isAi)).toHaveLength(
      1,
    );
    expect(started.room.lifecycle).toBe("playing");
  });

  it("does not count a disconnected ready player toward the human minimum", async () => {
    const now = 1_600_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom(createMessage("Host"), now);
    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "Second",
    );
    await coordinator.execute(
      host.session,
      readyMessage("ready-host-before-disconnect"),
      now,
    );
    await coordinator.execute(
      second.session,
      readyMessage("ready-second-before-disconnect"),
      now,
    );
    await coordinator.disconnect(second.session, now);

    await expect(
      coordinator.execute(
        host.session,
        {
          payload: { fillWithAi: true },
          requestId: "start-with-disconnected-second-human",
          type: "room.start",
          v: 1,
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "NOT_ENOUGH_PLAYERS" });
  });

  it("isolates equal client command ids by authenticated session", async () => {
    const now = 2_000_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({ clock: () => now, repository });
    const host = await coordinator.createRoom(createMessage("Host"), now);
    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "Second",
    );
    const third = await join(
      coordinator,
      host.grant.inviteToken!,
      "Third",
    );
    const members = [host, second, third];
    const sessions = new Map<string, BoundRoomSession>(
      members.map((member) => [member.session.playerId, member.session]),
    );
    for (const member of members) {
      await coordinator.execute(
        member.session,
        readyMessage(`ready-${member.session.playerId}`),
        now,
      );
    }

    let room = (
      await coordinator.execute(
        host.session,
        {
          payload: { fillWithAi: false },
          requestId: "start-three",
          type: "room.start",
          v: 1,
        },
        now,
      )
    ).room;
    const firstPlayerId = room.match!.currentPlayerId!;
    const firstSession = sessions.get(firstPlayerId)!;
    const firstIntent = chooseAiIntent(
      createPlayerSnapshot(room.match!, firstPlayerId),
      "same-command",
    )!;
    const first = await coordinator.execute(
      firstSession,
      {
        payload: { intent: firstIntent },
        requestId: "same-command",
        type: "match.intent",
        v: 1,
      },
      now,
    );
    expect(first.matchEvents.some((event) => event.type === "intent-rejected"))
      .toBe(false);
    room = first.room;

    const secondPlayerId = room.match!.currentPlayerId!;
    expect(secondPlayerId).not.toBe(firstPlayerId);
    const secondSession = sessions.get(secondPlayerId)!;
    const secondIntent = chooseAiIntent(
      createPlayerSnapshot(room.match!, secondPlayerId),
      "same-command",
    )!;
    const secondResult = await coordinator.execute(
      secondSession,
      {
        payload: { intent: secondIntent },
        requestId: "same-command",
        type: "match.intent",
        v: 1,
      },
      now,
    );
    expect(secondResult.changed).toBe(true);
    expect(
      secondResult.matchEvents.some((event) => event.type === "intent-rejected"),
    ).toBe(false);

    await expect(
      coordinator.execute(
        firstSession,
        {
          payload: {
            intent: {
              ...firstIntent,
              expectedVersion: secondResult.room.match!.version,
            },
          },
          requestId: "same-command",
          type: "match.intent",
          v: 1,
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "COMMAND_REJECTED" });
  });

  it("keeps legacy rooms timed and lets new rooms disable human turn deadlines", async () => {
    const now = 2_900_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({
      clock: () => now,
      config: { aiActionDelayMs: 25, turnTimeoutMs: 100 },
      repository,
    });
    const legacyMessage = createMessage("Legacy");
    const {
      turnTimerEnabled: _legacyTimer,
      ...legacyPayload
    } = legacyMessage.payload;
    const legacy = await coordinator.createRoom({
      ...legacyMessage,
      payload: legacyPayload,
    });
    expect(legacy.room.turnTimerEnabled).toBe(true);

    const host = await coordinator.createRoom({
      ...createMessage("NoTimerHost"),
      payload: {
        ...createMessage("NoTimerHost").payload,
        turnTimerEnabled: false,
      },
    });
    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "NoTimerSecond",
    );
    const third = await join(
      coordinator,
      host.grant.inviteToken!,
      "NoTimerThird",
    );
    const members = [host, second, third];
    const sessions = new Map<string, BoundRoomSession>(
      members.map((member) => [member.session.playerId, member.session]),
    );
    for (const member of members) {
      await coordinator.execute(
        member.session,
        readyMessage(`no-timer-ready-${member.session.playerId}`),
        now,
      );
    }

    const started = await coordinator.execute(
      host.session,
      {
        payload: { fillWithAi: false },
        requestId: "start-without-turn-timer",
        type: "room.start",
        v: 1,
      },
      now,
    );
    expect(started.room.turnTimerEnabled).toBe(false);
    expect(started.room.deadline).toBeNull();

    const currentPlayerId = started.room.match!.currentPlayerId!;
    const departed = await coordinator.execute(
      sessions.get(currentPlayerId)!,
      {
        payload: {},
        requestId: "current-player-leaves-no-timer-room",
        type: "room.leave",
        v: 1,
      },
      now,
    );
    expect(departed.room.deadline).toMatchObject({
      dueAt: now + 25,
      kind: "turn",
      playerId: currentPlayerId,
    });
  });

  it("uses a hidden reconnect grace when the current player disconnects from a no-timer room", async () => {
    const startTime = 2_950_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => startTime);
    const coordinator = new RoomCoordinator({
      clock: () => startTime,
      config: { aiActionDelayMs: 25, turnTimeoutMs: 100 },
      repository,
    });
    const host = await coordinator.createRoom({
      ...createMessage("GraceHost"),
      payload: {
        ...createMessage("GraceHost").payload,
        turnTimerEnabled: false,
      },
    });
    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "GraceSecond",
    );
    const third = await join(
      coordinator,
      host.grant.inviteToken!,
      "GraceThird",
    );
    const members = [host, second, third];
    for (const member of members) {
      await coordinator.execute(
        member.session,
        readyMessage(`grace-ready-${member.session.playerId}`),
        startTime,
      );
    }

    const started = await coordinator.execute(
      host.session,
      {
        payload: { fillWithAi: false },
        requestId: "start-reconnect-grace-room",
        type: "room.start",
        v: 1,
      },
      startTime,
    );
    const currentPlayerId = started.room.match!.currentPlayerId!;
    const currentMember = members.find(
      (member) => member.session.playerId === currentPlayerId,
    )!;

    const disconnected = await coordinator.disconnect(
      currentMember.session,
      startTime,
    );
    expect(disconnected!.room.deadline).toMatchObject({
      dueAt: startTime + 100,
      kind: "turn",
      playerId: currentPlayerId,
    });
    const resumed = await coordinator.resumeSession(
      {
        payload: { resumeToken: currentMember.grant.resumeToken },
        requestId: "resume-within-hidden-grace",
        type: "session.resume",
        v: 1,
      },
      startTime + 50,
    );
    expect(resumed.room.deadline).toBeNull();

    const disconnectedAgain = await coordinator.disconnect(
      resumed.session,
      startTime + 50,
    );
    expect(disconnectedAgain!.room.deadline?.dueAt).toBe(startTime + 150);

    const advanced = await coordinator.wake(
      resumed.room.id,
      startTime + 150,
    );
    expect(advanced!.room.match!.version).toBeGreaterThan(
      disconnectedAgain!.room.match!.version,
    );
  });

  it("advances an expired authoritative deadline only once", async () => {
    let now = 3_000_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({
      clock: () => now,
      config: { aiActionDelayMs: 25, turnTimeoutMs: 100 },
      repository,
    });
    const host = await coordinator.createRoom(createMessage("Host"), now);
    const second = await join(
      coordinator,
      host.grant.inviteToken!,
      "Second",
    );
    const third = await join(
      coordinator,
      host.grant.inviteToken!,
      "Third",
    );
    const members = [host, second, third];
    const sessions = new Map<string, BoundRoomSession>(
      members.map((member) => [member.session.playerId, member.session]),
    );
    for (const member of members) {
      await coordinator.execute(
        member.session,
        readyMessage(`deadline-ready-${member.session.playerId}`),
        now,
      );
    }
    const started = await coordinator.execute(
      host.session,
      {
        payload: { fillWithAi: false },
        requestId: "start-with-ai",
        type: "room.start",
        v: 1,
      },
      now,
    );
    const initialVersion = started.room.match!.version;
    now = started.room.deadline!.dueAt;
    const expiredPlayerId = started.room.match!.currentPlayerId!;
    const expiredIntent = chooseAiIntent(
      createPlayerSnapshot(started.room.match!, expiredPlayerId),
      "expired-command",
    )!;
    await expect(
      coordinator.execute(
        sessions.get(expiredPlayerId)!,
        {
          payload: { intent: expiredIntent },
          requestId: "expired-command",
          type: "match.intent",
          v: 1,
        },
        now,
      ),
    ).rejects.toMatchObject({ code: "COMMAND_REJECTED" });

    const advanced = await coordinator.wake(started.room.id, now);
    expect(advanced?.changed).toBe(true);
    expect(advanced?.room.match!.version).toBe(initialVersion + 1);
    expect(advanced?.matchEvents).not.toHaveLength(0);

    const duplicateWake = await coordinator.wake(started.room.id, now);
    expect(duplicateWake?.changed).toBe(false);
    expect(duplicateWake?.room.match!.version).toBe(initialVersion + 1);
  });
});
