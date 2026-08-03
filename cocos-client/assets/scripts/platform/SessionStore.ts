import type { WechatPlatformApi } from "./WechatSocketTransport";

const SESSION_STORAGE_KEY = "wizzard.room-session.v1";

export type StoredRoomSession = {
  playerId: string;
  resumeToken: string;
  roomCode: string;
  roomId: string;
};

export interface RoomSessionStore {
  clear(): void;
  load(): StoredRoomSession | null;
  save(session: StoredRoomSession): void;
}

function isStoredRoomSession(value: unknown): value is StoredRoomSession {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.playerId === "string" &&
    typeof candidate.resumeToken === "string" &&
    typeof candidate.roomCode === "string" &&
    typeof candidate.roomId === "string"
  );
}

function parseStoredSession(value: unknown): StoredRoomSession | null {
  if (isStoredRoomSession(value)) {
    return value;
  }

  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  try {
    const decoded = JSON.parse(value) as unknown;
    return isStoredRoomSession(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export class BrowserRoomSessionStore implements RoomSessionStore {
  public constructor(private readonly storage: Storage) {}

  public clear(): void {
    try {
      this.storage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted browser previews.
    }
  }

  public load(): StoredRoomSession | null {
    try {
      return parseStoredSession(this.storage.getItem(SESSION_STORAGE_KEY));
    } catch {
      return null;
    }
  }

  public save(session: StoredRoomSession): void {
    try {
      this.storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // A live socket remains usable when persistent storage is unavailable.
    }
  }
}

export class MemoryRoomSessionStore implements RoomSessionStore {
  private session: StoredRoomSession | null = null;

  public clear(): void {
    this.session = null;
  }

  public load(): StoredRoomSession | null {
    return this.session ? { ...this.session } : null;
  }

  public save(session: StoredRoomSession): void {
    this.session = { ...session };
  }
}

export class WechatRoomSessionStore implements RoomSessionStore {
  public constructor(private readonly api: WechatPlatformApi) {}

  public clear(): void {
    try {
      this.api.removeStorageSync(SESSION_STORAGE_KEY);
    } catch {
      // A live socket remains usable when persistent storage is unavailable.
    }
  }

  public load(): StoredRoomSession | null {
    try {
      return parseStoredSession(this.api.getStorageSync(SESSION_STORAGE_KEY));
    } catch {
      return null;
    }
  }

  public save(session: StoredRoomSession): void {
    try {
      this.api.setStorageSync(SESSION_STORAGE_KEY, session);
    } catch {
      // A live socket remains usable when persistent storage is unavailable.
    }
  }
}
