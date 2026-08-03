import { describe, expect, it } from "vitest";
import { MemoryRoomRepository } from "../src/persistence/index.js";
import type { RevisionedRoom } from "../src/persistence/index.js";

type TestRoom = RevisionedRoom & {
  nested: { players: string[] };
};

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

describe("MemoryRoomRepository", () => {
  it("isolates callers from stored state with structured clones", async () => {
    const repository = new MemoryRoomRepository<TestRoom>(() => 1_000);
    const original = room();

    expect(await repository.create(original)).toBe(true);
    original.nested.players.push("outside-write");
    const firstRead = await repository.loadById(original.id);
    expect(firstRead?.nested.players).toEqual(["player-1"]);

    firstRead?.nested.players.push("read-write");
    expect((await repository.loadById(original.id))?.nested.players).toEqual([
      "player-1",
    ]);
  });

  it("updates records only through the expected revision", async () => {
    const repository = new MemoryRoomRepository<TestRoom>(() => 1_000);
    await repository.create(room());

    expect(
      await repository.compareAndSwap(room({ revision: 1 }), 9),
    ).toBe("conflict");
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

  it("enforces unique room, code, and invite indexes", async () => {
    const repository = new MemoryRoomRepository<TestRoom>(() => 1_000);
    expect(await repository.create(room())).toBe(true);
    expect(await repository.create(room())).toBe(false);
    expect(await repository.create(room({ id: "room-2" }))).toBe(false);
    expect(
      await repository.create(
        room({ code: "XYZ789", id: "room-2", inviteTokenHash: "invite-hash-1" }),
      ),
    ).toBe(false);
  });

  it("expires rooms and releases every index", async () => {
    let now = 1_000;
    const repository = new MemoryRoomRepository<TestRoom>(() => now);
    await repository.create(room({ expiresAt: 2_000 }));
    now = 2_000;

    expect(await repository.loadById("room-1")).toBeNull();
    expect(await repository.loadByCode("ABC234")).toBeNull();
    expect(
      await repository.create(
        room({ expiresAt: 4_000, id: "room-2" }),
      ),
    ).toBe(true);
    expect(repository.sweepExpired(4_000)).toBe(1);
  });

  it("deletes a room and its indexes", async () => {
    const repository = new MemoryRoomRepository<TestRoom>(() => 1_000);
    await repository.create(room());
    await repository.delete("room-1");

    expect(await repository.loadById("room-1")).toBeNull();
    expect(await repository.loadByCode("ABC234")).toBeNull();
    expect(await repository.loadByInviteHash("invite-hash-1")).toBeNull();
  });
});
