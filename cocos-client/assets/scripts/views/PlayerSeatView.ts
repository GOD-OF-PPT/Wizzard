import { Color, Node } from "cc";
import type { MatchPlayerState } from "@wizzard/game-core/contracts";
import type { AssetKey } from "../assets/AssetAddresses.generated";
import { AssetRegistry } from "../assets/AssetRegistry";
import {
  GAMEPLAY_ASSETS,
  GAMEPLAY_LAYOUT,
  getGameplayOpponentCountX,
  type GameplaySeatSlot,
} from "./GameplayLayout";
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
  local: boolean;
  slot: GameplaySeatSlot;
};

export function getPlayerAvatarAssetKey(player: MatchPlayerState): AssetKey {
  const character = AVATAR_KEY_MAP[player.avatarKey] ?? "maskedTraveler";
  return `avatar.${character}.normal` as AssetKey;
}

export function createPlayerSeatView(
  parent: Node,
  assets: AssetRegistry,
  player: MatchPlayerState,
  options: PlayerSeatOptions,
): Node {
  const root = createContainer(parent, `Seat:${player.id}`, 330, 320);

  if (options.current) {
    createSprite(root, assets, "fx.card.legal" as AssetKey, 208, 208, 0, 60);
  }

  createSprite(root, assets, getPlayerAvatarAssetKey(player), 176, 176, 0, 60);

  createText(root, assets, player.name, 210, 36, 0, -28, {
    fontKey: "font.display" as AssetKey,
    fontSize: 30,
    outlineColor: new Color(45, 22, 14, 255),
    outlineWidth: 2,
  });

  createSprite(
    root,
    assets,
    GAMEPLAY_ASSETS.statPaper as AssetKey,
    GAMEPLAY_LAYOUT.seatStats.paper.width,
    GAMEPLAY_LAYOUT.seatStats.paper.height,
    GAMEPLAY_LAYOUT.seatStats.paper.x,
    GAMEPLAY_LAYOUT.seatStats.paper.y,
  );
  createSprite(
    root,
    assets,
    GAMEPLAY_ASSETS.statGreen as AssetKey,
    GAMEPLAY_LAYOUT.seatStats.green.width,
    GAMEPLAY_LAYOUT.seatStats.green.height,
    GAMEPLAY_LAYOUT.seatStats.green.x,
    GAMEPLAY_LAYOUT.seatStats.green.y,
  );

  const bid = player.bid === null ? "—" : String(player.bid);
  createText(
    root,
    assets,
    `预测 ${bid}`,
    GAMEPLAY_LAYOUT.seatStats.labelWidth,
    GAMEPLAY_LAYOUT.seatStats.labelHeight,
    GAMEPLAY_LAYOUT.seatStats.paper.x,
    GAMEPLAY_LAYOUT.seatStats.paper.y,
    {
      color: new Color(83, 49, 29, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: GAMEPLAY_LAYOUT.seatStats.fontSize,
    },
  );
  createText(
    root,
    assets,
    `已赢 ${player.tricksWon}`,
    GAMEPLAY_LAYOUT.seatStats.labelWidth,
    GAMEPLAY_LAYOUT.seatStats.labelHeight,
    GAMEPLAY_LAYOUT.seatStats.green.x +
      GAMEPLAY_LAYOUT.seatStats.greenLabelOffsetX,
    GAMEPLAY_LAYOUT.seatStats.green.y,
    {
      color: new Color(232, 224, 177, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: GAMEPLAY_LAYOUT.seatStats.fontSize,
      outlineColor: new Color(29, 54, 38, 255),
      outlineWidth: 1,
    },
  );

  if (!options.local && options.handCount > 0) {
    const handLayout = GAMEPLAY_LAYOUT.opponentHand;
    const visibleCards = Math.min(options.handCount, handLayout.maxVisibleCards);
    const spacing = visibleCards > 1 ? handLayout.spacing : 0;
    const center = (visibleCards - 1) / 2;

    for (let index = 0; index < visibleCards; index += 1) {
      const offset = index - center;
      const back = createSprite(
        root,
        assets,
        "card.back" as AssetKey,
        handLayout.card.width,
        handLayout.card.height,
        offset * spacing,
        handLayout.card.y - Math.abs(offset) * handLayout.dropPerStep,
      );
      back.angle = offset * handLayout.anglePerStep;
    }

    if (options.handCount > visibleCards) {
      createText(
        root,
        assets,
        `×${options.handCount}`,
        handLayout.count.width,
        handLayout.count.height,
        getGameplayOpponentCountX(options.slot),
        handLayout.count.y,
        {
          color: new Color(246, 229, 187, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 22,
          outlineColor: new Color(32, 24, 27, 255),
          outlineWidth: 2,
        },
      );
    }
  }

  if (!player.isHuman) {
    createSprite(root, assets, "ui.badge.ai" as AssetKey, 54, 36, 92, 6);
  }

  if (options.dealer) {
    createSprite(
      root,
      assets,
      "ui.status.green" as AssetKey,
      62,
      50,
      -58,
      100,
      false,
    );
    createText(root, assets, "庄", 44, 38, -58, 101, {
      fontKey: "font.interface" as AssetKey,
      fontSize: 22,
      outlineColor: new Color(29, 54, 38, 255),
      outlineWidth: 1,
    });
  }

  return root;
}
