import { afterEach, describe, expect, it, vi } from "vitest";

type RuntimeGlobals = typeof globalThis & {
  __WIZZARD_APP_RUNTIME_CONFIG__?: unknown;
  __WIZZARD_MATCH_RUNTIME_CONFIG__?: unknown;
};

const runtimeGlobals = globalThis as RuntimeGlobals;

afterEach(() => {
  delete runtimeGlobals.__WIZZARD_APP_RUNTIME_CONFIG__;
  delete runtimeGlobals.__WIZZARD_MATCH_RUNTIME_CONFIG__;
  vi.resetModules();
});

describe("APP_RUNTIME_CONFIG", () => {
  it("accepts the AppID-bound cloud-container target", async () => {
    runtimeGlobals.__WIZZARD_APP_RUNTIME_CONFIG__ = {
      friendRoom: {
        environmentId: "prod-d9g3qr6rqdbba6605",
        path: "/ws",
        serviceName: "wizzard-room-server",
        transport: "wechat-cloud-container",
      },
      startup: "home",
    };

    const { APP_RUNTIME_CONFIG } = await import(
      "../assets/scripts/config/MatchRuntimeConfig"
    );

    expect(APP_RUNTIME_CONFIG).toEqual({
      friendRoom: {
        environmentId: "prod-d9g3qr6rqdbba6605",
        path: "/ws",
        serviceName: "wizzard-room-server",
        transport: "wechat-cloud-container",
      },
      startup: "home",
    });
  });

  it("keeps legacy explicit WebSocket injection for local diagnostics", async () => {
    runtimeGlobals.__WIZZARD_APP_RUNTIME_CONFIG__ = {
      friendRoom: { endpoint: "ws://127.0.0.1:8787/ws" },
      startup: "home",
    };

    const { APP_RUNTIME_CONFIG } = await import(
      "../assets/scripts/config/MatchRuntimeConfig"
    );

    expect(APP_RUNTIME_CONFIG.friendRoom).toEqual({
      endpoint: "ws://127.0.0.1:8787/ws",
    });
  });
});
