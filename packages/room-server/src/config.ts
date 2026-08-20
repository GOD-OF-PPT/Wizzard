export type RoomServiceConfig = {
  aiActionDelayMs: number;
  finishedRoomTtlMs: number;
  heartbeatIntervalMs: number;
  idleConnectionTimeoutMs: number;
  lobbyRoomTtlMs: number;
  matchRoomTtlMs: number;
  maxActiveRooms: number;
  maxFrameBytes: number;
  maxRoomCreationsPerWindow: number;
  offlineRoomTtlMs: number;
  port: number;
  roomCreationWindowMs: number;
  roundScoreDelayMs: number;
  sessionTtlMs: number;
  trickResultDelayMs: number;
  turnTimeoutMs: number;
};

export const DEFAULT_ROOM_SERVICE_CONFIG: RoomServiceConfig = {
  aiActionDelayMs: 420,
  finishedRoomTtlMs: 30 * 60 * 1_000,
  heartbeatIntervalMs: 15_000,
  idleConnectionTimeoutMs: 45_000,
  lobbyRoomTtlMs: 30 * 60 * 1_000,
  matchRoomTtlMs: 4 * 60 * 60 * 1_000,
  maxActiveRooms: 100,
  maxFrameBytes: 16 * 1_024,
  maxRoomCreationsPerWindow: 3,
  offlineRoomTtlMs: 15 * 60 * 1_000,
  port: 8787,
  roomCreationWindowMs: 10 * 60 * 1_000,
  roundScoreDelayMs: 8_000,
  sessionTtlMs: 4 * 60 * 60 * 1_000,
  trickResultDelayMs: 1_500,
  turnTimeoutMs: 30_000,
};

function readPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readRoomServiceConfig(
  environment: NodeJS.ProcessEnv = process.env,
): RoomServiceConfig {
  return {
    ...DEFAULT_ROOM_SERVICE_CONFIG,
    port: readPositiveInteger(
      environment.PORT,
      readPositiveInteger(
        environment.WIZZARD_ROOM_PORT,
        DEFAULT_ROOM_SERVICE_CONFIG.port,
      ),
    ),
  };
}

export function readAllowedOrigins(
  environment: NodeJS.ProcessEnv = process.env,
): string[] | undefined {
  const raw = environment.WIZZARD_ALLOWED_ORIGINS?.trim();
  if (!raw) {
    return undefined;
  }

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      const parsed = new URL(origin);
      if (
        (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
        parsed.origin !== origin
      ) {
        throw new Error("WIZZARD_ALLOWED_ORIGIN_INVALID");
      }
      return parsed.origin;
    });

  return origins.length > 0 ? [...new Set(origins)] : undefined;
}
