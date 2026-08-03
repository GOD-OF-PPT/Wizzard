import {
  SUITS,
  type Card,
  type MatchEvent,
  type MatchIntent,
  type PlayerMatchSnapshot,
  type PlayedCard,
  type Suit,
} from "@wizzard/game-core/contracts";
import {
  hasOnlyKeys,
  isArrayOf,
  isBoundedString,
  isIdentifier,
  isNonNegativeInteger,
  isNullable,
  isPositiveInteger,
  isRecord,
  isRequestId,
  isSafeInteger,
  type JsonRecord,
} from "./guards.js";

const MATCH_PHASES = [
  "trump-select",
  "bid",
  "trick-play",
  "trick-result",
  "round-score",
  "match-end",
] as const;

const MATCH_ERROR_CODES = [
  "DUPLICATE_COMMAND",
  "STALE_VERSION",
  "WRONG_PHASE",
  "NOT_YOUR_TURN",
  "PLAYER_NOT_FOUND",
  "INVALID_TRUMP",
  "BID_NOT_INTEGER",
  "BID_OUT_OF_RANGE",
  "CARD_NOT_FOUND",
  "CARD_NOT_LEGAL",
] as const;

function isSuit(value: unknown): value is Suit {
  return (
    typeof value === "string" &&
    (SUITS as readonly string[]).includes(value)
  );
}

function isCard(value: unknown): value is Card {
  if (!isRecord(value) || !isIdentifier(value.id)) {
    return false;
  }

  if (value.kind === "highest" || value.kind === "lowest") {
    return hasOnlyKeys(value, ["id", "kind"]);
  }

  return (
    value.kind === "number" &&
    hasOnlyKeys(value, ["id", "kind", "rank", "suit"]) &&
    isSafeInteger(value.rank) &&
    value.rank >= 1 &&
    value.rank <= 13 &&
    isSuit(value.suit)
  );
}

function isPlayedCard(value: unknown): value is PlayedCard {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["card", "playerId"]) &&
    isCard(value.card) &&
    isIdentifier(value.playerId)
  );
}

function isScoreEntry(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      "bid",
      "playerId",
      "roundScore",
      "total",
      "tricksWon",
    ]) &&
    isNonNegativeInteger(value.bid) &&
    isIdentifier(value.playerId) &&
    isSafeInteger(value.roundScore) &&
    isSafeInteger(value.total) &&
    isNonNegativeInteger(value.tricksWon)
  );
}

function isMatchPlayer(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      "avatarKey",
      "bid",
      "id",
      "isHuman",
      "name",
      "roundScore",
      "seatIndex",
      "totalScore",
      "tricksWon",
    ]) &&
    isBoundedString(value.avatarKey, 1, 128) &&
    (value.bid === null || isNonNegativeInteger(value.bid)) &&
    isIdentifier(value.id) &&
    typeof value.isHuman === "boolean" &&
    isBoundedString(value.name, 1, 64) &&
    (value.roundScore === null || isSafeInteger(value.roundScore)) &&
    isNonNegativeInteger(value.seatIndex) &&
    isSafeInteger(value.totalScore) &&
    isNonNegativeInteger(value.tricksWon)
  );
}

function isTrick(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["leaderId", "number", "plays"]) &&
    isIdentifier(value.leaderId) &&
    isPositiveInteger(value.number) &&
    isArrayOf(value.plays, isPlayedCard)
  );
}

function isCompletedTrick(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["leaderId", "number", "plays", "winnerId"]) &&
    isIdentifier(value.leaderId) &&
    isPositiveInteger(value.number) &&
    isArrayOf(value.plays, isPlayedCard) &&
    isIdentifier(value.winnerId)
  );
}

function isHandCounts(value: unknown): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([playerId, count]) =>
        isIdentifier(playerId) && isNonNegativeInteger(count),
    )
  );
}

function isPublicMatchState(value: unknown): value is JsonRecord {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      "completedTrick",
      "currentPlayerId",
      "dealerIndex",
      "handCounts",
      "handSize",
      "matchId",
      "mode",
      "phase",
      "players",
      "revealedCard",
      "roundHandCounts",
      "roundIndex",
      "scoreEntries",
      "trick",
      "trump",
      "version",
    ]) &&
    (value.completedTrick === null ||
      isCompletedTrick(value.completedTrick)) &&
    (value.currentPlayerId === null || isIdentifier(value.currentPlayerId)) &&
    isNonNegativeInteger(value.dealerIndex) &&
    isHandCounts(value.handCounts) &&
    isNonNegativeInteger(value.handSize) &&
    isIdentifier(value.matchId) &&
    (value.mode === "classic" || value.mode === "quick") &&
    typeof value.phase === "string" &&
    (MATCH_PHASES as readonly string[]).includes(value.phase) &&
    isArrayOf(value.players, isMatchPlayer) &&
    value.players.length >= 3 &&
    value.players.length <= 6 &&
    isNullable(value.revealedCard, isCard) &&
    isArrayOf(value.roundHandCounts, isPositiveInteger) &&
    value.roundHandCounts.length > 0 &&
    isNonNegativeInteger(value.roundIndex) &&
    isArrayOf(value.scoreEntries, isScoreEntry) &&
    isTrick(value.trick) &&
    (value.trump === null || isSuit(value.trump)) &&
    isNonNegativeInteger(value.version)
  );
}

export function isPlayerMatchSnapshot(
  value: unknown,
): value is PlayerMatchSnapshot {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["privateState", "publicState"]) ||
    !isRecord(value.privateState) ||
    !hasOnlyKeys(value.privateState, ["hand", "legalCardIds", "playerId"]) ||
    !isArrayOf(value.privateState.hand, isCard) ||
    !isArrayOf(value.privateState.legalCardIds, isIdentifier) ||
    !isIdentifier(value.privateState.playerId) ||
    !isPublicMatchState(value.publicState)
  ) {
    return false;
  }

  const players = value.publicState.players as JsonRecord[];
  const playerIds = players.map((player) => player.id as string);
  const uniquePlayerIds = new Set(playerIds);
  const handCounts = value.publicState.handCounts as Record<string, number>;
  const handIds = new Set(value.privateState.hand.map((card) => card.id));
  const legalCardIds = value.privateState.legalCardIds;

  return (
    uniquePlayerIds.size === playerIds.length &&
    playerIds.includes(value.privateState.playerId) &&
    Object.keys(handCounts).length === playerIds.length &&
    playerIds.every((playerId) => playerId in handCounts) &&
    handCounts[value.privateState.playerId] === value.privateState.hand.length &&
    new Set(legalCardIds).size === legalCardIds.length &&
    legalCardIds.every((cardId) => handIds.has(cardId))
  );
}

export function parseMatchIntent(
  value: unknown,
  requestId: string,
): MatchIntent | null {
  if (
    !isRecord(value) ||
    typeof value.type !== "string" ||
    !isRequestId(value.commandId) ||
    value.commandId !== requestId ||
    !isNonNegativeInteger(value.expectedVersion)
  ) {
    return null;
  }

  if (value.type === "choose-trump") {
    return hasOnlyKeys(value, [
      "type",
      "commandId",
      "expectedVersion",
      "trump",
    ]) && isSuit(value.trump)
      ? (value as MatchIntent)
      : null;
  }

  if (value.type === "submit-bid") {
    return hasOnlyKeys(value, [
      "type",
      "commandId",
      "expectedVersion",
      "bid",
    ]) &&
      isNonNegativeInteger(value.bid) &&
      value.bid <= 60
      ? (value as MatchIntent)
      : null;
  }

  if (value.type === "play-card") {
    return hasOnlyKeys(value, [
      "type",
      "commandId",
      "expectedVersion",
      "cardId",
    ]) && isIdentifier(value.cardId)
      ? (value as MatchIntent)
      : null;
  }

  return null;
}

export function isMatchEvent(value: unknown): value is MatchEvent {
  if (
    !isRecord(value) ||
    typeof value.type !== "string" ||
    !isNonNegativeInteger(value.version)
  ) {
    return false;
  }

  if (value.type === "intent-rejected") {
    return (
      hasOnlyKeys(value, [
        "type",
        "code",
        "commandId",
        "version",
      ]) &&
      typeof value.code === "string" &&
      (MATCH_ERROR_CODES as readonly string[]).includes(value.code) &&
      isRequestId(value.commandId)
    );
  }

  if (value.type === "trump-selected") {
    return (
      hasOnlyKeys(value, ["type", "playerId", "trump", "version"]) &&
      isIdentifier(value.playerId) &&
      isSuit(value.trump)
    );
  }

  if (value.type === "bid-accepted") {
    return (
      hasOnlyKeys(value, ["type", "bid", "playerId", "version"]) &&
      isNonNegativeInteger(value.bid) &&
      value.bid <= 60 &&
      isIdentifier(value.playerId)
    );
  }

  if (value.type === "card-played") {
    return (
      hasOnlyKeys(value, [
        "type",
        "card",
        "playerId",
        "trickNumber",
        "version",
      ]) &&
      isCard(value.card) &&
      isIdentifier(value.playerId) &&
      isPositiveInteger(value.trickNumber)
    );
  }

  if (value.type === "trick-resolved") {
    return (
      hasOnlyKeys(value, [
        "type",
        "plays",
        "trickNumber",
        "version",
        "winnerId",
      ]) &&
      isArrayOf(value.plays, isPlayedCard) &&
      isPositiveInteger(value.trickNumber) &&
      isIdentifier(value.winnerId)
    );
  }

  if (value.type === "trick-started") {
    return (
      hasOnlyKeys(value, [
        "type",
        "leaderId",
        "trickNumber",
        "version",
      ]) &&
      isIdentifier(value.leaderId) &&
      isPositiveInteger(value.trickNumber)
    );
  }

  if (value.type === "round-scored") {
    return (
      hasOnlyKeys(value, [
        "type",
        "entries",
        "roundNumber",
        "version",
      ]) &&
      isArrayOf(value.entries, isScoreEntry) &&
      isPositiveInteger(value.roundNumber)
    );
  }

  if (value.type === "round-started") {
    return (
      hasOnlyKeys(value, [
        "type",
        "dealerId",
        "handSize",
        "revealedCard",
        "roundNumber",
        "version",
      ]) &&
      isIdentifier(value.dealerId) &&
      isNonNegativeInteger(value.handSize) &&
      isNullable(value.revealedCard, isCard) &&
      isPositiveInteger(value.roundNumber)
    );
  }

  if (value.type === "match-ended") {
    return (
      hasOnlyKeys(value, ["type", "version", "winnerIds"]) &&
      isArrayOf(value.winnerIds, isIdentifier) &&
      value.winnerIds.length > 0
    );
  }

  return false;
}
