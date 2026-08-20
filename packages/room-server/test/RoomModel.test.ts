import { describe, expect, it } from "vitest";
import type { RoomPlayerRecord, RoomRecord } from "../src/index.js";
import { isRoomRecord } from "../src/room/model.js";

function humanPlayer(
  playerId: string,
  seatIndex: number,
): RoomPlayerRecord {
  return {
    avatarKey: "bamboo-cat",
    connected: true,
    consecutiveTimeouts: 0,
    control: "human",
    isAi: false,
    joinedAt: 1_000,
    name: playerId,
    playerId,
    ready: false,
    seatIndex,
    session: {
      expiresAt: 10_000,
      generation: 1,
      resumeTokenHash: "0".repeat(64),
      sessionId: `session-${playerId}`,
    },
  };
}

function aiPlayer(): RoomPlayerRecord {
  return {
    avatarKey: "flower-fox",
    connected: true,
    consecutiveTimeouts: 0,
    control: "ai",
    isAi: true,
    joinedAt: 1_000,
    name: "Tea Spirit",
    playerId: "ai-1",
    ready: true,
    seatIndex: 1,
    session: null,
  };
}

function roomRecord(): RoomRecord {
  return {
    code: "234567",
    commandHistory: [],
    createdAt: 1_000,
    deadline: null,
    expiresAt: 10_000,
    hostPlayerId: "host",
    id: "room-1",
    inviteTokenHash: "1".repeat(64),
    lifecycle: "lobby",
    match: null,
    maxPlayers: 3,
    mode: "quick",
    players: [humanPlayer("host", 0)],
    randomState: {
      algorithm: "hmac-sha256-counter-v1",
      counter: 0,
      keyBase64: "A".repeat(43),
    },
    revision: 0,
    schemaVersion: 1,
    updatedAt: 1_000,
  };
}

describe("isRoomRecord", () => {
  it("accepts legacy and boolean turn-timer persistence values", () => {
    const legacy = roomRecord();
    expect(isRoomRecord(legacy)).toBe(true);

    const enabled = roomRecord();
    enabled.turnTimerEnabled = true;
    expect(isRoomRecord(enabled)).toBe(true);

    const disabled = roomRecord();
    disabled.turnTimerEnabled = false;
    expect(isRoomRecord(disabled)).toBe(true);

    const malformed = roomRecord() as unknown as Record<string, unknown>;
    malformed.turnTimerEnabled = "false";
    expect(isRoomRecord(malformed)).toBe(false);
  });

  it("rejects rosters that exceed the configured seat capacity", () => {
    const valid = roomRecord();
    expect(isRoomRecord(valid)).toBe(true);

    const overCapacity = structuredClone(valid);
    overCapacity.players.push(
      humanPlayer("second", 1),
      humanPlayer("third", 2),
      humanPlayer("fourth", 3),
    );
    expect(isRoomRecord(overCapacity)).toBe(false);

    const outOfRangeSeat = structuredClone(valid);
    outOfRangeSeat.players[0].seatIndex = outOfRangeSeat.maxPlayers;
    expect(isRoomRecord(outOfRangeSeat)).toBe(false);
  });

  it("requires every active room host to be a human player", () => {
    const aiHosted = roomRecord();
    Object.assign(aiHosted.players[0], {
      control: "ai" as const,
      isAi: true,
      ready: true,
      session: null,
    });
    expect(isRoomRecord(aiHosted)).toBe(false);

    const closed = roomRecord();
    closed.lifecycle = "closed";
    closed.hostPlayerId = "";
    expect(isRoomRecord(closed)).toBe(true);

    closed.hostPlayerId = closed.players[0].playerId;
    expect(isRoomRecord(closed)).toBe(false);
  });

  it("rejects persisted AI players with human or inactive seat state", () => {
    const valid = roomRecord();
    valid.players.push(aiPlayer());
    expect(isRoomRecord(valid)).toBe(true);

    const invalidAiPlayers: RoomPlayerRecord[] = [
      { ...aiPlayer(), connected: false },
      { ...aiPlayer(), control: "human" },
      { ...aiPlayer(), ready: false },
      { ...aiPlayer(), session: humanPlayer("session-source", 2).session },
    ];
    for (const invalidAi of invalidAiPlayers) {
      const invalid = roomRecord();
      invalid.players.push(invalidAi);
      expect(isRoomRecord(invalid)).toBe(false);
    }
  });

  it("accepts legacy players and requires unique complete join receipts", () => {
    const legacy = roomRecord();
    expect(isRoomRecord(legacy)).toBe(true);

    const legacyCode = roomRecord();
    legacyCode.code = "ABC234";
    expect(isRoomRecord(legacyCode)).toBe(true);

    const malformedCode = roomRecord();
    malformedCode.code = "12A456";
    expect(isRoomRecord(malformedCode)).toBe(false);

    const withReceipt = roomRecord();
    withReceipt.players[0].joinRequestFingerprint = "a".repeat(64);
    withReceipt.players[0].joinRequestId = "join-request-1";
    expect(isRoomRecord(withReceipt)).toBe(true);

    const partialReceipt = structuredClone(withReceipt);
    delete partialReceipt.players[0].joinRequestFingerprint;
    expect(isRoomRecord(partialReceipt)).toBe(false);

    const duplicateReceipt = structuredClone(withReceipt);
    const second = humanPlayer("second", 1);
    second.joinRequestFingerprint = "b".repeat(64);
    second.joinRequestId = withReceipt.players[0].joinRequestId;
    duplicateReceipt.players.push(second);
    expect(isRoomRecord(duplicateReceipt)).toBe(false);
  });
});
