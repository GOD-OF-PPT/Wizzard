import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  advanceAuthoritativeMatch,
  applyMatchIntent,
  createPlayerSnapshot,
  type AuthoritativeMatchState,
  type MatchTransition,
} from "@wizzard/game-core/authority";
import {
  executeMatchAction,
  planNextMatchAction,
  type MatchPacingConfig,
  type PlayerPacingInfo,
} from "@wizzard/game-core";
import type {
  MatchEvent,
  MatchIntent,
  MatchPlayerSeed,
  PlayerMatchSnapshot,
  Suit,
} from "@wizzard/game-core/contracts";
import type { MatchControls } from "../web/shared/IMatchAdapter";
import { createWebPracticeSession, type PracticeSessionOptions } from "../web/practice-session";

const HUMAN_PLAYER_ID = "player-you";
const FAST_EVIDENCE_MODE = import.meta.env.DEV && typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("fast") : null;
const FAST_EVIDENCE_PACING = FAST_EVIDENCE_MODE === "1" || FAST_EVIDENCE_MODE === "2";

/** Convert seconds to milliseconds (rounded) for pacing configuration. */
const toMs = (seconds: number): number => Math.round(seconds * 1000);

/**
 * Pacing configuration for the local practice match. AI actions and trick
 * results advance automatically through `planNextMatchAction`; round scores
 * advance manually via `advance()` (`roundScoreDelayMs: null`). The turn
 * timer is always enabled for local practice.
 */
const PACING_CONFIG: MatchPacingConfig = {
  aiActionDelayMs: toMs(FAST_EVIDENCE_PACING ? 0.1 : 0.42),
  trickResultDelayMs: toMs(FAST_EVIDENCE_PACING ? 0.18 : 1.5),
  roundScoreDelayMs: null,
  // Mode 2 keeps normal human thinking time while accelerating only AI and
  // result pacing, so browser inspection never races a five-second timeout.
  turnTimeoutMs: toMs(FAST_EVIDENCE_MODE === "1" ? 1.2 : 30),
};

const PRACTICE_PLAYERS: readonly MatchPlayerSeed[] = [
  {
    avatarKey: "bamboo-cat",
    id: HUMAN_PLAYER_ID,
    isHuman: true,
    name: "青竹客",
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
  {
    avatarKey: "ink-panda",
    id: "player-panda",
    name: "墨隐熊",
  },
  {
    avatarKey: "sleepy-star-cat",
    id: "player-star-cat",
    name: "星眠猫",
  },
  {
    avatarKey: "masked-traveler",
    id: "player-traveler",
    name: "AI旅人",
  },
];

type IntentPayload =
  | { trump: Suit; type: "choose-trump" }
  | { bid: number; type: "submit-bid" }
  | { cardId: string; type: "play-card" };

type Session = {
  events: MatchEvent[];
  state: AuthoritativeMatchState;
};

type SessionAction =
  | { transition: MatchTransition; type: "transition" }
  | { state: AuthoritativeMatchState; type: "reset" };

function sessionReducer(_session: Session, action: SessionAction): Session {
  if (action.type === "reset") {
    return { events: [], state: action.state };
  }

  return {
    events: action.transition.events,
    state: action.transition.state,
  };
}

export type LocalMatchController = {
  advance: () => void;
  connection?: "local" | "connected" | "reconnecting" | "disconnected";
  controls?: MatchControls;
  events: MatchEvent[];
  humanPlayerId: string;
  restart: () => void;
  sendIntent: (payload: IntentPayload) => void;
  snapshot: PlayerMatchSnapshot;
  turnSecondsRemaining: number | null;
};

export function useLocalMatch(options: PracticeSessionOptions = {}): LocalMatchController {
  const optionsRef = useRef(options);
  const openingRef = useRef<ReturnType<typeof createWebPracticeSession> | null>(null);
  if (!openingRef.current) openingRef.current = createWebPracticeSession(PRACTICE_PLAYERS, HUMAN_PLAYER_ID, optionsRef.current);
  const randomRef = useRef(openingRef.current.random);
  const commandCounterRef = useRef(0);
  const initialSessionRef = useRef<Session | null>(null);

  if (!initialSessionRef.current) {
    initialSessionRef.current = {
      events: [],
      state: openingRef.current.state,
    };
  }

  const [session, dispatch] = useReducer(
    sessionReducer,
    initialSessionRef.current,
  );
  const [turnSecondsRemaining, setTurnSecondsRemaining] = useState<
    number | null
  >(null);
  const snapshot = useMemo(
    () => createPlayerSnapshot(session.state, HUMAN_PLAYER_ID),
    [session.state],
  );
  useEffect(() => { openingRef.current?.commitOpening(); }, [session.state.matchId]);

  const sendIntent = useCallback(
    (payload: IntentPayload) => {
      commandCounterRef.current += 1;
      const intent = {
        ...payload,
        commandId: `local:${commandCounterRef.current}`,
        expectedVersion: session.state.version,
      } as MatchIntent;
      dispatch({
        transition: applyMatchIntent(session.state, HUMAN_PLAYER_ID, intent),
        type: "transition",
      });
    },
    [session.state.version],
  );

  const advance = useCallback(() => {
    dispatch({
      transition: advanceAuthoritativeMatch(
        session.state,
        "continue-round",
        randomRef.current,
      ),
      type: "transition",
    });
  }, [session.state]);

  const restart = useCallback(() => {
    const next = createWebPracticeSession(PRACTICE_PLAYERS, HUMAN_PLAYER_ID, optionsRef.current);
    openingRef.current = next;
    randomRef.current = next.random;
    commandCounterRef.current = 0;
    dispatch({ state: next.state, type: "reset" });
  }, []);

  useEffect(() => {
    // Build the per-player pacing metadata the shared driver needs. The local
    // human is always connected and human-controlled; AI seats are automated.
    // Clients ignore `playerPacingChanges` (consecutive-timeout takeover is a
    // server concern), so `consecutiveTimeouts` stays at 0 here.
    const players: PlayerPacingInfo[] = session.state.players.map((player) => ({
      playerId: player.id,
      isAi: !player.isHuman,
      control: player.isHuman ? "human" : "ai",
      connected: true,
      consecutiveTimeouts: 0,
    }));

    const now = Date.now();
    const action = planNextMatchAction(
      session.state,
      players,
      now,
      PACING_CONFIG,
      { turnTimerEnabled: true },
    );

    if (!action) {
      setTurnSecondsRemaining(null);
      return undefined;
    }

    // Schedule the next match action at its absolute `dueAt`. The countdown
    // HUD is derived from this same `dueAt` rather than a hardcoded constant.
    const pacingDelay = Math.max(0, action.dueAt - now);

    const timeout = window.setTimeout(() => {
      let commandIdPrefix: string;
      if (action.kind === "turn") {
        commandCounterRef.current += 1;
        commandIdPrefix = action.isTimeout
          ? `local-timeout:${commandCounterRef.current}`
          : `local-ai:${commandCounterRef.current}`;
      } else {
        commandIdPrefix = "local-advance";
      }

      const execution = executeMatchAction(
        session.state,
        action,
        randomRef.current,
        players,
        commandIdPrefix,
      );

      // Only dispatch when the action produced a new state. A no-op (e.g. the
      // AI had no intent) returns the same state reference, matching the prior
      // `if (intent)` guard. `playerPacingChanges` is ignored by clients.
      if (execution.transition.state !== session.state) {
        dispatch({ transition: execution.transition, type: "transition" });
      }
    }, pacingDelay);

    // The countdown HUD only applies to turn phases; trick-result and
    // round-score advance silently behind their scheduled action.
    let interval: number | undefined;
    if (action.kind === "turn") {
      const tick = () =>
        setTurnSecondsRemaining(
          Math.max(0, Math.ceil((action.dueAt - Date.now()) / 1000)),
        );
      tick();
      interval = window.setInterval(tick, 250);
    } else {
      setTurnSecondsRemaining(null);
    }

    return () => {
      window.clearTimeout(timeout);
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [session.state]);

  return {
    advance,
    connection: "local",
    events: session.events,
    humanPlayerId: HUMAN_PLAYER_ID,
    restart,
    sendIntent,
    snapshot,
    turnSecondsRemaining,
  };
}
