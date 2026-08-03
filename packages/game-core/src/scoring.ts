export type BidValidationResult =
  | { ok: true; value: number }
  | {
      error: "BID_NOT_INTEGER" | "BID_OUT_OF_RANGE";
      ok: false;
    };

export type RoundScoringEntry = {
  bid: number;
  playerId: string;
  previousTotal: number;
  tricksWon: number;
};

export type ScoreEntry = {
  bid: number;
  playerId: string;
  roundScore: number;
  total: number;
  tricksWon: number;
};

export function validateBid(
  bid: number,
  handSize: number,
): BidValidationResult {
  if (!Number.isInteger(bid)) {
    return { error: "BID_NOT_INTEGER", ok: false };
  }

  if (bid < 0 || bid > handSize) {
    return { error: "BID_OUT_OF_RANGE", ok: false };
  }

  return { ok: true, value: bid };
}

export function scoreBid(bid: number, tricksWon: number): number {
  if (bid === tricksWon) {
    return 20 + 10 * tricksWon;
  }

  return -10 * Math.abs(tricksWon - bid);
}

export function scoreRound(
  entries: readonly RoundScoringEntry[],
): ScoreEntry[] {
  return entries.map(({ bid, playerId, previousTotal, tricksWon }) => {
    const roundScore = scoreBid(bid, tricksWon);

    return {
      bid,
      playerId,
      roundScore,
      total: previousTotal + roundScore,
      tricksWon,
    };
  });
}
