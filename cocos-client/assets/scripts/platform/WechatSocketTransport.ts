import type {
  SocketObserver,
  TextSocket,
  TextSocketFactory,
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

export type WechatPlatformApi = {
  connectSocket(options: {
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
  private opened = false;

  public constructor(
    private readonly task: WechatSocketTask,
    private readonly observer: SocketObserver,
  ) {
    task.onOpen(() => {
      this.opened = true;
      observer.onOpen();
    });
    task.onMessage((event) => {
      if (typeof event.data !== "string") {
        observer.onError(new Error("SOCKET_BINARY_MESSAGE_NOT_SUPPORTED"));
        return;
      }

      observer.onMessage(event.data);
    });
    task.onError((event) => {
      observer.onError(new Error(event.errMsg ?? "WECHAT_SOCKET_ERROR"));
    });
    task.onClose((event) => {
      this.closed = true;
      this.opened = false;
      observer.onClose({
        code: event.code ?? 1006,
        reason: event.reason ?? "",
      });
    });
  }

  public close(code?: number, reason?: string): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.task.close({ code, reason });
  }

  public send(text: string): boolean {
    if (!this.opened || this.closed) {
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
}

export class WechatSocketFactory implements TextSocketFactory {
  public constructor(private readonly api: WechatPlatformApi) {}

  public connect(
    url: string,
    observer: SocketObserver,
    protocol?: string,
  ): TextSocket {
    const task = this.api.connectSocket({
      ...(protocol ? { protocols: [protocol] } : {}),
      tcpNoDelay: true,
      url,
    });

    return new WechatTextSocket(task, observer);
  }
}
