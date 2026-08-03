import { Color, Node } from "cc";
import type { MatchPlayerState } from "@wizzard/game-core/contracts";
import type { AssetKey } from "../assets/AssetAddresses.generated";
import { AssetRegistry } from "../assets/AssetRegistry";
import { createContainer, createSprite, createText } from "./UiFactory";

const AVATAR_KEY_MAP: Record<string, string> = {
  "bamboo-cat": "bambooCat",
  "flower-fox": "flowerFox",
  "ink-panda": "inkPanda",
  "masked-traveler": "maskedTraveler",
  "sleepy-star-cat": "sleepyStarCat",
  "wandering-crane": "wanderingCrane",
};

type PlayerSeatOptions = {
  current: boolean;
  dealer: boolean;
  handCount: number;
};

function getAvatarAssetKey(player: MatchPlayerState): AssetKey {
  const character = AVATAR_KEY_MAP[player.avatarKey] ?? "maskedTraveler";
  return `avatar.${character}.normal` as AssetKey;
}

export function createPlayerSeatView(
  parent: Node,
  assets: AssetRegistry,
  player: MatchPlayerState,
  options: PlayerSeatOptions,
): Node {
  const root = createContainer(parent, `Seat:${player.id}`, 250, 210);

  if (options.current) {
    createSprite(
      root,
      assets,
      "fx.card.legal" as AssetKey,
      164,
      164,
      0,
      26,
    );
  }

  createSprite(root, assets, getAvatarAssetKey(player), 138, 138, 0, 28);
  createSprite(
    root,
    assets,
    "ui.plaque.small" as AssetKey,
    232,
    84,
    0,
    -64,
    true,
  );
  createText(root, assets, player.name, 176, 34, 0, -49, {
    fontKey: "font.interface" as AssetKey,
    fontSize: 25,
    outlineColor: new Color(45, 22, 14, 255),
    outlineWidth: 2,
  });

  const bid = player.bid === null ? "预测 —" : `预测 ${player.bid}`;
  createText(
    root,
    assets,
    `${bid} · 赢 ${player.tricksWon} · 余 ${options.handCount}`,
    214,
    28,
    0,
    -78,
    {
      color: new Color(83, 49, 29, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: 19,
    },
  );

  if (!player.isHuman) {
    createSprite(root, assets, "ui.badge.ai" as AssetKey, 68, 44, 76, 72);
  }

  if (options.dealer) {
    createSprite(
      root,
      assets,
      "ui.status.green" as AssetKey,
      58,
      46,
      -78,
      72,
      false,
    );
    createText(root, assets, "庄", 44, 38, -78, 73, {
      fontKey: "font.interface" as AssetKey,
      fontSize: 22,
      outlineColor: new Color(29, 54, 38, 255),
      outlineWidth: 1,
    });
  }

  return root;
}
