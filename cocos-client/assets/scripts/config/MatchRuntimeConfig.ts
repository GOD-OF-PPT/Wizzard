import type { RoomBinding } from "../network/RoomSocketClient";

export type FriendRoomRuntimeConfig = {
  endpoint: string;
  initialBinding?: RoomBinding;
  protocol?: string;
};

export type AppRuntimeConfig = {
  friendRoom: FriendRoomRuntimeConfig | null;
  startup: "home" | "practice";
};

type LegacyMatchRuntimeConfig =
  | { mode: "local" }
  | {
      binding: RoomBinding;
      endpoint: string;
      mode: "network";
      protocol?: string;
    };

const LOCAL_FRIEND_ROOM_ENDPOINT = "ws://127.0.0.1:8787/ws";

function isFriendRoomRuntimeConfig(
  value: unknown,
): value is FriendRoomRuntimeConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<FriendRoomRuntimeConfig>;
  return (
    typeof candidate.endpoint === "string" &&
    (candidate.protocol === undefined ||
      typeof candidate.protocol === "string") &&
    (candidate.initialBinding === undefined ||
      (typeof candidate.initialBinding === "object" &&
        candidate.initialBinding !== null))
  );
}

function readInjectedRuntimeConfig(): AppRuntimeConfig | null {
  const globals = globalThis as unknown as {
    __WIZZARD_APP_RUNTIME_CONFIG__?: unknown;
    __WIZZARD_MATCH_RUNTIME_CONFIG__?: unknown;
  };
  const injected = globals.__WIZZARD_APP_RUNTIME_CONFIG__;

  if (injected !== undefined) {
    if (typeof injected !== "object" || injected === null) {
      throw new Error("INVALID_APP_RUNTIME_CONFIG");
    }

    const candidate = injected as Partial<AppRuntimeConfig>;
    const startup = candidate.startup ?? "home";
    const friendRoom = candidate.friendRoom;

    if (
      (startup !== "home" && startup !== "practice") ||
      (friendRoom !== null && !isFriendRoomRuntimeConfig(friendRoom))
    ) {
      throw new Error("INVALID_APP_RUNTIME_CONFIG");
    }

    return { friendRoom: friendRoom ?? null, startup };
  }

  const legacy = globals.__WIZZARD_MATCH_RUNTIME_CONFIG__;
  if (legacy === undefined) {
    return null;
  }

  if (typeof legacy !== "object" || legacy === null) {
    throw new Error("INVALID_MATCH_RUNTIME_CONFIG");
  }

  const candidate = legacy as Partial<LegacyMatchRuntimeConfig>;
  if (candidate.mode === "local") {
    return {
      friendRoom: { endpoint: LOCAL_FRIEND_ROOM_ENDPOINT },
      startup: "practice",
    };
  }

  if (
    candidate.mode === "network" &&
    typeof candidate.endpoint === "string" &&
    typeof candidate.binding === "object" &&
    candidate.binding !== null
  ) {
    return {
      friendRoom: {
        endpoint: candidate.endpoint,
        initialBinding: candidate.binding,
        ...(candidate.protocol ? { protocol: candidate.protocol } : {}),
      },
      startup: "home",
    };
  }

  throw new Error("INVALID_MATCH_RUNTIME_CONFIG");
}

// The checked-in development build opens the friend-room home and connects
// only after the player creates or joins. Production injects a public wss://
// endpoint before Boot.scene starts; credentials never belong in this config.
export const APP_RUNTIME_CONFIG: AppRuntimeConfig =
  readInjectedRuntimeConfig() ?? {
    friendRoom: { endpoint: LOCAL_FRIEND_ROOM_ENDPOINT },
    startup: "home",
  };
