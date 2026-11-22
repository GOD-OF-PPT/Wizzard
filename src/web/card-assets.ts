import type { Card } from "@wizzard/game-core/contracts";
import { getCardImage } from "../game-assets";
import leaf from "../../art/runtime/web-v3/cards/landscape-leaf-v5-native.png";
import mountain from "../../art/runtime/web-v3/cards/landscape-mountain-v5-native.png";
import knot from "../../art/runtime/web-v3/cards/landscape-knot-v5-native.png";
import sun from "../../art/runtime/web-v3/cards/landscape-sun-v5-native.png";
import portraitLeaf from "../../art/runtime/web-v3/cards/portrait-leaf-v5-native.png";
import portraitMountain from "../../art/runtime/web-v3/cards/portrait-mountain-v5-native.png";
import portraitKnot from "../../art/runtime/web-v3/cards/portrait-knot-v5-native.png";
import portraitSun from "../../art/runtime/web-v3/cards/portrait-sun-v5-native.png";

export const webNumberFaces = { leaf, mountain, knot, sun };
const portraitNumberFaces = { leaf: portraitLeaf, mountain: portraitMountain, knot: portraitKnot, sun: portraitSun };
export function webCardImage(card: Card): string {
  return card.kind === "number" ? webNumberFaces[card.suit] : getCardImage(card);
}

export function webPortraitCardImage(card: Card): string {
  return card.kind === "number" ? portraitNumberFaces[card.suit] : getCardImage(card);
}
