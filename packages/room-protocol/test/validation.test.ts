import {
  createMatch,
  createPlayerSnapshot,
} from "@wizzard/game-core/authority";
import type {
  MatchPlayerSeed,
  RandomSource,
} from "@wizzard/game-core/contracts";
import { describe, expect, it } from "vitest";
import {
  decodeClientMessage,
  decodeServerMessage,
  encodeClientMessage,
  encodeServerMessage,
  ProtocolEncodeError,
  type ClientRoomMessage,
  type RoomUpdateMessage,
  type RoomUpdatePayload,
  type ServerRoomMessage,
  type SessionEstablishedMessage,
} from "../src/index.js";

const random: RandomSource = () => 0.42;
const matchPlayers: MatchPlayerSeed[] = [
  {
    avatarKey: "bamboo-cat",
    id: "player-host",
    isHuman: true,
    name: "阿竹",
  },
  {
    avatarKey: "wandering-crane",
    id: "player-crane",
    name: "云游鹤",
  },
  {
    avatarKey: "flower-fox",
    id: "player-fox",
    name: "花间狐",
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createUpdatePayload(): RoomUpdatePayload {
  const state = createMatch(
    {
      matchId: "match-1",
      mode: "quick",
      players: matchPlayers,
    },
    random,
  );

  return {
    match: {
      events: [],
      snapshot: createPlayerSnapshot(state, "player-host"),
      turnDeadlineAt: 31_000,
    },
    permissions: {
      canContinueRound: false,
      canRematch: false,
      canSetReady: false,
      canStart: false,
    },
    room: {
      createdAt: 1_000,
      hostPlayerId: "player-host",
      maxPlayers: 3,
      mode: "quick",
      phase: "playing",
      players: [
        {
          avatarKey: "bamboo-cat",
          connected: true,
          isAi: false,
          joinedAt: 1_000,
          name: "阿竹",
          playerId: "player-host",
          ready: true,
        },
        {
          avatarKey: "wandering-crane",
          connected: true,
          isAi: true,
          joinedAt: 1_001,
          name: "云游鹤",
          playerId: "player-crane",
          ready: true,
        },
        {
          avatarKey: "flower-fox",
          connected: true,
          isAi: true,
          joinedAt: 1_002,
          name: "花间狐",
          playerId: "player-fox",
          ready: true,
        },
      ],
      revision: 4,
      roomCode: "123456",
      roomId: "room-1",
      selfPlayerId: "player-host",
      updatedAt: 1_500,
    },
    streamId: "stream-1",
    updateId: 3,
  };
}

function createRoomUpdate(): RoomUpdateMessage {
  return {
    ...createUpdatePayload(),
    serverTime: 1_500,
    type: "room.update",
    v: 1,
  };
}

describe("client protocol decoder", () => {
  it("accepts and normalizes a valid v1 create-room message", () => {
    const result = decodeClientMessage(
      JSON.stringify({
        payload: {
          avatarKey: "bamboo-cat",
          displayName: "  阿竹  ",
          maxPlayers: 3,
          mode: "quick",
        },
        requestId: "stream-1:1",
        type: "room.create",
        v: 1,
      }),
    );

    expect(result).toEqual({
      ok: true,
      value: {
        payload: {
          avatarKey: "bamboo-cat",
          displayName: "阿竹",
          maxPlayers: 3,
          mode: "quick",
        },
        requestId: "stream-1:1",
        type: "room.create",
        v: 1,
      },
    });
  });

  it("accepts an explicit friend-room turn-timer choice", () => {
    const result = decodeClientMessage(
      JSON.stringify({
        payload: {
          avatarKey: "bamboo-cat",
          displayName: "阿竹",
          maxPlayers: 6,
          mode: "quick",
          turnTimerEnabled: false,
        },
        requestId: "stream-1:no-turn-timer",
        type: "room.create",
        v: 1,
      }),
    );

    expect(result).toEqual({
      ok: true,
      value: {
        payload: {
          avatarKey: "bamboo-cat",
          displayName: "阿竹",
          maxPlayers: 6,
          mode: "quick",
          turnTimerEnabled: false,
        },
        requestId: "stream-1:no-turn-timer",
        type: "room.create",
        v: 1,
      },
    });
  });

  it("rejects a non-boolean friend-room turn-timer choice", () => {
    expect(
      decodeClientMessage(
        JSON.stringify({
          payload: {
            avatarKey: "bamboo-cat",
            displayName: "阿竹",
            maxPlayers: 6,
            mode: "quick",
            turnTimerEnabled: "false",
          },
          requestId: "stream-1:invalid-turn-timer",
          type: "room.create",
          v: 1,
        }),
      ).ok,
    ).toBe(false);
  });

  it("accepts a host request that sets the lobby AI count", () => {
    expect(
      decodeClientMessage(
        JSON.stringify({
          payload: { aiCount: 4 },
          requestId: "stream-1:ai-count",
          type: "room.set-ai-count",
          v: 1,
        }),
      ),
    ).toEqual({
      ok: true,
      value: {
        payload: { aiCount: 4 },
        requestId: "stream-1:ai-count",
        type: "room.set-ai-count",
        v: 1,
      },
    });
  });

  it.each([-1, 1.5, 5, "2"])("rejects invalid AI counts: %s", (aiCount) => {
    expect(
      decodeClientMessage(
        JSON.stringify({
          payload: { aiCount },
          requestId: "stream-1:bad-ai-count",
          type: "room.set-ai-count",
          v: 1,
        }),
      ).ok,
    ).toBe(false);
  });

  it.each([
    ["missing", undefined],
    ["unsupported", 2],
  ])("rejects a %s client protocol version", (_label, version) => {
    const message: Record<string, unknown> = {
      payload: {},
      requestId: "stream-1:2",
      type: "room.leave",
    };

    if (version !== undefined) {
      message.v = version;
    }

    expect(decodeClientMessage(JSON.stringify(message)).ok).toBe(false);
  });

  it("rejects unknown envelope and payload fields", () => {
    const envelopeExtra = decodeClientMessage(
      JSON.stringify({
        payload: {},
        playerId: "player-host",
        requestId: "stream-1:3",
        type: "room.leave",
        v: 1,
      }),
    );
    const payloadExtra = decodeClientMessage(
      JSON.stringify({
        payload: { playerId: "player-host" },
        requestId: "stream-1:4",
        type: "room.leave",
        v: 1,
      }),
    );

    expect(envelopeExtra.ok).toBe(false);
    expect(payloadExtra.ok).toBe(false);
  });

  it("rejects match.intent when the client attempts to report playerId", () => {
    const result = decodeClientMessage(
      JSON.stringify({
        payload: {
          intent: {
            bid: 0,
            commandId: "stream-1:5",
            expectedVersion: 0,
            playerId: "player-crane",
            type: "submit-bid",
          },
        },
        requestId: "stream-1:5",
        type: "match.intent",
        v: 1,
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("requires requestId to equal the inner MatchIntent commandId", () => {
    const result = decodeClientMessage(
      JSON.stringify({
        payload: {
          intent: {
            bid: 0,
            commandId: "stream-1:different",
            expectedVersion: 0,
            type: "submit-bid",
          },
        },
        requestId: "stream-1:6",
        type: "match.intent",
        v: 1,
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("round-trips a legal MatchIntent", () => {
    const message: ClientRoomMessage = {
      payload: {
        intent: {
          cardId: "mountain-1",
          commandId: "stream-1:7",
          expectedVersion: 2,
          type: "play-card",
        },
      },
      requestId: "stream-1:7",
      type: "match.intent",
      v: 1,
    };

    expect(decodeClientMessage(encodeClientMessage(message))).toEqual({
      ok: true,
      value: message,
    });
  });

});

describe("server protocol decoder", () => {
  it("accepts connection.ready and a deeply validated viewer update", () => {
    const ready: ServerRoomMessage = {
      heartbeatIntervalMs: 15_000,
      serverTime: 1_000,
      streamId: "stream-1",
      type: "connection.ready",
      v: 1,
    };
    const update = createRoomUpdate();

    expect(decodeServerMessage(encodeServerMessage(ready))).toEqual({
      ok: true,
      value: ready,
    });
    expect(decodeServerMessage(encodeServerMessage(update))).toEqual({
      ok: true,
      value: update,
    });
  });

  it.each([
    ["missing", undefined],
    ["unsupported", 2],
  ])("rejects a %s server protocol version", (_label, version) => {
    const message = clone(createRoomUpdate()) as Record<string, unknown>;

    if (version === undefined) {
      delete message.v;
    } else {
      message.v = version;
    }

    expect(decodeServerMessage(JSON.stringify(message)).ok).toBe(false);
  });

  it("rejects unknown fields at nested room and player levels", () => {
    const roomExtra = clone(createRoomUpdate()) as unknown as {
      room: Record<string, unknown>;
    };
    const playerExtra = clone(createRoomUpdate()) as unknown as {
      room: { players: Record<string, unknown>[] };
    };
    roomExtra.room.deckOrder = ["secret-card"];
    playerExtra.room.players[0].hand = ["secret-card"];

    expect(decodeServerMessage(JSON.stringify(roomExtra)).ok).toBe(false);
    expect(decodeServerMessage(JSON.stringify(playerExtra)).ok).toBe(false);
  });

  it("rejects nested values that do not match their declared wire types", () => {
    const invalidName = clone(createRoomUpdate()) as unknown as {
      room: { players: Array<{ name: unknown }> };
    };
    invalidName.room.players[0].name = null;

    expect(decodeServerMessage(JSON.stringify(invalidName)).ok).toBe(false);
  });

  it("rejects a full hands table smuggled into the public match snapshot", () => {
    const message = clone(createRoomUpdate()) as unknown as {
      match: { snapshot: { publicState: Record<string, unknown> } };
    };
    message.match.snapshot.publicState.hands = {
      "player-crane": [{ id: "highest-1", kind: "highest" }],
    };

    expect(decodeServerMessage(JSON.stringify(message)).ok).toBe(false);
  });

  it("accepts session grants with and without the create-only invite token", () => {
    const update = createUpdatePayload();
    const base: SessionEstablishedMessage = {
      requestId: "stream-1:8",
      serverTime: 1_500,
      session: {
        playerId: "player-host",
        resumeToken: "resume_token_1234567890",
        roomCode: "123456",
        roomId: "room-1",
      },
      type: "session.established",
      update,
      v: 1,
    };

    expect(decodeServerMessage(JSON.stringify(base)).ok).toBe(true);
    expect(
      decodeServerMessage(
        JSON.stringify({
          ...base,
          session: {
            ...base.session,
            inviteToken: "invite_token_1234567890",
          },
        }),
      ).ok,
    ).toBe(true);
  });

  it("rejects unknown stable error codes", () => {
    const result = decodeServerMessage(
      JSON.stringify({
        code: "LEAK_INTERNAL_EXCEPTION",
        message: "details",
        requestId: "stream-1:9",
        serverTime: 1_500,
        type: "request.error",
        v: 1,
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("makes encoders reject objects that only pretend to satisfy the types", () => {
    const invalid = {
      ...createRoomUpdate(),
      v: 2,
    } as unknown as ServerRoomMessage;

    expect(() => encodeServerMessage(invalid)).toThrow(ProtocolEncodeError);
  });
});
