import type {
  Clock,
  RevisionedRoom,
  RoomRepository,
  SaveRoomResult,
} from "./types.js";

function cloneRoom<TRoom>(room: TRoom): TRoom {
  const clone = (
    globalThis as typeof globalThis & {
      structuredClone<TValue>(value: TValue): TValue;
    }
  ).structuredClone;

  if (typeof clone !== "function") {
    throw new Error("STRUCTURED_CLONE_NOT_AVAILABLE");
  }

  return clone(room);
}

export class MemoryRoomRepository<TRoom extends RevisionedRoom>
  implements RoomRepository<TRoom>
{
  private readonly codeIndex = new Map<string, string>();
  private readonly inviteIndex = new Map<string, string>();
  private readonly rooms = new Map<string, TRoom>();

  public constructor(private readonly now: Clock = Date.now) {}

  public async compareAndSwap(
    room: TRoom,
    expectedRevision: number,
  ): Promise<SaveRoomResult> {
    const current = this.getCurrent(room.id);

    if (!current) {
      return "missing";
    }

    if (
      current.revision !== expectedRevision ||
      room.revision !== expectedRevision + 1
    ) {
      return "conflict";
    }

    if (room.expiresAt <= this.now()) {
      return "conflict";
    }

    this.pruneIndexedOwner(this.codeIndex, room.code);
    this.pruneIndexedOwner(this.inviteIndex, room.inviteTokenHash);
    const codeOwner = this.codeIndex.get(room.code);
    const inviteOwner = this.inviteIndex.get(room.inviteTokenHash);

    if (
      (codeOwner !== undefined && codeOwner !== room.id) ||
      (inviteOwner !== undefined && inviteOwner !== room.id)
    ) {
      return "conflict";
    }

    this.removeIndexes(current);
    const stored = cloneRoom(room);
    this.rooms.set(stored.id, stored);
    this.addIndexes(stored);
    return "saved";
  }

  public async create(room: TRoom): Promise<boolean> {
    this.pruneRoom(room.id);
    this.pruneIndexedOwner(this.codeIndex, room.code);
    this.pruneIndexedOwner(this.inviteIndex, room.inviteTokenHash);

    if (
      room.expiresAt <= this.now() ||
      this.rooms.has(room.id) ||
      this.codeIndex.has(room.code) ||
      this.inviteIndex.has(room.inviteTokenHash)
    ) {
      return false;
    }

    const stored = cloneRoom(room);
    this.rooms.set(stored.id, stored);
    this.addIndexes(stored);
    return true;
  }

  public async delete(id: string): Promise<void> {
    const current = this.rooms.get(id);

    if (!current) {
      return;
    }

    this.rooms.delete(id);
    this.removeIndexes(current);
  }

  public async loadByCode(code: string): Promise<TRoom | null> {
    return this.loadIndexed(this.codeIndex, code, (room) => room.code);
  }

  public async loadById(id: string): Promise<TRoom | null> {
    const current = this.getCurrent(id);
    return current ? cloneRoom(current) : null;
  }

  public async loadByInviteHash(
    inviteTokenHash: string,
  ): Promise<TRoom | null> {
    return this.loadIndexed(
      this.inviteIndex,
      inviteTokenHash,
      (room) => room.inviteTokenHash,
    );
  }

  public sweepExpired(now = this.now()): number {
    let removed = 0;

    for (const [id, room] of this.rooms) {
      if (room.expiresAt <= now) {
        this.rooms.delete(id);
        this.removeIndexes(room);
        removed += 1;
      }
    }

    return removed;
  }

  private addIndexes(room: TRoom): void {
    this.codeIndex.set(room.code, room.id);
    this.inviteIndex.set(room.inviteTokenHash, room.id);
  }

  private getCurrent(id: string): TRoom | null {
    this.pruneRoom(id);
    return this.rooms.get(id) ?? null;
  }

  private async loadIndexed(
    index: Map<string, string>,
    key: string,
    selectKey: (room: TRoom) => string,
  ): Promise<TRoom | null> {
    const id = index.get(key);

    if (!id) {
      return null;
    }

    const room = this.getCurrent(id);

    if (!room || selectKey(room) !== key) {
      index.delete(key);
      return null;
    }

    return cloneRoom(room);
  }

  private pruneRoom(id: string): void {
    const room = this.rooms.get(id);

    if (room && room.expiresAt <= this.now()) {
      this.rooms.delete(id);
      this.removeIndexes(room);
    }
  }

  private pruneIndexedOwner(index: Map<string, string>, key: string): void {
    const ownerId = index.get(key);

    if (ownerId) {
      this.pruneRoom(ownerId);
    }
  }

  private removeIndexes(room: TRoom): void {
    if (this.codeIndex.get(room.code) === room.id) {
      this.codeIndex.delete(room.code);
    }

    if (this.inviteIndex.get(room.inviteTokenHash) === room.id) {
      this.inviteIndex.delete(room.inviteTokenHash);
    }
  }
}
