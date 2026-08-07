import type { WechatPlatformApi } from "./WechatSocketTransport";

const PREFERENCES_STORAGE_KEY = "wizzard.client-preferences.v1";

export type GamePreferences = Readonly<{
  showLegalHints: boolean;
  vibrationEnabled: boolean;
}>;

export const DEFAULT_GAME_PREFERENCES: GamePreferences = Object.freeze({
  showLegalHints: true,
  vibrationEnabled: true,
});

export interface GamePreferencesStore {
  clear(): void;
  load(): GamePreferences;
  save(preferences: GamePreferences): void;
}

function parsePreferences(value: unknown): GamePreferences {
  if (typeof value === "string" && value.length > 0) {
    try {
      return parsePreferences(JSON.parse(value) as unknown);
    } catch {
      return DEFAULT_GAME_PREFERENCES;
    }
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return DEFAULT_GAME_PREFERENCES;
  }

  const candidate = value as Record<string, unknown>;
  return {
    showLegalHints:
      typeof candidate.showLegalHints === "boolean"
        ? candidate.showLegalHints
        : DEFAULT_GAME_PREFERENCES.showLegalHints,
    vibrationEnabled:
      typeof candidate.vibrationEnabled === "boolean"
        ? candidate.vibrationEnabled
        : DEFAULT_GAME_PREFERENCES.vibrationEnabled,
  };
}

export class BrowserGamePreferencesStore implements GamePreferencesStore {
  public constructor(private readonly storage: Storage) {}

  public clear(): void {
    try {
      this.storage.removeItem(PREFERENCES_STORAGE_KEY);
    } catch {
      // Privacy-restricted previews may deny storage access.
    }
  }

  public load(): GamePreferences {
    try {
      return parsePreferences(this.storage.getItem(PREFERENCES_STORAGE_KEY));
    } catch {
      return DEFAULT_GAME_PREFERENCES;
    }
  }

  public save(preferences: GamePreferences): void {
    try {
      this.storage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences),
      );
    } catch {
      // Preferences remain active for the current launch when storage fails.
    }
  }
}

export class MemoryGamePreferencesStore implements GamePreferencesStore {
  private preferences: GamePreferences = DEFAULT_GAME_PREFERENCES;

  public clear(): void {
    this.preferences = DEFAULT_GAME_PREFERENCES;
  }

  public load(): GamePreferences {
    return { ...this.preferences };
  }

  public save(preferences: GamePreferences): void {
    this.preferences = { ...preferences };
  }
}

export class WechatGamePreferencesStore implements GamePreferencesStore {
  public constructor(private readonly api: WechatPlatformApi) {}

  public clear(): void {
    try {
      this.api.removeStorageSync(PREFERENCES_STORAGE_KEY);
    } catch {
      // The current launch can continue with in-memory preferences.
    }
  }

  public load(): GamePreferences {
    try {
      return parsePreferences(this.api.getStorageSync(PREFERENCES_STORAGE_KEY));
    } catch {
      return DEFAULT_GAME_PREFERENCES;
    }
  }

  public save(preferences: GamePreferences): void {
    try {
      this.api.setStorageSync(PREFERENCES_STORAGE_KEY, preferences);
    } catch {
      // The current launch can continue with in-memory preferences.
    }
  }
}
