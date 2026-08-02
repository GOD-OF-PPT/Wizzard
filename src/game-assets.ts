import bambooCatMistake from "../art/runtime/avatars/bamboo-cat/mistake.png";
import bambooCatNormal from "../art/runtime/avatars/bamboo-cat/normal.png";
import bambooCatProud from "../art/runtime/avatars/bamboo-cat/proud.png";
import bambooCatThinking from "../art/runtime/avatars/bamboo-cat/thinking.png";
import flowerFoxMistake from "../art/runtime/avatars/flower-fox/mistake.png";
import flowerFoxNormal from "../art/runtime/avatars/flower-fox/normal.png";
import flowerFoxProud from "../art/runtime/avatars/flower-fox/proud.png";
import flowerFoxThinking from "../art/runtime/avatars/flower-fox/thinking.png";
import inkPandaMistake from "../art/runtime/avatars/ink-panda/mistake.png";
import inkPandaNormal from "../art/runtime/avatars/ink-panda/normal.png";
import inkPandaProud from "../art/runtime/avatars/ink-panda/proud.png";
import inkPandaThinking from "../art/runtime/avatars/ink-panda/thinking.png";
import maskedTravelerMistake from "../art/runtime/avatars/masked-traveler/mistake.png";
import maskedTravelerNormal from "../art/runtime/avatars/masked-traveler/normal.png";
import maskedTravelerProud from "../art/runtime/avatars/masked-traveler/proud.png";
import maskedTravelerThinking from "../art/runtime/avatars/masked-traveler/thinking.png";
import sleepyStarCatMistake from "../art/runtime/avatars/sleepy-star-cat/mistake.png";
import sleepyStarCatNormal from "../art/runtime/avatars/sleepy-star-cat/normal.png";
import sleepyStarCatProud from "../art/runtime/avatars/sleepy-star-cat/proud.png";
import sleepyStarCatThinking from "../art/runtime/avatars/sleepy-star-cat/thinking.png";
import wanderingCraneMistake from "../art/runtime/avatars/wandering-crane/mistake.png";
import wanderingCraneNormal from "../art/runtime/avatars/wandering-crane/normal.png";
import wanderingCraneProud from "../art/runtime/avatars/wandering-crane/proud.png";
import wanderingCraneThinking from "../art/runtime/avatars/wandering-crane/thinking.png";
import cardBack from "../art/runtime/cards/card-back.png";
import highestSpecial from "../art/runtime/cards/highest-special.png";
import knotFace from "../art/runtime/cards/knot-face.png";
import leafFace from "../art/runtime/cards/leaf-face.png";
import lowestSpecial from "../art/runtime/cards/lowest-special.png";
import mountainFace from "../art/runtime/cards/mountain-face.png";
import sunFace from "../art/runtime/cards/sun-face.png";
import teahouseTable from "../art/runtime/backgrounds/teahouse-table.png";
import aiBadge from "../art/runtime/ui/ai-badge.png";
import countdownRing from "../art/runtime/ui/countdown-ring.png";
import greenStatus from "../art/runtime/ui/green-status.png";
import legalHalo from "../art/runtime/ui/legal-halo.png";
import predictionMiss from "../art/runtime/ui/prediction-miss.png";
import predictionSuccess from "../art/runtime/ui/prediction-success.png";
import primaryPanel from "../art/runtime/ui/primary-panel.png";
import roundTitleScroll from "../art/runtime/ui/round-title-scroll.png";
import scoreRibbon from "../art/runtime/ui/score-ribbon.png";
import secondaryPanel from "../art/runtime/ui/secondary-panel.png";
import selectedHalo from "../art/runtime/ui/selected-halo.png";
import smallPlaque from "../art/runtime/ui/small-plaque.png";
import trickWin from "../art/runtime/ui/trick-win.png";
import trumpTile from "../art/runtime/ui/trump-tile.png";
import turnButton from "../art/runtime/ui/turn-button.png";
import type { Card, Suit } from "./game";

export type AvatarExpression = "normal" | "thinking" | "proud" | "mistake";

export const avatarImages = {
  "bamboo-cat": {
    mistake: bambooCatMistake,
    normal: bambooCatNormal,
    proud: bambooCatProud,
    thinking: bambooCatThinking,
  },
  "flower-fox": {
    mistake: flowerFoxMistake,
    normal: flowerFoxNormal,
    proud: flowerFoxProud,
    thinking: flowerFoxThinking,
  },
  "ink-panda": {
    mistake: inkPandaMistake,
    normal: inkPandaNormal,
    proud: inkPandaProud,
    thinking: inkPandaThinking,
  },
  "masked-traveler": {
    mistake: maskedTravelerMistake,
    normal: maskedTravelerNormal,
    proud: maskedTravelerProud,
    thinking: maskedTravelerThinking,
  },
  "sleepy-star-cat": {
    mistake: sleepyStarCatMistake,
    normal: sleepyStarCatNormal,
    proud: sleepyStarCatProud,
    thinking: sleepyStarCatThinking,
  },
  "wandering-crane": {
    mistake: wanderingCraneMistake,
    normal: wanderingCraneNormal,
    proud: wanderingCraneProud,
    thinking: wanderingCraneThinking,
  },
} as const;

export type AvatarKey = keyof typeof avatarImages;

export const cardImages = {
  back: cardBack,
  highest: highestSpecial,
  knot: knotFace,
  leaf: leafFace,
  lowest: lowestSpecial,
  mountain: mountainFace,
  sun: sunFace,
} as const;

export const suitLabels: Record<Suit, string> = {
  knot: "结",
  leaf: "叶",
  mountain: "山",
  sun: "日",
};

export const suitNames: Record<Suit, string> = {
  knot: "朱结",
  leaf: "青叶",
  mountain: "靛山",
  sun: "赭日",
};

export function getCardImage(card: Card): string {
  if (card.kind === "number") {
    return cardImages[card.suit];
  }

  return cardImages[card.kind];
}

export const gameArt = {
  aiBadge,
  countdownRing,
  greenStatus,
  legalHalo,
  predictionMiss,
  predictionSuccess,
  primaryPanel,
  roundTitleScroll,
  scoreRibbon,
  secondaryPanel,
  selectedHalo,
  smallPlaque,
  table: teahouseTable,
  trickWin,
  trumpTile,
  turnButton,
} as const;
