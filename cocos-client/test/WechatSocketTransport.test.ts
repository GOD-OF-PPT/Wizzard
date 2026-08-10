import { describe, expect, it, vi } from "vitest";
import {
  WechatSocketFactory,
  type WechatPlatformApi,
} from "../assets/scripts/platform/WechatSocketTransport";

type MockSocketTask = ReturnType<typeof createMockSocketTask>;

function createMockSocketTask() {
  let closeListener:
    | ((event: { code?: number; reason?: string }) => void)
    | null = null;
  let messageListener: ((event: { data: unknown }) => void) | null = null;
  let openListener: (() => void) | null = null;

  return {
    close: vi.fn(),
    emitClose: (event: { code?: number; reason?: string }) =>
      closeListener?.(event),
    emitMessage: (data: unknown) => messageListener?.({ data }),
    emitOpen: () => openListener?.(),
    onClose: vi.fn(
      (listener: (event: { code?: number; reason?: string }) => void) => {
        closeListener = listener;
      },
    ),
    onError: vi.fn(),
    onMessage: vi.fn((listener: (event: { data: unknown }) => void) => {
      messageListener = listener;
    }),
    onOpen: vi.fn((listener: () => void) => {
      openListener = listener;
    }),
    send: vi.fn(),
  };
}

function createWechatApi(
  task: MockSocketTask,
): WechatPlatformApi & {
  cloud: {
    connectContainer: ReturnType<typeof vi.fn>;
    init: ReturnType<typeof vi.fn>;
  };
  connectSocket: ReturnType<typeof vi.fn>;
} {
  return {
    cloud: {
      connectContainer: vi.fn().mockResolvedValue({ socketTask: task }),
      init: vi.fn().mockResolvedValue(undefined),
    },
    connectSocket: vi.fn(),
    getStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
  } as unknown as WechatPlatformApi & {
    cloud: {
      connectContainer: ReturnType<typeof vi.fn>;
      init: ReturnType<typeof vi.fn>;
    };
    connectSocket: ReturnType<typeof vi.fn>;
  };
}

describe("WechatSocketFactory", () => {
  it("keeps explicit direct WebSocket targets available for local diagnostics", () => {
    const task = createMockSocketTask();
    const api = createWechatApi(task);
    api.connectSocket.mockReturnValue(task);
    const observer = {
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
      onOpen: vi.fn(),
    };

    new WechatSocketFactory(api).connect(
      {
        kind: "websocket",
        protocol: "wizzard-room-v1",
        url: "ws://127.0.0.1:8787/ws",
      },
      observer,
    );

    expect(api.connectSocket).toHaveBeenCalledWith({
      protocols: ["wizzard-room-v1"],
      tcpNoDelay: true,
      url: "ws://127.0.0.1:8787/ws",
    });
    expect(api.cloud.init).not.toHaveBeenCalled();
    expect(api.cloud.connectContainer).not.toHaveBeenCalled();
  });

  it("connects through the current AppID cloud container without using public WSS", async () => {
    const task = createMockSocketTask();
    const api = createWechatApi(task);
    const observer = {
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
      onOpen: vi.fn(),
    };

    new WechatSocketFactory(api).connect(
      {
        environmentId: "wizzard-trial-123456",
        kind: "wechat-cloud-container",
        path: "/ws",
        serviceName: "wizzard-room-server",
      },
      observer,
    );

    await vi.waitFor(() => {
      expect(api.cloud.connectContainer).toHaveBeenCalledOnce();
    });

    expect(api.cloud.init).toHaveBeenCalledWith({ traceUser: true });
    expect(api.cloud.connectContainer).toHaveBeenCalledWith({
      config: { env: "wizzard-trial-123456" },
      path: "/ws",
      service: "wizzard-room-server",
    });
    expect(api.connectSocket).not.toHaveBeenCalled();

    task.emitOpen();
    expect(observer.onOpen).toHaveBeenCalledOnce();
  });

  it("keeps the synchronous socket seam while the cloud task resolves", async () => {
    const task = createMockSocketTask();
    const api = createWechatApi(task);
    const observer = {
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
      onOpen: vi.fn(),
    };
    const socket = new WechatSocketFactory(api).connect(
      {
        environmentId: "wizzard-trial-123456",
        kind: "wechat-cloud-container",
        path: "/ws",
        serviceName: "wizzard-room-server",
      },
      observer,
    );

    expect(socket.send("before-open")).toBe(false);
    await vi.waitFor(() => expect(task.onOpen).toHaveBeenCalledOnce());

    task.emitOpen();
    expect(socket.send("hello")).toBe(true);
    expect(task.send).toHaveBeenCalledWith({
      data: "hello",
      fail: expect.any(Function),
    });

    socket.close(1000, "done");
    expect(task.close).toHaveBeenCalledWith({ code: 1000, reason: "done" });
  });

  it("initializes WeChat cloud once while reconnecting the same factory", async () => {
    const task = createMockSocketTask();
    const api = createWechatApi(task);
    const observer = {
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
      onOpen: vi.fn(),
    };
    const factory = new WechatSocketFactory(api);
    const target = {
      environmentId: "wizzard-trial-123456",
      kind: "wechat-cloud-container" as const,
      path: "/ws",
      serviceName: "wizzard-room-server",
    };

    factory.connect(target, observer);
    factory.connect(target, observer);

    await vi.waitFor(() => {
      expect(api.cloud.connectContainer).toHaveBeenCalledTimes(2);
    });
    expect(api.cloud.init).toHaveBeenCalledOnce();
  });

  it("retries cloud initialization after the first attempt fails", async () => {
    const task = createMockSocketTask();
    const api = createWechatApi(task);
    api.cloud.init
      .mockRejectedValueOnce(new Error("cloud init failed"))
      .mockResolvedValue(undefined);
    const factory = new WechatSocketFactory(api);
    const target = {
      environmentId: "wizzard-trial-123456",
      kind: "wechat-cloud-container" as const,
      path: "/ws",
      serviceName: "wizzard-room-server",
    };
    const firstObserver = {
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
      onOpen: vi.fn(),
    };

    factory.connect(target, firstObserver);
    await vi.waitFor(() => expect(firstObserver.onClose).toHaveBeenCalledOnce());

    factory.connect(target, {
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
      onOpen: vi.fn(),
    });

    await vi.waitFor(() => {
      expect(api.cloud.connectContainer).toHaveBeenCalledOnce();
    });
    expect(api.cloud.init).toHaveBeenCalledTimes(2);
  });

  it("turns a rejected cloud connection into error and close events", async () => {
    const task = createMockSocketTask();
    const api = createWechatApi(task);
    api.cloud.connectContainer.mockRejectedValue({
      errMsg: "-601031 service does not belong to this AppID",
    });
    const observer = {
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
      onOpen: vi.fn(),
    };

    new WechatSocketFactory(api).connect(
      {
        environmentId: "wizzard-trial-123456",
        kind: "wechat-cloud-container",
        path: "/ws",
        serviceName: "wizzard-room-server",
      },
      observer,
    );

    await vi.waitFor(() => expect(observer.onClose).toHaveBeenCalledOnce());
    expect(observer.onError).toHaveBeenCalledWith(
      new Error("-601031 service does not belong to this AppID"),
    );
    expect(observer.onClose).toHaveBeenCalledWith({
      code: 1006,
      reason: "-601031 service does not belong to this AppID",
    });
    expect(api.connectSocket).not.toHaveBeenCalled();
  });

  it("closes a cloud task that resolves after its proxy was disposed", async () => {
    const task = createMockSocketTask();
    const api = createWechatApi(task);
    let resolveTask: ((result: { socketTask: MockSocketTask }) => void) | null =
      null;
    api.cloud.connectContainer.mockReturnValue(
      new Promise((resolve) => {
        resolveTask = resolve;
      }),
    );
    const socket = new WechatSocketFactory(api).connect(
      {
        environmentId: "wizzard-trial-123456",
        kind: "wechat-cloud-container",
        path: "/ws",
        serviceName: "wizzard-room-server",
      },
      {
        onClose: vi.fn(),
        onError: vi.fn(),
        onMessage: vi.fn(),
        onOpen: vi.fn(),
      },
    );

    socket.close(1000, "disposed before connect");
    resolveTask?.({ socketTask: task });

    await vi.waitFor(() => {
      expect(task.close).toHaveBeenCalledWith({
        code: 1000,
        reason: "disposed before connect",
      });
    });
  });

  it("ignores a cloud rejection after its proxy was disposed", async () => {
    const task = createMockSocketTask();
    const api = createWechatApi(task);
    let rejectTask: ((reason: unknown) => void) | null = null;
    api.cloud.connectContainer.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectTask = reject;
      }),
    );
    const observer = {
      onClose: vi.fn(),
      onError: vi.fn(),
      onMessage: vi.fn(),
      onOpen: vi.fn(),
    };
    const socket = new WechatSocketFactory(api).connect(
      {
        environmentId: "wizzard-trial-123456",
        kind: "wechat-cloud-container",
        path: "/ws",
        serviceName: "wizzard-room-server",
      },
      observer,
    );

    await vi.waitFor(() => {
      expect(api.cloud.connectContainer).toHaveBeenCalledOnce();
    });
    socket.close(1000, "disposed before rejection");
    rejectTask?.(new Error("late cloud failure"));
    await Promise.resolve();
    await Promise.resolve();

    expect(observer.onError).not.toHaveBeenCalled();
    expect(observer.onClose).not.toHaveBeenCalled();
  });
});
