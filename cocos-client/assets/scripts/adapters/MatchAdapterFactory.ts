import type { FriendRoomRuntimeConfig } from "../config/MatchRuntimeConfig";
import {
  RoomSocketClient,
  type RoomBinding,
} from "../network/RoomSocketClient";
import {
  createPlatformServices,
  type PlatformServices,
} from "../platform/PlatformServices";
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
  assertSocketEndpoint(config.endpoint, services.runtime);
  return new RoomSocketClient({
    binding,
    endpoint: config.endpoint,
    ...(config.protocol ? { protocol: config.protocol } : {}),
    sessionStore: services.sessionStore,
    socketFactory: services.socketFactory,
  });
}
