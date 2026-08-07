import { describe, expect, it } from "vitest";
import {
  RULES_SETTINGS_ASSETS,
  RULES_SETTINGS_COPY,
  RULES_SETTINGS_LAYOUT,
  type LayoutRect,
} from "../assets/scripts/views/RulesSettingsLayout";

const top = (rect: LayoutRect): number => rect.y + rect.height / 2;
const bottom = (rect: LayoutRect): number => rect.y - rect.height / 2;
const left = (rect: LayoutRect): number => rect.x - rect.width / 2;
const right = (rect: LayoutRect): number => rect.x + rect.width / 2;
const verticalGap = (upper: LayoutRect, lower: LayoutRect): number =>
  bottom(upper) - top(lower);
const horizontalGap = (leftRect: LayoutRect, rightRect: LayoutRect): number =>
  left(rightRect) - right(leftRect);

const chapterRect = (): LayoutRect => ({
  height: RULES_SETTINGS_LAYOUT.chapter.height,
  width: RULES_SETTINGS_LAYOUT.chapter.width,
  x: RULES_SETTINGS_LAYOUT.chapter.startX,
  y: RULES_SETTINGS_LAYOUT.chapter.y,
});

describe("rules and settings layout", () => {
  it("keeps the dedicated Mini Game frame inside the 1920x1080 safe area", () => {
    expect((1920 - RULES_SETTINGS_LAYOUT.panel.width) / 2).toBeGreaterThanOrEqual(
      40,
    );
    expect((1080 - RULES_SETTINGS_LAYOUT.panel.height) / 2).toBeGreaterThanOrEqual(
      40,
    );
    expect(RULES_SETTINGS_LAYOUT.title.width).toBe(
      RULES_SETTINGS_LAYOUT.title.height,
    );
  });

  it("uses purpose-built SIMPLE assets for dense rules and settings content", () => {
    expect(RULES_SETTINGS_ASSETS).toEqual({
      frame: "ui.panel.rulesSettings",
      settingsRow: "ui.settingsRow",
      textCard: "ui.panel.rulesText",
      visualCard: "ui.panel.rulesVisual",
    });
  });

  it("keeps the title and return button inside the lacquer frame", () => {
    const localPanel: LayoutRect = {
      ...RULES_SETTINGS_LAYOUT.panel,
      x: 0,
      y: 0,
    };

    for (const rect of [
      RULES_SETTINGS_LAYOUT.title,
      RULES_SETTINGS_LAYOUT.backButton,
    ]) {
      expect(top(rect)).toBeLessThanOrEqual(top(localPanel) - 40);
      expect(bottom(rect)).toBeGreaterThanOrEqual(bottom(localPanel) + 40);
      expect(left(rect)).toBeGreaterThanOrEqual(left(localPanel) + 40);
      expect(right(rect)).toBeLessThanOrEqual(right(localPanel) - 40);
    }
  });

  it("wraps the five-character title inside the round sign's inner plate", () => {
    expect(RULES_SETTINGS_COPY.title.split("\n")).toEqual(["规则与", "设置"]);
    expect(RULES_SETTINGS_LAYOUT.titleLabel.width).toBeLessThanOrEqual(72);
    expect(RULES_SETTINGS_LAYOUT.titleLabel.height).toBeLessThanOrEqual(46);
    expect(
      Math.max(...RULES_SETTINGS_COPY.title.split("\n").map((line) => line.length)) *
        RULES_SETTINGS_LAYOUT.titleLabel.fontSize,
    ).toBeLessThanOrEqual(RULES_SETTINGS_LAYOUT.titleLabel.width);
    expect(top(RULES_SETTINGS_LAYOUT.titleLabel)).toBeLessThan(
      top(RULES_SETTINGS_LAYOUT.title) - 40,
    );
    expect(bottom(RULES_SETTINGS_LAYOUT.titleLabel)).toBeGreaterThan(
      bottom(RULES_SETTINGS_LAYOUT.title) + 20,
    );
  });

  it("keeps title, tabs and chapter navigation in separate bands", () => {
    expect(
      verticalGap(RULES_SETTINGS_LAYOUT.title, RULES_SETTINGS_LAYOUT.rulesTab),
    ).toBeGreaterThanOrEqual(12);
    expect(
      verticalGap(RULES_SETTINGS_LAYOUT.rulesTab, chapterRect()),
    ).toBeGreaterThanOrEqual(16);
  });

  it("keeps chapter navigation, content, footer and pagination separate", () => {
    expect(
      verticalGap(chapterRect(), RULES_SETTINGS_LAYOUT.textCard),
    ).toBeGreaterThanOrEqual(24);
    expect(
      verticalGap(RULES_SETTINGS_LAYOUT.textCard, RULES_SETTINGS_LAYOUT.footer),
    ).toBeGreaterThanOrEqual(16);
    expect(
      verticalGap(
        RULES_SETTINGS_LAYOUT.footer,
        RULES_SETTINGS_LAYOUT.pageIndicator,
      ),
    ).toBeGreaterThanOrEqual(12);
  });

  it("keeps the text card's eyebrow, title and body separated", () => {
    expect(
      verticalGap(
        RULES_SETTINGS_LAYOUT.eyebrow,
        RULES_SETTINGS_LAYOUT.pageTitle,
      ),
    ).toBeGreaterThanOrEqual(10);
    expect(
      verticalGap(
        RULES_SETTINGS_LAYOUT.pageTitle,
        RULES_SETTINGS_LAYOUT.pageBody,
      ),
    ).toBeGreaterThanOrEqual(10);
    expect(
      RULES_SETTINGS_LAYOUT.textCard.height / 2 -
        top(RULES_SETTINGS_LAYOUT.eyebrow),
    ).toBeGreaterThanOrEqual(32);
    expect(
      bottom(RULES_SETTINGS_LAYOUT.pageBody) +
        RULES_SETTINGS_LAYOUT.textCard.height / 2,
    ).toBeGreaterThanOrEqual(32);
    expect(
      (RULES_SETTINGS_LAYOUT.textCard.width -
        RULES_SETTINGS_LAYOUT.pageBody.width) /
        2,
    ).toBeGreaterThanOrEqual(70);
  });

  it("keeps rule-card examples clear of the visual frame ornaments", () => {
    const visual = RULES_SETTINGS_LAYOUT.ruleVisual;
    const visualHalfHeight = RULES_SETTINGS_LAYOUT.visualCard.height / 2;
    const suitCard: LayoutRect = {
      ...visual.suitCard,
      x: visual.suitCard.startX,
    };
    const suitLabel: LayoutRect = {
      ...visual.suitLabel,
      x: visual.suitCard.startX,
    };
    const specialCard: LayoutRect = visual.specialCard;
    const specialLabel: LayoutRect = visual.specialLabel;

    expect(visualHalfHeight - top(suitCard)).toBeGreaterThanOrEqual(40);
    expect(verticalGap(suitCard, suitLabel)).toBeGreaterThanOrEqual(4);
    expect(verticalGap(suitLabel, specialCard)).toBeGreaterThanOrEqual(4);
    expect(verticalGap(specialCard, specialLabel)).toBeGreaterThanOrEqual(4);
    expect(bottom(specialLabel) + visualHalfHeight).toBeGreaterThanOrEqual(32);
  });

  it("keeps every settings band separated", () => {
    const settings = RULES_SETTINGS_LAYOUT.settings;
    expect(verticalGap(RULES_SETTINGS_LAYOUT.settingsTab, settings.heading)).toBeGreaterThanOrEqual(10);
    expect(verticalGap(settings.heading, settings.subtitle)).toBeGreaterThanOrEqual(8);
    expect(verticalGap(settings.subtitle, settings.firstRow)).toBeGreaterThanOrEqual(12);
    expect(verticalGap(settings.firstRow, settings.secondRow)).toBeGreaterThanOrEqual(12);
    expect(verticalGap(settings.secondRow, settings.timerRow)).toBeGreaterThanOrEqual(12);
    expect(verticalGap(settings.timerRow, settings.reset)).toBeGreaterThanOrEqual(20);
  });

  it("keeps row copy, toggles and actions from intersecting", () => {
    const settings = RULES_SETTINGS_LAYOUT.settings;
    expect(
      verticalGap(settings.rowTitle, settings.rowDescription),
    ).toBeGreaterThanOrEqual(8);
    expect(
      horizontalGap(settings.rowDescription, settings.toggle),
    ).toBeGreaterThanOrEqual(48);
    expect(
      left(settings.rowTitle) - left(settings.firstRow),
    ).toBeGreaterThanOrEqual(120);
    expect(
      left(settings.rowDescription) - left(settings.firstRow),
    ).toBeGreaterThanOrEqual(120);
    expect(
      left(settings.timerDescription) - left(settings.timerRow),
    ).toBeGreaterThanOrEqual(120);
    expect(
      right(settings.firstRow) - right(settings.toggle),
    ).toBeGreaterThanOrEqual(64);

    const resetWithNotice: LayoutRect = {
      ...settings.reset,
      x: settings.resetWithNoticeX,
    };
    expect(horizontalGap(resetWithNotice, settings.notice)).toBeGreaterThanOrEqual(
      40,
    );
  });

  it("uses native-aspect SIMPLE sprites for the blue controls and cards", () => {
    const relativeError = (actual: number, expected: number): number =>
      Math.abs(actual / expected - 1);

    expect(
      relativeError(
        RULES_SETTINGS_LAYOUT.rulesTab.width /
          RULES_SETTINGS_LAYOUT.rulesTab.height,
        376 / 184,
      ),
    ).toBeLessThan(0.01);
    expect(
      relativeError(
        RULES_SETTINGS_LAYOUT.settings.toggle.width /
          RULES_SETTINGS_LAYOUT.settings.toggle.height,
        376 / 184,
      ),
    ).toBeLessThan(0.01);
    expect(
      relativeError(
        RULES_SETTINGS_LAYOUT.textCard.width /
          RULES_SETTINGS_LAYOUT.textCard.height,
        376 / 184,
      ),
    ).toBeLessThan(0.01);
  });
});
