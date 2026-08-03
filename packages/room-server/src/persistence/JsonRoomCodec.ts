import type {
  RevisionedRoom,
  RoomCodec,
  RoomRecordGuard,
} from "./types.js";

const DEFAULT_MAX_JSON_CHARACTERS = 1_000_000;
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isJsonContainer(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSafeJsonValue(value: unknown, seen: Set<object>): boolean {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (!isJsonContainer(value) || seen.has(value)) {
    return false;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    const safe = value.every((entry) => isSafeJsonValue(entry, seen));
    seen.delete(value);
    return safe;
  }

  const prototype = Object.getPrototypeOf(value);

  if (prototype !== Object.prototype && prototype !== null) {
    seen.delete(value);
    return false;
  }

  const safe = Object.entries(value).every(
    ([key, entry]) =>
      !FORBIDDEN_KEYS.has(key) && isSafeJsonValue(entry, seen),
  );
  seen.delete(value);
  return safe;
}

export function isRevisionedRoom(
  value: unknown,
): value is RevisionedRoom {
  if (!isJsonContainer(value) || Array.isArray(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.code === "string" &&
    value.code.length > 0 &&
    typeof value.inviteTokenHash === "string" &&
    value.inviteTokenHash.length > 0 &&
    Number.isSafeInteger(value.revision) &&
    (value.revision as number) >= 0 &&
    typeof value.expiresAt === "number" &&
    Number.isFinite(value.expiresAt)
  );
}

export function createJsonRoomCodec<TRoom extends RevisionedRoom>(
  guard: RoomRecordGuard<TRoom>,
  options: { maxJsonCharacters?: number } = {},
): RoomCodec<TRoom> {
  const maxJsonCharacters =
    options.maxJsonCharacters ?? DEFAULT_MAX_JSON_CHARACTERS;

  if (!Number.isSafeInteger(maxJsonCharacters) || maxJsonCharacters <= 0) {
    throw new Error("ROOM_CODEC_MAX_SIZE_INVALID");
  }

  return {
    decode(serialized): TRoom | null {
      if (serialized.length > maxJsonCharacters) {
        return null;
      }

      try {
        const value: unknown = JSON.parse(serialized);

        return isSafeJsonValue(value, new Set()) && guard(value) ? value : null;
      } catch {
        return null;
      }
    },

    encode(room): string {
      if (!guard(room) || !isSafeJsonValue(room, new Set())) {
        throw new Error("ROOM_RECORD_NOT_JSON_SAFE");
      }

      const serialized = JSON.stringify(room);

      if (serialized.length > maxJsonCharacters) {
        throw new Error("ROOM_RECORD_TOO_LARGE");
      }

      return serialized;
    },
  };
}
