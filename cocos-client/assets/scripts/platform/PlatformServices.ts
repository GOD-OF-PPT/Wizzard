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

declare const wx: Partial<WechatPlatformApi> | undefined;

export type PlatformServices = {
  copyText(text: string): Promise<void>;
  preferenceStore: GamePreferencesStore;
  runtime: "browser" | "wechat";
  sessionStore: RoomSessionStore;
  sharing: PlatformSharing;
  socketFactory: TextSocketFactory;
  vibrateShort(): Promise<void>;
};

export type RoomInviteShare = Readonly<{
  inviteToken: string;
}>;

export type PlatformSharing = {
  register(onRoomInvite: (inviteToken: string) => void): () => void;
  setRoomInvite(invite: RoomInviteShare | null): void;
  shareRoom(): boolean;
};

const HOME_SHARE_TITLE = "奇术茶馆：邀好友来一局";
const ROOM_SHARE_TITLE = "奇术茶馆：好友正在等你入座";
const SHARE_IMAGE_URL = "share-card-v1.jpg";
const SHARE_IMAGE_USER_FILE = "wizzard-share-card-v1.jpg";
const SHARE_DIAGNOSTIC_PREFIX = "[WIZZARD_SHARE_DIAG_8F21]";
const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9._-]{16,512}$/;

function prepareWechatShareImage(api: WechatPlatformApi): string {
  const userDataPath = api.env?.USER_DATA_PATH?.replace(/[\\/]+$/u, "");
  const fileSystem = api.getFileSystemManager?.();
  if (
    !userDataPath ||
    !fileSystem ||
    typeof fileSystem.copyFileSync !== "function"
  ) {
    console.warn(SHARE_DIAGNOSTIC_PREFIX, {
      hasFileSystem: Boolean(fileSystem),
      hasUserDataPath: Boolean(userDataPath),
      stage: "image-copy-unavailable",
    });
    return SHARE_IMAGE_URL;
  }

  const destination = `${userDataPath}/${SHARE_IMAGE_USER_FILE}`;
  try {
    fileSystem.copyFileSync(SHARE_IMAGE_URL, destination);
    console.info(SHARE_DIAGNOSTIC_PREFIX, {
      imageUrl: destination,
      stage: "image-copy-ready",
    });
    return destination;
  } catch (copyError) {
    try {
      fileSystem.accessSync?.(destination);
      console.info(SHARE_DIAGNOSTIC_PREFIX, {
        imageUrl: destination,
        stage: "image-copy-existing",
      });
      return destination;
    } catch {
      console.warn(SHARE_DIAGNOSTIC_PREFIX, {
        message:
          copyError instanceof Error ? copyError.message : String(copyError),
        stage: "image-copy-failed",
      });
      return SHARE_IMAGE_URL;
    }
  }
}

function readRoomInviteToken(options: unknown): string | null {
  if (typeof options !== "object" || options === null) {
    return null;
  }

  const query = (options as { query?: unknown }).query;
  if (typeof query !== "object" || query === null || Array.isArray(query)) {
    return null;
  }

  const token = (query as Record<string, unknown>).inviteToken;
  return typeof token === "string" && INVITE_TOKEN_PATTERN.test(token)
    ? token
    : null;
}

function createWechatSharing(api: WechatPlatformApi): PlatformSharing {
  let roomInvite: RoomInviteShare | null = null;
  const shareImageUrl = prepareWechatShareImage(api);

  const getShareMessage = () =>
    roomInvite
      ? {
          imageUrl: shareImageUrl,
          query: `inviteToken=${encodeURIComponent(roomInvite.inviteToken)}`,
          title: ROOM_SHARE_TITLE,
        }
      : { imageUrl: shareImageUrl, title: HOME_SHARE_TITLE };

  return {
    register: (onRoomInvite) => {
      const shareListener = () => {
        const message = getShareMessage();
        console.info(SHARE_DIAGNOSTIC_PREFIX, {
          hasQuery: "query" in message,
          imageUrl: message.imageUrl,
          kind: roomInvite ? "room" : "home",
          stage: "menu-callback",
          title: message.title,
        });
        return message;
      };
      const showListener = (options: unknown) => {
        const inviteToken = readRoomInviteToken(options);
        if (inviteToken) {
          onRoomInvite(inviteToken);
        }
      };

      api.onShareAppMessage?.(shareListener);
      api.showShareMenu?.({
        menus: ["shareAppMessage"],
        withShareTicket: false,
      });
      console.info(SHARE_DIAGNOSTIC_PREFIX, {
        listenerInstalled: typeof api.onShareAppMessage === "function",
        shareMenuRequested: typeof api.showShareMenu === "function",
        stage: "registered",
      });

      const initialInvite = readRoomInviteToken(
        api.getLaunchOptionsSync?.(),
      );
      if (initialInvite) {
        onRoomInvite(initialInvite);
      }
      api.onShow?.(showListener);

      let registered = true;
      return () => {
        if (!registered) {
          return;
        }
        registered = false;
        api.offShareAppMessage?.(shareListener);
        api.offShow?.(showListener);
      };
    },
    setRoomInvite: (invite) => {
      roomInvite =
        invite && INVITE_TOKEN_PATTERN.test(invite.inviteToken)
          ? { ...invite }
          : null;
    },
    shareRoom: () => {
      if (!roomInvite || !api.shareAppMessage) {
        return false;
      }

      try {
        const message = getShareMessage();
        console.info(SHARE_DIAGNOSTIC_PREFIX, {
          hasQuery: "query" in message,
          imageUrl: message.imageUrl,
          kind: "room",
          stage: "direct-call",
          title: message.title,
        });
        api.shareAppMessage(message);
        return true;
      } catch {
        return false;
      }
    },
  };
}

function createBrowserSharing(): PlatformSharing {
  return {
    register: () => () => undefined,
    setRoomInvite: () => undefined,
    shareRoom: () => false,
  };
}

function getWechatApi(): WechatPlatformApi | null {
  const lexicalCandidate = typeof wx === "undefined" ? undefined : wx;
  const globalCandidate = (
    globalThis as unknown as { wx?: Partial<WechatPlatformApi> }
  ).wx;
  const candidates = [lexicalCandidate, globalCandidate].filter(
    (candidate, index, all) => candidate && all.indexOf(candidate) === index,
  );

  for (const candidate of candidates) {
    const cloud = candidate?.cloud;
    const hasSocketTransport =
      typeof candidate?.connectSocket === "function" ||
      (typeof cloud?.init === "function" &&
        typeof cloud.connectContainer === "function");

    if (
      candidate &&
      hasSocketTransport &&
      typeof candidate.getStorageSync === "function" &&
      typeof candidate.removeStorageSync === "function" &&
      typeof candidate.setStorageSync === "function"
    ) {
      return candidate as WechatPlatformApi;
    }
  }
  return null;
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
  const globalWechatApi = (
    globalThis as unknown as { wx?: Partial<WechatPlatformApi> }
  ).wx;
  const lexicalWechatApi = typeof wx === "undefined" ? undefined : wx;

  if (lexicalWechatApi || globalWechatApi) {
    const candidate = lexicalWechatApi ?? globalWechatApi;
    console.info(SHARE_DIAGNOSTIC_PREFIX, {
      globalWx: Boolean(globalWechatApi),
      lexicalWx: Boolean(lexicalWechatApi),
      onShareAppMessage: typeof candidate?.onShareAppMessage,
      runtime: wechatApi ? "wechat" : "browser",
      shareAppMessage: typeof candidate?.shareAppMessage,
      stage: "runtime",
    });
  }

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
      sharing: createWechatSharing(wechatApi),
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
    sharing: createBrowserSharing(),
    socketFactory: new BrowserSocketFactory(),
    vibrateShort: async () => {
      const navigatorApi = (
        globalThis as unknown as { navigator?: Navigator }
      ).navigator;
      navigatorApi?.vibrate?.(18);
    },
  };
}
