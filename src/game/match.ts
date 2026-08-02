import { createDeck } from "./deck";
import { dealCards, shuffleCards, type RandomSource } from "./deal";
import { getRoundHandCounts } from "./rounds";
import { scoreRound, validateBid, type ScoreEntry } from "./scoring";
import { getLegalCards, resolveTrickWinner } from "./trick";
import { resolveTrump } from "./trump";
import type {
  Card,
  GameMode,
  PlayedCard,
  PlayerCount,
  Suit,
} from "./types";
import { SUITS } from "./types";

export type MatchPhase =
  | "trump-select"
  | "bid"
  | "trick-play"
  | "trick-result"
  | "round-score"
  | "match-end";

export type AuthorityAdvance = "continue-round" | "resolve-trick";

export type MatchPlayerSeed = {
  avatarKey: string;
  id: string;
  isHuman?: boolean;
  name: string;
};

export type MatchPlayerState = {
  avatarKey: string;
  bid: number | null;
  id: string;
  isHuman: boolean;
  name: string;
  roundScore: number | null;
  seatIndex: number;
  totalScore: number;
  tricksWon: number;
};

export type TrickState = {
  leaderId: string;
  number: number;
  plays: PlayedCard[];
};

export type CompletedTrick = TrickState & {
  winnerId: string;
};

export type AuthoritativeMatchState = {
  commandEventCache: Record<string, MatchEvent[]>;
  completedTrick: CompletedTrick | null;
  currentPlayerId: string | null;
  dealerIndex: number;
  hands: Record<string, Card[]>;
  handSize: number;
  matchId: string;
  mode: GameMode;
  phase: MatchPhase;
  players: MatchPlayerState[];
  processedCommandIds: string[];
  revealedCard: Card | null;
  roundHandCounts: number[];
  roundIndex: number;
  scoreEntries: ScoreEntry[];
  trick: TrickState;
  trump: Suit | null;
  version: number;
};

export type MatchIntentBase = {
  commandId: string;
  expectedVersion: number;
};

export type MatchIntent =
  | (MatchIntentBase & { trump: Suit; type: "choose-trump" })
  | (MatchIntentBase & { bid: number; type: "submit-bid" })
  | (MatchIntentBase & { cardId: string; type: "play-card" });

export type MatchErrorCode =
  | "DUPLICATE_COMMAND"
  | "STALE_VERSION"
  | "WRONG_PHASE"
  | "NOT_YOUR_TURN"
  | "PLAYER_NOT_FOUND"
  | "INVALID_TRUMP"
  | "BID_NOT_INTEGER"
  | "BID_OUT_OF_RANGE"
  | "CARD_NOT_FOUND"
  | "CARD_NOT_LEGAL";

export type MatchEvent =
  | {
      code: MatchErrorCode;
      commandId: string;
      type: "intent-rejected";
      version: number;
    }
  | {
      playerId: string;
      trump: Suit;
      type: "trump-selected";
      version: number;
    }
  | {
      bid: number;
      playerId: string;
      type: "bid-accepted";
      version: number;
    }
  | {
      card: Card;
      playerId: string;
      trickNumber: number;
      type: "card-played";
      version: number;
    }
  | {
      plays: PlayedCard[];
      trickNumber: number;
      type: "trick-resolved";
      version: number;
      winnerId: string;
    }
  | {
      leaderId: string;
      trickNumber: number;
      type: "trick-started";
      version: number;
    }
  | {
      entries: ScoreEntry[];
      roundNumber: number;
      type: "round-scored";
      version: number;
    }
  | {
      dealerId: string;
      handSize: number;
      revealedCard: Card | null;
      roundNumber: number;
      type: "round-started";
      version: number;
    }
  | {
      type: "match-ended";
      version: number;
      winnerIds: string[];
    };

export type MatchTransition = {
  events: MatchEvent[];
  state: AuthoritativeMatchState;
};

export type PublicMatchState = Omit<
  AuthoritativeMatchState,
  "commandEventCache" | "hands" | "processedCommandIds"
> & {
  handCounts: Record<string, number>;
};

export type PlayerPrivateState = {
  hand: Card[];
  legalCardIds: string[];
  playerId: string;
};

export type PlayerMatchSnapshot = {
  privateState: PlayerPrivateState;
  publicState: PublicMatchState;
};

function asPlayerCount(count: number): PlayerCount {
  if (count < 3 || count > 6) {
    throw new Error("PLAYER_COUNT_OUT_OF_RANGE");
  }

  return count as PlayerCount;
}

function getSeatId(players: readonly MatchPlayerState[], index: number): string {
  return players[(index + players.length) % players.length].id;
}

function getPlayerIndex(
  players: readonly MatchPlayerState[],
  playerId: string,
): number {
  return players.findIndex((player) => player.id === playerId);
}

function getNextPlayerId(
  players: readonly MatchPlayerState[],
  playerId: string,
): string {
  const index = getPlayerIndex(players, playerId);

  if (index < 0) {
    throw new Error("PLAYER_NOT_FOUND");
  }

  return getSeatId(players, index + 1);
}

function rememberCommand(
  commandIds: readonly string[],
  commandId: string,
): string[] {
  return [...commandIds, commandId];
}

function acceptIntent(
  state: AuthoritativeMatchState,
  intent: MatchIntent,
  events: MatchEvent[],
): MatchTransition {
  const cachedEvents = events.map(cloneMatchEvent);

  return {
    events: cachedEvents.map(cloneMatchEvent),
    state: {
      ...state,
      commandEventCache: {
        ...state.commandEventCache,
        [intent.commandId]: cachedEvents,
      },
    },
  };
}

function cloneCard(card: Card): Card {
  return { ...card };
}

function clonePlays(plays: readonly PlayedCard[]): PlayedCard[] {
  return plays.map((play) => ({
    card: cloneCard(play.card),
    playerId: play.playerId,
  }));
}

function cloneMatchEvent(event: MatchEvent): MatchEvent {
  if (event.type === "card-played") {
    return { ...event, card: cloneCard(event.card) };
  }

  if (event.type === "trick-resolved") {
    return { ...event, plays: clonePlays(event.plays) };
  }

  if (event.type === "round-scored") {
    return {
      ...event,
      entries: event.entries.map((entry) => ({ ...entry })),
    };
  }

  if (event.type === "round-started") {
    return {
      ...event,
      revealedCard: event.revealedCard
        ? cloneCard(event.revealedCard)
        : null,
    };
  }

  return { ...event };
}

function rejectIntent(
  state: AuthoritativeMatchState,
  intent: MatchIntent,
  code: MatchErrorCode,
): MatchTransition {
  return {
    events: [
      {
        code,
        commandId: intent.commandId,
        type: "intent-rejected",
        version: state.version,
      },
    ],
    state,
  };
}

function setupRound(
  state: AuthoritativeMatchState,
  roundIndex: number,
  dealerIndex: number,
  random: RandomSource,
  version: number,
): AuthoritativeMatchState {
  const handSize = state.roundHandCounts[roundIndex];
  const shuffledDeck = shuffleCards(createDeck(), random);
  const firstPlayerId = getSeatId(state.players, dealerIndex + 1);
  const dealOrder = state.players.map((_, offset) =>
    getSeatId(state.players, dealerIndex + 1 + offset),
  );
  const { hands, remainder } = dealCards(shuffledDeck, dealOrder, handSize);
  const revealedCard = remainder[0] ?? null;
  const resolution = revealedCard ? resolveTrump(revealedCard) : null;
  const needsTrumpChoice = resolution?.kind === "dealer-choice";
  const trump = resolution?.kind === "fixed" ? resolution.trump : null;

  return {
    ...state,
    completedTrick: null,
    currentPlayerId: needsTrumpChoice
      ? getSeatId(state.players, dealerIndex)
      : firstPlayerId,
    dealerIndex,
    hands,
    handSize,
    phase: needsTrumpChoice ? "trump-select" : "bid",
    players: state.players.map((player) => ({
      ...player,
      bid: null,
      roundScore: null,
      tricksWon: 0,
    })),
    revealedCard,
    roundIndex,
    scoreEntries: [],
    trick: {
      leaderId: firstPlayerId,
      number: 1,
      plays: [],
    },
    trump,
    version,
  };
}

export function createMatch(
  config: {
    dealerIndex?: number;
    matchId?: string;
    mode: GameMode;
    players: readonly MatchPlayerSeed[];
  },
  random: RandomSource,
): AuthoritativeMatchState {
  const playerCount = asPlayerCount(config.players.length);
  const uniquePlayerIds = new Set(config.players.map((player) => player.id));

  if (uniquePlayerIds.size !== config.players.length) {
    throw new Error("PLAYER_IDS_MUST_BE_UNIQUE");
  }

  const players = config.players.map<MatchPlayerState>((player, seatIndex) => ({
    avatarKey: player.avatarKey,
    bid: null,
    id: player.id,
    isHuman: player.isHuman ?? false,
    name: player.name,
    roundScore: null,
    seatIndex,
    totalScore: 0,
    tricksWon: 0,
  }));
  const configuredDealerIndex = config.dealerIndex ?? 0;
  const dealerIndex =
    ((configuredDealerIndex % players.length) + players.length) % players.length;
  const initialState: AuthoritativeMatchState = {
    commandEventCache: {},
    completedTrick: null,
    currentPlayerId: null,
    dealerIndex,
    hands: {},
    handSize: 0,
    matchId: config.matchId ?? "local-practice",
    mode: config.mode,
    phase: "bid",
    players,
    processedCommandIds: [],
    revealedCard: null,
    roundHandCounts: getRoundHandCounts(playerCount, config.mode),
    roundIndex: 0,
    scoreEntries: [],
    trick: {
      leaderId: getSeatId(players, dealerIndex + 1),
      number: 1,
      plays: [],
    },
    trump: null,
    version: 0,
  };

  return setupRound(initialState, 0, dealerIndex, random, 0);
}

export function createPlayerSnapshot(
  state: AuthoritativeMatchState,
  playerId: string,
): PlayerMatchSnapshot {
  if (!(playerId in state.hands)) {
    throw new Error("PLAYER_NOT_FOUND");
  }

  const handCounts = Object.fromEntries(
    state.players.map((player) => [player.id, state.hands[player.id].length]),
  );
  const {
    commandEventCache: _commandEventCache,
    hands: _hands,
    processedCommandIds: _commands,
    ...publicState
  } = state;
  const clonedCompletedTrick = state.completedTrick
    ? {
        ...state.completedTrick,
        plays: clonePlays(state.completedTrick.plays),
      }
    : null;

  return {
    privateState: {
      hand: state.hands[playerId].map(cloneCard),
      legalCardIds:
        state.phase === "trick-play" && state.currentPlayerId === playerId
          ? getLegalCards(state.hands[playerId], state.trick.plays).map(
              (card) => card.id,
            )
          : [],
      playerId,
    },
    publicState: {
      ...publicState,
      completedTrick: clonedCompletedTrick,
      handCounts,
      players: state.players.map((player) => ({ ...player })),
      revealedCard: state.revealedCard
        ? cloneCard(state.revealedCard)
        : null,
      roundHandCounts: [...state.roundHandCounts],
      scoreEntries: state.scoreEntries.map((entry) => ({ ...entry })),
      trick: {
        ...state.trick,
        plays: clonePlays(state.trick.plays),
      },
    },
  };
}

export function getLegalCardIds(
  state: AuthoritativeMatchState,
  playerId: string,
): string[] {
  const hand = state.hands[playerId];

  if (!hand) {
    return [];
  }

  return getLegalCards(hand, state.trick.plays).map((card) => card.id);
}

export function applyMatchIntent(
  state: AuthoritativeMatchState,
  actorPlayerId: string,
  intent: MatchIntent,
): MatchTransition {
  const cachedEvents = state.commandEventCache[intent.commandId];

  if (cachedEvents) {
    return { events: cachedEvents.map(cloneMatchEvent), state };
  }

  if (state.processedCommandIds.includes(intent.commandId)) {
    return rejectIntent(state, intent, "DUPLICATE_COMMAND");
  }

  if (intent.expectedVersion !== state.version) {
    return rejectIntent(state, intent, "STALE_VERSION");
  }

  const playerIndex = getPlayerIndex(state.players, actorPlayerId);

  if (playerIndex < 0) {
    return rejectIntent(state, intent, "PLAYER_NOT_FOUND");
  }

  if (state.currentPlayerId !== actorPlayerId) {
    return rejectIntent(state, intent, "NOT_YOUR_TURN");
  }

  const nextVersion = state.version + 1;
  const processedCommandIds = rememberCommand(
    state.processedCommandIds,
    intent.commandId,
  );

  if (intent.type === "choose-trump") {
    if (state.phase !== "trump-select") {
      return rejectIntent(state, intent, "WRONG_PHASE");
    }

    if (!SUITS.includes(intent.trump)) {
      return rejectIntent(state, intent, "INVALID_TRUMP");
    }

    const nextState: AuthoritativeMatchState = {
      ...state,
      currentPlayerId: getSeatId(state.players, state.dealerIndex + 1),
      phase: "bid",
      processedCommandIds,
      trump: intent.trump,
      version: nextVersion,
    };

    return acceptIntent(nextState, intent, [
      {
        playerId: actorPlayerId,
        trump: intent.trump,
        type: "trump-selected",
        version: nextVersion,
      },
    ]);
  }

  if (intent.type === "submit-bid") {
    if (state.phase !== "bid") {
      return rejectIntent(state, intent, "WRONG_PHASE");
    }

    const validation = validateBid(intent.bid, state.handSize);

    if (!validation.ok) {
      return rejectIntent(state, intent, validation.error);
    }

    const players = state.players.map((player) =>
      player.id === actorPlayerId
        ? { ...player, bid: validation.value }
        : player,
    );
    const biddingComplete = players.every((player) => player.bid !== null);
    const nextState: AuthoritativeMatchState = {
      ...state,
      currentPlayerId: biddingComplete
        ? state.trick.leaderId
        : getNextPlayerId(players, actorPlayerId),
      phase: biddingComplete ? "trick-play" : "bid",
      players,
      processedCommandIds,
      version: nextVersion,
    };

    return acceptIntent(nextState, intent, [
      {
        bid: validation.value,
        playerId: actorPlayerId,
        type: "bid-accepted",
        version: nextVersion,
      },
    ]);
  }

  if (state.phase !== "trick-play") {
    return rejectIntent(state, intent, "WRONG_PHASE");
  }

  const hand = state.hands[actorPlayerId];
  const card = hand.find((candidate) => candidate.id === intent.cardId);

  if (!card) {
    return rejectIntent(state, intent, "CARD_NOT_FOUND");
  }

  const legalCardIds = new Set(
    getLegalCards(hand, state.trick.plays).map((candidate) => candidate.id),
  );

  if (!legalCardIds.has(card.id)) {
    return rejectIntent(state, intent, "CARD_NOT_LEGAL");
  }

  const plays = [...state.trick.plays, { card, playerId: actorPlayerId }];
  const hands = {
    ...state.hands,
    [actorPlayerId]: hand.filter((candidate) => candidate.id !== card.id),
  };
  const trickComplete = plays.length === state.players.length;

  if (!trickComplete) {
    const nextState: AuthoritativeMatchState = {
      ...state,
      currentPlayerId: getNextPlayerId(state.players, actorPlayerId),
      hands,
      processedCommandIds,
      trick: { ...state.trick, plays },
      version: nextVersion,
    };

    return acceptIntent(nextState, intent, [
      {
        card,
        playerId: actorPlayerId,
        trickNumber: state.trick.number,
        type: "card-played",
        version: nextVersion,
      },
    ]);
  }

  const winner = resolveTrickWinner(plays, state.trump);

  if (!winner) {
    throw new Error("TRICK_WINNER_NOT_FOUND");
  }

  const players = state.players.map((player) =>
    player.id === winner.playerId
      ? { ...player, tricksWon: player.tricksWon + 1 }
      : player,
  );
  const completedTrick: CompletedTrick = {
    ...state.trick,
    plays,
    winnerId: winner.playerId,
  };
  const nextState: AuthoritativeMatchState = {
    ...state,
    completedTrick,
    currentPlayerId: null,
    hands,
    phase: "trick-result",
    players,
    processedCommandIds,
    trick: { ...state.trick, plays },
    version: nextVersion,
  };

  return acceptIntent(nextState, intent, [
    {
      card,
      playerId: actorPlayerId,
      trickNumber: state.trick.number,
      type: "card-played",
      version: nextVersion,
    },
    {
      plays,
      trickNumber: state.trick.number,
      type: "trick-resolved",
      version: nextVersion,
      winnerId: winner.playerId,
    },
  ]);
}

export function advanceAuthoritativeMatch(
  state: AuthoritativeMatchState,
  advance: AuthorityAdvance,
  random: RandomSource,
): MatchTransition {
  if (advance === "resolve-trick") {
    if (state.phase !== "trick-result") {
      throw new Error(`AUTHORITY_PHASE_MISMATCH:${state.phase}:trick-result`);
    }

    const winnerId = state.completedTrick?.winnerId;

    if (!winnerId) {
      throw new Error("COMPLETED_TRICK_NOT_FOUND");
    }

    const nextVersion = state.version + 1;
    const roundComplete = state.players.every(
      (player) => state.hands[player.id].length === 0,
    );

    if (!roundComplete) {
      const trickNumber = state.trick.number + 1;
      const nextState: AuthoritativeMatchState = {
        ...state,
        completedTrick: null,
        currentPlayerId: winnerId,
        phase: "trick-play",
        trick: {
          leaderId: winnerId,
          number: trickNumber,
          plays: [],
        },
        version: nextVersion,
      };

      return {
        events: [
          {
            leaderId: winnerId,
            trickNumber,
            type: "trick-started",
            version: nextVersion,
          },
        ],
        state: nextState,
      };
    }

    const scoringInputs = state.players.map((player) => {
      if (player.bid === null) {
        throw new Error(`BID_NOT_FOUND:${player.id}`);
      }

      return {
        bid: player.bid,
        playerId: player.id,
        previousTotal: player.totalScore,
        tricksWon: player.tricksWon,
      };
    });
    const entries = scoreRound(scoringInputs);
    const entryByPlayerId = new Map(
      entries.map((entry) => [entry.playerId, entry]),
    );
    const players = state.players.map((player) => {
      const entry = entryByPlayerId.get(player.id);

      if (!entry) {
        return player;
      }

      return {
        ...player,
        roundScore: entry.roundScore,
        totalScore: entry.total,
      };
    });
    const nextState: AuthoritativeMatchState = {
      ...state,
      completedTrick: null,
      phase: "round-score",
      players,
      scoreEntries: entries,
      version: nextVersion,
    };

    return {
      events: [
        {
          entries,
          roundNumber: state.roundIndex + 1,
          type: "round-scored",
          version: nextVersion,
        },
      ],
      state: nextState,
    };
  }

  if (state.phase !== "round-score") {
    throw new Error(`AUTHORITY_PHASE_MISMATCH:${state.phase}:round-score`);
  }

  const nextVersion = state.version + 1;
  const nextRoundIndex = state.roundIndex + 1;

  if (nextRoundIndex >= state.roundHandCounts.length) {
    const topScore = Math.max(...state.players.map((player) => player.totalScore));
    const winnerIds = state.players
      .filter((player) => player.totalScore === topScore)
      .map((player) => player.id);
    const nextState: AuthoritativeMatchState = {
      ...state,
      currentPlayerId: null,
      phase: "match-end",
      version: nextVersion,
    };

    return {
      events: [
        {
          type: "match-ended",
          version: nextVersion,
          winnerIds,
        },
      ],
      state: nextState,
    };
  }

  const dealerIndex = (state.dealerIndex + 1) % state.players.length;
  const nextState = setupRound(
    state,
    nextRoundIndex,
    dealerIndex,
    random,
    nextVersion,
  );

  return {
    events: [
      {
        dealerId: getSeatId(nextState.players, dealerIndex),
        handSize: nextState.handSize,
        revealedCard: nextState.revealedCard,
        roundNumber: nextRoundIndex + 1,
        type: "round-started",
        version: nextVersion,
      },
    ],
    state: nextState,
  };
}
