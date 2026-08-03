import {
  createMatch,
  createPlayerSnapshot,
} from "@wizzard/game-core/authority";
import {
  decodeClientMessage,
  encodeServerMessage,
  PROTOCOL_VERSION,
  type RoomUpdatePayload,
  type ServerRoomMessage,
} from "@wizzard/room-protocol";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkMatchAdapter } from "../assets/scripts/adapters/NetworkMatchAdapter";
import type { MatchUpdate } from "../assets/scripts/adapters/IMatchAdapter";
import {
  RoomSocketClient,
  type RoomSocketClientOptions,
} from "../assets/scripts/network/RoomSocketClient";
import { MemoryRoomSessionStore } from "../assets/scripts/platform/SessionStore";
import type {
  SocketObserver,
  TextSocket,
  TextSocketFactory,
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

  public serverClose(): void {
    this.observer.onClose({ code: 1006, reason: "network changed" });
  }
}

class FakeSocketFactory implements TextSocketFactory {
  public readonly sockets: FakeTextSocket[] = [];

  public connect(_url: string, observer: SocketObserver): TextSocket {
    const socket = new FakeTextSocket(observer);
    this.sockets.push(socket);
    observer.onOpen();
    return socket;
  }
}

function createMatchUpdate(
  streamId: string,
  updateId: number,
  ackCommandId?: string,
): RoomUpdatePayload {
  const playerSeeds = [
    {
      avatarKey: "bamboo-cat",
      id: "player-self",
      isHuman: true,
      name: "Self",
    },
    {
      avatarKey: "wandering-crane",
      id: "player-two",
      isHuman: true,
      name: "Two",
    },
    {
      avatarKey: "flower-fox",
      id: "player-three",
      isHuman: true,
      name: "Three",
    },
  ];
  const state = createMatch(
    { matchId: "match-network-test", mode: "quick", players: playerSeeds },
    () => 0.42,
  );

  return {
    ...(ackCommandId ? { ackCommandId } : {}),
    match: {
      events: [],
      snapshot: createPlayerSnapshot(state, "player-self"),
      turnDeadlineAt: SERVER_TIME + 30_000,
    },
    permissions: {
      canContinueRound: true,
      canRematch: true,
      canSetReady: false,
      canStart: false,
    },
    room: {
      createdAt: SERVER_TIME - 10_000,
      hostPlayerId: "player-self",
      maxPlayers: 3,
      mode: "quick",
      phase: "playing",
      players: playerSeeds.map((player, index) => ({
        avatarKey: player.avatarKey as
          | "bamboo-cat"
          | "wandering-crane"
          | "flower-fox",
        connected: true,
        isAi: false,
        joinedAt: SERVER_TIME - 9_000 + index,
        name: player.name,
        playerId: player.id,
        ready: true,
      })),
      revision: updateId,
      roomCode: "ABC234",
      roomId: "room-network-test",
      selfPlayerId: "player-self",
      updatedAt: SERVER_TIME,
    },
    streamId,
    updateId,
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

function establishSession(
  requestId: string,
  update: RoomUpdatePayload,
): ServerRoomMessage {
  return {
    requestId,
    serverTime: SERVER_TIME,
    session: {
      inviteToken: "invite-token-123456789",
      playerId: "player-self",
      resumeToken: "resume-token-123456789",
      roomCode: "ABC234",
      roomId: "room-network-test",
    },
    type: "session.established",
    update,
    v: PROTOCOL_VERSION,
  };
}

function decodeSent(socket: FakeTextSocket, index: number) {
  const result = decodeClientMessage(socket.sent[index]);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}

describe("NetworkMatchAdapter", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resumes with an exact pending intent and never advances at countdown zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(SERVER_TIME);
    vi.spyOn(Math, "random").mockReturnValue(0);
    const socketFactory = new FakeSocketFactory();
    const options: RoomSocketClientOptions = {
      binding: {
        payload: {
          avatarKey: "bamboo-cat",
          displayName: "Self",
          maxPlayers: 3,
          mode: "quick",
        },
        type: "create",
      },
      endpoint: "ws://127.0.0.1:8787",
      sessionStore: new MemoryRoomSessionStore(),
      socketFactory,
    };
    const adapter = new NetworkMatchAdapter(new RoomSocketClient(options));
    let latest: MatchUpdate | null = null;
    adapter.start((update) => {
      latest = update;
    });

    const firstSocket = socketFactory.sockets[0];
    firstSocket.receive(connectionReady("stream-one"));
    const createMessage = decodeSent(firstSocket, 0);
    expect(createMessage.type).toBe("room.create");
    firstSocket.receive(
      establishSession(
        createMessage.requestId,
        createMatchUpdate("stream-one", 1),
      ),
    );
    expect(latest?.connection).toBe("connected");
    expect(latest?.snapshot.privateState.playerId).toBe("player-self");

    adapter.submitIntent({ bid: 0, type: "submit-bid" });
    const firstIntent = decodeSent(firstSocket, 1);
    expect(firstIntent.type).toBe("match.intent");
    if (firstIntent.type !== "match.intent") {
      throw new Error("MATCH_INTENT_NOT_SENT");
    }
    expect(firstIntent.requestId).toBe(firstIntent.payload.intent.commandId);
    expect("playerId" in firstIntent.payload.intent).toBe(false);

    const sentBeforeCountdown = firstSocket.sent.length;
    adapter.update(35);
    expect(firstSocket.sent).toHaveLength(sentBeforeCountdown);
    expect(latest?.turnSecondsRemaining).toBe(0);
    adapter.submitIntent({ bid: 1, type: "submit-bid" });
    expect(firstSocket.sent).toHaveLength(sentBeforeCountdown);

    firstSocket.serverClose();
    expect(latest?.connection).toBe("reconnecting");
    vi.advanceTimersByTime(500);
    const secondSocket = socketFactory.sockets[1];
    secondSocket.receive(connectionReady("stream-two"));
    const resumeMessage = decodeSent(secondSocket, 0);
    expect(resumeMessage.type).toBe("session.resume");
    secondSocket.receive(
      establishSession(
        resumeMessage.requestId,
        createMatchUpdate("stream-two", 1),
      ),
    );

    const retriedIntent = decodeSent(secondSocket, 1);
    expect(retriedIntent).toEqual(firstIntent);
    secondSocket.receive({
      ...createMatchUpdate("stream-two", 2, firstIntent.requestId),
      serverTime: SERVER_TIME,
      type: "room.update",
      v: PROTOCOL_VERSION,
    });

    adapter.submitIntent({ bid: 1, type: "submit-bid" });
    const nextIntent = decodeSent(secondSocket, 2);
    expect(nextIntent.type).toBe("match.intent");
    expect(nextIntent.requestId.startsWith("stream-two:")).toBe(true);
    adapter.dispose();
  });

  it("blocks a new intent after the server countdown reaches zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(SERVER_TIME);
    const socketFactory = new FakeSocketFactory();
    const adapter = new NetworkMatchAdapter(
      new RoomSocketClient({
        binding: {
          payload: {
            avatarKey: "bamboo-cat",
            displayName: "Self",
            maxPlayers: 3,
            mode: "quick",
          },
          type: "create",
        },
        endpoint: "ws://127.0.0.1:8787",
        sessionStore: new MemoryRoomSessionStore(),
        socketFactory,
      }),
    );
    adapter.start(() => undefined);
    const socket = socketFactory.sockets[0];
    socket.receive(connectionReady("deadline-stream"));
    const createMessage = decodeSent(socket, 0);
    socket.receive(
      establishSession(
        createMessage.requestId,
        createMatchUpdate("deadline-stream", 1),
      ),
    );

    adapter.update(30);
    const sentAtDeadline = socket.sent.length;
    adapter.submitIntent({ bid: 0, type: "submit-bid" });
    expect(socket.sent).toHaveLength(sentAtDeadline);
    adapter.dispose();
  });
});
