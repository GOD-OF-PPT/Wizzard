import { describe, expect, it } from "vitest";
import { createMatch, createPlayerSnapshot } from "@wizzard/game-core/authority";
import type { PlayerMatchSnapshot, MatchEvent } from "@wizzard/game-core/contracts";
import type { RoomUpdatePayload } from "@wizzard/room-protocol";
import { MatchAudioTracker, RoomAudioTracker } from "./cues";

function snapshot(): PlayerMatchSnapshot {
  return createPlayerSnapshot(createMatch({ matchId: "sound-match", mode: "quick", players: [
    { id: "you", name: "You", avatarKey: "bamboo-cat", isHuman: true },
    { id: "ai-1", name: "AI 1", avatarKey: "flower-fox" },
    { id: "ai-2", name: "AI 2", avatarKey: "ink-panda" },
  ] }, () => 0.3), "you");
}
const ids = (cues: ReturnType<MatchAudioTracker["update"]>) => cues.map(cue => cue.id);

describe("authoritative sound cues", () => {
  it("does not sound on replay, pending redraw, countdown or an older version", () => {
    const tracker = new MatchAudioTracker(), first = snapshot();
    expect(tracker.update(first, [])).toEqual([]);
    const next = structuredClone(first); next.publicState.version += 1;
    const event: MatchEvent = { type: "bid-accepted", playerId: "you", bid: 0, version: next.publicState.version };
    expect(ids(tracker.update(next, [event]))).toContain("ui.confirm");
    expect(tracker.update(next, [event])).toEqual([]);
    expect(tracker.update(first, [])).toEqual([]);
    expect(tracker.update(next, [event])).toEqual([]);
  });

  it("settles card sounds from new snapshots without relying on transport ACK", () => {
    const tracker = new MatchAudioTracker(), first = snapshot();
    first.publicState.phase = "trick-play"; first.publicState.currentPlayerId = "ai-1";
    tracker.update(first, []);
    const next = structuredClone(first); next.publicState.version++;
    next.publicState.trick.plays = [{ playerId: "you", card: next.privateState.hand[0] }];
    const played = tracker.update(next, []);
    expect(ids(played)).toEqual(["card.play"]);
    expect(played[0].gain).toBe(1);
    expect(tracker.update(next, [])).toEqual([]);
  });

  it("silently rebases reconnect snapshots, including missed rewards", () => {
    const tracker = new MatchAudioTracker(), first = snapshot();
    tracker.update(first, [], { fresh: true });
    const resumed = structuredClone(first); resumed.publicState.version += 10; resumed.publicState.phase = "round-score";
    expect(tracker.update(resumed, [], { silent: true })).toEqual([]);
    expect(tracker.update(resumed, [])).toEqual([]);
  });

  it("chooses one result cue, including tied winners", () => {
    const tracker = new MatchAudioTracker(), first = snapshot(); tracker.update(first, []);
    const score = structuredClone(first); score.publicState.version++; score.publicState.phase = "round-score";
    score.publicState.players[0].bid = 1; score.publicState.players[0].tricksWon = 1;
    expect(ids(tracker.update(score, []))).toEqual(["bid.exact"]);
    const end = structuredClone(score); end.publicState.version++; end.publicState.phase = "match-end";
    end.publicState.players.forEach(player => { player.totalScore = 30; });
    expect(ids(tracker.update(end, []))).toEqual(["match.victory"]);
  });

  it("gives a new local match its opening cues only once", () => {
    const tracker = new MatchAudioTracker(), first = snapshot();
    expect(ids(tracker.update(first, [], { fresh: true }))).toContain("cards.deal");
    expect(tracker.update(first, [], { fresh: true })).toEqual([]);
    const restart = structuredClone(first); restart.publicState.matchId = "rematch";
    expect(ids(tracker.update(restart, [], { fresh: true }))).toContain("cards.deal");
  });

  it("separates AI volume, local turn cues, trump reveal and local trick reward", () => {
    const tracker = new MatchAudioTracker(), first = snapshot();
    first.publicState.phase = "trump-select"; first.publicState.currentPlayerId = "ai-1";
    tracker.update(first, []);
    const trump = structuredClone(first); trump.publicState.version++; trump.publicState.phase = "bid"; trump.publicState.currentPlayerId = "you";
    const revealed = tracker.update(trump, [{ type: "trump-selected", version: trump.publicState.version, playerId: "ai-1", trump: "sun" }]);
    expect(ids(revealed)).toEqual(["trump.reveal", "turn.yours"]);
    const ai = structuredClone(trump); ai.publicState.version++; ai.publicState.phase = "trick-play"; ai.publicState.currentPlayerId = "ai-2";
    const played = tracker.update(ai, [{ type: "card-played", version: ai.publicState.version, playerId: "ai-1", card: ai.privateState.hand[0], trickNumber: 1 }]);
    expect(played.find(cue => cue.id === "card.play")?.gain).toBe(0.5);
    const win = structuredClone(ai); win.publicState.version++; win.publicState.phase = "trick-result";
    win.publicState.completedTrick = { number: 1, leaderId: "you", plays: [], winnerId: "you" };
    expect(ids(tracker.update(win, []))).toEqual(["trick.win"]);
  });
});

function lobby(): RoomUpdatePayload {
  return { streamId: "stream", updateId: 1, match: null, permissions: { canContinueRound: false, canRematch: false, canSetReady: true, canStart: true }, room: {
    createdAt: 1, updatedAt: 1, hostPlayerId: "you", selfPlayerId: "you", maxPlayers: 6, mode: "quick", phase: "lobby", roomCode: "234567", roomId: "room", revision: 1,
    players: [{ playerId: "you", avatarKey: "bamboo-cat", connected: true, isAi: false, joinedAt: 1, name: "You", ready: false }],
  } };
}

describe("friend room sound settlement", () => {
  it("allows first create sound, then AI confirmation and dedupes replay", () => {
    const tracker = new RoomAudioTracker("create"), first = lobby();
    tracker.disconnected(); // Initial connecting is not a reconnect.
    expect(ids(tracker.update(first))).toEqual(["room.arrive"]);
    const added = structuredClone(first); added.room.revision++;
    added.room.players.push({ ...first.room.players[0], playerId: "robot", isAi: true });
    expect(ids(tracker.update(added, "room.set-ai-count"))).toEqual(["room.ai-join"]);
    expect(tracker.update(added, "room.set-ai-count")).toEqual([]);
  });

  it("does not re-announce players or readiness when restoring", () => {
    const tracker = new RoomAudioTracker("resume"), first = lobby();
    expect(tracker.update(first)).toEqual([]);
    tracker.disconnected();
    const restored = structuredClone(first); restored.room.revision += 3; restored.room.players[0].ready = true;
    expect(tracker.update(restored, "room.set-ready")).toEqual([]);
    expect(tracker.update(restored)).toEqual([]);
  });
});
