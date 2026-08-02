import { describe, expect, it } from "vitest";
import {
  advanceAuthoritativeMatch,
  applyMatchIntent,
  chooseAiIntent,
  createMatch,
  createPlayerSnapshot,
  type MatchPlayerSeed,
  type RandomSource,
} from "./index";

function createSeededRandom(seed: number): RandomSource {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const players: MatchPlayerSeed[] = Array.from({ length: 6 }, (_, index) => ({
  avatarKey: `avatar-${index}`,
  id: `player-${index}`,
  name: `玩家 ${index}`,
}));

describe("authoritative match state machine", () => {
  it("completes an eight-round quick match through the same intent interface used by AI", () => {
    const random = createSeededRandom(1);
    let state = createMatch(
      { dealerIndex: 0, mode: "quick", players },
      random,
    );
    let commandNumber = 0;
    const dealerByRound = [state.dealerIndex];

    for (let guard = 0; guard < 5_000 && state.phase !== "match-end"; guard += 1) {
      const previousRoundIndex = state.roundIndex;

      if (state.phase === "trick-result" || state.phase === "round-score") {
        state = advanceAuthoritativeMatch(
          state,
          state.phase === "trick-result" ? "resolve-trick" : "continue-round",
          random,
        ).state;
      } else {
        const currentPlayerId = state.currentPlayerId;

        if (!currentPlayerId) {
          throw new Error(`MISSING_CURRENT_PLAYER:${state.phase}`);
        }

        commandNumber += 1;
        const intent = chooseAiIntent(
          createPlayerSnapshot(state, currentPlayerId),
          `ai:${commandNumber}`,
        );

        if (!intent) {
          throw new Error(`AI_INTENT_NOT_FOUND:${state.phase}`);
        }

        const transition = applyMatchIntent(state, currentPlayerId, intent);
        const rejection = transition.events.find(
          (event) => event.type === "intent-rejected",
        );

        if (rejection?.type === "intent-rejected") {
          throw new Error(`AI_INTENT_REJECTED:${rejection.code}`);
        }

        state = transition.state;
      }

      if (state.roundIndex !== previousRoundIndex) {
        dealerByRound.push(state.dealerIndex);
      }
    }

    expect(state.phase).toBe("match-end");
    expect(state.roundIndex).toBe(7);
    expect(dealerByRound).toEqual([0, 1, 2, 3, 4, 5, 0, 1]);
    expect(state.players.every((player) => Number.isFinite(player.totalScore))).toBe(
      true,
    );
  });

  it("projects only the viewer hand and rejects an out-of-turn intent", () => {
    const random = createSeededRandom(1);
    const state = createMatch(
      {
        dealerIndex: 0,
        mode: "quick",
        players: players.map((player, index) => ({
          ...player,
          isHuman: index === 0,
        })),
      },
      random,
    );
    const snapshot = createPlayerSnapshot(state, "player-0");
    const transition = applyMatchIntent(
      state,
      "player-1",
      {
        bid: 0,
        commandId: "wrong-turn",
        expectedVersion: state.version,
        type: "submit-bid",
      },
    );

    expect("hands" in snapshot.publicState).toBe(false);
    expect(snapshot.privateState.hand).toHaveLength(1);
    expect(transition.state).toBe(state);
    expect(transition.events).toEqual([
      {
        code: "NOT_YOUR_TURN",
        commandId: "wrong-turn",
        type: "intent-rejected",
        version: state.version,
      },
    ]);
  });

  it("replays the first accepted result for a retried command without advancing twice", () => {
    const random = createSeededRandom(1);
    const state = createMatch(
      {
        dealerIndex: 0,
        mode: "quick",
        players: players.map((player, index) => ({
          ...player,
          isHuman: index === 0,
        })),
      },
      random,
    );
    const intent = {
      commandId: "choose-trump-once",
      expectedVersion: state.version,
      trump: "mountain" as const,
      type: "choose-trump" as const,
    };
    const first = applyMatchIntent(state, "player-0", intent);
    const replay = applyMatchIntent(first.state, "player-0", intent);

    expect(replay.state).toBe(first.state);
    expect(replay.state.version).toBe(first.state.version);
    expect(replay.events).toEqual(first.events);
    expect(replay.events[0]?.type).toBe("trump-selected");
  });
});
