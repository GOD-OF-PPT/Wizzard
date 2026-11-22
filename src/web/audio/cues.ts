import type { MatchEvent, PlayerMatchSnapshot, PublicMatchState } from "@wizzard/game-core/contracts";
import type { FriendRoomSnapshot, RoomUpdatePayload } from "@wizzard/room-protocol";
import type { AudioCue } from "./player";

/** Snapshot/event observer: new authoritative outcomes only, no command sends. */
export class MatchAudioTracker {
  private previous: PublicMatchState | null = null;
  private rejected = new Set<string>();

  update(snapshot: PlayerMatchSnapshot, events: readonly MatchEvent[], options: { silent?: boolean; fresh?: boolean } = {}): AudioCue[] {
    const state = snapshot.publicState, selfId = snapshot.privateState.playerId;
    const before = this.previous;
    if (before?.matchId === state.matchId && state.version < before.version) return [];
    this.previous = state;
    const key = `${state.matchId}:${state.roundIndex}`;
    const cues: AudioCue[] = [];
    for (const event of events) if (event.type === "intent-rejected" && !this.rejected.has(event.commandId)) {
      this.rejected.add(event.commandId);
      if (this.rejected.size > 128) this.rejected.delete(this.rejected.values().next().value!);
      cues.push({ id: "notice.soft", key: `${state.matchId}:reject:${event.commandId}` });
    }
    const fresh = !before || before.matchId !== state.matchId;
    if (options.silent || fresh && !options.fresh) return [];
    if (!fresh && state.version <= before.version) return cues;
    const local = state.players.find(player => player.id === selfId);
    if (state.phase === "match-end" && (fresh || before.phase !== "match-end")) {
      const high = Math.max(...state.players.map(player => player.totalScore));
      return [{ id: local?.totalScore === high ? "match.victory" : "match.complete", key: `${state.matchId}:end`, priority: 3 }];
    }
    if (state.phase === "round-score" && (fresh || before.phase !== "round-score")) {
      return [{ id: local?.bid === local?.tricksWon ? "bid.exact" : "round.score", key: `${key}:score`, priority: 3 }];
    }
    const newRound = fresh || before.roundIndex !== state.roundIndex;
    if (newRound) {
      cues.push({ id: "cards.deal", key: `${key}:deal`, priority: 2 });
      if (state.phase !== "trump-select") cues.push({ id: "trump.reveal", key: `${key}:trump`, delayMs: 180, priority: 2 });
    } else {
      const newEvents = events.filter(event => event.type !== "intent-rejected" && event.version > before.version && event.version <= state.version);
      if (newEvents.some(event => event.type === "trump-selected")) cues.push({ id: "trump.reveal", key: `${key}:trump`, priority: 2 });
      if (newEvents.some(event => event.type === "bid-accepted" && event.playerId === selfId)) cues.push({ id: "ui.confirm", key: `${key}:bid:${selfId}` });
      const played = new Set<string>();
      for (const event of newEvents) if (event.type === "card-played") {
        const identity = `${event.trickNumber}:${event.playerId}:${event.card.id}`;
        played.add(identity);
        cues.push({ id: "card.play", key: `${key}:play:${identity}`, gain: event.playerId === selfId ? 1 : 0.5 });
      }
      // Full snapshots can settle an action even when an event batch is omitted.
      const oldPlays = new Set([...before.trick.plays.map(play => `${before.trick.number}:${play.playerId}:${play.card.id}`), ...(before.completedTrick?.plays.map(play => `${before.completedTrick!.number}:${play.playerId}:${play.card.id}`) ?? [])]);
      const plays = [...state.trick.plays.map(play => ({ ...play, number: state.trick.number })), ...(state.completedTrick?.plays.map(play => ({ ...play, number: state.completedTrick!.number })) ?? [])];
      for (const play of plays) {
        const identity = `${play.number}:${play.playerId}:${play.card.id}`;
        if (!oldPlays.has(identity) && !played.has(identity)) cues.push({ id: "card.play", key: `${key}:play:${identity}`, gain: play.playerId === selfId ? 1 : 0.5 });
      }
    }
    if (state.phase === "trick-result" && state.completedTrick?.winnerId === selfId && (fresh || before.completedTrick?.number !== state.completedTrick.number)) {
      cues.push({ id: "trick.win", key: `${key}:win:${state.completedTrick.number}`, delayMs: 140, priority: 2 });
    }
    const turnKey = (value: PublicMatchState) => `${value.roundIndex}:${value.phase}:${value.trick.number}:${value.currentPlayerId}`;
    if (state.currentPlayerId === selfId && ["trump-select", "bid", "trick-play"].includes(state.phase) && (fresh || turnKey(before) !== turnKey(state))) {
      cues.push({ id: "turn.yours", key: `${state.matchId}:turn:${turnKey(state)}`, delayMs: newRound ? 450 : 100, priority: 2 });
    }
    return cues;
  }
}

export class RoomAudioTracker {
  private previous: FriendRoomSnapshot | null = null;
  private rebase = false;
  private match = new MatchAudioTracker();
  constructor(private readonly initialBinding: "create" | "join" | "resume") {}

  disconnected(): void { if (this.previous) this.rebase = true; }

  update(payload: RoomUpdatePayload, settledCommand?: string): AudioCue[] {
    const room = payload.room, before = this.previous;
    if (before?.roomId === room.roomId && room.revision < before.revision) return [];
    this.previous = room;
    const initial = !before || before.roomId !== room.roomId;
    const silent = this.rebase || initial && this.initialBinding === "resume";
    this.rebase = false;
    const freshMatch = !silent && !!before && before.phase === "lobby" && room.phase === "playing";
    const matchCues = payload.match ? this.match.update(payload.match.snapshot, payload.match.events, { silent, fresh: freshMatch }) : [];
    if (silent) return [];
    const key = `${room.roomId}:${room.revision}`;
    if (settledCommand === "room.leave") return [{ id: "ui.back", key: `${key}:leave` }];
    if (initial) return [{ id: "room.arrive", key: `${room.roomId}:arrive` }, ...matchCues];
    if (room.revision <= before.revision) return [];
    const newHuman = room.players.some(player => !player.isAi && !before.players.some(old => old.playerId === player.playerId));
    if (newHuman) return [{ id: "room.arrive", key: `${key}:join` }, ...matchCues];
    if (room.phase === "lobby") {
      const aiDelta = room.players.filter(player => player.isAi).length - before.players.filter(player => player.isAi).length;
      if (aiDelta) return [{ id: aiDelta > 0 ? "room.ai-join" : "ui.back", key: `${key}:ai` }];
      const self = room.players.find(player => player.playerId === room.selfPlayerId);
      const oldSelf = before.players.find(player => player.playerId === room.selfPlayerId);
      if (settledCommand === "room.set-ready" && self?.ready !== oldSelf?.ready) return [{ id: self?.ready ? "ui.confirm" : "ui.back", key: `${key}:ready` }];
    }
    return matchCues;
  }
}
