import { SUITS, type Card } from "./types.js";

export function createDeck(): Card[] {
  const numberCards: Card[] = SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => {
      const rank = index + 1;

      return {
        id: `number:${suit}:${rank}`,
        kind: "number" as const,
        rank,
        suit,
      };
    }),
  );

  const highestCards: Card[] = Array.from({ length: 4 }, (_, index) => ({
    id: `highest:${index + 1}`,
    kind: "highest",
  }));
  const lowestCards: Card[] = Array.from({ length: 4 }, (_, index) => ({
    id: `lowest:${index + 1}`,
    kind: "lowest",
  }));

  return [...numberCards, ...highestCards, ...lowestCards];
}
