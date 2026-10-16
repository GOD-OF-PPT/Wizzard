import type {
  RoomBinding,
  RoomSocketClientOptions,
} from "./shared/RoomSocketClient";
import { RoomSocketClient } from "./shared/RoomSocketClient";
import type {
  RoomSessionStore,
  StoredRoomSession,
} from "./shared/SessionStore";
import type {
  SocketObserver,
  TextSocket,
  TextSocketFactory,
  TextSocketTarget,
} from "./shared/SocketTransport";

const SESSION_STORAGE_KEY = "wizzard.room-session.web.v1";
const TOKEN_PATTERN = /^[A-Za-z0-9._-]{16,512}$/;
const ROOM_CODE_PATTERN = /^\d{6}$/;
const TAB_LEASE_KEY = "wizzard.room-tab-lease.v1";

export class WebRoomSessionStore implements RoomSessionStore {
  public clear(): void {
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Private browsing can disable storage; the live connection still works.
    }
  }

  public load(): StoredRoomSession | null {
    try {
      const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<StoredRoomSession>;
      if (
        typeof value.playerId !== "string" ||
        typeof value.resumeToken !== "string" ||
        typeof value.roomCode !== "string" ||
        typeof value.roomId !== "string"
      ) {
        return null;
      }
      if (
        !TOKEN_PATTERN.test(value.resumeToken) ||
        !ROOM_CODE_PATTERN.test(value.roomCode) ||
        (value.inviteToken !== undefined && !TOKEN_PATTERN.test(value.inviteToken))
      ) {
        this.clear();
        return null;
      }
      return {
        ...(typeof value.inviteToken === "string"
          ? { inviteToken: value.inviteToken }
          : {}),
        playerId: value.playerId,
        resumeToken: value.resumeToken,
        roomCode: value.roomCode,
        roomId: value.roomId,
      };
    } catch {
      return null;
    }
  }

  public save(session: StoredRoomSession): void {
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // The current session remains usable without persistence.
    }
  }
}

export function hasStoredWebRoomSession(): boolean {
  return new WebRoomSessionStore().load() !== null;
}

export class WebRoomTabLease {
  private readonly tabId = `tab-${Math.random().toString(36).slice(2)}`;
  private roomId: string | null = null;

  public acquire(roomId: string, ttlMs = 15_000): boolean {
    const now = Date.now();
    try {
      const raw = window.localStorage.getItem(TAB_LEASE_KEY);
      const current = raw ? (JSON.parse(raw) as { expiresAt?: number; roomId?: string; tabId?: string }) : null;
      if (current && current.expiresAt && current.expiresAt > now && current.roomId === roomId && current.tabId !== this.tabId) return false;
      window.localStorage.setItem(TAB_LEASE_KEY, JSON.stringify({ expiresAt: now + ttlMs, roomId, tabId: this.tabId }));
      this.roomId = roomId;
      return true;
    } catch {
      return true;
    }
  }

  public renew(ttlMs = 15_000): void {
    if (this.roomId) this.acquire(this.roomId, ttlMs);
  }

  public release(): void {
    try {
      const raw = window.localStorage.getItem(TAB_LEASE_KEY);
      const current = raw ? (JSON.parse(raw) as { tabId?: string }) : null;
      if (current?.tabId === this.tabId) window.localStorage.removeItem(TAB_LEASE_KEY);
    } catch {
      // Storage may be unavailable in private browsing.
    }
    this.roomId = null;
  }
}

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
    if (this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(text);
    return true;
  }
}

export class InternalBrowserSocketFactory implements TextSocketFactory {
  public connect(
    target: TextSocketTarget,
    observer: SocketObserver,
  ): TextSocket {
    if (target.kind !== "websocket") {
      throw new Error("WEB_RUNTIME_REQUIRES_WEBSOCKET_TARGET");
    }

    const resolvedUrl = target.url.startsWith("/")
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${target.url}`
      : target.url;
    const socket = target.protocol
      ? new WebSocket(resolvedUrl, target.protocol)
      : new WebSocket(resolvedUrl);
    socket.addEventListener("open", observer.onOpen);
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") {
        observer.onError(new Error("SOCKET_BINARY_MESSAGE_NOT_SUPPORTED"));
        return;
      }
      observer.onMessage(event.data);
    });
    socket.addEventListener("error", () =>
      observer.onError(new Error("SOCKET_TRANSPORT_ERROR")),
    );
    socket.addEventListener("close", (event) =>
      observer.onClose({ code: event.code, reason: event.reason }),
    );
    return new BrowserTextSocket(socket);
  }
}

export type WebRoomClientOptions = Pick<
  RoomSocketClientOptions,
  "reconnectBaseMs" | "reconnectMaxMs"
> & {
  binding: RoomBinding;
  endpoint?: string;
};

export function createWebRoomClient({
  binding,
  endpoint,
  reconnectBaseMs,
  reconnectMaxMs,
}: WebRoomClientOptions): RoomSocketClient {
  const resolvedEndpoint = endpoint ?? "/ws";
  return new RoomSocketClient({
    binding,
    ...(reconnectBaseMs === undefined ? {} : { reconnectBaseMs }),
    ...(reconnectMaxMs === undefined ? {} : { reconnectMaxMs }),
    sessionStore: new WebRoomSessionStore(),
    socketFactory: new InternalBrowserSocketFactory(),
    target: { kind: "websocket", url: resolvedEndpoint, protocol: "wizzard.v1" },
  });
}
