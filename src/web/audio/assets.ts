import sfx0 from "../../../art/runtime/audio/teahouse-v1/ui-tap-v1.mp3";
import sfx1 from "../../../art/runtime/audio/teahouse-v1/ui-confirm-v1.mp3";
import sfx2 from "../../../art/runtime/audio/teahouse-v1/ui-back-v1.mp3";
import sfx3 from "../../../art/runtime/audio/teahouse-v1/room-arrive-v1.mp3";
import sfx4 from "../../../art/runtime/audio/teahouse-v1/room-ai-join-v1.mp3";
import sfx5 from "../../../art/runtime/audio/teahouse-v1/cards-deal-v1.mp3";
import sfx6 from "../../../art/runtime/audio/teahouse-v1/card-select-v1.mp3";
import sfx7 from "../../../art/runtime/audio/teahouse-v1/card-play-v1.mp3";
import sfx8 from "../../../art/runtime/audio/teahouse-v1/turn-yours-v1.mp3";
import sfx9 from "../../../art/runtime/audio/teahouse-v1/trump-reveal-v1.mp3";
import sfx10 from "../../../art/runtime/audio/teahouse-v1/trick-win-v1.mp3";
import sfx11 from "../../../art/runtime/audio/teahouse-v1/bid-exact-v1.mp3";
import sfx12 from "../../../art/runtime/audio/teahouse-v1/round-score-v1.mp3";
import sfx13 from "../../../art/runtime/audio/teahouse-v1/match-victory-v1.mp3";
import sfx14 from "../../../art/runtime/audio/teahouse-v1/match-complete-v1.mp3";
import sfx15 from "../../../art/runtime/audio/teahouse-v1/notice-soft-v1.mp3";

// Only selected game assets enter the web bundle; candidates stay in art/.
export const audioAssets = {
  "ui.tap": { url: sfx0, cooldownMs: 80 },
  "ui.confirm": { url: sfx1, cooldownMs: 150 },
  "ui.back": { url: sfx2, cooldownMs: 100 },
  "room.arrive": { url: sfx3, cooldownMs: 400 },
  "room.ai-join": { url: sfx4, cooldownMs: 180 },
  "cards.deal": { url: sfx5, cooldownMs: 600 },
  "card.select": { url: sfx6, cooldownMs: 90 },
  "card.play": { url: sfx7, cooldownMs: 160 },
  "turn.yours": { url: sfx8, cooldownMs: 1200 },
  "trump.reveal": { url: sfx9, cooldownMs: 800 },
  "trick.win": { url: sfx10, cooldownMs: 700 },
  "bid.exact": { url: sfx11, cooldownMs: 1500 },
  "round.score": { url: sfx12, cooldownMs: 1000 },
  "match.victory": { url: sfx13, cooldownMs: 3000 },
  "match.complete": { url: sfx14, cooldownMs: 2500 },
  "notice.soft": { url: sfx15, cooldownMs: 650 },
} as const;

export type AudioId = keyof typeof audioAssets;
