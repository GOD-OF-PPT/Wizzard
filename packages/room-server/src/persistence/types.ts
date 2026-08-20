export type RevisionedRoom = {
  code: string;
  expiresAt: number;
  id: string;
  inviteTokenHash: string;
  revision: number;
};

export type SaveRoomResult = "conflict" | "missing" | "saved";

export interface RoomRepository<TRoom extends RevisionedRoom> {
  compareAndSwap(
    room: TRoom,
    expectedRevision: number,
  ): Promise<SaveRoomResult>;
  countActive(now: number): Promise<number>;
  create(room: TRoom): Promise<boolean>;
  delete(id: string): Promise<void>;
  loadByCode(code: string): Promise<TRoom | null>;
  loadById(id: string): Promise<TRoom | null>;
  loadByInviteHash(inviteTokenHash: string): Promise<TRoom | null>;
  sweepExpired(now: number): Promise<number>;
}

export type RoomRecordGuard<TRoom extends RevisionedRoom> = (
  value: unknown,
) => value is TRoom;

export interface RoomCodec<TRoom extends RevisionedRoom> {
  decode(serialized: string): TRoom | null;
  encode(room: TRoom): string;
}

export type Clock = () => number;
