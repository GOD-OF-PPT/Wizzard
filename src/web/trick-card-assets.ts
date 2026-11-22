import type { Card } from "@wizzard/game-core/contracts";
import { getCardImage } from "../game-assets";
import leaf from "../../art/runtime/web-v3/trick-cards-v1/landscape-leaf.png";
import knot from "../../art/runtime/web-v3/trick-cards-v1/landscape-knot.png";
import sun from "../../art/runtime/web-v3/trick-cards-v1/landscape-sun.png";
import mountain from "../../art/runtime/web-v3/trick-cards-v1/landscape-mountain.png";
import portraitLeaf from "../../art/runtime/web-v3/trick-cards-v1/portrait-leaf.png";
import portraitKnot from "../../art/runtime/web-v3/trick-cards-v1/portrait-knot.png";
import portraitSun from "../../art/runtime/web-v3/trick-cards-v1/portrait-sun.png";
import portraitMountain from "../../art/runtime/web-v3/trick-cards-v1/portrait-mountain.png";

const faces = { leaf, knot, sun, mountain };
const portraitFaces = { leaf: portraitLeaf, knot: portraitKnot, sun: portraitSun, mountain: portraitMountain };
export function trickCardImage(card: Card, portrait = false): string {
  return card.kind === "number" ? (portrait ? portraitFaces : faces)[card.suit] : getCardImage(card);
}
