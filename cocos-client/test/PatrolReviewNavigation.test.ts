import type { PatrolPlayerState } from "@wizzard/game-core";
import { describe, expect, it } from "vitest";
import { PATROL_REVIEW_ASSET_KEYS } from "../assets/scripts/assets/AssetAddresses.generated";
import {
  getPatrolReviewActionVisibility,
  isStandalonePatrolReviewConfig,
} from "../assets/scripts/bootstrap/PatrolReviewNavigation";
import {
  PATROL_REVIEW_HOME_ASSET_KEYS,
  PATROL_REVIEW_HOME_CONTENT,
} from "../assets/scripts/views/PatrolReviewContent";
import { getPatrolTravelerTransitionMode } from "../assets/scripts/views/PatrolPrototypeMotion";

const PLAYER: PatrolPlayerState = {
  collectedSpiritIds: [],
  id: "traveler-you",
  isHuman: true,
  name: "你",
  position: 0,
  route: "outer",
  score: null,
  seatIndex: 0,
  speed: "cruise",
  switchQueued: false,
  target: 5,
};

describe("standalone patrol review navigation", () => {
  it("publishes a patrol-native home contract using only whitelisted assets", () => {
    const whitelist = new Set(PATROL_REVIEW_ASSET_KEYS);

    expect(
      PATROL_REVIEW_HOME_ASSET_KEYS.filter((key) => !whitelist.has(key)),
    ).toEqual([]);
    expect(PATROL_REVIEW_HOME_CONTENT).toMatchObject({
      action: "开始巡游",
      title: "漆环巡游",
    });
    expect(PATROL_REVIEW_HOME_CONTENT.subtitle).toContain("双环");
    expect(PATROL_REVIEW_HOME_CONTENT.subtitle).toContain("六座桥");
    expect(PATROL_REVIEW_HOME_CONTENT.subtitle).toContain("60 秒");
    expect(Object.values(PATROL_REVIEW_HOME_CONTENT).join(" ")).not.toMatch(
      /牌|花色|王牌|出牌|牌组|手牌|牌堆|墩/u,
    );
  });

  it("recognizes only the isolated patrol runtime as a review carrier", () => {
    expect(
      isStandalonePatrolReviewConfig({
        friendRoom: null,
        startup: "patrol",
      }),
    ).toBe(true);
    expect(
      isStandalonePatrolReviewConfig({
        friendRoom: { endpoint: "ws://127.0.0.1:8787/ws" },
        startup: "home",
      }),
    ).toBe(false);
  });

  it("keeps return-home available during play and moves it into results", () => {
    expect(getPatrolReviewActionVisibility("observe", true)).toEqual({
      showPersistentReturn: true,
      showReplay: false,
      showResultReturn: false,
    });
    expect(getPatrolReviewActionVisibility("results", true)).toEqual({
      showPersistentReturn: false,
      showReplay: true,
      showResultReturn: true,
    });
    expect(getPatrolReviewActionVisibility("patrol", false)).toEqual({
      showPersistentReturn: false,
      showReplay: false,
      showResultReturn: false,
    });
  });

  it("preserves a traveler tween for a control-only update", () => {
    expect(
      getPatrolTravelerTransitionMode(PLAYER, PLAYER, "patrol", "patrol"),
    ).toBe("preserve");
    expect(
      getPatrolTravelerTransitionMode(
        PLAYER,
        { ...PLAYER, position: 1 },
        "patrol",
        "patrol",
      ),
    ).toBe("animate");
    expect(
      getPatrolTravelerTransitionMode(PLAYER, PLAYER, "observe", "observe"),
    ).toBe("snap");
  });
});
