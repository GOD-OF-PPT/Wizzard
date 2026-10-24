import { describe, expect, it } from "vitest";
import { createMatch, createPlayerSnapshot } from "@wizzard/game-core/authority";
import type { ClientRoomMessage, RoomUpdatePayload } from "@wizzard/room-protocol";
import { NetworkMatchAdapter } from "./NetworkMatchAdapter";
import { RoomSocketClient, type RoomSocketListener, type RoomSocketConnectionState } from "./RoomSocketClient";
import type { MatchUpdate } from "./IMatchAdapter";

// Exercise the real web adapter's public event boundary. Transport persistence
// is tested elsewhere; these checks specifically cover its presentation signal.
class ControlledRoomClient extends RoomSocketClient {
  listener: RoomSocketListener = () => undefined;
  state: RoomSocketConnectionState = "connected";
  sent: ClientRoomMessage[] = [];
  counter = 0;
  constructor() {
    super({ binding: { type: "resume" }, target: { kind: "websocket", url: "ws://localhost/test" },
      sessionStore: { load: () => null, save: () => undefined, clear: () => undefined },
      socketFactory: { connect: () => { throw new Error("No network in this boundary test"); } } });
  }
  override start() {}
  override subscribe(listener: RoomSocketListener) { this.listener = listener; return () => { this.listener = () => undefined; }; }
  override getConnectionState() { return this.state; }
  override nextRequestId() { return `intent-${++this.counter}`; }
  override sendTracked(message: ClientRoomMessage) { this.sent.push(message); return true; }
}

function fixture(ackCommandId?: string): RoomUpdatePayload {
  const players = [{ id: "self", name: "青竹客", isHuman: true, avatarKey: "bamboo-cat" },
    { id: "two", name: "云游鹤", avatarKey: "wandering-crane" },
    { id: "three", name: "花间狐", avatarKey: "flower-fox" }];
  const state = createMatch({ matchId: "pending-presentation", mode: "quick", players }, () => .42);
  return { streamId: "test", updateId: 1, ...(ackCommandId ? { ackCommandId } : {}),
    match: { snapshot: createPlayerSnapshot(state, "self"), events: [], turnDeadlineAt: null },
    permissions: { canContinueRound: false, canRematch: false, canSetReady: false, canStart: false },
    room: { roomId: "room", roomCode: "234567", selfPlayerId: "self", hostPlayerId: "self", phase: "playing", mode: "quick", maxPlayers: 3, revision: 1, createdAt: 0, updatedAt: 0, players: [] } };
}

describe("web pending-intent presentation", () => {
  it("stays pending across unrelated snapshots and reconnect until its own authoritative ACK", () => {
    const room = new ControlledRoomClient(), adapter = new NetworkMatchAdapter(room, false);
    const updates: MatchUpdate[] = [];
    adapter.start(update => updates.push(update));
    room.listener({ type: "update", payload: fixture(), serverTime: 0 });
    adapter.submitIntent({ type: "submit-bid", bid: 0 });
    expect(updates.at(-1)?.pendingIntent).toBe(true);
    adapter.submitIntent({ type: "submit-bid", bid: 1 });
    expect(room.sent).toHaveLength(1);
    room.listener({ type: "update", payload: fixture("another-command"), serverTime: 0 });
    expect(updates.at(-1)?.pendingIntent).toBe(true);
    room.state = "reconnecting";
    room.listener({ type: "connection", state: "reconnecting" });
    expect(updates.at(-1)?.pendingIntent).toBe(true);
    room.state = "connected";
    room.listener({ type: "update", payload: fixture(room.sent[0].requestId), serverTime: 0 });
    expect(updates.at(-1)?.pendingIntent).toBe(false);
    adapter.submitIntent({ type: "submit-bid", bid: 1 });
    expect(room.sent).toHaveLength(2);
    adapter.dispose();
  });

  it("unlocks after a matching rejection, not an unrelated error", () => {
    const room = new ControlledRoomClient(), adapter = new NetworkMatchAdapter(room, false);
    const updates: MatchUpdate[] = [];
    adapter.start(update => updates.push(update));
    room.listener({ type: "update", payload: fixture(), serverTime: 0 });
    adapter.submitIntent({ type: "submit-bid", bid: 0 });
    room.listener({ type: "error", code: "TRANSPORT_ERROR", message: "unrelated", requestId: "other" });
    expect(updates.at(-1)?.pendingIntent).toBe(true);
    room.listener({ type: "error", code: "TRANSPORT_ERROR", message: "rejected", requestId: room.sent[0].requestId });
    expect(updates.at(-1)?.pendingIntent).toBe(false);
    adapter.dispose();
  });
});
