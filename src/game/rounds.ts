import type { GameMode, PlayerCount } from "./types";

const DECK_SIZE = 60;

export function getRoundHandCounts(
  playerCount: PlayerCount,
  mode: GameMode,
): number[] {
  const roundCount = mode === "quick" ? 8 : DECK_SIZE / playerCount;

  return Array.from({ length: roundCount }, (_, index) => index + 1);
}
