import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROTOCOL_VERSION,
  type AvatarKey,
  type ClientRoomMessage,
  type FriendRoomSnapshot,
  type RoomPermissions,
  type RoomUpdatePayload,
} from "@wizzard/room-protocol";
import {
  createWebRoomClient,
  hasStoredWebRoomSession,
  WebRoomTabLease,
  type WebRoomClientOptions,
} from "../web/platform";
import type {
  RoomBinding,
  RoomSocketClient,
  RoomSocketConnectionState,
  RoomSocketEvent,
} from "../web/shared/RoomSocketClient";

export type FriendRoomState = Readonly<{
  connection: RoomSocketConnectionState;
  error: string | null;
  terminalError?: boolean;
  permissions: RoomPermissions | null;
  room: FriendRoomSnapshot | null;
  match: RoomUpdatePayload["match"];
}>;

const EMPTY_STATE: FriendRoomState = {
  connection: "disconnected",
  error: null,
  terminalError: false,
  match: null,
  permissions: null,
  room: null,
};

function toConnectionState(event: RoomSocketEvent): RoomSocketConnectionState {
  return event.type === "connection" ? event.state : "disconnected";
}

export function useFriendRoom(endpoint?: string) {
  const clientRef = useRef<RoomSocketClient | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [client, setClient] = useState<RoomSocketClient | null>(null);
  const [state, setState] = useState<FriendRoomState>(EMPTY_STATE);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const pendingCommandRef = useRef<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const tabIdRef = useRef(`web-tab-${Math.random().toString(36).slice(2)}`);
  const leaseRef = useRef(new WebRoomTabLease());

  const dispose = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    clientRef.current?.dispose();
    clientRef.current = null;
    setClient(null);
    channelRef.current?.close();
    channelRef.current = null;
    leaseRef.current.release();
    setState(EMPTY_STATE);
    pendingCommandRef.current = null;
    setPendingCommand(null);
  }, []);

  const attach = useCallback(
    (binding: RoomBinding) => {
      dispose();
      const client = createWebRoomClient({
        binding,
        ...(endpoint ? { endpoint } : {}),
      } satisfies WebRoomClientOptions);
      clientRef.current = client;
      setClient(client);
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("wizzard-room");
        channel.onmessage = (event) => {
          const message = event.data as { roomId?: unknown; tabId?: unknown; type?: unknown };
          const activeRoomId = client.getLatestUpdate()?.room.roomId;
          if (message.type === "room-active" && message.tabId !== tabIdRef.current && message.roomId === activeRoomId) {
            setState((current) => ({ ...current, error: "该房间已在另一个标签页打开" }));
          }
        };
        channelRef.current = channel;
      }
      unsubscribeRef.current = client.subscribe((event) => {
        if (event.type === "connection") {
          setState((current) => ({
            ...current,
            connection: event.state,
          }));
          return;
        }

        if (event.type === "error") {
          // Transport loss is not a negative acknowledgement. Keep the pending
          // command owned until its own ACK/rejection or an ended session.
          if (event.terminal || event.requestId === pendingCommandRef.current) {
            pendingCommandRef.current = null;
            setPendingCommand(null);
          }
          setState((current) => ({
            ...current,
            connection: client.getConnectionState(),
            error: event.message,
            terminalError: event.terminal === true,
          }));
          return;
        }

        if (event.payload.ackCommandId === pendingCommandRef.current) {
          pendingCommandRef.current = null;
          setPendingCommand(null);
        }
        if (!leaseRef.current.acquire(event.payload.room.roomId)) {
          setState((current) => ({ ...current, error: "该房间已在另一个标签页打开" }));
          return;
        }
        setState({
          connection: client.getConnectionState(),
          error: null,
          terminalError: false,
          match: event.payload.match,
          permissions: event.payload.permissions,
          room: event.payload.room,
        });
        channelRef.current?.postMessage({ roomId: event.payload.room.roomId, tabId: tabIdRef.current, type: "room-active" });
      });
      client.start();
      const leaseTimer = window.setInterval(() => leaseRef.current.renew(), 5_000);
      const previousDispose = unsubscribeRef.current;
      unsubscribeRef.current = () => {
        window.clearInterval(leaseTimer);
        previousDispose?.();
      };
    },
    [dispose, endpoint],
  );

  const send = useCallback((message: Omit<ClientRoomMessage, "requestId" | "v">) => {
    const client = clientRef.current;
    if (!client || client.getConnectionState() !== "connected" || pendingCommandRef.current) return false;
    const requestId = client.nextRequestId();
    pendingCommandRef.current = requestId;
    setPendingCommand(message.type);
    const sent = client.sendTracked({
      ...message,
      requestId,
      v: PROTOCOL_VERSION,
    } as ClientRoomMessage);
    if (!sent) { pendingCommandRef.current = null; setPendingCommand(null); }
    return sent;
  }, []);

  const createRoom = useCallback(
    (displayName: string, maxPlayers: 3 | 4 | 5 | 6 = 6, turnTimerEnabled = false) => {
      attach({
        payload: {
          avatarKey: "bamboo-cat",
          displayName,
          maxPlayers,
          mode: "quick",
          turnTimerEnabled,
        },
        type: "create",
      });
    },
    [attach],
  );

  const joinRoom = useCallback(
    (displayName: string, roomCode: string) => {
      attach({
        payload: {
          avatarKey: "bamboo-cat",
          displayName,
          roomCode,
        },
        type: "join",
      });
    },
    [attach],
  );

  useEffect(() => dispose, [dispose]);

  useEffect(() => {
    if (hasStoredWebRoomSession()) attach({ type: "resume" });
  }, [attach]);

  const leaveRoom = useCallback(async (): Promise<boolean> => {
    const activeClient = clientRef.current;
    if (!activeClient || activeClient.getConnectionState() !== "connected") return false;
    const requestId = activeClient.nextRequestId();
    const message = { payload: {}, requestId, type: "room.leave", v: PROTOCOL_VERSION } as ClientRoomMessage;
    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const unsubscribe = activeClient.subscribe((event) => {
        if (event.type === "update" && event.payload.ackCommandId === requestId) {
          settled = true;
          unsubscribe();
          resolve(true);
        }
        if (event.type === "error" && event.requestId === requestId) {
          settled = true;
          unsubscribe();
          resolve(false);
        }
      });
      if (!activeClient.sendTracked(message)) {
        unsubscribe();
        resolve(false);
      }
      window.setTimeout(() => {
        if (!settled) {
          unsubscribe();
          resolve(false);
        }
      }, 5_000);
    });
  }, []);

  return {
    createRoom,
    dispose,
    joinRoom,
    send,
    setAiCount: (aiCount: number) =>
      send({ payload: { aiCount }, type: "room.set-ai-count" }),
    setReady: (ready: boolean) =>
      send({ payload: { ready }, type: "room.set-ready" }),
    startRoom: (fillWithAi: boolean) =>
      send({ payload: { fillWithAi }, type: "room.start" }),
    leaveRoom,
    reconnect: () => clientRef.current?.reconnectNow() ?? false,
    clearEndedSession: () => clientRef.current?.clearEndedSession() ?? false,
    state,
    client,
    pendingCommand,
  };
}

export type FriendRoomController = ReturnType<typeof useFriendRoom>;

export type FriendRoomAvatar = AvatarKey;
