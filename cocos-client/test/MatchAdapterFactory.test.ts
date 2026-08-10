import { describe, expect, it, vi } from "vitest";
import { createRoomSocketClient } from "../assets/scripts/adapters/MatchAdapterFactory";
import type { PlatformServices } from "../assets/scripts/platform/PlatformServices";
import {
  MemoryGamePreferencesStore,
} from "../assets/scripts/platform/GamePreferences";
import { MemoryRoomSessionStore } from "../assets/scripts/platform/SessionStore";
import type {
  SocketObserver,
  TextSocket,
  TextSocketFactory,
  TextSocketTarget,
} from "../assets/scripts/platform/SocketTransport";

class RecordingSocketFactory implements TextSocketFactory {
  public readonly connect = vi.fn(
    (_target: TextSocketTarget, _observer: SocketObserver): TextSocket => ({
      close: () => undefined,
      send: () => false,
    }),
  );
}

function createWechatServices(
  socketFactory: TextSocketFactory,
): PlatformServices {
  return {
    copyText: async () => undefined,
    preferenceStore: new MemoryGamePreferencesStore(),
    runtime: "wechat",
    sessionStore: new MemoryRoomSessionStore(),
    socketFactory,
    vibrateShort: async () => undefined,
  };
}

describe("createRoomSocketClient", () => {
  it("passes an explicit cloud-container target through the socket seam", () => {
    const socketFactory = new RecordingSocketFactory();
    const client = createRoomSocketClient(
      {
        environmentId: "wizzard-trial-123456",
        path: "/ws",
        serviceName: "wizzard-room-server",
        transport: "wechat-cloud-container",
      },
      {
        payload: {
          avatarKey: "bamboo-cat",
          displayName: "Self",
          maxPlayers: 3,
          mode: "quick",
        },
        type: "create",
      },
      createWechatServices(socketFactory),
    );

    client.start();

    expect(socketFactory.connect).toHaveBeenCalledWith(
      {
        environmentId: "wizzard-trial-123456",
        kind: "wechat-cloud-container",
        path: "/ws",
        serviceName: "wizzard-room-server",
      },
      expect.objectContaining({
        onClose: expect.any(Function),
        onError: expect.any(Function),
        onMessage: expect.any(Function),
        onOpen: expect.any(Function),
      }),
    );
    client.dispose();
  });
});
