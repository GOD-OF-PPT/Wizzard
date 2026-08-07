export type LayoutRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export const RULES_SETTINGS_ASSETS = {
  frame: "ui.panel.rulesSettings",
  settingsRow: "ui.settingsRow",
  textCard: "ui.panel.rulesText",
  visualCard: "ui.panel.rulesVisual",
} as const;

export const RULES_SETTINGS_COPY = {
  title: "规则与\n设置",
} as const;

export const RULES_SETTINGS_LAYOUT = {
  // This frame has its own 1840x1000 Mini Game artwork and is rendered SIMPLE.
  panel: { height: 1000, width: 1840, x: 0, y: 0 },
  title: { height: 132, width: 132, x: 0, y: 375 },
  titleLabel: {
    fontSize: 17,
    height: 46,
    lineHeight: 20,
    width: 72,
    x: 0,
    y: 362,
  },
  backButton: { height: 80, width: 200, x: 700, y: 400 },
  rulesTab: { height: 118, width: 240, x: -180, y: 235 },
  settingsTab: { height: 118, width: 240, x: 180, y: 235 },
  chapter: {
    height: 80,
    spacing: 390,
    startX: -585,
    width: 300,
    y: 120,
  },
  textCard: { height: 333, width: 680, x: -365, y: -111 },
  visualCard: { height: 333, width: 680, x: 365, y: -111 },
  eyebrow: { height: 22, width: 540, x: 0, y: 120 },
  pageTitle: { height: 34, width: 540, x: 0, y: 80 },
  pageBody: { height: 184, width: 540, x: 0, y: -39 },
  ruleVisual: {
    suitCard: {
      height: 108,
      spacing: 100,
      startX: -150,
      width: 72,
      y: 67,
    },
    suitLabel: { height: 22, width: 72, x: 0, y: -2 },
    specialCard: { height: 90, width: 60, x: 70, y: -62 },
    specialLabel: { height: 22, width: 116, x: 70, y: -123 },
  },
  footer: { height: 84, width: 980, x: 0, y: -336 },
  previousButton: { height: 72, width: 220, x: -680, y: -430 },
  pageIndicator: { height: 72, width: 140, x: 0, y: -430 },
  nextButton: { height: 72, width: 220, x: 680, y: -430 },
  settings: {
    heading: { height: 40, width: 480, x: 0, y: 135 },
    subtitle: { height: 28, width: 820, x: 0, y: 92 },
    firstRow: { height: 116, width: 820, x: 0, y: 8 },
    secondRow: { height: 116, width: 820, x: 0, y: -120 },
    timerRow: { height: 116, width: 820, x: 0, y: -248 },
    rowTitle: { height: 30, width: 400, x: -75, y: 22 },
    rowDescription: { height: 34, width: 400, x: -75, y: -20 },
    toggle: { height: 78, width: 160, x: 260, y: 0 },
    timerDescription: { height: 34, width: 580, x: 0, y: -20 },
    reset: { height: 80, width: 220, x: 0, y: -370 },
    resetWithNoticeX: -170,
    notice: { height: 80, width: 300, x: 170, y: -370 },
  },
} as const;
