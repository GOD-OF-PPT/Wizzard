import {
  createJsonRoomCodec,
  isRevisionedRoom,
} from "./JsonRoomCodec.js";
import type {
  Clock,
  RevisionedRoom,
  RoomCodec,
  RoomRepository,
  SaveRoomResult,
} from "./types.js";

const CREATE_ROOM_SCRIPT = `-- wizzard:create-room-v1
if redis.call("EXISTS", KEYS[1]) == 1
  or redis.call("EXISTS", KEYS[2]) == 1
  or redis.call("EXISTS", KEYS[3]) == 1 then
  return 0
end
redis.call("SET", KEYS[1], ARGV[1], "PX", ARGV[2])
redis.call("SET", KEYS[2], ARGV[3], "PX", ARGV[2])
redis.call("SET", KEYS[3], ARGV[3], "PX", ARGV[2])
return 1`;

const CAS_ROOM_SCRIPT = `-- wizzard:cas-room-v1
local current_json = redis.call("GET", KEYS[1])
if not current_json then
  return -1
end
local decoded_ok, current = pcall(cjson.decode, current_json)
if not decoded_ok
  or tostring(current.id) ~= ARGV[4]
  or tonumber(current.revision) ~= tonumber(ARGV[2]) then
  return 0
end
local code_owner = redis.call("GET", KEYS[4])
local invite_owner = redis.call("GET", KEYS[5])
if (code_owner and code_owner ~= ARGV[4])
  or (invite_owner and invite_owner ~= ARGV[4]) then
  return 0
end
redis.call("SET", KEYS[1], ARGV[1], "PX", ARGV[3])
if KEYS[2] ~= KEYS[4] and redis.call("GET", KEYS[2]) == ARGV[4] then
  redis.call("DEL", KEYS[2])
end
if KEYS[3] ~= KEYS[5] and redis.call("GET", KEYS[3]) == ARGV[4] then
  redis.call("DEL", KEYS[3])
end
redis.call("SET", KEYS[4], ARGV[4], "PX", ARGV[3])
redis.call("SET", KEYS[5], ARGV[4], "PX", ARGV[3])
return 1`;

const DELETE_ROOM_SCRIPT = `-- wizzard:delete-room-v1
local current_json = redis.call("GET", KEYS[1])
if not current_json then
  return 1
end
local decoded_ok, current = pcall(cjson.decode, current_json)
if not decoded_ok
  or tostring(current.id) ~= ARGV[2]
  or tonumber(current.revision) ~= tonumber(ARGV[1]) then
  return 0
end
redis.call("DEL", KEYS[1])
if redis.call("GET", KEYS[2]) == ARGV[2] then
  redis.call("DEL", KEYS[2])
end
if redis.call("GET", KEYS[3]) == ARGV[2] then
  redis.call("DEL", KEYS[3])
end
return 1`;

const CLEAN_INDEX_SCRIPT = `-- wizzard:clean-room-index-v1
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0`;

export type RedisEvalOptions = {
  arguments: string[];
  keys: string[];
};

export interface RedisClientLike {
  eval(script: string, options: RedisEvalOptions): Promise<unknown>;
  get(key: string): Promise<string | null>;
}

export type RedisRoomRepositoryOptions<TRoom extends RevisionedRoom> = {
  codec?: RoomCodec<TRoom>;
  keyPrefix?: string;
  now?: Clock;
};

function asIntegerResult(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return Number(value);
  }

  throw new Error("REDIS_SCRIPT_RESULT_INVALID");
}

function defaultRoomCodec<TRoom extends RevisionedRoom>(): RoomCodec<TRoom> {
  return createJsonRoomCodec(
    (value: unknown): value is TRoom => isRevisionedRoom(value),
  );
}

function encodeKeyPart(value: string): string {
  if (value.length === 0 || value.length > 512) {
    throw new Error("ROOM_INDEX_KEY_INVALID");
  }

  return encodeURIComponent(value);
}

export class RedisRoomRepository<TRoom extends RevisionedRoom>
  implements RoomRepository<TRoom>
{
  private readonly codec: RoomCodec<TRoom>;
  private readonly keyPrefix: string;
  private readonly now: Clock;

  public constructor(
    private readonly client: RedisClientLike,
    options: RedisRoomRepositoryOptions<TRoom> = {},
  ) {
    this.codec = options.codec ?? defaultRoomCodec<TRoom>();
    this.keyPrefix = options.keyPrefix ?? "wizzard:{rooms}:v1";
    this.now = options.now ?? Date.now;

    if (this.keyPrefix.length === 0 || this.keyPrefix.length > 128) {
      throw new Error("REDIS_KEY_PREFIX_INVALID");
    }
  }

  public async compareAndSwap(
    room: TRoom,
    expectedRevision: number,
  ): Promise<SaveRoomResult> {
    if (
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 0 ||
      room.revision !== expectedRevision + 1
    ) {
      return "conflict";
    }

    const ttl = this.getTtl(room);

    if (ttl === null) {
      return "conflict";
    }

    const current = await this.loadStoredById(room.id);

    if (!current) {
      return "missing";
    }

    const result = asIntegerResult(
      await this.client.eval(CAS_ROOM_SCRIPT, {
        arguments: [
          this.codec.encode(room),
          String(expectedRevision),
          String(ttl),
          room.id,
        ],
        keys: [
          this.roomKey(room.id),
          this.codeKey(current.code),
          this.inviteKey(current.inviteTokenHash),
          this.codeKey(room.code),
          this.inviteKey(room.inviteTokenHash),
        ],
      }),
    );

    if (result === 1) {
      return "saved";
    }

    return result === -1 ? "missing" : "conflict";
  }

  public async create(room: TRoom): Promise<boolean> {
    const ttl = this.getTtl(room);

    if (ttl === null) {
      return false;
    }

    const result = await this.client.eval(CREATE_ROOM_SCRIPT, {
      arguments: [this.codec.encode(room), String(ttl), room.id],
      keys: [
        this.roomKey(room.id),
        this.codeKey(room.code),
        this.inviteKey(room.inviteTokenHash),
      ],
    });

    return asIntegerResult(result) === 1;
  }

  public async delete(id: string): Promise<void> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const current = await this.loadStoredById(id);

      if (!current) {
        return;
      }

      const result = asIntegerResult(
        await this.client.eval(DELETE_ROOM_SCRIPT, {
          arguments: [String(current.revision), current.id],
          keys: [
            this.roomKey(current.id),
            this.codeKey(current.code),
            this.inviteKey(current.inviteTokenHash),
          ],
        }),
      );

      if (result === 1) {
        return;
      }
    }

    throw new Error("ROOM_DELETE_CONFLICT");
  }

  public async loadByCode(code: string): Promise<TRoom | null> {
    return this.loadIndexed(this.codeKey(code), code, (room) => room.code);
  }

  public async loadById(id: string): Promise<TRoom | null> {
    const room = await this.loadStoredById(id);

    if (!room) {
      return null;
    }

    if (room.expiresAt <= this.now()) {
      await this.delete(room.id);
      return null;
    }

    return room;
  }

  public async loadByInviteHash(
    inviteTokenHash: string,
  ): Promise<TRoom | null> {
    return this.loadIndexed(
      this.inviteKey(inviteTokenHash),
      inviteTokenHash,
      (room) => room.inviteTokenHash,
    );
  }

  private codeKey(code: string): string {
    return `${this.keyPrefix}:code:${encodeKeyPart(code)}`;
  }

  private getTtl(room: TRoom): number | null {
    const ttl = Math.ceil(room.expiresAt - this.now());
    return Number.isSafeInteger(ttl) && ttl > 0 ? ttl : null;
  }

  private inviteKey(inviteTokenHash: string): string {
    return `${this.keyPrefix}:invite:${encodeKeyPart(inviteTokenHash)}`;
  }

  private async loadIndexed(
    indexKey: string,
    expectedIndex: string,
    selectIndex: (room: TRoom) => string,
  ): Promise<TRoom | null> {
    const id = await this.client.get(indexKey);

    if (!id) {
      return null;
    }

    const room = await this.loadById(id);

    if (!room || selectIndex(room) !== expectedIndex) {
      await this.client.eval(CLEAN_INDEX_SCRIPT, {
        arguments: [id],
        keys: [indexKey],
      });
      return null;
    }

    return room;
  }

  private async loadStoredById(id: string): Promise<TRoom | null> {
    const serialized = await this.client.get(this.roomKey(id));

    if (!serialized) {
      return null;
    }

    const room = this.codec.decode(serialized);
    return room?.id === id ? room : null;
  }

  private roomKey(id: string): string {
    return `${this.keyPrefix}:room:${encodeKeyPart(id)}`;
  }
}
