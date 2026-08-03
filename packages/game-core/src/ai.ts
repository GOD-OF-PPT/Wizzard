import type { MatchIntent, PlayerMatchSnapshot } from "./match.js";
import { getLegalCards, resolveTrickWinner } from "./trick.js";
import { SUITS, type Card, type Suit } from "./types.js";

function getCardPower(card: Card, trump: Suit | null): number {
  if (card.kind === "highest") {
    return 100;
  }

  if (card.kind === "lowest") {
    return 0;
  }

  return card.rank + (card.suit === trump ? 30 : 0);
}

function chooseTrump(hand: readonly Card[]): Suit {
  const suitScores = new Map<Suit, number>(
    SUITS.map((suit) => [suit, 0]),
  );

  for (const card of hand) {
    if (card.kind !== "number") {
      continue;
    }

    const rankWeight = card.rank >= 10 ? 2 : 1;
    suitScores.set(card.suit, (suitScores.get(card.suit) ?? 0) + rankWeight);
  }

  return [...SUITS].sort(
    (left, right) =>
      (suitScores.get(right) ?? 0) - (suitScores.get(left) ?? 0),
  )[0];
}

function estimateBid(hand: readonly Card[], trump: Suit | null): number {
  let estimate = 0;

  for (const card of hand) {
    if (card.kind === "highest") {
      estimate += 1;
      continue;
    }

    if (card.kind !== "number") {
      continue;
    }

    if (card.rank >= 12 || (card.suit === trump && card.rank >= 9)) {
      estimate += 1;
    }
  }

  return Math.min(hand.length, estimate);
}

function choosePlay(snapshot: PlayerMatchSnapshot): Card | null {
  const { privateState, publicState } = snapshot;
  const legalCards = getLegalCards(
    privateState.hand,
    publicState.trick.plays,
  );
  const player = publicState.players.find(
    (candidate) => candidate.id === privateState.playerId,
  );

  if (!player || legalCards.length === 0) {
    return null;
  }

  const wantsTrick = player.tricksWon < (player.bid ?? 0);
  const sorted = [...legalCards].sort(
    (left, right) =>
      getCardPower(left, publicState.trump) -
      getCardPower(right, publicState.trump),
  );

  if (!wantsTrick) {
    return sorted[0];
  }

  if (publicState.trick.plays.length === 0) {
    return sorted[sorted.length - 1];
  }

  const winningCard = sorted.find((card) => {
    const winner = resolveTrickWinner(
      [
        ...publicState.trick.plays,
        { card, playerId: privateState.playerId },
      ],
      publicState.trump,
    );

    return winner?.playerId === privateState.playerId;
  });

  return winningCard ?? sorted[sorted.length - 1];
}

export function chooseAiIntent(
  snapshot: PlayerMatchSnapshot,
  commandId: string,
): MatchIntent | null {
  const { privateState, publicState } = snapshot;

  if (publicState.currentPlayerId !== privateState.playerId) {
    return null;
  }

  const base = {
    commandId,
    expectedVersion: publicState.version,
  };

  if (publicState.phase === "trump-select") {
    return {
      ...base,
      trump: chooseTrump(privateState.hand),
      type: "choose-trump",
    };
  }

  if (publicState.phase === "bid") {
    return {
      ...base,
      bid: estimateBid(privateState.hand, publicState.trump),
      type: "submit-bid",
    };
  }

  if (publicState.phase === "trick-play") {
    const card = choosePlay(snapshot);

    return card
      ? {
          ...base,
          cardId: card.id,
          type: "play-card",
        }
      : null;
  }

  return null;
}
