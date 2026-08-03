import { Color, Node, Sprite, Vec3 } from "cc";
import type { Card } from "@wizzard/game-core/contracts";
import type { AssetKey } from "../assets/AssetAddresses.generated";
import { AssetRegistry } from "../assets/AssetRegistry";
import { createContainer, createSprite, createText } from "./UiFactory";

export type CardVisualState =
  | "normal"
  | "legal"
  | "illegal"
  | "selected"
  | "played";

type CardViewOptions = {
  faceDown?: boolean;
  height?: number;
  onActivate?: () => void;
  state?: CardVisualState;
  width?: number;
  winner?: boolean;
};

const SUIT_COLORS = {
  knot: new Color(183, 66, 51, 255),
  leaf: new Color(55, 132, 123, 255),
  mountain: new Color(72, 103, 148, 255),
  sun: new Color(203, 145, 48, 255),
} as const;

function getCardAssetKey(card: Card, faceDown: boolean): AssetKey {
  if (faceDown) {
    return "card.back" as AssetKey;
  }

  if (card.kind === "highest") {
    return "card.special.highest" as AssetKey;
  }

  if (card.kind === "lowest") {
    return "card.special.lowest" as AssetKey;
  }

  return `card.face.${card.suit}` as AssetKey;
}

export function createCardView(
  parent: Node,
  assets: AssetRegistry,
  card: Card,
  options: CardViewOptions = {},
): Node {
  const width = options.width ?? 128;
  const height = options.height ?? 192;
  const state = options.state ?? "normal";
  const root = createContainer(parent, `Card:${card.id}`, width + 30, height + 34);

  if (state === "legal" || state === "selected") {
    createSprite(
      root,
      assets,
      (state === "selected" ? "fx.card.selected" : "fx.card.legal") as AssetKey,
      width + 28,
      height + 34,
    );
  }

  if (options.winner) {
    createSprite(
      root,
      assets,
      "fx.trick.win" as AssetKey,
      width + 42,
      height + 48,
    );
  }

  const art = createSprite(
    root,
    assets,
    getCardAssetKey(card, options.faceDown ?? false),
    width,
    height,
  );

  if (state === "illegal") {
    const sprite = art.getComponent(Sprite);

    if (sprite) {
      sprite.color = new Color(112, 118, 123, 205);
    }
  }

  if (!options.faceDown && card.kind === "number") {
    const rankColor = SUIT_COLORS[card.suit];
    const rankSize = Math.max(22, Math.floor(width * 0.27));
    const top = createText(
      root,
      assets,
      String(card.rank),
      width * 0.32,
      height * 0.22,
      -width * 0.31,
      height * 0.34,
      {
        color: rankColor,
        fontKey: "font.interface" as AssetKey,
        fontSize: rankSize,
        outlineColor: new Color(249, 235, 204, 255),
        outlineWidth: 2,
      },
    );
    const bottom = createText(
      root,
      assets,
      String(card.rank),
      width * 0.32,
      height * 0.22,
      width * 0.31,
      -height * 0.34,
      {
        color: rankColor,
        fontKey: "font.interface" as AssetKey,
        fontSize: rankSize,
        outlineColor: new Color(249, 235, 204, 255),
        outlineWidth: 2,
      },
    );
    top.setPosition(new Vec3(top.position.x, top.position.y, 1));
    bottom.angle = 180;
  }

  if (state === "selected") {
    root.setPosition(new Vec3(0, 22, 0));
  }

  if (options.onActivate && state !== "illegal") {
    root.on(Node.EventType.TOUCH_END, options.onActivate);
  }

  return root;
}
