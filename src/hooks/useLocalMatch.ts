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
  chooseAiIntent,
  createMatch,
  createPlayerSnapshot,
  type AuthoritativeMatchState,
  type MatchEvent,
  type MatchIntent,
  type MatchPlayerSeed,
  type MatchTransition,
  type PlayerMatchSnapshot,
  type RandomSource,
  type Suit,
} from "../game";

const HUMAN_PLAYER_ID = "player-you";
const TURN_DURATION_SECONDS = 30;
// The deterministic practice seed opens with a highest-card reveal so the
// first round exercises the dealer trump-choice flow before bidding.
const DEFAULT_SEED = 1;

const PRACTICE_PLAYERS: readonly MatchPlayerSeed[] = [
  {
    avatarKey: "bamboo-cat",
    id: HUMAN_PLAYER_ID,
    isHuman: true,
    name: "你",
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
    name: "面具旅人",
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

function createPracticeState(random: RandomSource): AuthoritativeMatchState {
  return createMatch(
    {
      dealerIndex: 0,
      matchId: "practice-quick",
      mode: "quick",
      players: PRACTICE_PLAYERS,
    },
    random,
  );
}

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
  events: MatchEvent[];
  humanPlayerId: string;
  restart: () => void;
  sendIntent: (payload: IntentPayload) => void;
  snapshot: PlayerMatchSnapshot;
  turnSecondsRemaining: number | null;
};

export function useLocalMatch(): LocalMatchController {
  const randomRef = useRef<RandomSource>(createSeededRandom(DEFAULT_SEED));
  const commandCounterRef = useRef(0);
  const initialSessionRef = useRef<Session | null>(null);

  if (!initialSessionRef.current) {
    initialSessionRef.current = {
      events: [],
      state: createPracticeState(randomRef.current),
    };
  }

  const [session, dispatch] = useReducer(
    sessionReducer,
    initialSessionRef.current,
  );
  const [turnSecondsRemaining, setTurnSecondsRemaining] = useState<
    number | null
  >(TURN_DURATION_SECONDS);
  const snapshot = useMemo(
    () => createPlayerSnapshot(session.state, HUMAN_PLAYER_ID),
    [session.state],
  );

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
    randomRef.current = createSeededRandom(DEFAULT_SEED);
    commandCounterRef.current = 0;
    dispatch({ state: createPracticeState(randomRef.current), type: "reset" });
  }, []);

  useEffect(() => {
    if (session.state.phase === "trick-result") {
      const timeout = window.setTimeout(() => {
        dispatch({
          transition: advanceAuthoritativeMatch(
            session.state,
            "resolve-trick",
            randomRef.current,
          ),
          type: "transition",
        });
      }, 1500);

      return () => window.clearTimeout(timeout);
    }

    const currentPlayer = session.state.players.find(
      (player) => player.id === session.state.currentPlayerId,
    );

    if (!currentPlayer) {
      return undefined;
    }

    const isLocalHuman = currentPlayer.id === HUMAN_PLAYER_ID;

    const timeout = window.setTimeout(() => {
      const snapshot = createPlayerSnapshot(session.state, currentPlayer.id);
      commandCounterRef.current += 1;
      const intent = chooseAiIntent(
        snapshot,
        `${isLocalHuman ? "local-timeout" : "local-ai"}:${commandCounterRef.current}`,
      );

      if (intent) {
        dispatch({
          transition: applyMatchIntent(
            session.state,
            currentPlayer.id,
            intent,
          ),
          type: "transition",
        });
      }
    }, isLocalHuman ? TURN_DURATION_SECONDS * 1000 : 420);

    return () => window.clearTimeout(timeout);
  }, [session.state]);

  useEffect(() => {
    const hasActiveTurn =
      session.state.currentPlayerId !== null &&
      (session.state.phase === "trump-select" ||
        session.state.phase === "bid" ||
        session.state.phase === "trick-play");

    if (!hasActiveTurn) {
      setTurnSecondsRemaining(null);
      return undefined;
    }

    const deadline = Date.now() + TURN_DURATION_SECONDS * 1000;
    setTurnSecondsRemaining(TURN_DURATION_SECONDS);

    const interval = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000),
      );
      setTurnSecondsRemaining(remaining);
    }, 250);

    return () => window.clearInterval(interval);
  }, [
    session.state.currentPlayerId,
    session.state.phase,
    session.state.version,
  ]);

  return {
    advance,
    events: session.events,
    humanPlayerId: HUMAN_PLAYER_ID,
    restart,
    sendIntent,
    snapshot,
    turnSecondsRemaining,
  };
}
