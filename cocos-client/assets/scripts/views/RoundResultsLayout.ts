export type RoundResultsLayoutRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export const ROUND_RESULTS_ASSETS = {
  panel: "ui.results.panel",
  paperButton: "ui.results.button.paper",
  greenButton: "ui.results.button.green.v2",
} as const;

export const ROUND_RESULTS_LAYOUT = {
  panel: { height: 880, width: 1640, x: 0, y: 0 },
  contentSafe: { height: 760, width: 1160, x: 0, y: -4 },
  footerSafe: { height: 104, width: 1020, x: -10, y: -306 },
  footerTouchSafe: { height: 120, width: 1020, x: -10, y: -306 },
  title: {
    fontSize: 40,
    height: 64,
    width: 500,
    x: 0,
    y: 345,
  },
  header: {
    height: 54,
    y: 218,
    player: { height: 42, width: 330, x: -375, y: 218 },
    bid: { height: 42, width: 110, x: -105, y: 218 },
    tricks: { height: 42, width: 110, x: 75, y: 218 },
    round: { height: 42, width: 130, x: 255, y: 218 },
    total: { height: 42, width: 130, x: 445, y: 218 },
  },
  rows: {
    avatar: { height: 64, width: 64, x: -500 },
    name: { height: 44, width: 210, x: -370 },
    bid: { height: 44, width: 110, x: -105 },
    tricks: { height: 44, width: 110, x: 75 },
    round: { height: 44, width: 140, x: 255 },
    total: { height: 44, width: 140, x: 445 },
    gap: 72,
    height: 64,
    startY: 152,
  },
  rankingRows: {
    rank: { height: 44, width: 72, x: -520 },
    avatar: { height: 64, width: 64, x: -440 },
    name: { height: 44, width: 210, x: -315 },
    round: { height: 44, width: 140, x: 255 },
    total: { height: 44, width: 140, x: 445 },
  },
  rankingHeader: {
    rank: { height: 42, width: 72, x: -520, y: 218 },
    player: { height: 42, width: 280, x: -335, y: 218 },
    round: { height: 42, width: 140, x: 255, y: 218 },
    total: { height: 42, width: 140, x: 445, y: 218 },
  },
  finalRows: {
    rank: { height: 44, width: 72, x: -520 },
    avatar: { height: 64, width: 64, x: -440 },
    name: { height: 44, width: 210, x: -315 },
    completed: { height: 44, width: 180, x: 220 },
    total: { height: 44, width: 140, x: 445 },
  },
  finalHeader: {
    rank: { height: 42, width: 72, x: -520, y: 218 },
    player: { height: 42, width: 280, x: -335, y: 218 },
    completed: { height: 42, width: 180, x: 220, y: 218 },
    total: { height: 42, width: 140, x: 445, y: 218 },
  },
  footer: {
    height: 100,
    touchHeight: 120,
    y: -306,
    hint: { height: 48, width: 410, x: -305, y: -306 },
    secondaryButton: { height: 100, width: 240, x: 40, y: -306 },
    primaryButton: { height: 100, width: 300, x: 335, y: -306 },
    secondaryLabel: {
      fontSize: 32,
      height: 64,
      offsetX: 0,
      offsetY: 2,
      width: 160,
    },
    primaryLabel: {
      fontSize: 32,
      height: 58,
      offsetX: 0,
      offsetY: 2,
      width: 210,
    },
  },
} as const;

export function getRoundResultsRowY(index: number): number {
  return (
    ROUND_RESULTS_LAYOUT.rows.startY - index * ROUND_RESULTS_LAYOUT.rows.gap
  );
}

export function getRoundResultsRowRect(index: number): RoundResultsLayoutRect {
  return {
    height: ROUND_RESULTS_LAYOUT.rows.height,
    width: ROUND_RESULTS_LAYOUT.contentSafe.width,
    x: ROUND_RESULTS_LAYOUT.contentSafe.x,
    y: getRoundResultsRowY(index),
  };
}
