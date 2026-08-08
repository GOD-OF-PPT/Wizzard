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
