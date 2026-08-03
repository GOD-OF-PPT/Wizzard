import { SUITS, type Card, type TrumpResolution } from "./types.js";

export function resolveTrump(revealedCard: Card): TrumpResolution {
  if (revealedCard.kind === "number") {
    return { kind: "fixed", trump: revealedCard.suit };
  }

  if (revealedCard.kind === "lowest") {
    return { kind: "fixed", trump: null };
  }

  return { choices: SUITS, kind: "dealer-choice" };
}
