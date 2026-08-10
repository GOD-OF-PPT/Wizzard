import type { RoomBinding } from "../network/RoomSocketClient";

type FriendRoomBindingConfig = {
  initialBinding?: RoomBinding;
};

export type FriendRoomRuntimeConfig = FriendRoomBindingConfig &
  (
    | {
        endpoint: string;
        protocol?: string;
        transport?: "websocket";
      }
    | {
        environmentId: string;
        path: string;
        serviceName: string;
        transport: "wechat-cloud-container";
      }
  );

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

  const candidate = value as {
    endpoint?: unknown;
    environmentId?: unknown;
    initialBinding?: unknown;
    path?: unknown;
    protocol?: unknown;
    serviceName?: unknown;
    transport?: unknown;
  };
  const hasValidBinding =
    candidate.initialBinding === undefined ||
    (typeof candidate.initialBinding === "object" &&
      candidate.initialBinding !== null);

  if (!hasValidBinding) {
    return false;
  }

  if (candidate.transport === "wechat-cloud-container") {
    return (
      typeof candidate.environmentId === "string" &&
      candidate.environmentId.trim().length > 0 &&
      typeof candidate.serviceName === "string" &&
      candidate.serviceName.trim().length > 0 &&
      typeof candidate.path === "string" &&
      candidate.path.startsWith("/")
    );
  }

  return (
    (candidate.transport === undefined ||
      candidate.transport === "websocket") &&
    typeof candidate.endpoint === "string" &&
    (candidate.protocol === undefined ||
      typeof candidate.protocol === "string")
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
// only after the player creates or joins. The shipping Mini Game injects its
// AppID-bound cloud-container target before Boot.scene starts; credentials
// never belong in this public routing config.
export const APP_RUNTIME_CONFIG: AppRuntimeConfig =
  readInjectedRuntimeConfig() ?? {
    friendRoom: { endpoint: LOCAL_FRIEND_ROOM_ENDPOINT },
    startup: "home",
  };
