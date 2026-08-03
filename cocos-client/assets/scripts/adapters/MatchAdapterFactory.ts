import type { MatchRuntimeConfig } from "../config/MatchRuntimeConfig";
import { RoomSocketClient } from "../network/RoomSocketClient";
import {
  createPlatformServices,
  type PlatformServices,
} from "../platform/PlatformServices";
import type { IMatchAdapter } from "./IMatchAdapter";
import { LocalMatchAdapter } from "./LocalMatchAdapter";
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

export function createMatchAdapter(
  config: MatchRuntimeConfig,
  platformServices?: PlatformServices,
): IMatchAdapter {
  if (config.mode === "local") {
    return new LocalMatchAdapter();
  }

  const services = platformServices ?? createPlatformServices();
  assertSocketEndpoint(config.endpoint, services.runtime);
  const roomClient = new RoomSocketClient({
    binding: config.binding,
    endpoint: config.endpoint,
    ...(config.protocol ? { protocol: config.protocol } : {}),
    sessionStore: services.sessionStore,
    socketFactory: services.socketFactory,
  });

  return new NetworkMatchAdapter(roomClient);
}
