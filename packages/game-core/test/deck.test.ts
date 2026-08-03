import { describe, expect, it } from "vitest";

import { createDeck } from "@wizzard/game-core";
import { SUITS } from "@wizzard/game-core/contracts";

describe("createDeck", () => {
  it("creates every numbered card from rank 1 through 13 in each suit", () => {
    const numberCards = createDeck().filter((card) => card.kind === "number");

    expect(numberCards).toHaveLength(52);

    for (const suit of SUITS) {
      expect(
        numberCards
          .filter((card) => card.suit === suit)
          .map((card) => card.rank)
          .sort((left, right) => left - right),
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    }
  });

  it("adds four highest and four lowest cards with unique ids", () => {
    const deck = createDeck();

    expect(deck).toHaveLength(60);
    expect(deck.filter((card) => card.kind === "highest")).toHaveLength(4);
    expect(deck.filter((card) => card.kind === "lowest")).toHaveLength(4);
    expect(new Set(deck.map((card) => card.id))).toHaveLength(60);
  });
});
