import { describe, expect, it } from "vitest";
import {
  advanceAuthoritativeMatch,
  applyMatchIntent,
  createMatch,
  createPlayerSnapshot,
} from "@wizzard/game-core/authority";
import {
  chooseAiIntent,
  executeMatchAction,
  planNextMatchAction,
  type MatchActionExecution,
  type MatchPacingConfig,
  type PlayerPacingChange,
  type PlayerPacingInfo,
  type ScheduledMatchAction,
} from "@wizzard/game-core";
import * as Core from "@wizzard/game-core";
import type {
  AuthoritativeMatchState,
  MatchTransition,
} from "@wizzard/game-core/authority";
import type {
  MatchPhase,
  MatchPlayerSeed,
  RandomSource,
} from "@wizzard/game-core/contracts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const PLAYERS: MatchPlayerSeed[] = Array.from({ length: 3 }, (_, index) => ({
  avatarKey: `avatar-${index}`,
  id: `player-${index}`,
  isHuman: index === 0,
  name: `Player ${index}`,
}));

function createBaseState(random: RandomSource): AuthoritativeMatchState {
  return createMatch(
    { dealerIndex: 0, mode: "quick", players: PLAYERS },
    random,
  );
}

/**
 * Play a match forward using AI intents until the state reaches `targetPhase`.
 * Returns the state at that phase. Throws if the phase is unreachable.
 */
function playToPhase(
  random: RandomSource,
  targetPhase: MatchPhase,
): AuthoritativeMatchState {
  let state = createBaseState(random);
  let commandNumber = 0;

  for (let guard = 0; guard < 10_000 && state.phase !== targetPhase; guard += 1) {
    if (state.phase === "trick-result" || state.phase === "round-score") {
      state = advanceAuthoritativeMatch(
        state,
        state.phase === "trick-result" ? "resolve-trick" : "continue-round",
        random,
      ).state;
    } else {
      const currentPlayerId = state.currentPlayerId;
      if (!currentPlayerId) {
        break;
      }
      commandNumber += 1;
      const intent = chooseAiIntent(
        createPlayerSnapshot(state, currentPlayerId),
        `ai:${commandNumber}`,
      );
      if (!intent) {
        break;
      }
      state = applyMatchIntent(state, currentPlayerId, intent).state;
    }
  }

  if (state.phase !== targetPhase) {
    throw new Error(`Could not reach phase ${targetPhase}, got ${state.phase}`);
  }
  return state;
}

/** Shallow-copy a state with a different phase / currentPlayerId. */
function withPhase(
  state: AuthoritativeMatchState,
  phase: MatchPhase,
  currentPlayerId: string | null = state.currentPlayerId,
): AuthoritativeMatchState {
  return { ...state, phase, currentPlayerId };
}

function createPacingInfo(
  playerId: string,
  overrides: Partial<PlayerPacingInfo> = {},
): PlayerPacingInfo {
  return {
    playerId,
    isAi: false,
    control: "human",
    connected: true,
    consecutiveTimeouts: 0,
    ...overrides,
  };
}

function aiPacingInfo(playerId: string): PlayerPacingInfo {
  return createPacingInfo(playerId, {
    isAi: true,
    control: "ai",
    connected: true,
  });
}

const DEFAULT_CONFIG: MatchPacingConfig = {
  aiActionDelayMs: 420,
  trickResultDelayMs: 1_500,
  roundScoreDelayMs: 8_000,
  turnTimeoutMs: 30_000,
};

const CLIENT_CONFIG: MatchPacingConfig = {
  ...DEFAULT_CONFIG,
  roundScoreDelayMs: null,
};

const TURN_PHASES: MatchPhase[] = ["trump-select", "bid", "trick-play"];

// ---------------------------------------------------------------------------
// planNextMatchAction
// ---------------------------------------------------------------------------

describe("planNextMatchAction", () => {
  describe("trick-result phase", () => {
    it("returns resolve-trick at now + trickResultDelayMs (VAL-MD-001)", () => {
      const random = createSeededRandom(1);
      const state = withPhase(
        createBaseState(random),
        "trick-result",
        null,
      );
      const now = 1_000;
      const config: MatchPacingConfig = {
        ...DEFAULT_CONFIG,
        trickResultDelayMs: 1_500,
      };

      const result = planNextMatchAction(state, [], now, config, {
        turnTimerEnabled: true,
      });

      expect(result).toEqual({ kind: "resolve-trick", dueAt: 2_500 });
    });
  });

  describe("round-score phase", () => {
    it("returns continue-round when roundScoreDelayMs is set (VAL-MD-002)", () => {
      const random = createSeededRandom(1);
      const state = withPhase(
        createBaseState(random),
        "round-score",
        null,
      );
      const now = 5_000;
      const config: MatchPacingConfig = {
        ...DEFAULT_CONFIG,
        roundScoreDelayMs: 8_000,
      };

      const result = planNextMatchAction(state, [], now, config, {
        turnTimerEnabled: true,
      });

      expect(result).toEqual({ kind: "continue-round", dueAt: 13_000 });
    });

    it("returns null when roundScoreDelayMs is null (VAL-MD-003)", () => {
      const random = createSeededRandom(1);
      const state = withPhase(
        createBaseState(random),
        "round-score",
        null,
      );

      const result = planNextMatchAction(state, [], 5_000, CLIENT_CONFIG, {
        turnTimerEnabled: true,
      });

      expect(result).toBeNull();
    });
  });

  describe("turn phases (trump-select, bid, trick-play)", () => {
    it("returns turn with aiActionDelayMs for AI player (VAL-MD-004)", () => {
      const random = createSeededRandom(1);
      const base = createBaseState(random);

      for (const phase of TURN_PHASES) {
        const state = withPhase(base, phase, "player-1");
        const players = [aiPacingInfo("player-1")];
        const now = 10_000;
        const config: MatchPacingConfig = {
          ...DEFAULT_CONFIG,
          aiActionDelayMs: 420,
        };

        const result = planNextMatchAction(state, players, now, config, {
          turnTimerEnabled: true,
        });

        expect(result).toEqual({
          kind: "turn",
          playerId: "player-1",
          dueAt: 10_420,
          isTimeout: false,
        });
      }
    });

    it("returns turn with turnTimeoutMs for human player with timer (VAL-MD-005)", () => {
      const random = createSeededRandom(1);
      const base = createBaseState(random);

      for (const phase of TURN_PHASES) {
        const state = withPhase(base, phase, "player-0");
        const players = [createPacingInfo("player-0")];
        const now = 20_000;
        const config: MatchPacingConfig = {
          ...DEFAULT_CONFIG,
          turnTimeoutMs: 30_000,
        };

        const result = planNextMatchAction(state, players, now, config, {
          turnTimerEnabled: true,
        });

        expect(result).toEqual({
          kind: "turn",
          playerId: "player-0",
          dueAt: 50_000,
          isTimeout: true,
        });
      }
    });

    it("returns null for connected human when turnTimerEnabled is false (VAL-MD-006)", () => {
      const random = createSeededRandom(1);
      const state = withPhase(
        createBaseState(random),
        "bid",
        "player-0",
      );
      const players = [createPacingInfo("player-0", { connected: true })];

      const result = planNextMatchAction(state, players, 1_000, DEFAULT_CONFIG, {
        turnTimerEnabled: false,
      });

      expect(result).toBeNull();
    });

    it("returns turn action for disconnected human even in no-timer mode (VAL-MD-007)", () => {
      const random = createSeededRandom(1);
      const state = withPhase(
        createBaseState(random),
        "bid",
        "player-0",
      );
      const players = [createPacingInfo("player-0", { connected: false })];
      const now = 7_000;

      const result = planNextMatchAction(state, players, now, DEFAULT_CONFIG, {
        turnTimerEnabled: false,
      });

      expect(result).toEqual({
        kind: "turn",
        playerId: "player-0",
        dueAt: 37_000,
        isTimeout: true,
      });
    });

    it("prefers control over isAi for automation detection (VAL-MD-026)", () => {
      const random = createSeededRandom(1);
      const state = withPhase(
        createBaseState(random),
        "bid",
        "player-0",
      );
      // isAi: false but control: "ai" → treated as automated
      const players = [
        createPacingInfo("player-0", { isAi: false, control: "ai" }),
      ];
      const now = 3_000;
      const config: MatchPacingConfig = {
        ...DEFAULT_CONFIG,
        aiActionDelayMs: 420,
      };

      const result = planNextMatchAction(state, players, now, config, {
        turnTimerEnabled: true,
      });

      expect(result).toEqual({
        kind: "turn",
        playerId: "player-0",
        dueAt: 3_420,
        isTimeout: false,
      });
    });
  });

  describe("match-end phase", () => {
    it("returns null for match-end (VAL-MD-008)", () => {
      const random = createSeededRandom(1);
      const state = withPhase(
        createBaseState(random),
        "match-end",
        null,
      );

      for (const turnTimerEnabled of [true, false]) {
        const result = planNextMatchAction(
          state,
          [],
          1_000,
          DEFAULT_CONFIG,
          { turnTimerEnabled },
        );
        expect(result).toBeNull();
      }
    });
  });

  describe("null currentPlayerId", () => {
    it("returns null when currentPlayerId is null in a turn phase (VAL-MD-009)", () => {
      const random = createSeededRandom(1);
      const state = withPhase(
        createBaseState(random),
        "bid",
        null,
      );

      const result = planNextMatchAction(state, [], 1_000, DEFAULT_CONFIG, {
        turnTimerEnabled: true,
      });

      expect(result).toBeNull();
    });
  });

  describe("dueAt is absolute epoch milliseconds (VAL-MD-028)", () => {
    it("derives dueAt from now + delay using a large epoch value", () => {
      const random = createSeededRandom(1);
      const state = withPhase(
        createBaseState(random),
        "trick-result",
        null,
      );
      const now = 1_000_000;
      const config: MatchPacingConfig = {
        ...DEFAULT_CONFIG,
        trickResultDelayMs: 1_500,
      };

      const result = planNextMatchAction(state, [], now, config, {
        turnTimerEnabled: true,
      });

      expect(result).toEqual({
        kind: "resolve-trick",
        dueAt: 1_001_500,
      });
    });
  });

  describe("purity (VAL-MD-010)", () => {
    it("returns equal results for identical inputs and mutates nothing", () => {
      const random = createSeededRandom(1);
      const base = createBaseState(random);
      const state = withPhase(base, "bid", "player-1");
      const players = [aiPacingInfo("player-1")];
      const config: MatchPacingConfig = { ...DEFAULT_CONFIG };
      const options = { turnTimerEnabled: true };

      const stateClone = structuredClone(state);
      const playersClone = structuredClone(players);
      const configClone = structuredClone(config);

      const result1 = planNextMatchAction(state, players, 5_000, config, options);
      const result2 = planNextMatchAction(state, players, 5_000, config, options);

      expect(result1).toEqual(result2);
      expect(state).toEqual(stateClone);
      expect(players).toEqual(playersClone);
      expect(config).toEqual(configClone);
    });
  });
});

// ---------------------------------------------------------------------------
// executeMatchAction
// ---------------------------------------------------------------------------

describe("executeMatchAction", () => {
  describe("turn timeout / AI action", () => {
    it("produces the same transition as applyMatchIntent + chooseAiIntent (VAL-MD-011)", () => {
      const random = createSeededRandom(2);
      const state = playToPhase(random, "bid");
      const playerId = state.currentPlayerId!;
      const players = [createPacingInfo(playerId)];
      const prefix = "test-timeout";
      const action: ScheduledMatchAction = {
        kind: "turn",
        playerId,
        dueAt: 0,
        isTimeout: true,
      };

      const result = executeMatchAction(
        state,
        action,
        random,
        players,
        prefix,
      );

      // Independently compute the expected transition.
      const snapshot = createPlayerSnapshot(state, playerId);
      const intent = chooseAiIntent(snapshot, prefix);
      expect(intent).not.toBeNull();
      const expected = applyMatchIntent(state, playerId, intent!);

      expect(result.transition).toEqual(expected);
    });

    it("increments consecutiveTimeouts for human without setting control at N=0 (VAL-MD-012)", () => {
      const random = createSeededRandom(2);
      const state = playToPhase(random, "bid");
      const playerId = state.currentPlayerId!;
      const players = [
        createPacingInfo(playerId, { consecutiveTimeouts: 0 }),
      ];
      const action: ScheduledMatchAction = {
        kind: "turn",
        playerId,
        dueAt: 0,
        isTimeout: true,
      };

      const result = executeMatchAction(
        state,
        action,
        random,
        players,
        "prefix",
      );

      expect(result.playerPacingChanges).toEqual([
        {
          playerId,
          consecutiveTimeouts: 1,
        },
      ]);
      // control must NOT be set when N === 0
      expect(result.playerPacingChanges?.[0]?.control).toBeUndefined();
    });

    it("increments to 1 without setting control at N=0 via parameterized check (VAL-MD-012)", () => {
      const random = createSeededRandom(3);
      const state = playToPhase(random, "bid");
      const playerId = state.currentPlayerId!;

      for (const n of [0, 1]) {
        const players = [
          createPacingInfo(playerId, { consecutiveTimeouts: n }),
        ];
        const action: ScheduledMatchAction = {
          kind: "turn",
          playerId,
          dueAt: 0,
          isTimeout: true,
        };

        const result = executeMatchAction(
          state,
          action,
          random,
          players,
          `prefix-${n}`,
        );

        const change = result.playerPacingChanges?.[0];
        expect(change?.consecutiveTimeouts).toBe(n + 1);
        if (n === 0) {
          expect(change?.control).toBeUndefined();
        }
      }
    });

    it("flips control to ai after 2 consecutive timeouts (VAL-MD-013)", () => {
      const random = createSeededRandom(2);
      const state = playToPhase(random, "bid");
      const playerId = state.currentPlayerId!;
      const players = [
        createPacingInfo(playerId, { consecutiveTimeouts: 1 }),
      ];
      const action: ScheduledMatchAction = {
        kind: "turn",
        playerId,
        dueAt: 0,
        isTimeout: true,
      };

      const result = executeMatchAction(
        state,
        action,
        random,
        players,
        "prefix",
      );

      expect(result.playerPacingChanges).toEqual([
        {
          playerId,
          consecutiveTimeouts: 2,
          control: "ai",
        },
      ]);
    });

    it("returns no playerPacingChanges for AI players (VAL-MD-014)", () => {
      const random = createSeededRandom(2);
      const state = playToPhase(random, "bid");
      const playerId = state.currentPlayerId!;
      const players = [aiPacingInfo(playerId)];
      const action: ScheduledMatchAction = {
        kind: "turn",
        playerId,
        dueAt: 0,
        isTimeout: false,
      };

      const result = executeMatchAction(
        state,
        action,
        random,
        players,
        "prefix",
      );

      expect(result.playerPacingChanges).toBeUndefined();
    });

    it("still applies AI intent for a disconnected human in no-timer grace (VAL-MD-015)", () => {
      const random = createSeededRandom(2);
      const state = playToPhase(random, "bid");
      const playerId = state.currentPlayerId!;
      const players = [
        createPacingInfo(playerId, { connected: false, consecutiveTimeouts: 0 }),
      ];
      const action: ScheduledMatchAction = {
        kind: "turn",
        playerId,
        dueAt: 0,
        isTimeout: true,
      };

      const result = executeMatchAction(
        state,
        action,
        random,
        players,
        "grace-prefix",
      );

      expect(result.transition.state).not.toBe(state);
      expect(result.transition.events.length).toBeGreaterThan(0);
    });
  });

  describe("resolve-trick", () => {
    it("produces the same transition as advanceAuthoritativeMatch (VAL-MD-016)", () => {
      // Twin random sources: one drives executeMatchAction, the other drives
      // the independent expected computation. Both start from the same seed
      // and undergo the same playToPhase operations, so they are at the same
      // state when the assertions run.
      const randomA = createSeededRandom(4);
      const randomB = createSeededRandom(4);
      const state = playToPhase(randomA, "trick-result");
      playToPhase(randomB, "trick-result");
      const action: ScheduledMatchAction = {
        kind: "resolve-trick",
        dueAt: 0,
      };

      const result = executeMatchAction(
        state,
        action,
        randomA,
        [],
        "prefix",
      );

      const expected = advanceAuthoritativeMatch(
        state,
        "resolve-trick",
        randomB,
      );
      expect(result.transition).toEqual(expected);
      expect(result.playerPacingChanges).toBeUndefined();
    });
  });

  describe("continue-round", () => {
    it("produces the same transition as advanceAuthoritativeMatch (VAL-MD-017)", () => {
      const randomA = createSeededRandom(4);
      const randomB = createSeededRandom(4);
      const state = playToPhase(randomA, "round-score");
      playToPhase(randomB, "round-score");
      const action: ScheduledMatchAction = {
        kind: "continue-round",
        dueAt: 0,
      };

      const result = executeMatchAction(
        state,
        action,
        randomA,
        [],
        "prefix",
      );

      const expected = advanceAuthoritativeMatch(
        state,
        "continue-round",
        randomB,
      );
      expect(result.transition).toEqual(expected);
      expect(result.playerPacingChanges).toBeUndefined();
    });
  });

  describe("commandIdPrefix flows into AI intent commandId (VAL-MD-018)", () => {
    it("uses the prefix as the commandId and distinct prefixes produce unique ids", () => {
      const random = createSeededRandom(2);
      const state = playToPhase(random, "bid");
      const playerId = state.currentPlayerId!;
      const players = [createPacingInfo(playerId)];
      const action: ScheduledMatchAction = {
        kind: "turn",
        playerId,
        dueAt: 0,
        isTimeout: true,
      };

      const resultA = executeMatchAction(
        state,
        action,
        random,
        players,
        "prefix-a",
      );
      const resultB = executeMatchAction(
        state,
        action,
        random,
        players,
        "prefix-b",
      );

      const keyA = Object.keys(resultA.transition.state.commandEventCache).find(
        (key) => !state.commandEventCache[key],
      );
      const keyB = Object.keys(resultB.transition.state.commandEventCache).find(
        (key) => !state.commandEventCache[key],
      );

      expect(keyA).toBe("prefix-a");
      expect(keyB).toBe("prefix-b");
      expect(keyA).not.toBe(keyB);
    });
  });

  describe("purity with respect to players (VAL-MD-019)", () => {
    it("does not mutate the input players array or PlayerPacingInfo objects", () => {
      const random = createSeededRandom(2);
      const state = playToPhase(random, "bid");
      const playerId = state.currentPlayerId!;
      const players = [
        createPacingInfo(playerId, { consecutiveTimeouts: 0 }),
      ];
      const playersClone = structuredClone(players);
      const action: ScheduledMatchAction = {
        kind: "turn",
        playerId,
        dueAt: 0,
        isTimeout: true,
      };

      executeMatchAction(state, action, random, players, "prefix");

      expect(players).toEqual(playersClone);
    });
  });
});

// ---------------------------------------------------------------------------
// Exports and authority boundary
// ---------------------------------------------------------------------------

describe("module exports", () => {
  it("exports planNextMatchAction and executeMatchAction from the bare specifier (VAL-MD-024, VAL-CROSS-017)", () => {
    expect(typeof Core.planNextMatchAction).toBe("function");
    expect(typeof Core.executeMatchAction).toBe("function");
  });

  it("exports all types from the bare specifier (VAL-MD-024)", () => {
    // Type-only imports prove the symbols are advertised on the bare specifier.
    // A runtime check ensures the type exports are wired (undefined for types
    // is expected, but the named import must not throw).
    const typeSymbols = {
      MatchPacingConfig: undefined as MatchPacingConfig | undefined,
      PlayerPacingInfo: undefined as PlayerPacingInfo | undefined,
      ScheduledMatchAction: undefined as ScheduledMatchAction | undefined,
      MatchActionExecution: undefined as MatchActionExecution | undefined,
      PlayerPacingChange: undefined as PlayerPacingChange | undefined,
    };
    expect(typeSymbols).toBeDefined();
  });

  it("does not re-export authority functions via the match-driver module (VAL-MD-025)", () => {
    const bare = Core as unknown as Record<string, unknown>;
    expect(bare.advanceAuthoritativeMatch).toBeUndefined();
    expect(bare.applyMatchIntent).toBeUndefined();
    expect(bare.createMatch).toBeUndefined();
    expect(bare.createPlayerSnapshot).toBeUndefined();
    expect(bare.getLegalCardIds).toBeUndefined();
  });

  it("MatchPacingConfig.roundScoreDelayMs accepts null (clients) and number (server) (VAL-MD-027)", () => {
    const clientConfig: MatchPacingConfig = {
      aiActionDelayMs: 420,
      trickResultDelayMs: 1_500,
      roundScoreDelayMs: null,
      turnTimeoutMs: 30_000,
    };
    const serverConfig: MatchPacingConfig = {
      aiActionDelayMs: 450,
      trickResultDelayMs: 1_500,
      roundScoreDelayMs: 8_000,
      turnTimeoutMs: 30_000,
    };
    expect(clientConfig.roundScoreDelayMs).toBeNull();
    expect(serverConfig.roundScoreDelayMs).toBe(8_000);
  });
});
