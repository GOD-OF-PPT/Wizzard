import { BrowserSocketFactory } from "./BrowserSocketTransport";
import {
  BrowserRoomSessionStore,
  MemoryRoomSessionStore,
  type RoomSessionStore,
  WechatRoomSessionStore,
} from "./SessionStore";
import {
  BrowserGamePreferencesStore,
  MemoryGamePreferencesStore,
  type GamePreferencesStore,
  WechatGamePreferencesStore,
} from "./GamePreferences";
import type { TextSocketFactory } from "./SocketTransport";
import {
  WechatSocketFactory,
  type WechatPlatformApi,
} from "./WechatSocketTransport";

export type PlatformServices = {
  copyText(text: string): Promise<void>;
  preferenceStore: GamePreferencesStore;
  runtime: "browser" | "wechat";
  sessionStore: RoomSessionStore;
  socketFactory: TextSocketFactory;
  vibrateShort(): Promise<void>;
};

function getWechatApi(): WechatPlatformApi | null {
  const candidate = (globalThis as unknown as { wx?: Partial<WechatPlatformApi> })
    .wx;
  const cloud = candidate?.cloud;
  const hasSocketTransport =
    typeof candidate?.connectSocket === "function" ||
    (typeof cloud?.init === "function" &&
      typeof cloud.connectContainer === "function");

  if (
    !candidate ||
    !hasSocketTransport ||
    typeof candidate.getStorageSync !== "function" ||
    typeof candidate.removeStorageSync !== "function" ||
    typeof candidate.setStorageSync !== "function"
  ) {
    return null;
  }

  return candidate as WechatPlatformApi;
}

function getBrowserStorage(): Storage | null {
  try {
    return (
      globalThis as unknown as { localStorage?: Storage }
    ).localStorage ?? null;
  } catch {
    return null;
  }
}

export function createPlatformServices(): PlatformServices {
  const wechatApi = getWechatApi();

  if (wechatApi) {
    return {
      copyText: (text) =>
        new Promise((resolve, reject) => {
          if (!wechatApi.setClipboardData) {
            reject(new Error("WECHAT_CLIPBOARD_NOT_AVAILABLE"));
            return;
          }

          wechatApi.setClipboardData({
            data: text,
            fail: (error) =>
              reject(new Error(error.errMsg ?? "WECHAT_CLIPBOARD_ERROR")),
            success: resolve,
          });
        }),
      preferenceStore: new WechatGamePreferencesStore(wechatApi),
      runtime: "wechat",
      sessionStore: new WechatRoomSessionStore(wechatApi),
      socketFactory: new WechatSocketFactory(wechatApi),
      vibrateShort: () =>
        new Promise((resolve, reject) => {
          if (!wechatApi.vibrateShort) {
            resolve();
            return;
          }

          wechatApi.vibrateShort({
            fail: (error) =>
              reject(new Error(error.errMsg ?? "WECHAT_VIBRATION_ERROR")),
            success: resolve,
            type: "light",
          });
        }),
    };
  }

  const storage = getBrowserStorage();

  return {
    copyText: async (text) => {
      const clipboard = (globalThis as unknown as { navigator?: Navigator })
        .navigator?.clipboard;
      if (!clipboard) {
        throw new Error("BROWSER_CLIPBOARD_NOT_AVAILABLE");
      }
      await clipboard.writeText(text);
    },
    preferenceStore: storage
      ? new BrowserGamePreferencesStore(storage)
      : new MemoryGamePreferencesStore(),
    runtime: "browser",
    sessionStore: storage
      ? new BrowserRoomSessionStore(storage)
      : new MemoryRoomSessionStore(),
    socketFactory: new BrowserSocketFactory(),
    vibrateShort: async () => {
      const navigatorApi = (
        globalThis as unknown as { navigator?: Navigator }
      ).navigator;
      navigatorApi?.vibrate?.(18);
    },
  };
}
