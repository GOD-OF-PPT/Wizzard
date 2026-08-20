import { describe, expect, it } from "vitest";
import {
  createJsonRoomCodec,
  isRevisionedRoom,
  RedisRoomRepository,
} from "../src/persistence/index.js";
import type {
  RedisClientLike,
  RedisEvalOptions,
  RevisionedRoom,
} from "../src/persistence/index.js";

type TestRoom = RevisionedRoom & {
  nested: { players: string[] };
};

function isTestRoom(value: unknown): value is TestRoom {
  if (!isRevisionedRoom(value)) {
    return false;
  }

  const nested = (value as { nested?: unknown }).nested;
  return (
    typeof nested === "object" &&
    nested !== null &&
    Array.isArray((nested as { players?: unknown }).players) &&
    (nested as { players: unknown[] }).players.every(
      (player) => typeof player === "string",
    )
  );
}

function room(overrides: Partial<TestRoom> = {}): TestRoom {
  return {
    code: "ABC234",
    expiresAt: 11_000,
    id: "room-1",
    inviteTokenHash: "invite-hash-1",
    nested: { players: ["player-1"] },
    revision: 0,
    ...overrides,
  };
}

class FakeRedisClient implements RedisClientLike {
  private readonly values = new Map<string, string>();

  public async eval(
    script: string,
    options: RedisEvalOptions,
  ): Promise<unknown> {
    const { arguments: args, keys } = options;

    if (script.startsWith("-- wizzard:create-room-v1")) {
      if (keys.some((key) => this.values.has(key))) {
        return 0;
      }

      this.values.set(keys[0], args[0]);
      this.values.set(keys[1], args[2]);
      this.values.set(keys[2], args[2]);
      return 1;
    }

    if (script.startsWith("-- wizzard:cas-room-v1")) {
      const serialized = this.values.get(keys[0]);

      if (!serialized) {
        return -1;
      }

      const current = JSON.parse(serialized) as TestRoom;

      if (current.id !== args[3] || current.revision !== Number(args[1])) {
        return 0;
      }

      const codeOwner = this.values.get(keys[3]);
      const inviteOwner = this.values.get(keys[4]);

      if (
        (codeOwner !== undefined && codeOwner !== args[3]) ||
        (inviteOwner !== undefined && inviteOwner !== args[3])
      ) {
        return 0;
      }

      this.values.set(keys[0], args[0]);

      if (keys[1] !== keys[3] && this.values.get(keys[1]) === args[3]) {
        this.values.delete(keys[1]);
      }

      if (keys[2] !== keys[4] && this.values.get(keys[2]) === args[3]) {
        this.values.delete(keys[2]);
      }

      this.values.set(keys[3], args[3]);
      this.values.set(keys[4], args[3]);
      return 1;
    }

    if (script.startsWith("-- wizzard:delete-room-v1")) {
      const serialized = this.values.get(keys[0]);

      if (!serialized) {
        return 1;
      }

      const current = JSON.parse(serialized) as TestRoom;

      if (current.id !== args[1] || current.revision !== Number(args[0])) {
        return 0;
      }

      this.values.delete(keys[0]);

      if (this.values.get(keys[1]) === args[1]) {
        this.values.delete(keys[1]);
      }

      if (this.values.get(keys[2]) === args[1]) {
        this.values.delete(keys[2]);
      }

      return 1;
    }

    if (script.startsWith("-- wizzard:clean-room-index-v1")) {
      if (this.values.get(keys[0]) === args[0]) {
        return this.values.delete(keys[0]) ? 1 : 0;
      }

      return 0;
    }

    throw new Error("UNRECOGNIZED_REDIS_SCRIPT");
  }

  public async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  public async scanKeys(pattern: string): Promise<string[]> {
    const prefix = pattern.replace(/\*$/, "");
    return [...this.values.keys()].filter((key) => key.startsWith(prefix));
  }

  public replaceRoomJson(id: string, serialized: string): void {
    const key = [...this.values.keys()].find((candidate) =>
      candidate.endsWith(`:room:${encodeURIComponent(id)}`),
    );

    if (!key) {
      throw new Error("ROOM_KEY_NOT_FOUND");
    }

    this.values.set(key, serialized);
  }
}

describe("RedisRoomRepository", () => {
  it("creates and resolves rooms through id, code, and invite indexes", async () => {
    const client = new FakeRedisClient();
    const repository = new RedisRoomRepository<TestRoom>(client, {
      codec: createJsonRoomCodec(isTestRoom),
      now: () => 1_000,
    });

    expect(await repository.create(room())).toBe(true);
    expect(await repository.create(room())).toBe(false);
    expect((await repository.loadById("room-1"))?.nested.players).toEqual([
      "player-1",
    ]);
    expect((await repository.loadByCode("ABC234"))?.id).toBe("room-1");
    expect((await repository.loadByInviteHash("invite-hash-1"))?.id).toBe(
      "room-1",
    );
  });

  it("uses revision CAS while atomically rotating secondary indexes", async () => {
    const client = new FakeRedisClient();
    const repository = new RedisRoomRepository<TestRoom>(client, {
      codec: createJsonRoomCodec(isTestRoom),
      now: () => 1_000,
    });
    await repository.create(room());

    expect(await repository.compareAndSwap(room({ revision: 1 }), 4)).toBe(
      "conflict",
    );
    expect(
      await repository.compareAndSwap(
        room({
          code: "XYZ789",
          inviteTokenHash: "invite-hash-2",
          revision: 1,
        }),
        0,
      ),
    ).toBe("saved");
    expect(await repository.loadByCode("ABC234")).toBeNull();
    expect((await repository.loadByCode("XYZ789"))?.revision).toBe(1);
    expect(await repository.loadByInviteHash("invite-hash-1")).toBeNull();
    expect((await repository.loadByInviteHash("invite-hash-2"))?.id).toBe(
      "room-1",
    );
  });

  it("removes expired records and their secondary indexes", async () => {
    let now = 1_000;
    const client = new FakeRedisClient();
    const repository = new RedisRoomRepository<TestRoom>(client, {
      codec: createJsonRoomCodec(isTestRoom),
      now: () => now,
    });
    await repository.create(room({ expiresAt: 2_000 }));
    now = 2_000;

    expect(await repository.loadById("room-1")).toBeNull();
    expect(await repository.loadByCode("ABC234")).toBeNull();
    expect(await repository.loadByInviteHash("invite-hash-1")).toBeNull();
  });

  it("deletes the record and both indexes with a revision guard", async () => {
    const client = new FakeRedisClient();
    const repository = new RedisRoomRepository<TestRoom>(client, {
      codec: createJsonRoomCodec(isTestRoom),
      now: () => 1_000,
    });
    await repository.create(room());
    await repository.delete("room-1");

    expect(await repository.loadById("room-1")).toBeNull();
    expect(await repository.loadByCode("ABC234")).toBeNull();
    expect(await repository.loadByInviteHash("invite-hash-1")).toBeNull();
  });

  it("rejects malformed, oversized, and prototype-bearing JSON", async () => {
    const codec = createJsonRoomCodec(isTestRoom, { maxJsonCharacters: 300 });
    const client = new FakeRedisClient();
    const repository = new RedisRoomRepository<TestRoom>(client, {
      codec,
      now: () => 1_000,
    });
    await repository.create(room());

    client.replaceRoomJson(
      "room-1",
      '{"id":"room-1","code":"ABC234","inviteTokenHash":"h","revision":0,"expiresAt":11000,"nested":{"players":[]},"__proto__":{"polluted":true}}',
    );
    expect(await repository.loadById("room-1")).toBeNull();
    expect(codec.decode("{".repeat(301))).toBeNull();
  });
});
