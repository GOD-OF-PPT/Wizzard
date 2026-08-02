import { describe, expect, it } from "vitest";

import { resolveTrump, SUITS } from "./index";

describe("resolveTrump", () => {
  it("uses a revealed number card's suit as the fixed trump", () => {
    expect(
      resolveTrump({
        id: "number:leaf:7",
        kind: "number",
        rank: 7,
        suit: "leaf",
      }),
    ).toEqual({ kind: "fixed", trump: "leaf" });
  });

  it("uses no trump when the revealed card is lowest", () => {
    expect(resolveTrump({ id: "lowest:1", kind: "lowest" })).toEqual({
      kind: "fixed",
      trump: null,
    });
  });

  it("offers every suit to the dealer when the revealed card is highest", () => {
    expect(resolveTrump({ id: "highest:1", kind: "highest" })).toEqual({
      choices: SUITS,
      kind: "dealer-choice",
    });
  });
});
