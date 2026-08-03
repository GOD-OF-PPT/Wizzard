import { BrowserSocketFactory } from "./BrowserSocketTransport";
import {
  BrowserRoomSessionStore,
  MemoryRoomSessionStore,
  type RoomSessionStore,
  WechatRoomSessionStore,
} from "./SessionStore";
import type { TextSocketFactory } from "./SocketTransport";
import {
  WechatSocketFactory,
  type WechatPlatformApi,
} from "./WechatSocketTransport";

export type PlatformServices = {
  runtime: "browser" | "wechat";
  sessionStore: RoomSessionStore;
  socketFactory: TextSocketFactory;
};

function getWechatApi(): WechatPlatformApi | null {
  const candidate = (globalThis as unknown as { wx?: Partial<WechatPlatformApi> })
    .wx;

  if (
    !candidate ||
    typeof candidate.connectSocket !== "function" ||
    typeof candidate.getStorageSync !== "function" ||
    typeof candidate.removeStorageSync !== "function" ||
    typeof candidate.setStorageSync !== "function"
  ) {
    return null;
  }

  return candidate as WechatPlatformApi;
}

export function createPlatformServices(): PlatformServices {
  const wechatApi = getWechatApi();

  if (wechatApi) {
    return {
      runtime: "wechat",
      sessionStore: new WechatRoomSessionStore(wechatApi),
      socketFactory: new WechatSocketFactory(wechatApi),
    };
  }

  const storage = (globalThis as unknown as { localStorage?: Storage })
    .localStorage;

  return {
    runtime: "browser",
    sessionStore: storage
      ? new BrowserRoomSessionStore(storage)
      : new MemoryRoomSessionStore(),
    socketFactory: new BrowserSocketFactory(),
  };
}
