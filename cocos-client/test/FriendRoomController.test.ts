import {
  decodeClientMessage,
  encodeServerMessage,
  PROTOCOL_VERSION,
  type RoomUpdatePayload,
  type ServerRoomMessage,
} from "@wizzard/room-protocol";
import { describe, expect, it } from "vitest";
import {
  FriendRoomController,
  type RoomClientFactory,
} from "../assets/scripts/controllers/FriendRoomController";
import {
  RoomSocketClient,
  type RoomBinding,
} from "../assets/scripts/network/RoomSocketClient";
import { MemoryRoomSessionStore } from "../assets/scripts/platform/SessionStore";
import type {
  SocketObserver,
  TextSocket,
  TextSocketFactory,
  TextSocketTarget,
} from "../assets/scripts/platform/SocketTransport";

const SERVER_TIME = 2_000_000;

class FakeTextSocket implements TextSocket {
  public readonly sent: string[] = [];

  public constructor(private readonly observer: SocketObserver) {}

  public close(): void {}

  public receive(message: ServerRoomMessage): void {
    this.observer.onMessage(encodeServerMessage(message));
  }

  public send(text: string): boolean {
    this.sent.push(text);
    return true;
  }
}

class FakeSocketFactory implements TextSocketFactory {
  public readonly sockets: FakeTextSocket[] = [];

  public connect(_target: TextSocketTarget, observer: SocketObserver): TextSocket {
    const socket = new FakeTextSocket(observer);
    this.sockets.push(socket);
    observer.onOpen();
    return socket;
  }
}

type ControllerHarness = {
  bindings: RoomBinding[];
  clients: RoomSocketClient[];
  controller: FriendRoomController;
  sessionStore: MemoryRoomSessionStore;
  socketFactory: FakeSocketFactory;
};

function createHarness(): ControllerHarness {
  const bindings: RoomBinding[] = [];
  const clients: RoomSocketClient[] = [];
  const sessionStore = new MemoryRoomSessionStore();
  const socketFactory = new FakeSocketFactory();
  const roomClientFactory: RoomClientFactory = (binding) => {
    bindings.push(binding);
    const client = new RoomSocketClient({
      binding,
      sessionStore,
      socketFactory,
      target: { kind: "websocket", url: "ws://127.0.0.1:8787/ws" },
    });
    clients.push(client);
    return client;
  };

  return {
    bindings,
    clients,
    controller: new FriendRoomController(roomClientFactory),
    sessionStore,
    socketFactory,
  };
}

function connectionReady(streamId: string): ServerRoomMessage {
  return {
    heartbeatIntervalMs: 10_000,
    serverTime: SERVER_TIME,
    streamId,
    type: "connection.ready",
    v: PROTOCOL_VERSION,
  };
}

function createRoomUpdate(
  streamId: string,
  updateId: number,
  options: {
    ackCommandId?: string;
    hostPlayerId?: string;
    phase?: "lobby" | "playing" | "finished";
    players?: RoomUpdatePayload["room"]["players"];
  } = {},
): RoomUpdatePayload {
  return {
    ...(options.ackCommandId
      ? { ackCommandId: options.ackCommandId }
      : {}),
    match: null,
    permissions: {
      canContinueRound: false,
      canRematch: options.phase === "finished",
      canSetReady: (options.phase ?? "lobby") === "lobby",
      canStart:
        (options.phase ?? "lobby") === "lobby" &&
        (options.hostPlayerId ?? "player-self") === "player-self",
    },
    room: {
      createdAt: SERVER_TIME - 10_000,
      hostPlayerId: options.hostPlayerId ?? "player-self",
      maxPlayers: 3,
      mode: "quick",
      phase: options.phase ?? "lobby",
      players:
        options.players ??
        [
          {
            avatarKey: "bamboo-cat",
            connected: true,
            isAi: false,
            joinedAt: SERVER_TIME - 9_000,
            name: "Self",
            playerId: "player-self",
            ready: false,
          },
        ],
      revision: updateId,
      roomCode: "ABC234",
      roomId: "room-controller-test",
      selfPlayerId: "player-self",
      updatedAt: SERVER_TIME,
    },
    streamId,
    updateId,
  };
}

function establishSession(
  requestId: string,
  update: RoomUpdatePayload,
): ServerRoomMessage {
  return {
    requestId,
    serverTime: SERVER_TIME,
    session: {
      playerId: "player-self",
      resumeToken: "resume-token-123456789",
      roomCode: "ABC234",
      roomId: "room-controller-test",
    },
    type: "session.established",
    update,
    v: PROTOCOL_VERSION,
  };
}

function decodeSent(socket: FakeTextSocket, index: number) {
  const decoded = decodeClientMessage(socket.sent[index]);
  if (!decoded.ok) {
    throw new Error(decoded.error);
  }
  return decoded.value;
}

function establishBoundRoom(
  harness: ControllerHarness,
  streamId: string,
): FakeTextSocket {
  const socket = harness.socketFactory.sockets[0];
  socket.receive(connectionReady(streamId));
  const bindingMessage = decodeSent(socket, 0);
  socket.receive(
    establishSession(
      bindingMessage.requestId,
      createRoomUpdate(streamId, 1),
    ),
  );
  return socket;
}

describe("FriendRoomController", () => {
  it("normalizes entry input before creating a socket binding", () => {
    const harness = createHarness();

    expect(
      harness.controller.joinRoom({
        avatarKey: "bamboo-cat",
        displayName: "   ",
        roomCode: "123456",
      }),
    ).toBe(false);
    expect(harness.controller.state.error?.code).toBe("NAME_INVALID");
    expect(harness.bindings).toHaveLength(0);

    expect(
      harness.controller.joinRoom({
        avatarKey: "bamboo-cat",
        displayName: "Self",
        roomCode: "12345A",
      }),
    ).toBe(false);
    expect(harness.controller.state.error?.code).toBe("ROOM_CODE_INVALID");
    expect(harness.bindings).toHaveLength(0);

    expect(
      harness.controller.joinRoom({
        avatarKey: "bamboo-cat",
        displayName: "  Self  ",
        roomCode: " 123456 ",
      }),
    ).toBe(true);
    expect(harness.bindings).toEqual([
      {
        payload: {
          avatarKey: "bamboo-cat",
          displayName: "Self",
          roomCode: "123456",
        },
        type: "join",
      },
    ]);
    harness.controller.dispose();
  });

  it("deduplicates ready and start commands until ack or request error", () => {
    const harness = createHarness();
    expect(
      harness.controller.createRoom({
        avatarKey: "bamboo-cat",
        displayName: "  Self  ",
        maxPlayers: 3,
        mode: "quick",
      }),
    ).toBe(true);
    const socket = establishBoundRoom(harness, "controller-stream");
    expect(harness.controller.state.connection).toBe("connected");
    expect(harness.controller.state.pending.binding).toBeNull();
    expect(decodeSent(socket, 0)).toMatchObject({
      payload: { displayName: "Self" },
      type: "room.create",
    });

    expect(harness.controller.setReady(true)).toBe(true);
    expect(harness.controller.setReady(false)).toBe(false);
    expect(harness.controller.leaveRoom()).toBe(false);
    expect(harness.controller.state.pending.ready).toBe(true);
    const readyMessage = decodeSent(socket, 1);
    expect(readyMessage.type).toBe("room.set-ready");

    socket.receive({
      ...createRoomUpdate("controller-stream", 2, {
        ackCommandId: readyMessage.requestId,
      }),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });
    expect(harness.controller.state.pending.ready).toBe(false);

    expect(harness.controller.startRoom(true)).toBe(true);
    expect(harness.controller.startRoom(false)).toBe(false);
    expect(harness.controller.leaveRoom()).toBe(false);
    expect(harness.controller.state.pending.start).toBe(true);
    const startMessage = decodeSent(socket, 2);
    expect(startMessage.type).toBe("room.start");
    socket.receive({
      code: "PLAYERS_NOT_READY",
      message: "All human players must be ready.",
      requestId: startMessage.requestId,
      serverTime: SERVER_TIME,
      type: "request.error",
      v: PROTOCOL_VERSION,
    });
    expect(harness.controller.state.pending.start).toBe(false);
    expect(harness.controller.state.error).toMatchObject({
      code: "PLAYERS_NOT_READY",
      requestId: startMessage.requestId,
    });
    harness.controller.dispose();
  });

  it("tracks AI-count commands and serializes every lobby mutation", () => {
    const harness = createHarness();
    expect(
      harness.controller.createRoom({
        avatarKey: "bamboo-cat",
        displayName: "Self",
        maxPlayers: 3,
        mode: "quick",
      }),
    ).toBe(true);
    const socket = establishBoundRoom(harness, "ai-controller-stream");
    socket.receive({
      ...createRoomUpdate("ai-controller-stream", 2, {
        players: [
          {
            avatarKey: "bamboo-cat",
            connected: true,
            isAi: false,
            joinedAt: SERVER_TIME - 9_000,
            name: "Self",
            playerId: "player-self",
            ready: false,
          },
          {
            avatarKey: "flower-fox",
            connected: true,
            isAi: false,
            joinedAt: SERVER_TIME - 8_000,
            name: "Friend",
            playerId: "player-friend",
            ready: false,
          },
        ],
      }),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });

    expect(harness.controller.setAiCount(1)).toBe(true);
    expect(harness.controller.state.pending.ai).toBe(true);
    expect(harness.controller.setAiCount(0)).toBe(false);
    expect(harness.controller.setReady(true)).toBe(false);
    expect(harness.controller.startRoom(true)).toBe(false);
    expect(harness.controller.leaveRoom()).toBe(false);
    const aiMessage = decodeSent(socket, 1);
    expect(aiMessage).toMatchObject({
      payload: { aiCount: 1 },
      type: "room.set-ai-count",
    });

    socket.receive({
      ...createRoomUpdate("ai-controller-stream", 3, {
        ackCommandId: aiMessage.requestId,
      }),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });
    expect(harness.controller.state.pending.ai).toBe(false);

    expect(harness.controller.setReady(true)).toBe(true);
    expect(harness.controller.setAiCount(1)).toBe(false);
    expect(harness.controller.startRoom(true)).toBe(false);
    expect(harness.controller.leaveRoom()).toBe(false);
    const readyMessage = decodeSent(socket, 2);
    socket.receive({
      ...createRoomUpdate("ai-controller-stream", 4, {
        ackCommandId: readyMessage.requestId,
      }),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });

    expect(harness.controller.startRoom(true)).toBe(true);
    expect(harness.controller.setAiCount(1)).toBe(false);
    expect(harness.controller.setReady(false)).toBe(false);
    expect(harness.controller.leaveRoom()).toBe(false);
    harness.controller.dispose();
  });

  it("rejects unauthorized AI counts and clears pending AI on request error", () => {
    const harness = createHarness();
    expect(
      harness.controller.createRoom({
        avatarKey: "bamboo-cat",
        displayName: "Self",
        maxPlayers: 3,
        mode: "quick",
      }),
    ).toBe(true);
    const socket = establishBoundRoom(harness, "ai-error-stream");

    expect(harness.controller.setAiCount(-1)).toBe(false);
    expect(harness.controller.setAiCount(3)).toBe(false);
    expect(harness.controller.setAiCount(1)).toBe(true);
    const aiMessage = decodeSent(socket, 1);
    socket.receive({
      code: "NOT_ENOUGH_PLAYERS",
      message: "At least two connected human players are required.",
      requestId: aiMessage.requestId,
      serverTime: SERVER_TIME,
      type: "request.error",
      v: PROTOCOL_VERSION,
    });
    expect(harness.controller.state.pending.ai).toBe(false);
    expect(harness.controller.state.error).toMatchObject({
      code: "NOT_ENOUGH_PLAYERS",
      requestId: aiMessage.requestId,
    });

    socket.receive({
      ...createRoomUpdate("ai-error-stream", 2, {
        hostPlayerId: "player-host",
        players: [
          {
            avatarKey: "flower-fox",
            connected: true,
            isAi: false,
            joinedAt: SERVER_TIME - 9_000,
            name: "Host",
            playerId: "player-host",
            ready: false,
          },
          {
            avatarKey: "bamboo-cat",
            connected: true,
            isAi: false,
            joinedAt: SERVER_TIME - 8_000,
            name: "Self",
            playerId: "player-self",
            ready: false,
          },
        ],
      }),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });
    expect(harness.controller.setAiCount(1)).toBe(false);
    expect(socket.sent).toHaveLength(2);
    harness.controller.dispose();
  });

  it("leaves a lobby once, then clears the room session after the server ack", () => {
    const harness = createHarness();
    expect(
      harness.controller.createRoom({
        avatarKey: "bamboo-cat",
        displayName: "Self",
        maxPlayers: 6,
        mode: "classic",
      }),
    ).toBe(true);
    const socket = establishBoundRoom(harness, "leave-controller-stream");
    expect(harness.sessionStore.load()).not.toBeNull();

    expect(harness.controller.leaveRoom()).toBe(true);
    expect(harness.controller.leaveRoom()).toBe(false);
    expect(harness.controller.state.pending.leave).toBe(true);
    const leaveMessage = decodeSent(socket, 1);
    expect(leaveMessage).toMatchObject({ payload: {}, type: "room.leave" });

    socket.receive({
      ...createRoomUpdate("leave-controller-stream", 2, {
        ackCommandId: leaveMessage.requestId,
      }),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });

    expect(harness.controller.state.pending.leave).toBe(false);
    expect(harness.controller.state.update).toBeNull();
    expect(harness.controller.state.connection).toBe("disconnected");
    expect(harness.controller.getRoomClient()).toBeNull();
    expect(harness.sessionStore.load()).toBeNull();
    harness.controller.dispose();
  });

  it("keeps the lobby session when a leave request is rejected", () => {
    const harness = createHarness();
    expect(
      harness.controller.createRoom({
        avatarKey: "bamboo-cat",
        displayName: "Self",
        maxPlayers: 3,
        mode: "quick",
      }),
    ).toBe(true);
    const socket = establishBoundRoom(harness, "leave-rejected-stream");
    const activeClient = harness.controller.getRoomClient();

    expect(harness.controller.leaveRoom()).toBe(true);
    const leaveMessage = decodeSent(socket, 1);
    socket.receive({
      code: "WRONG_ROOM_PHASE",
      message: "Room cannot be left in this phase.",
      requestId: leaveMessage.requestId,
      serverTime: SERVER_TIME,
      type: "request.error",
      v: PROTOCOL_VERSION,
    });

    expect(harness.controller.state.pending.leave).toBe(false);
    expect(harness.controller.state.update?.room.roomCode).toBe("ABC234");
    expect(harness.controller.getRoomClient()).toBe(activeClient);
    expect(harness.sessionStore.load()).not.toBeNull();
    harness.controller.dispose();
  });

  it("retains one subscribed client across playing and rematch lobby updates", () => {
    const harness = createHarness();
    harness.sessionStore.save({
      playerId: "player-self",
      resumeToken: "resume-token-123456789",
      roomCode: "ABC234",
      roomId: "room-controller-test",
    });

    expect(harness.controller.resumeRoom()).toBe(true);
    expect(harness.bindings).toEqual([{ type: "resume" }]);
    const socket = establishBoundRoom(harness, "resume-stream");
    const activeClient = harness.controller.getRoomClient();
    expect(activeClient).toBe(harness.clients[0]);

    socket.receive({
      ...createRoomUpdate("resume-stream", 2, { phase: "playing" }),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });
    expect(harness.controller.state.update?.room.phase).toBe("playing");
    expect(harness.controller.getRoomClient()).toBe(activeClient);

    socket.receive({
      ...createRoomUpdate("resume-stream", 3, { phase: "lobby" }),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });
    expect(harness.controller.state.update?.room.phase).toBe("lobby");
    expect(harness.controller.getRoomClient()).toBe(activeClient);
    expect(harness.socketFactory.sockets).toHaveLength(1);
    harness.controller.dispose();
  });

  it("does not leak a subscription when cached replay disposes synchronously", () => {
    const sessionStore = new MemoryRoomSessionStore();
    const socketFactory = new FakeSocketFactory();
    const existingClient = new RoomSocketClient({
      binding: {
        payload: {
          avatarKey: "bamboo-cat",
          displayName: "Self",
          maxPlayers: 3,
          mode: "quick",
        },
        type: "create",
      },
      sessionStore,
      socketFactory,
      target: { kind: "websocket", url: "ws://127.0.0.1:8787/ws" },
    });
    existingClient.start();
    const socket = socketFactory.sockets[0];
    socket.receive(connectionReady("cached-stream"));
    const createMessage = decodeSent(socket, 0);
    socket.receive(
      establishSession(
        createMessage.requestId,
        createRoomUpdate("cached-stream", 1),
      ),
    );

    const controller = new FriendRoomController(() => existingClient);
    let notificationCount = 0;
    controller.subscribe((state) => {
      notificationCount += 1;
      if (state.update) {
        controller.dispose();
      }
    });

    expect(
      controller.createRoom({
        avatarKey: "bamboo-cat",
        displayName: "Self",
        maxPlayers: 3,
        mode: "quick",
      }),
    ).toBe(false);
    expect(controller.getRoomClient()).toBeNull();
    const notificationsAfterDispose = notificationCount;
    socket.receive({
      ...createRoomUpdate("cached-stream", 2),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });
    expect(notificationCount).toBe(notificationsAfterDispose);
  });
});
