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

export interface TextSocket {
  close(code?: number, reason?: string): void;
  send(text: string): boolean;
}

export interface TextSocketFactory {
  connect(
    url: string,
    observer: SocketObserver,
    protocol?: string,
  ): TextSocket;
}
