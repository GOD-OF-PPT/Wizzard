import { describe, expect, it } from "vitest";

import { getRoundHandCounts, type PlayerCount } from "./index";

describe("getRoundHandCounts", () => {
  it("returns every increasing classic hand count that fits the 60-card deck", () => {
    const expectedLastHandCount: Record<PlayerCount, number> = {
      3: 20,
      4: 15,
      5: 12,
      6: 10,
    };

    for (const playerCount of [3, 4, 5, 6] as const) {
      const handCounts = getRoundHandCounts(playerCount, "classic");
      const lastHandCount = expectedLastHandCount[playerCount];

      expect(handCounts).toEqual(
        Array.from({ length: lastHandCount }, (_, index) => index + 1),
      );
    }
  });

  it("returns hand counts 1 through 8 for every supported quick game", () => {
    const expected = [1, 2, 3, 4, 5, 6, 7, 8];

    for (const playerCount of [3, 4, 5, 6] as const) {
      expect(getRoundHandCounts(playerCount, "quick")).toEqual(expected);
    }
  });
});
