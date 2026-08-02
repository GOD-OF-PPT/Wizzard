import { describe, expect, it } from "vitest";
import { dealCards, shuffleCards, type Card } from "./index";

const cards: Card[] = [
  { id: "mountain-1", kind: "number", rank: 1, suit: "mountain" },
  { id: "knot-2", kind: "number", rank: 2, suit: "knot" },
  { id: "leaf-3", kind: "number", rank: 3, suit: "leaf" },
];

describe("authoritative dealing helpers", () => {
  it("shuffles through an injected random source without mutating the deck", () => {
    const shuffled = shuffleCards(cards, () => 0);

    expect(shuffled.map((card) => card.id)).toEqual([
      "knot-2",
      "leaf-3",
      "mountain-1",
    ]);
    expect(cards.map((card) => card.id)).toEqual([
      "mountain-1",
      "knot-2",
      "leaf-3",
    ]);
  });

  it("deals clockwise one card at a time and returns the undealt deck", () => {
    const deal = dealCards(
      [
        ...cards,
        { id: "sun-4", kind: "number", rank: 4, suit: "sun" },
        { id: "mountain-5", kind: "number", rank: 5, suit: "mountain" },
        { id: "knot-6", kind: "number", rank: 6, suit: "knot" },
        { id: "leaf-7", kind: "number", rank: 7, suit: "leaf" },
      ],
      ["a", "b", "c"],
      2,
    );

    expect(deal.hands.a.map((card) => card.id)).toEqual([
      "mountain-1",
      "sun-4",
    ]);
    expect(deal.hands.b.map((card) => card.id)).toEqual([
      "knot-2",
      "mountain-5",
    ]);
    expect(deal.hands.c.map((card) => card.id)).toEqual([
      "leaf-3",
      "knot-6",
    ]);
    expect(deal.remainder.map((card) => card.id)).toEqual(["leaf-7"]);
  });

  it("rejects a deal that would expose missing cards", () => {
    expect(() => dealCards(cards, ["a", "b"], 2)).toThrowError(
      "DECK_TOO_SMALL",
    );
  });
});
