import type {
  SocketObserver,
  TextSocket,
  TextSocketFactory,
  TextSocketTarget,
} from "./SocketTransport";

class BrowserTextSocket implements TextSocket {
  public constructor(private readonly socket: WebSocket) {}

  public close(code?: number, reason?: string): void {
    if (
      this.socket.readyState === WebSocket.CLOSED ||
      this.socket.readyState === WebSocket.CLOSING
    ) {
      return;
    }

    this.socket.close(code, reason);
  }

  public send(text: string): boolean {
    if (this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.socket.send(text);
    return true;
  }
}

export class BrowserSocketFactory implements TextSocketFactory {
  public connect(
    target: TextSocketTarget,
    observer: SocketObserver,
  ): TextSocket {
    if (target.kind !== "websocket") {
      throw new Error("BROWSER_CLOUD_CONTAINER_NOT_AVAILABLE");
    }

    const socket = target.protocol
      ? new WebSocket(target.url, target.protocol)
      : new WebSocket(target.url);

    socket.addEventListener("open", () => observer.onOpen());
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") {
        observer.onError(new Error("SOCKET_BINARY_MESSAGE_NOT_SUPPORTED"));
        return;
      }

      observer.onMessage(event.data);
    });
    socket.addEventListener("error", () => {
      observer.onError(new Error("BROWSER_WEBSOCKET_ERROR"));
    });
    socket.addEventListener("close", (event) => {
      observer.onClose({ code: event.code, reason: event.reason });
    });

    return new BrowserTextSocket(socket);
  }
}
