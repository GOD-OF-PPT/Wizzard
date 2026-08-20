// Match-driver: pure pacing decision and execution shared by all runtimes.
//
// This module composes existing authority functions (chooseAiIntent,
// applyMatchIntent, advanceAuthoritativeMatch, createPlayerSnapshot) to
// decide what happens next in a match and when (absolute dueAt), then execute
// that decision. It does NOT re-export the authority functions — callers that
// need them must use the /authority subpath.

import { chooseAiIntent } from "./ai.js";
import {
  advanceAuthoritativeMatch,
  applyMatchIntent,
  createPlayerSnapshot,
  type AuthoritativeMatchState,
  type MatchTransition,
} from "./match.js";
import type { RandomSource } from "./deal.js";

/**
 * Pacing configuration — the single source of truth for match timing constants.
 *
 * `roundScoreDelayMs` is nullable: `null` means manual advance (clients call
 * `advance()` / `requestContinueRound()` themselves); a number means the
 * scheduler auto-advances after that many milliseconds (server).
 */
export type MatchPacingConfig = {
  /** AI "thinking" delay before an automated action fires. */
  aiActionDelayMs: number;
  /** Trick-result display duration before the trick is resolved. */
  trickResultDelayMs: number;
  /** Round-score display duration before the next round starts. `null` = manual. */
  roundScoreDelayMs: number | null;
  /** Human turn deadline. */
  turnTimeoutMs: number;
};

/**
 * Per-player pacing metadata. This is separate from `MatchPlayerState` (the
 * authority-side player record) because pacing concerns — connectivity,
 * timeout counters, control takeover — belong to the scheduling runtime, not
 * the rules engine.
 */
export type PlayerPacingInfo = {
  playerId: string;
  isAi: boolean;
  control: "human" | "ai";
  connected: boolean;
  consecutiveTimeouts: number;
};

/**
 * A scheduled match action returned by `planNextMatchAction`.
 *
 * `dueAt` is an absolute epoch-millisecond timestamp (not a relative delay).
 * Each runtime derives its own countdown from `dueAt - now`.
 */
export type ScheduledMatchAction =
  | { kind: "continue-round"; dueAt: number }
  | { kind: "resolve-trick"; dueAt: number }
  | {
      kind: "turn";
      playerId: string;
      dueAt: number;
      /** `true` for a human deadline expiry, `false` for a scheduled AI action. */
      isTimeout: boolean;
    };

/**
 * A per-player pacing change returned by `executeMatchAction`. The scheduling
 * runtime applies these after executing the action; clients ignore them.
 */
export type PlayerPacingChange = {
  playerId: string;
  consecutiveTimeouts?: number;
  control?: "human" | "ai";
};

/**
 * Result of executing a scheduled match action.
 */
export type MatchActionExecution = {
  transition: MatchTransition;
  playerPacingChanges?: PlayerPacingChange[];
};

/**
 * Decide what should happen next in the match and when.
 *
 * Returns `null` when no automatic action should be scheduled:
 * - `match-end` phase (match is over).
 * - `round-score` phase when `roundScoreDelayMs` is `null` (manual advance).
 * - A connected human's turn when `turnTimerEnabled` is `false` (no-timer mode).
 * - A turn phase with no current player.
 *
 * For all other cases, returns a `ScheduledMatchAction` with an absolute
 * `dueAt` timestamp.
 *
 * This function is pure: it does not mutate `state`, `players`, or `config`.
 */
export function planNextMatchAction(
  state: AuthoritativeMatchState,
  players: PlayerPacingInfo[],
  now: number,
  config: MatchPacingConfig,
  options: { turnTimerEnabled: boolean },
): ScheduledMatchAction | null {
  if (state.phase === "match-end") {
    return null;
  }

  if (state.phase === "trick-result") {
    return { kind: "resolve-trick", dueAt: now + config.trickResultDelayMs };
  }

  if (state.phase === "round-score") {
    if (config.roundScoreDelayMs === null) {
      return null;
    }
    return { kind: "continue-round", dueAt: now + config.roundScoreDelayMs };
  }

  // Turn phases: trump-select, bid, trick-play.
  const currentPlayerId = state.currentPlayerId;
  if (!currentPlayerId) {
    return null;
  }

  const player = players.find(
    (entry) => entry.playerId === currentPlayerId,
  );
  if (!player) {
    return null;
  }

  // Automation detection prefers `control` over `isAi`: a human whose control
  // was flipped to "ai" (consecutive-timeout takeover) is treated as automated.
  const automated = player.control === "ai" || player.isAi;

  // No-timer mode: a connected human gets no deadline. A disconnected human
  // still gets a deadline to prevent an abandoned client from deadlocking the
  // match (the server handles the hidden takeover window separately).
  if (!automated && !options.turnTimerEnabled && player.connected) {
    return null;
  }

  const delay = automated ? config.aiActionDelayMs : config.turnTimeoutMs;
  return {
    kind: "turn",
    playerId: currentPlayerId,
    dueAt: now + delay,
    isTimeout: !automated,
  };
}

/**
 * Execute a previously scheduled match action.
 *
 * For `turn` actions: creates a player snapshot, asks the AI for an intent,
 * and applies it via `applyMatchIntent`. If the action is a human timeout
 * (`isTimeout: true`), returns `playerPacingChanges` with the incremented
 * `consecutiveTimeouts` and, after the second timeout, `control: "ai"`.
 *
 * For `resolve-trick` and `continue-round` actions: delegates to
 * `advanceAuthoritativeMatch`.
 *
 * This function is pure with respect to the `players` array — it does not
 * mutate `PlayerPacingInfo` objects. The `commandIdPrefix` flows directly into
 * the AI intent's `commandId`.
 */
export function executeMatchAction(
  state: AuthoritativeMatchState,
  action: ScheduledMatchAction,
  random: RandomSource,
  players: PlayerPacingInfo[],
  commandIdPrefix: string,
): MatchActionExecution {
  if (action.kind === "turn") {
    const snapshot = createPlayerSnapshot(state, action.playerId);
    const intent = chooseAiIntent(snapshot, commandIdPrefix);

    if (!intent) {
      return { transition: { events: [], state } };
    }

    const transition = applyMatchIntent(state, action.playerId, intent);

    let playerPacingChanges: PlayerPacingChange[] | undefined;
    if (action.isTimeout) {
      const player = players.find(
        (entry) => entry.playerId === action.playerId,
      );
      if (player && !player.isAi && player.control === "human") {
        const nextTimeouts = player.consecutiveTimeouts + 1;
        const change: PlayerPacingChange = {
          playerId: action.playerId,
          consecutiveTimeouts: nextTimeouts,
        };
        if (nextTimeouts >= 2) {
          change.control = "ai";
        }
        playerPacingChanges = [change];
      }
    }

    return { transition, playerPacingChanges };
  }

  const advance =
    action.kind === "resolve-trick" ? "resolve-trick" : "continue-round";
  const transition = advanceAuthoritativeMatch(state, advance, random);
  return { transition };
}
