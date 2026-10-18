import type { Card } from "@wizzard/game-core/contracts";
import { getCardImage } from "../game-assets";
import leaf from "../../art/runtime/web-v3/cards/leaf-v2.png";
import mountain from "../../art/runtime/web-v3/cards/mountain-v2.png";
import knot from "../../art/runtime/web-v3/cards/knot-v2.png";
import sun from "../../art/runtime/web-v3/cards/sun-v2.png";

export const webNumberFaces = { leaf, mountain, knot, sun };
export function webCardImage(card: Card): string {
  return card.kind === "number" ? webNumberFaces[card.suit] : getCardImage(card);
}
