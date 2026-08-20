import { describe, expect, it, vi } from "vitest";
import { createPlatformServices } from "../assets/scripts/platform/PlatformServices";
import type {
  WechatPlatformApi,
  WechatShareAppMessage,
} from "../assets/scripts/platform/WechatSocketTransport";

function createSocketTask() {
  return {
    close: vi.fn(),
    onClose: vi.fn(),
    onError: vi.fn(),
    onMessage: vi.fn(),
    onOpen: vi.fn(),
    send: vi.fn(),
  };
}

describe("PlatformServices sharing", () => {
  it("copies the packaged share image to a real-device local path", () => {
    const copyFileSync = vi.fn();
    const onShareAppMessage = vi.fn();
    const api = {
      connectSocket: vi.fn(() => createSocketTask()),
      env: { USER_DATA_PATH: "wxfile://usr" },
      getFileSystemManager: vi.fn(() => ({ copyFileSync })),
      getStorageSync: vi.fn(),
      onShareAppMessage,
      removeStorageSync: vi.fn(),
      setStorageSync: vi.fn(),
      showShareMenu: vi.fn(),
    } as unknown as WechatPlatformApi;
    const wechatGlobal = globalThis as typeof globalThis & {
      wx?: WechatPlatformApi;
    };
    const previousWechat = wechatGlobal.wx;
    wechatGlobal.wx = api;

    try {
      const services = createPlatformServices();
      services.sharing.register(() => undefined);
      const listener = onShareAppMessage.mock.calls[0]?.[0] as
        | (() => WechatShareAppMessage)
        | undefined;

      expect(copyFileSync).toHaveBeenCalledWith(
        "share-card-v1.jpg",
        "wxfile://usr/wizzard-share-card-v1.jpg",
      );
      expect(listener?.()).toEqual({
        imageUrl: "wxfile://usr/wizzard-share-card-v1.jpg",
        title: "奇术茶馆：邀好友来一局",
      });
    } finally {
      if (previousWechat) {
        wechatGlobal.wx = previousWechat;
      } else {
        delete wechatGlobal.wx;
      }
    }
  });

  it("registers the WeChat share menu once and removes its callback on dispose", () => {
    const onShareAppMessage = vi.fn();
    const offShareAppMessage = vi.fn();
    const offShow = vi.fn();
    const onShow = vi.fn();
    const showShareMenu = vi.fn();
    const api = {
      connectSocket: vi.fn(() => createSocketTask()),
      getStorageSync: vi.fn(),
      offShareAppMessage,
      offShow,
      onShareAppMessage,
      onShow,
      removeStorageSync: vi.fn(),
      setStorageSync: vi.fn(),
      showShareMenu,
    } as unknown as WechatPlatformApi;
    const wechatGlobal = globalThis as typeof globalThis & {
      wx?: WechatPlatformApi;
    };
    const previousWechat = wechatGlobal.wx;
    wechatGlobal.wx = api;

    try {
      const services = createPlatformServices();
      const unregister = services.sharing.register(() => undefined);

      expect(services.runtime).toBe("wechat");
      expect(onShareAppMessage).toHaveBeenCalledOnce();
      expect(showShareMenu).toHaveBeenCalledWith({
        menus: ["shareAppMessage"],
        withShareTicket: false,
      });
      const listener = onShareAppMessage.mock.calls[0]?.[0] as
        | (() => WechatShareAppMessage)
        | undefined;
      expect(listener?.()).toEqual({
        imageUrl: "share-card-v1.jpg",
        title: "奇术茶馆：邀好友来一局",
      });

      unregister();
      unregister();
      expect(offShareAppMessage).toHaveBeenCalledOnce();
      expect(offShareAppMessage).toHaveBeenCalledWith(listener);
      expect(offShow).toHaveBeenCalledOnce();
      expect(offShow).toHaveBeenCalledWith(onShow.mock.calls[0]?.[0]);
    } finally {
      if (previousWechat) {
        wechatGlobal.wx = previousWechat;
      } else {
        delete wechatGlobal.wx;
      }
    }
  });

  it("shares the active friend room and delivers its cold-start invite", () => {
    const inviteToken =
      "i1.room-test.abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
    const onShareAppMessage = vi.fn();
    const onShow = vi.fn();
    const shareAppMessage = vi.fn();
    const api = {
      connectSocket: vi.fn(() => createSocketTask()),
      getLaunchOptionsSync: vi.fn(() => ({ query: { inviteToken } })),
      getStorageSync: vi.fn(),
      onShareAppMessage,
      onShow,
      removeStorageSync: vi.fn(),
      setStorageSync: vi.fn(),
      shareAppMessage,
      showShareMenu: vi.fn(),
    } as unknown as WechatPlatformApi;
    const wechatGlobal = globalThis as typeof globalThis & {
      wx?: WechatPlatformApi;
    };
    const previousWechat = wechatGlobal.wx;
    wechatGlobal.wx = api;

    try {
      const receivedInvites: string[] = [];
      const services = createPlatformServices();
      const unregister = services.sharing.register((received) =>
        receivedInvites.push(received),
      );
      services.sharing.setRoomInvite({ inviteToken });

      expect(receivedInvites).toEqual([inviteToken]);
      const listener = onShareAppMessage.mock.calls[0]?.[0] as
        | (() => WechatShareAppMessage)
        | undefined;
      const expectedShare = {
        imageUrl: "share-card-v1.jpg",
        query: `inviteToken=${encodeURIComponent(inviteToken)}`,
        title: "奇术茶馆：好友正在等你入座",
      };
      expect(listener?.()).toEqual(expectedShare);
      expect(services.sharing.shareRoom()).toBe(true);
      expect(shareAppMessage).toHaveBeenCalledWith(expectedShare);

      const showListener = onShow.mock.calls[0]?.[0] as
        | ((options: unknown) => void)
        | undefined;
      showListener?.({ query: { inviteToken: [inviteToken] } });
      expect(receivedInvites).toEqual([inviteToken]);
      const hotInvite =
        "i1.room-hot.abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHI";
      showListener?.({ query: { inviteToken: hotInvite } });
      expect(receivedInvites).toEqual([inviteToken, hotInvite]);

      services.sharing.setRoomInvite(null);
      expect(listener?.()).toEqual({
        imageUrl: "share-card-v1.jpg",
        title: "奇术茶馆：邀好友来一局",
      });
      unregister();
    } finally {
      if (previousWechat) {
        wechatGlobal.wx = previousWechat;
      } else {
        delete wechatGlobal.wx;
      }
    }
  });
});
