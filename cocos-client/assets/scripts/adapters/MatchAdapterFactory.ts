import type { FriendRoomRuntimeConfig } from "../config/MatchRuntimeConfig";
import {
  RoomSocketClient,
  type RoomBinding,
} from "../network/RoomSocketClient";
import {
  createPlatformServices,
  type PlatformServices,
} from "../platform/PlatformServices";
import type { TextSocketTarget } from "../platform/SocketTransport";
import type { IMatchAdapter } from "./IMatchAdapter";
import {
  LocalMatchAdapter,
  type LocalMatchAdapterOptions,
} from "./LocalMatchAdapter";
import { NetworkMatchAdapter } from "./NetworkMatchAdapter";

function assertSocketEndpoint(
  endpoint: string,
  runtime: PlatformServices["runtime"],
): void {
  if (!/^wss?:\/\//i.test(endpoint)) {
    throw new Error("NETWORK_ENDPOINT_MUST_USE_WEBSOCKET");
  }

  if (
    runtime === "wechat" &&
    /^ws:\/\//i.test(endpoint) &&
    !/^ws:\/\/(127\.0\.0\.1|localhost)(?::|\/|$)/i.test(endpoint)
  ) {
    throw new Error("WECHAT_NETWORK_ENDPOINT_MUST_USE_WSS");
  }
}

function createSocketTarget(
  config: FriendRoomRuntimeConfig,
  runtime: PlatformServices["runtime"],
): TextSocketTarget {
  if (config.transport === "wechat-cloud-container") {
    if (runtime !== "wechat") {
      throw new Error("WECHAT_CLOUD_CONTAINER_REQUIRES_WECHAT_RUNTIME");
    }
    if (!config.environmentId.trim()) {
      throw new Error("WECHAT_CLOUD_CONTAINER_ENVIRONMENT_REQUIRED");
    }
    if (!/^[a-z][a-z0-9-]{0,19}$/u.test(config.serviceName)) {
      throw new Error("WECHAT_CLOUD_CONTAINER_SERVICE_INVALID");
    }
    if (!config.path.startsWith("/") || config.path.startsWith("//")) {
      throw new Error("WECHAT_CLOUD_CONTAINER_PATH_INVALID");
    }

    return {
      environmentId: config.environmentId,
      kind: "wechat-cloud-container",
      path: config.path,
      serviceName: config.serviceName,
    };
  }

  assertSocketEndpoint(config.endpoint, runtime);
  return {
    kind: "websocket",
    ...(config.protocol ? { protocol: config.protocol } : {}),
    url: config.endpoint,
  };
}

export function createLocalMatchAdapter(
  options?: LocalMatchAdapterOptions,
): IMatchAdapter {
  return new LocalMatchAdapter(options);
}

export function createNetworkMatchAdapter(
  roomClient: RoomSocketClient,
  ownsRoomClient = true,
): IMatchAdapter {
  return new NetworkMatchAdapter(roomClient, ownsRoomClient);
}

export function createRoomSocketClient(
  config: FriendRoomRuntimeConfig,
  binding: RoomBinding,
  platformServices?: PlatformServices,
): RoomSocketClient {
  const services = platformServices ?? createPlatformServices();
  const target = createSocketTarget(config, services.runtime);
  return new RoomSocketClient({
    binding,
    sessionStore: services.sessionStore,
    socketFactory: services.socketFactory,
    target,
  });
}
