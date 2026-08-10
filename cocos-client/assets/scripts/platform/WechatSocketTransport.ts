import type {
  SocketObserver,
  TextSocket,
  TextSocketFactory,
  TextSocketTarget,
} from "./SocketTransport";

type WechatSocketTask = {
  close(options?: { code?: number; reason?: string }): void;
  onClose(listener: (event: { code?: number; reason?: string }) => void): void;
  onError(listener: (event: { errMsg?: string }) => void): void;
  onMessage(listener: (event: { data: unknown }) => void): void;
  onOpen(listener: () => void): void;
  send(options: {
    data: string;
    fail?: (error: { errMsg?: string }) => void;
  }): void;
};

type WechatCloudApi = {
  connectContainer(options: {
    config: { env: string };
    path: string;
    service: string;
  }): Promise<{ socketTask: WechatSocketTask }>;
  init(options: { traceUser: boolean }): Promise<unknown> | unknown;
};

export type WechatPlatformApi = {
  cloud?: Partial<WechatCloudApi>;
  connectSocket?(options: {
    protocols?: string[];
    tcpNoDelay?: boolean;
    url: string;
  }): WechatSocketTask;
  getStorageSync(key: string): unknown;
  removeStorageSync(key: string): void;
  setClipboardData?(options: {
    data: string;
    fail?: (error: { errMsg?: string }) => void;
    success?: () => void;
  }): void;
  setStorageSync(key: string, value: unknown): void;
  vibrateShort?(options: {
    fail?: (error: { errMsg?: string }) => void;
    success?: () => void;
    type?: "heavy" | "light" | "medium";
  }): void;
};

class WechatTextSocket implements TextSocket {
  private closed = false;
  private closeNotified = false;
  private opened = false;
  private pendingClose: { code?: number; reason?: string } | null = null;
  private task: WechatSocketTask | null = null;

  public constructor(
    task: Promise<WechatSocketTask> | WechatSocketTask,
    private readonly observer: SocketObserver,
  ) {
    if (typeof (task as Promise<WechatSocketTask>).then === "function") {
      void Promise.resolve(task).then(
        (resolvedTask) => this.attach(resolvedTask),
        (error: unknown) => this.failConnection(error),
      );
      return;
    }

    this.attach(task as WechatSocketTask);
  }

  public close(code?: number, reason?: string): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.opened = false;
    this.pendingClose = { code, reason };
    this.task?.close(this.pendingClose);
  }

  public send(text: string): boolean {
    if (!this.task || !this.opened || this.closed) {
      return false;
    }

    this.task.send({
      data: text,
      fail: (error) => {
        this.observer.onError(
          new Error(error.errMsg ?? "WECHAT_SOCKET_SEND_ERROR"),
        );
      },
    });
    return true;
  }

  private attach(task: WechatSocketTask): void {
    this.task = task;
    task.onOpen(() => {
      if (this.closed) {
        return;
      }

      this.opened = true;
      this.observer.onOpen();
    });
    task.onMessage((event) => {
      if (typeof event.data !== "string") {
        this.observer.onError(
          new Error("SOCKET_BINARY_MESSAGE_NOT_SUPPORTED"),
        );
        return;
      }

      this.observer.onMessage(event.data);
    });
    task.onError((event) => {
      this.observer.onError(
        new Error(event.errMsg ?? "WECHAT_SOCKET_ERROR"),
      );
    });
    task.onClose((event) => {
      this.closed = true;
      this.opened = false;
      this.notifyClose({
        code: event.code ?? 1006,
        reason: event.reason ?? "",
      });
    });

    if (this.closed) {
      task.close(this.pendingClose ?? undefined);
    }
  }

  private failConnection(error: unknown): void {
    if (this.closed) {
      return;
    }

    const normalized =
      error instanceof Error
        ? error
        : new Error(
            typeof error === "object" &&
              error !== null &&
              "errMsg" in error &&
              typeof error.errMsg === "string"
              ? error.errMsg
              : String(error),
          );

    this.observer.onError(normalized);
    this.closed = true;
    this.opened = false;
    this.notifyClose({ code: 1006, reason: normalized.message.slice(0, 123) });
  }

  private notifyClose(info: { code: number; reason: string }): void {
    if (this.closeNotified) {
      return;
    }

    this.closeNotified = true;
    this.observer.onClose(info);
  }
}

export class WechatSocketFactory implements TextSocketFactory {
  private cloudInitPromise: Promise<void> | null = null;

  public constructor(private readonly api: WechatPlatformApi) {}

  public connect(
    target: TextSocketTarget,
    observer: SocketObserver,
  ): TextSocket {
    if (target.kind === "wechat-cloud-container") {
      return new WechatTextSocket(this.connectCloudContainer(target), observer);
    }

    if (!this.api.connectSocket) {
      throw new Error("WECHAT_CONNECT_SOCKET_UNAVAILABLE");
    }

    const task = this.api.connectSocket({
      ...(target.protocol ? { protocols: [target.protocol] } : {}),
      tcpNoDelay: true,
      url: target.url,
    });

    return new WechatTextSocket(task, observer);
  }

  private async connectCloudContainer(
    target: Extract<TextSocketTarget, { kind: "wechat-cloud-container" }>,
  ): Promise<WechatSocketTask> {
    const cloud = this.api.cloud;
    if (
      !cloud ||
      typeof cloud.init !== "function" ||
      typeof cloud.connectContainer !== "function"
    ) {
      throw new Error("WECHAT_CLOUD_CONTAINER_UNAVAILABLE");
    }

    if (!this.cloudInitPromise) {
      const initAttempt = Promise.resolve(cloud.init({ traceUser: true })).then(
        () => undefined,
      );
      this.cloudInitPromise = initAttempt.catch((error: unknown) => {
        this.cloudInitPromise = null;
        throw error;
      });
    }

    await this.cloudInitPromise;
    const result = await cloud.connectContainer({
      config: { env: target.environmentId },
      path: target.path,
      service: target.serviceName,
    });

    if (!result?.socketTask) {
      throw new Error("WECHAT_CLOUD_CONTAINER_SOCKET_TASK_MISSING");
    }

    return result.socketTask;
  }
}
