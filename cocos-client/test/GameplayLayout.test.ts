import { describe, expect, it } from "vitest";
import {
  GAMEPLAY_ASSETS,
  GAMEPLAY_LAYOUT,
  GAMEPLAY_SEAT_POSITIONS,
  GAMEPLAY_SLOT_MAPS,
  getGameplayLocalChoiceHandVisualRect,
  getGameplayLocalHandCardRect,
  getGameplayLocalHandVisualRect,
  getGameplayOpponentCountX,
  getGameplayPlayedCardsRect,
  getGameplayPlayedCardsVisualRect,
  getGameplayRightActionOccupant,
  getGameplaySeatCoreRect,
  getGameplaySeatFullRect,
  getGameplayTrumpStatusRects,
  getGameplayTurnActionLabelRect,
  getTopSeatCardRect,
  getTopSeatGlowRect,
  type GameplayLayoutRect,
} from "../assets/scripts/views/GameplayLayout";

const top = (rect: GameplayLayoutRect): number => rect.y + rect.height / 2;
const bottom = (rect: GameplayLayoutRect): number => rect.y - rect.height / 2;
const left = (rect: GameplayLayoutRect): number => rect.x - rect.width / 2;
const right = (rect: GameplayLayoutRect): number => rect.x + rect.width / 2;
const verticalGap = (
  upper: GameplayLayoutRect,
  lower: GameplayLayoutRect,
): number => bottom(upper) - top(lower);
const horizontalGap = (
  leftRect: GameplayLayoutRect,
  rightRect: GameplayLayoutRect,
): number => left(rightRect) - right(leftRect);
const horizontalAxisGap = (
  first: GameplayLayoutRect,
  second: GameplayLayoutRect,
): number => Math.max(left(second) - right(first), left(first) - right(second));
const verticalAxisGap = (
  first: GameplayLayoutRect,
  second: GameplayLayoutRect,
): number => Math.max(bottom(second) - top(first), bottom(first) - top(second));
const rectSeparation = (
  first: GameplayLayoutRect,
  second: GameplayLayoutRect,
): number =>
  Math.max(horizontalAxisGap(first, second), verticalAxisGap(first, second));

function expectInside(
  rect: GameplayLayoutRect,
  container: GameplayLayoutRect,
  inset: number,
): void {
  expect(left(rect)).toBeGreaterThanOrEqual(left(container) + inset);
  expect(right(rect)).toBeLessThanOrEqual(right(container) - inset);
  expect(top(rect)).toBeLessThanOrEqual(top(container) - inset);
  expect(bottom(rect)).toBeGreaterThanOrEqual(bottom(container) + inset);
}

describe("WeChat Mini Game gameplay layout", () => {
  it("uses the final-proportion SIMPLE assets and compact gameplay geometry", () => {
    expect(GAMEPLAY_ASSETS).toEqual({
      roundHeader: "ui.roundTitleScroll",
      statGreen: "ui.match.stat.green",
      statPaper: "ui.match.stat.paper",
    });

    expect(
      GAMEPLAY_LAYOUT.roundHeader.width / GAMEPLAY_LAYOUT.roundHeader.height,
    ).toBeCloseTo(343 / 327, 2);
    expect(
      GAMEPLAY_LAYOUT.localStats.paper.width /
        GAMEPLAY_LAYOUT.localStats.paper.height,
    ).toBeCloseTo(600 / 168, 2);
    expect(
      GAMEPLAY_LAYOUT.seatStats.green.width /
        GAMEPLAY_LAYOUT.seatStats.green.height,
    ).toBeCloseTo(600 / 168, 2);
    expect(
      GAMEPLAY_LAYOUT.trumpStatus.width / GAMEPLAY_LAYOUT.trumpStatus.height,
    ).toBeCloseTo(600 / 168, 2);
    expect(GAMEPLAY_LAYOUT.opponentHand.card).toEqual({
      height: 114,
      width: 76,
      x: 0,
      y: -148,
    });
    expect(GAMEPLAY_LAYOUT.playedCard).toMatchObject({
      anglePerStep: 3.2,
      baseY: 52,
      height: 219,
      winnerExtraHeight: 48,
      winnerExtraWidth: 42,
      width: 146,
    });
    expect(GAMEPLAY_LAYOUT.localHand).toEqual({
      anglePerStep: 2.4,
      baseY: -376,
      choiceHeight: 220,
      choiceMaxSpacing: 112,
      choiceWidth: 146,
      effectExtraHeight: 34,
      effectExtraWidth: 28,
      height: 280,
      maxSpacing: 140,
      maxSpread: 960,
      risePerStep: 2,
      selectedLift: 4,
      width: 186,
    });
    expect(GAMEPLAY_LAYOUT.trumpStatus).toEqual({
      height: 72,
      width: 257,
      x: 0,
      y: -161,
    });
    expect(GAMEPLAY_LAYOUT.bidTrumpStatus).toEqual({
      height: 72,
      width: 257,
      x: 790,
      y: -348,
    });
    expect(GAMEPLAY_LAYOUT.rightActionLane).toEqual({
      height: 238,
      width: 257,
      x: 790,
      y: -348,
    });
    expect(GAMEPLAY_LAYOUT.turnAction).toEqual({
      height: 238,
      width: 249,
      x: 790,
      y: -348,
    });
  });

  it("exports the relative 3-6 player slot maps and authored seat positions", () => {
    expect(GAMEPLAY_SEAT_POSITIONS).toEqual([
      [-785, -270],
      [-785, 8],
      [-450, 342],
      [0, 350],
      [450, 342],
      [785, 8],
    ]);
    expect(GAMEPLAY_SLOT_MAPS).toEqual({
      3: [0, 2, 4],
      4: [0, 1, 3, 5],
      5: [0, 1, 2, 4, 5],
      6: [0, 1, 2, 3, 4, 5],
    });

    for (const playerCount of [3, 4, 5, 6] as const) {
      const slots = GAMEPLAY_SLOT_MAPS[playerCount];
      expect(slots[0]).toBe(0);
      expect(slots).toHaveLength(playerCount);
      expect(new Set(slots).size).toBe(slots.length);
      expect(slots.slice(1)).toHaveLength(playerCount - 1);
    }
  });

  it("keeps every active opponent seat at least 48px from its neighbours", () => {
    for (const playerCount of [3, 4, 5, 6] as const) {
      const opponentSlots = GAMEPLAY_SLOT_MAPS[playerCount].slice(1);

      for (let first = 0; first < opponentSlots.length; first += 1) {
        for (
          let second = first + 1;
          second < opponentSlots.length;
          second += 1
        ) {
          expect(
            rectSeparation(
              getGameplaySeatFullRect(opponentSlots[first]),
              getGameplaySeatFullRect(opponentSlots[second]),
            ),
          ).toBeGreaterThanOrEqual(48);
        }
      }
    }
  });

  it("keeps all authored gameplay regions inside the centered 16:9 safe frame", () => {
    const viewport = GAMEPLAY_LAYOUT.designViewport;
    const rects: GameplayLayoutRect[] = [
      GAMEPLAY_LAYOUT.roundHeader,
      GAMEPLAY_LAYOUT.roundHeaderLabel,
      GAMEPLAY_LAYOUT.localStats.paper,
      GAMEPLAY_LAYOUT.localStats.green,
      GAMEPLAY_LAYOUT.tableStatus,
      GAMEPLAY_LAYOUT.timer,
      GAMEPLAY_LAYOUT.trumpStatus,
      GAMEPLAY_LAYOUT.trumpContentSafe,
      GAMEPLAY_LAYOUT.trumpIcon,
      GAMEPLAY_LAYOUT.trumpLabel,
      GAMEPLAY_LAYOUT.rightActionLane,
      GAMEPLAY_LAYOUT.bidTrumpStatus,
      GAMEPLAY_LAYOUT.turnAction,
      getGameplayTurnActionLabelRect(),
      getGameplayPlayedCardsRect(6),
      getGameplayLocalHandCardRect(false),
      getGameplayLocalHandCardRect(true),
      getTopSeatGlowRect(),
      ...([0, 1, 2, 3, 4, 5] as const).map((slot) =>
        getGameplaySeatFullRect(slot),
      ),
    ];

    for (const rect of rects) {
      expectInside(rect, viewport, 24);
    }
  });

  it("keeps the round sign, timer and center play corridor clear of every opponent core", () => {
    const playedCards = getGameplayPlayedCardsRect(6);
    const opponentSlots = GAMEPLAY_SLOT_MAPS[6].slice(1);

    for (const slot of opponentSlots) {
      const core = getGameplaySeatCoreRect(slot);
      expect(
        rectSeparation(GAMEPLAY_LAYOUT.roundHeader, core),
      ).toBeGreaterThanOrEqual(24);
      expect(
        rectSeparation(GAMEPLAY_LAYOUT.timer, core),
      ).toBeGreaterThanOrEqual(24);
      expect(rectSeparation(playedCards, core)).toBeGreaterThanOrEqual(24);
    }

    for (let playCount = 1; playCount <= 6; playCount += 1) {
      for (let winnerIndex = 0; winnerIndex < playCount; winnerIndex += 1) {
        expect(
          verticalGap(
            getGameplayPlayedCardsVisualRect(playCount, winnerIndex),
            GAMEPLAY_LAYOUT.trumpStatus,
          ),
        ).toBeGreaterThanOrEqual(16);
      }
    }
  });

  it("keeps the trump icon and single-line label inside the authored resource safe area", () => {
    expectInside(
      GAMEPLAY_LAYOUT.trumpContentSafe,
      GAMEPLAY_LAYOUT.trumpStatus,
      0,
    );
    expectInside(
      GAMEPLAY_LAYOUT.trumpIcon,
      GAMEPLAY_LAYOUT.trumpContentSafe,
      0,
    );
    expectInside(
      GAMEPLAY_LAYOUT.trumpLabel,
      GAMEPLAY_LAYOUT.trumpContentSafe,
      0,
    );
    expect(GAMEPLAY_LAYOUT.trumpLabel.fontSize).toBe(24);
  });

  it("reuses the authored trump badge in the modal-safe right action lane", () => {
    const viewport = GAMEPLAY_LAYOUT.designViewport;
    const lane = GAMEPLAY_LAYOUT.rightActionLane;
    const modalTrump = getGameplayTrumpStatusRects(
      GAMEPLAY_LAYOUT.bidTrumpStatus,
    );
    const bidPanel = { height: 500, width: 720, x: 0, y: 0 };

    expect(GAMEPLAY_LAYOUT.bidTrumpStatus.x).toBe(GAMEPLAY_LAYOUT.turnAction.x);
    expect(GAMEPLAY_LAYOUT.bidTrumpStatus.y).toBe(GAMEPLAY_LAYOUT.turnAction.y);
    expectInside(lane, viewport, 40);
    expectInside(GAMEPLAY_LAYOUT.turnAction, lane, 0);
    expectInside(modalTrump.status, lane, 0);
    expectInside(modalTrump.contentSafe, modalTrump.status, 0);
    expectInside(modalTrump.icon, modalTrump.contentSafe, 0);
    expectInside(modalTrump.label, modalTrump.contentSafe, 0);
    expect(bottom(modalTrump.status) - bottom(viewport)).toBeGreaterThanOrEqual(
      64,
    );
    expect(horizontalGap(bidPanel, modalTrump.status)).toBeGreaterThanOrEqual(
      24,
    );
    expect(verticalGap(bidPanel, modalTrump.status)).toBeGreaterThanOrEqual(24);
    expect(rectSeparation(modalTrump.status, bidPanel)).toBeGreaterThanOrEqual(
      24,
    );
    expect(
      verticalGap(getGameplaySeatFullRect(5), modalTrump.status),
    ).toBeGreaterThanOrEqual(48);

    for (const handCount of [20, 15, 12, 10] as const) {
      expect(
        horizontalGap(
          getGameplayLocalChoiceHandVisualRect(handCount, handCount - 1),
          modalTrump.status,
        ),
      ).toBeGreaterThanOrEqual(24);
      expect(
        horizontalGap(
          getGameplayLocalHandVisualRect(handCount, handCount - 1, "normal"),
          modalTrump.status,
        ),
      ).toBeGreaterThanOrEqual(24);
    }
  });

  it("assigns the shared right action lane to mutually exclusive turn states", () => {
    expect(getGameplayRightActionOccupant(true, "bid", true)).toBe(
      "bid-trump-status",
    );
    expect(getGameplayRightActionOccupant(true, "trick-play", true)).toBe(
      "turn-action",
    );
    expect(getGameplayRightActionOccupant(false, "bid", true)).toBeNull();
    expect(getGameplayRightActionOccupant(true, "bid", false)).toBeNull();
    expect(
      getGameplayRightActionOccupant(false, "trick-play", true),
    ).toBeNull();
    expect(
      getGameplayRightActionOccupant(true, "trick-play", false),
    ).toBeNull();
    expect(
      getGameplayRightActionOccupant(true, "trump-select", true),
    ).toBeNull();
    expect(
      getGameplayRightActionOccupant(true, "round-score", true),
    ).toBeNull();
    expect(getGameplayRightActionOccupant(true, "match-end", true)).toBeNull();
  });

  it("keeps the shared turn action readable, reachable and inside its 40px safe frame", () => {
    const action = GAMEPLAY_LAYOUT.turnAction;
    const fixedHeightScale = 402 / 1080;

    expect(action.width / action.height).toBeCloseTo(343 / 328, 2);
    expectInside(action, GAMEPLAY_LAYOUT.designViewport, 40);
    expectInside(getGameplayTurnActionLabelRect(), action, 32);
    expect(GAMEPLAY_LAYOUT.turnActionLabel).toMatchObject({
      fontSize: 38,
      height: 126,
      width: 178,
      x: 0,
      y: 2,
    });
    expect(action.width * fixedHeightScale).toBeGreaterThanOrEqual(44);
    expect(action.height * fixedHeightScale).toBeGreaterThanOrEqual(44);
    expect(
      rectSeparation(action, getGameplaySeatFullRect(5)),
    ).toBeGreaterThanOrEqual(24);
  });

  it("keeps the widest supported decorated hand clear of the shared turn action", () => {
    const maximumHandCounts = [20, 15, 12, 10] as const;

    for (const handCount of maximumHandCounts) {
      for (const state of ["legal", "selected"] as const) {
        expect(
          rectSeparation(
            getGameplayLocalHandVisualRect(handCount, handCount - 1, state),
            GAMEPLAY_LAYOUT.turnAction,
          ),
        ).toBeGreaterThanOrEqual(24);
      }
    }
  });

  it("keeps the round label inside its authored sign and the empty status below the top cards", () => {
    expectInside(
      GAMEPLAY_LAYOUT.roundHeaderLabel,
      GAMEPLAY_LAYOUT.roundHeader,
      24,
    );
    expect(
      verticalGap(getTopSeatCardRect(), GAMEPLAY_LAYOUT.tableStatus),
    ).toBeGreaterThanOrEqual(16);
  });

  it("keeps compact seat stats legible and the count marker pointed toward table center", () => {
    expect(
      horizontalGap(
        GAMEPLAY_LAYOUT.seatStats.paper,
        GAMEPLAY_LAYOUT.seatStats.green,
      ),
    ).toBeGreaterThanOrEqual(16);

    expect(getGameplayOpponentCountX(1)).toBe(112);
    expect(getGameplayOpponentCountX(2)).toBe(112);
    expect(getGameplayOpponentCountX(3)).toBe(112);
    expect(getGameplayOpponentCountX(4)).toBe(-112);
    expect(getGameplayOpponentCountX(5)).toBe(-112);
  });

  it("keeps local prediction and won bands separated from each other and the left seat", () => {
    expect(
      verticalGap(
        GAMEPLAY_LAYOUT.localStats.paper,
        GAMEPLAY_LAYOUT.localStats.green,
      ),
    ).toBeGreaterThanOrEqual(10);
    expect(
      verticalGap(getGameplaySeatFullRect(1), GAMEPLAY_LAYOUT.localStats.paper),
    ).toBeGreaterThanOrEqual(24);
  });

  it("keeps the trump plaque clear of both normal and selected local cards", () => {
    const normalHand = getGameplayLocalHandCardRect(false);
    const selectedHand = getGameplayLocalHandCardRect(true);

    expect(
      verticalGap(GAMEPLAY_LAYOUT.trumpStatus, normalHand),
    ).toBeGreaterThanOrEqual(19);
    expect(
      verticalGap(GAMEPLAY_LAYOUT.trumpStatus, selectedHand),
    ).toBeGreaterThanOrEqual(19);

    for (const state of ["legal", "selected"] as const) {
      expect(
        verticalGap(
          GAMEPLAY_LAYOUT.trumpStatus,
          getGameplayLocalHandVisualRect(1, 0, state),
        ),
      ).toBeGreaterThanOrEqual(16);
    }
  });

  it("rejects impossible played-card counts in the pure layout helper", () => {
    expect(() => getGameplayPlayedCardsRect(-1)).toThrow(
      "INVALID_GAMEPLAY_PLAY_COUNT:-1",
    );
    expect(() => getGameplayPlayedCardsRect(7)).toThrow(
      "INVALID_GAMEPLAY_PLAY_COUNT:7",
    );
  });
});
