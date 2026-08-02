import { describe, expect, it } from "vitest";
import {
  createDeck,
  dealCards,
  getRoundHandCounts,
  shuffleCards,
} from "./index";
import type { GameMode, PlayerCount } from "./index";

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

describe("public game-rules interface", () => {
  it("deals a four-player fourth quick round without losing or duplicating cards", () => {
    const deck = createDeck();
    const handSize = getRoundHandCounts(4, "quick")[3];
    const deal = dealCards(deck, ["north", "east", "south", "west"], handSize);
    const dealtCards = Object.values(deal.hands).flat();
    const allCardIds = [...dealtCards, ...deal.remainder].map(
      (card) => card.id,
    );

    expect(Object.values(deal.hands).map((hand) => hand.length)).toEqual([
      4, 4, 4, 4,
    ]);
    expect(deal.remainder).toHaveLength(44);
    expect(new Set(allCardIds)).toHaveLength(60);
  });

  it("survives 1,000 complete matches for every player count and mode", () => {
    const playerCounts: PlayerCount[] = [3, 4, 5, 6];
    const modes: GameMode[] = ["classic", "quick"];
    let simulatedMatches = 0;

    for (const playerCount of playerCounts) {
      const seats = Array.from(
        { length: playerCount },
        (_, index) => `seat-${index + 1}`,
      );

      for (const mode of modes) {
        const random = createSeededRandom(playerCount * 10 + mode.length);
        const handCounts = getRoundHandCounts(playerCount, mode);

        for (let match = 0; match < 1_000; match += 1) {
          for (const handSize of handCounts) {
            const shuffledDeck = shuffleCards(createDeck(), random);
            const deal = dealCards(shuffledDeck, seats, handSize);
            const hands = Object.values(deal.hands);
            const allCards = [...hands.flat(), ...deal.remainder];

            if (hands.some((hand) => hand.length !== handSize)) {
              throw new Error(
                `HAND_SIZE_MISMATCH:${playerCount}:${mode}:${handSize}`,
              );
            }

            if (
              allCards.length !== 60 ||
              new Set(allCards.map((card) => card.id)).size !== 60
            ) {
              throw new Error(
                `DEAL_INTEGRITY_FAILED:${playerCount}:${mode}:${handSize}`,
              );
            }
          }

          simulatedMatches += 1;
        }
      }
    }

    expect(simulatedMatches).toBe(8_000);
  });
});
