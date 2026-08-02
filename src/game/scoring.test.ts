import { describe, expect, it } from "vitest";

import { scoreBid, scoreRound, validateBid } from "./index";

describe("validateBid", () => {
  it.each([0, 3, 5])(
    "accepts integer bid %s within the inclusive hand-size range",
    (bid) => {
      expect(validateBid(bid, 5)).toEqual({
        ok: true,
        value: bid,
      });
    },
  );

  it("rejects a non-integer bid with a stable error code", () => {
    expect(validateBid(1.5, 5)).toEqual({
      error: "BID_NOT_INTEGER",
      ok: false,
    });
  });

  it.each([-1, 6])(
    "rejects bid %s outside the inclusive hand-size range",
    (bid) => {
      expect(validateBid(bid, 5)).toEqual({
        error: "BID_OUT_OF_RANGE",
        ok: false,
      });
    },
  );
});

describe("scoreBid", () => {
  it("awards the exact-bid bonus plus ten points per won trick", () => {
    expect(scoreBid(3, 3)).toBe(50);
  });

  it.each([
    { bid: 4, tricksWon: 2 },
    { bid: 1, tricksWon: 3 },
  ])(
    "deducts ten points per trick of error for bid $bid and $tricksWon tricks won",
    ({ bid, tricksWon }) => {
      expect(scoreBid(bid, tricksWon)).toBe(-20);
    },
  );
});

describe("scoreRound", () => {
  it("adds each player's round score to their previous cumulative total", () => {
    expect(
      scoreRound([
        {
          bid: 2,
          playerId: "player-1",
          previousTotal: 10,
          tricksWon: 2,
        },
      ]),
    ).toEqual([
      {
        bid: 2,
        playerId: "player-1",
        roundScore: 40,
        total: 50,
        tricksWon: 2,
      },
    ]);
  });

  it("scores every player independently and allows a negative total", () => {
    expect(
      scoreRound([
        {
          bid: 1,
          playerId: "player-1",
          previousTotal: 5,
          tricksWon: 3,
        },
        {
          bid: 0,
          playerId: "player-2",
          previousTotal: 20,
          tricksWon: 0,
        },
      ]),
    ).toEqual([
      {
        bid: 1,
        playerId: "player-1",
        roundScore: -20,
        total: -15,
        tricksWon: 3,
      },
      {
        bid: 0,
        playerId: "player-2",
        roundScore: 20,
        total: 40,
        tricksWon: 0,
      },
    ]);
  });
});
