import type { Card, PlayedCard, Suit } from "./types.js";

function getHighestNumberPlayForSuit(
  plays: readonly PlayedCard[],
  suit: Suit | null,
): PlayedCard | null {
  if (suit === null) {
    return null;
  }

  let winningPlay: PlayedCard | null = null;
  let winningRank = Number.NEGATIVE_INFINITY;

  for (const play of plays) {
    if (
      play.card.kind === "number" &&
      play.card.suit === suit &&
      play.card.rank > winningRank
    ) {
      winningPlay = play;
      winningRank = play.card.rank;
    }
  }

  return winningPlay;
}

export function getLeadSuit(plays: readonly PlayedCard[]): Suit | null {
  for (const { card } of plays) {
    if (card.kind === "highest") {
      return null;
    }

    if (card.kind === "number") {
      return card.suit;
    }
  }

  return null;
}

export function getLegalCards(
  hand: readonly Card[],
  plays: readonly PlayedCard[],
): Card[] {
  const leadSuit = getLeadSuit(plays);
  const canFollowSuit = hand.some(
    (card) => card.kind === "number" && card.suit === leadSuit,
  );

  if (leadSuit === null || !canFollowSuit) {
    return [...hand];
  }

  return hand.filter(
    (card) => card.kind !== "number" || card.suit === leadSuit,
  );
}

export function resolveTrickWinner(
  plays: readonly PlayedCard[],
  trump: Suit | null,
): PlayedCard | null {
  const firstHighestPlay = plays.find(({ card }) => card.kind === "highest");

  if (firstHighestPlay) {
    return firstHighestPlay;
  }

  const winningTrumpPlay = getHighestNumberPlayForSuit(plays, trump);

  if (winningTrumpPlay) {
    return winningTrumpPlay;
  }

  const leadSuit = getLeadSuit(plays);
  const winningLeadPlay = getHighestNumberPlayForSuit(plays, leadSuit);

  return winningLeadPlay ?? plays[0] ?? null;
}
