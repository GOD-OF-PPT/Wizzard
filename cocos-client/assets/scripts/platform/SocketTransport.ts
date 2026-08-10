export type SocketCloseInfo = {
  code: number;
  reason: string;
};

export type SocketObserver = {
  onClose(info: SocketCloseInfo): void;
  onError(error: Error): void;
  onMessage(text: string): void;
  onOpen(): void;
};

export type TextSocketTarget =
  | {
      kind: "websocket";
      protocol?: string;
      url: string;
    }
  | {
      environmentId: string;
      kind: "wechat-cloud-container";
      path: string;
      serviceName: string;
    };

export interface TextSocket {
  close(code?: number, reason?: string): void;
  send(text: string): boolean;
}

export interface TextSocketFactory {
  connect(target: TextSocketTarget, observer: SocketObserver): TextSocket;
}
