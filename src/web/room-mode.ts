import { getRoundHandCounts } from "@wizzard/game-core";
import type { GameMode, PlayerCount } from "@wizzard/game-core/contracts";

export const roomModeNames: Record<GameMode, string> = { quick: "快速局", classic: "经典局" };

export function roomModeLabel(mode: GameMode, seats: PlayerCount): string {
  return `${roomModeNames[mode]} · ${getRoundHandCounts(seats, mode).length}轮`;
}
