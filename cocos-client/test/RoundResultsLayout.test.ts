import { describe, expect, it } from "vitest";
import {
  ROUND_RESULTS_ASSETS,
  ROUND_RESULTS_LAYOUT,
  getRoundResultsRowRect,
  type RoundResultsLayoutRect,
} from "../assets/scripts/views/RoundResultsLayout";

const top = (rect: RoundResultsLayoutRect): number => rect.y + rect.height / 2;
const bottom = (rect: RoundResultsLayoutRect): number =>
  rect.y - rect.height / 2;
const left = (rect: RoundResultsLayoutRect): number => rect.x - rect.width / 2;
const right = (rect: RoundResultsLayoutRect): number => rect.x + rect.width / 2;
const verticalGap = (
  upper: RoundResultsLayoutRect,
  lower: RoundResultsLayoutRect,
): number => bottom(upper) - top(lower);
const expectInside = (
  outer: RoundResultsLayoutRect,
  inner: RoundResultsLayoutRect,
): void => {
  expect(left(inner)).toBeGreaterThanOrEqual(left(outer));
  expect(right(inner)).toBeLessThanOrEqual(right(outer));
  expect(top(inner)).toBeLessThanOrEqual(top(outer));
  expect(bottom(inner)).toBeGreaterThanOrEqual(bottom(outer));
};

describe("WeChat Mini Game round-results layout", () => {
  it("uses purpose-built final-proportion SIMPLE resources", () => {
    expect(ROUND_RESULTS_ASSETS).toEqual({
      greenButton: "ui.results.button.green.v2",
      panel: "ui.results.panel",
      paperButton: "ui.results.button.paper",
    });
    expect(
      ROUND_RESULTS_LAYOUT.panel.width / ROUND_RESULTS_LAYOUT.panel.height,
    ).toBeCloseTo(1710 / 920, 2);
    expect(
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.width /
        ROUND_RESULTS_LAYOUT.footer.secondaryButton.height,
    ).toBeCloseTo(480 / 200, 2);
    expect(
      ROUND_RESULTS_LAYOUT.footer.primaryButton.width /
        ROUND_RESULTS_LAYOUT.footer.primaryButton.height,
    ).toBeCloseTo(600 / 200, 2);
  });

  it("uses a dedicated footer-safe band for the three footer items", () => {
    expect(ROUND_RESULTS_LAYOUT.footerSafe).toEqual({
      height: 104,
      width: 1020,
      x: -10,
      y: -306,
    });
    expect(ROUND_RESULTS_LAYOUT.footerTouchSafe).toEqual({
      height: 120,
      width: 1020,
      x: -10,
      y: -306,
    });
    expect(ROUND_RESULTS_LAYOUT.footer.y).toBe(-306);
    expect(ROUND_RESULTS_LAYOUT.footer.touchHeight).toBe(120);
    expect(ROUND_RESULTS_LAYOUT.footer.hint).toMatchObject({
      width: 410,
      x: -305,
      y: -306,
    });
    expect(ROUND_RESULTS_LAYOUT.footer.secondaryButton).toEqual({
      height: 100,
      width: 240,
      x: 40,
      y: -306,
    });
    expect(ROUND_RESULTS_LAYOUT.footer.primaryButton).toEqual({
      height: 100,
      width: 300,
      x: 335,
      y: -306,
    });
    expect(ROUND_RESULTS_LAYOUT.footer.primaryButton.height).toBe(
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.height,
    );
    expect(ROUND_RESULTS_LAYOUT.footer.secondaryLabel).toEqual({
      fontSize: 32,
      height: 64,
      offsetX: 0,
      offsetY: 2,
      width: 160,
    });
    expect(ROUND_RESULTS_LAYOUT.footer.primaryLabel).toEqual({
      fontSize: 32,
      height: 58,
      offsetX: 0,
      offsetY: 2,
      width: 210,
    });
  });

  it("keeps title, header, six rows and footer in separate bands", () => {
    const headerRect: RoundResultsLayoutRect = {
      height: ROUND_RESULTS_LAYOUT.header.height,
      width: ROUND_RESULTS_LAYOUT.contentSafe.width,
      x: 0,
      y: ROUND_RESULTS_LAYOUT.header.y,
    };
    const firstRow = getRoundResultsRowRect(0);
    const lastRow = getRoundResultsRowRect(5);
    const footerRect: RoundResultsLayoutRect = {
      height: ROUND_RESULTS_LAYOUT.footer.height,
      width: ROUND_RESULTS_LAYOUT.contentSafe.width,
      x: 0,
      y: ROUND_RESULTS_LAYOUT.footer.y,
    };

    expect(
      verticalGap(ROUND_RESULTS_LAYOUT.title, headerRect),
    ).toBeGreaterThanOrEqual(32);
    expect(verticalGap(headerRect, firstRow)).toBeGreaterThanOrEqual(6);
    expect(verticalGap(lastRow, footerRect)).toBeGreaterThanOrEqual(2);
    expect(
      top(ROUND_RESULTS_LAYOUT.panel) - top(ROUND_RESULTS_LAYOUT.title),
    ).toBeGreaterThanOrEqual(32);
    expect(
      bottom(footerRect) - bottom(ROUND_RESULTS_LAYOUT.panel),
    ).toBeGreaterThanOrEqual(32);
  });

  it("keeps adjacent six-player rows from touching", () => {
    for (let index = 0; index < 5; index += 1) {
      expect(
        verticalGap(
          getRoundResultsRowRect(index),
          getRoundResultsRowRect(index + 1),
        ),
      ).toBeGreaterThanOrEqual(8);
    }
  });

  it("keeps table columns inside the ornament-safe area", () => {
    const safe = ROUND_RESULTS_LAYOUT.contentSafe;
    const row = ROUND_RESULTS_LAYOUT.rows;
    const rects: RoundResultsLayoutRect[] = [
      ROUND_RESULTS_LAYOUT.header.player,
      ROUND_RESULTS_LAYOUT.header.bid,
      ROUND_RESULTS_LAYOUT.header.tricks,
      ROUND_RESULTS_LAYOUT.header.round,
      ROUND_RESULTS_LAYOUT.header.total,
      ROUND_RESULTS_LAYOUT.rankingHeader.rank,
      ROUND_RESULTS_LAYOUT.rankingHeader.player,
      ROUND_RESULTS_LAYOUT.rankingHeader.round,
      ROUND_RESULTS_LAYOUT.rankingHeader.total,
      ROUND_RESULTS_LAYOUT.finalHeader.rank,
      ROUND_RESULTS_LAYOUT.finalHeader.player,
      ROUND_RESULTS_LAYOUT.finalHeader.completed,
      ROUND_RESULTS_LAYOUT.finalHeader.total,
      { ...row.avatar, y: row.startY },
      { ...row.name, y: row.startY },
      { ...row.bid, y: row.startY },
      { ...row.tricks, y: row.startY },
      { ...row.round, y: row.startY },
      { ...row.total, y: row.startY },
      { ...ROUND_RESULTS_LAYOUT.rankingRows.rank, y: row.startY },
      { ...ROUND_RESULTS_LAYOUT.rankingRows.avatar, y: row.startY },
      { ...ROUND_RESULTS_LAYOUT.rankingRows.name, y: row.startY },
      { ...ROUND_RESULTS_LAYOUT.finalRows.completed, y: row.startY },
    ];

    for (const rect of rects) {
      expect(left(rect)).toBeGreaterThanOrEqual(left(safe));
      expect(right(rect)).toBeLessThanOrEqual(right(safe));
    }
  });

  it("keeps footer visuals and expanded touch targets inside footerSafe", () => {
    const safe = ROUND_RESULTS_LAYOUT.footerSafe;
    const touchSafe = ROUND_RESULTS_LAYOUT.footerTouchSafe;
    const footer = ROUND_RESULTS_LAYOUT.footer;
    const visualRects: RoundResultsLayoutRect[] = [
      footer.hint,
      footer.secondaryButton,
      footer.primaryButton,
    ];
    const touchRects: RoundResultsLayoutRect[] = [
      { ...footer.secondaryButton, height: footer.touchHeight },
      { ...footer.primaryButton, height: footer.touchHeight },
    ];

    for (const rect of visualRects) {
      expectInside(safe, rect);
    }
    for (const rect of touchRects) {
      expectInside(touchSafe, rect);
    }
    expectInside(ROUND_RESULTS_LAYOUT.panel, safe);
    expectInside(ROUND_RESULTS_LAYOUT.panel, touchSafe);
    expect(
      verticalGap(getRoundResultsRowRect(5), touchSafe),
    ).toBeGreaterThanOrEqual(6);

    expect(
      left(footer.secondaryButton) - right(footer.hint),
    ).toBeGreaterThanOrEqual(20);
    expect(
      left(footer.primaryButton) - right(footer.secondaryButton),
    ).toBeGreaterThanOrEqual(20);
    expect(left(footer.hint) - left(safe)).toBeGreaterThanOrEqual(10);
    expect(right(safe) - right(footer.primaryButton)).toBeGreaterThanOrEqual(
      10,
    );
  });

  it("keeps both action labels inside their authored content-safe areas", () => {
    const footer = ROUND_RESULTS_LAYOUT.footer;
    const secondarySafe: RoundResultsLayoutRect = {
      height: 70,
      width: 160,
      x: footer.secondaryButton.x,
      y: footer.secondaryButton.y,
    };
    const primarySafe: RoundResultsLayoutRect = {
      height: 70,
      width: 240,
      x: footer.primaryButton.x,
      y: footer.primaryButton.y,
    };
    const secondaryLabel: RoundResultsLayoutRect = {
      height: footer.secondaryLabel.height,
      width: footer.secondaryLabel.width,
      x: footer.secondaryButton.x + footer.secondaryLabel.offsetX,
      y: footer.secondaryButton.y + footer.secondaryLabel.offsetY,
    };
    const primaryLabel: RoundResultsLayoutRect = {
      height: footer.primaryLabel.height,
      width: footer.primaryLabel.width,
      x: footer.primaryButton.x + footer.primaryLabel.offsetX,
      y: footer.primaryButton.y + footer.primaryLabel.offsetY,
    };

    expectInside(secondarySafe, secondaryLabel);
    expectInside(primarySafe, primaryLabel);
    expect(secondaryLabel.y).toBe(primaryLabel.y);
    expect(footer.secondaryLabel.fontSize).toBe(footer.primaryLabel.fontSize);
  });

  it("keeps both result actions at least 44px tall on the 847px WeChat viewport", () => {
    const fixedHeightScale = 402 / 1080;
    expect(
      ROUND_RESULTS_LAYOUT.footer.touchHeight * fixedHeightScale,
    ).toBeGreaterThanOrEqual(44);
    for (const button of [
      ROUND_RESULTS_LAYOUT.footer.secondaryButton,
      ROUND_RESULTS_LAYOUT.footer.primaryButton,
    ]) {
      expect(button.width * fixedHeightScale).toBeGreaterThanOrEqual(44);
    }
    expect(
      ROUND_RESULTS_LAYOUT.footer.secondaryLabel.fontSize * fixedHeightScale,
    ).toBeGreaterThanOrEqual(11);
  });
});
