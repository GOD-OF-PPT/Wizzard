export type GameplayLayoutRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export type GameplayPlayerCount = 3 | 4 | 5 | 6;
export type GameplaySeatSlot = 0 | 1 | 2 | 3 | 4 | 5;
export type GameplayLocalHandVisualState = "normal" | "legal" | "selected";

export type GameplayRightActionOccupant =
  "bid-trump-status" | "turn-action" | null;

export type GameplayTrumpStatusRects = Readonly<{
  contentSafe: GameplayLayoutRect;
  icon: GameplayLayoutRect;
  label: GameplayLayoutRect;
  status: GameplayLayoutRect;
}>;

export const GAMEPLAY_ASSETS = {
  roundHeader: "ui.roundTitleScroll",
  statGreen: "ui.match.stat.green",
  statPaper: "ui.match.stat.paper",
} as const;

export const GAMEPLAY_SEAT_POSITIONS = [
  [-785, -270],
  [-785, 8],
  [-450, 342],
  [0, 350],
  [450, 342],
  [785, 8],
] as const satisfies readonly (readonly [number, number])[];

export const GAMEPLAY_SLOT_MAPS = {
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
} as const satisfies Readonly<
  Record<GameplayPlayerCount, readonly GameplaySeatSlot[]>
>;

// Compatibility alias for callers that use the shorter domain term.
export const SLOT_MAPS = GAMEPLAY_SLOT_MAPS;

export const GAMEPLAY_LAYOUT = {
  designViewport: { height: 1080, width: 1920, x: 0, y: 0 },
  roundHeader: { height: 172, width: 180, x: -846, y: 390 },
  roundHeaderLabel: {
    fontSize: 20,
    height: 62,
    lineHeight: 27,
    width: 120,
    x: -846,
    y: 375,
  },
  tableStatus: { height: 48, width: 620, x: 0, y: 95 },
  localStats: {
    paper: { height: 75, width: 268, x: -800, y: -274 },
    green: { height: 75, width: 268, x: -800, y: -360 },
    labelHeight: 44,
    labelWidth: 210,
    greenLabelOffsetX: 18,
  },
  seatStats: {
    paper: { height: 37, width: 132, x: -74, y: -72 },
    green: { height: 37, width: 132, x: 74, y: -72 },
    labelHeight: 26,
    labelWidth: 112,
    fontSize: 18,
    greenLabelOffsetX: 7,
  },
  opponentHand: {
    anglePerStep: 3,
    card: { height: 114, width: 76, x: 0, y: -148 },
    count: { height: 36, width: 64, x: 112, y: -146 },
    countOffsetX: 112,
    dropPerStep: 2,
    maxVisibleCards: 5,
    spacing: 42,
  },
  playedCard: {
    anglePerStep: 3.2,
    arcDropPerStep: 6,
    baseY: 52,
    height: 219,
    maxSpacing: 142,
    maxSpread: 700,
    winnerExtraHeight: 48,
    winnerExtraWidth: 42,
    width: 146,
  },
  localHand: {
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
  },
  trumpStatus: { height: 72, width: 257, x: 0, y: -161 },
  trumpContentSafe: {
    height: (72 * 132) / 168,
    width: (257 * 460) / 600,
    x: 0,
    y: -161,
  },
  trumpIcon: { height: 54, width: 36, x: -80, y: -161 },
  trumpLabel: {
    fontSize: 24,
    height: 34,
    width: 144,
    x: 24,
    y: -161,
  },
  rightActionLane: { height: 238, width: 257, x: 790, y: -348 },
  bidTrumpStatus: { height: 72, width: 257, x: 790, y: -348 },
  turnAction: { height: 238, width: 249, x: 790, y: -348 },
  turnActionLabel: {
    fontSize: 38,
    height: 126,
    width: 178,
    x: 0,
    y: 2,
  },
  timer: { height: 110, width: 110, x: 680, y: 440 },
  seatBounds: {
    // Avatar glow, name and both compact stat bands.
    core: { height: 255, width: 280, x: 0, y: 36.5 },
    // The full bounds include the rotated five-card fan and inward count label.
    full: {
      center: { height: 377, width: 280, x: 0, y: -24.5 },
      left: { height: 377, width: 284, x: 2, y: -24.5 },
      right: { height: 377, width: 284, x: -2, y: -24.5 },
    },
  },
  topSeat: {
    card: { height: 114, width: 76, x: 0, y: -148 },
    currentGlow: { height: 208, width: 208, x: 0, y: 60 },
    y: 350,
  },
  upperLeftSeatAvatar: { height: 176, width: 176, x: -450, y: 402 },
} as const;

function translateRect(
  rect: GameplayLayoutRect,
  x: number,
  y: number,
): GameplayLayoutRect {
  return {
    ...rect,
    x: rect.x + x,
    y: rect.y + y,
  };
}

function getRotatedRect(
  width: number,
  height: number,
  x: number,
  y: number,
  angleDegrees: number,
): GameplayLayoutRect {
  const angleRadians = (Math.abs(angleDegrees) * Math.PI) / 180;
  const rotatedWidth =
    Math.abs(width * Math.cos(angleRadians)) +
    Math.abs(height * Math.sin(angleRadians));
  const rotatedHeight =
    Math.abs(width * Math.sin(angleRadians)) +
    Math.abs(height * Math.cos(angleRadians));

  return {
    height: rotatedHeight,
    width: rotatedWidth,
    x,
    y,
  };
}

function unionRects(rects: readonly GameplayLayoutRect[]): GameplayLayoutRect {
  if (rects.length === 0) {
    return { height: 0, width: 0, x: 0, y: 0 };
  }

  const left = Math.min(...rects.map((rect) => rect.x - rect.width / 2));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width / 2));
  const bottom = Math.min(...rects.map((rect) => rect.y - rect.height / 2));
  const top = Math.max(...rects.map((rect) => rect.y + rect.height / 2));

  return {
    height: top - bottom,
    width: right - left,
    x: (left + right) / 2,
    y: (bottom + top) / 2,
  };
}

export function getGameplayOpponentCountX(slot: GameplaySeatSlot): number {
  if (slot === 1 || slot === 2 || slot === 3) {
    return GAMEPLAY_LAYOUT.opponentHand.countOffsetX;
  }

  if (slot === 4 || slot === 5) {
    return -GAMEPLAY_LAYOUT.opponentHand.countOffsetX;
  }

  return 0;
}

export function getGameplaySeatCoreRect(
  slot: GameplaySeatSlot,
): GameplayLayoutRect {
  const [x, y] = GAMEPLAY_SEAT_POSITIONS[slot];
  return translateRect(GAMEPLAY_LAYOUT.seatBounds.core, x, y);
}

export function getGameplaySeatFullRect(
  slot: GameplaySeatSlot,
): GameplayLayoutRect {
  const [x, y] = GAMEPLAY_SEAT_POSITIONS[slot];
  const bounds =
    slot === 1 || slot === 2 || slot === 3
      ? GAMEPLAY_LAYOUT.seatBounds.full.left
      : slot === 4 || slot === 5
        ? GAMEPLAY_LAYOUT.seatBounds.full.right
        : GAMEPLAY_LAYOUT.seatBounds.full.center;
  return translateRect(bounds, x, y);
}

export function getGameplayPlayedCardsRect(
  playCount: number,
): GameplayLayoutRect {
  if (!Number.isInteger(playCount) || playCount < 0 || playCount > 6) {
    throw new Error(`INVALID_GAMEPLAY_PLAY_COUNT:${playCount}`);
  }

  const card = GAMEPLAY_LAYOUT.playedCard;
  if (playCount === 0) {
    return { height: 0, width: 0, x: 0, y: card.baseY };
  }

  const centerOffset = (playCount - 1) / 2;
  const spacing =
    playCount === 1
      ? 0
      : Math.min(card.maxSpacing, card.maxSpread / (playCount - 1));
  const arcDrop = centerOffset * card.arcDropPerStep;

  return {
    height: card.height + arcDrop,
    width: card.width + spacing * (playCount - 1),
    x: 0,
    y: card.baseY - arcDrop / 2,
  };
}

export function getGameplayPlayedCardsVisualRect(
  playCount: number,
  winnerIndex: number | null,
): GameplayLayoutRect {
  if (!Number.isInteger(playCount) || playCount < 1 || playCount > 6) {
    throw new Error(`INVALID_GAMEPLAY_PLAY_COUNT:${playCount}`);
  }
  if (
    winnerIndex !== null &&
    (!Number.isInteger(winnerIndex) ||
      winnerIndex < 0 ||
      winnerIndex >= playCount)
  ) {
    throw new Error(`INVALID_GAMEPLAY_WINNER_INDEX:${winnerIndex}`);
  }

  const card = GAMEPLAY_LAYOUT.playedCard;
  const spacing =
    playCount === 1
      ? 0
      : Math.min(card.maxSpacing, card.maxSpread / (playCount - 1));
  const center = (playCount - 1) / 2;
  const rects = Array.from({ length: playCount }, (_, index) => {
    const offset = index - center;
    const winner = index === winnerIndex;
    return getRotatedRect(
      card.width + (winner ? card.winnerExtraWidth : 0),
      card.height + (winner ? card.winnerExtraHeight : 0),
      offset * spacing,
      card.baseY - Math.abs(offset) * card.arcDropPerStep,
      offset * card.anglePerStep,
    );
  });

  return unionRects(rects);
}

export function getGameplayLocalHandCardRect(
  selected: boolean,
): GameplayLayoutRect {
  const hand = GAMEPLAY_LAYOUT.localHand;
  return {
    height: hand.height,
    width: hand.width,
    x: 0,
    y: hand.baseY + (selected ? hand.selectedLift : 0),
  };
}

export function getGameplayLocalHandVisualRect(
  handCount: number,
  index: number,
  state: GameplayLocalHandVisualState,
): GameplayLayoutRect {
  if (!Number.isInteger(handCount) || handCount < 1 || handCount > 20) {
    throw new Error(`INVALID_GAMEPLAY_HAND_COUNT:${handCount}`);
  }
  if (!Number.isInteger(index) || index < 0 || index >= handCount) {
    throw new Error(`INVALID_GAMEPLAY_HAND_INDEX:${index}`);
  }

  const hand = GAMEPLAY_LAYOUT.localHand;
  const spacing =
    handCount === 1
      ? 0
      : Math.min(hand.maxSpacing, hand.maxSpread / (handCount - 1));
  const center = (handCount - 1) / 2;
  const offset = index - center;
  const decorated = state === "legal" || state === "selected";

  return getRotatedRect(
    hand.width + (decorated ? hand.effectExtraWidth : 0),
    hand.height + (decorated ? hand.effectExtraHeight : 0),
    offset * spacing,
    hand.baseY +
      Math.abs(offset) * hand.risePerStep +
      (state === "selected" ? hand.selectedLift : 0),
    offset * hand.anglePerStep,
  );
}

export function getGameplayLocalChoiceHandVisualRect(
  handCount: number,
  index: number,
): GameplayLayoutRect {
  if (!Number.isInteger(handCount) || handCount < 1 || handCount > 20) {
    throw new Error(`INVALID_GAMEPLAY_HAND_COUNT:${handCount}`);
  }
  if (!Number.isInteger(index) || index < 0 || index >= handCount) {
    throw new Error(`INVALID_GAMEPLAY_HAND_INDEX:${index}`);
  }

  const hand = GAMEPLAY_LAYOUT.localHand;
  const spacing =
    handCount === 1
      ? 0
      : Math.min(hand.choiceMaxSpacing, hand.maxSpread / (handCount - 1));
  const center = (handCount - 1) / 2;
  const offset = index - center;

  return getRotatedRect(
    hand.choiceWidth,
    hand.choiceHeight,
    offset * spacing,
    hand.baseY + Math.abs(offset) * hand.risePerStep,
    offset * hand.anglePerStep,
  );
}

export function getGameplayTrumpStatusRects(
  status: GameplayLayoutRect = GAMEPLAY_LAYOUT.trumpStatus,
): GameplayTrumpStatusRects {
  const offsetX = status.x - GAMEPLAY_LAYOUT.trumpStatus.x;
  const offsetY = status.y - GAMEPLAY_LAYOUT.trumpStatus.y;

  return {
    contentSafe: translateRect(
      GAMEPLAY_LAYOUT.trumpContentSafe,
      offsetX,
      offsetY,
    ),
    icon: translateRect(GAMEPLAY_LAYOUT.trumpIcon, offsetX, offsetY),
    label: translateRect(GAMEPLAY_LAYOUT.trumpLabel, offsetX, offsetY),
    status,
  };
}

export function getGameplayRightActionOccupant(
  canInteract: boolean,
  phase: string,
  isViewerTurn: boolean,
): GameplayRightActionOccupant {
  if (!canInteract || !isViewerTurn) {
    return null;
  }

  if (phase === "bid") {
    return "bid-trump-status";
  }

  if (phase === "trick-play") {
    return "turn-action";
  }

  return null;
}

export function getGameplayTurnActionLabelRect(): GameplayLayoutRect {
  const action = GAMEPLAY_LAYOUT.turnAction;
  const label = GAMEPLAY_LAYOUT.turnActionLabel;
  return {
    height: label.height,
    width: label.width,
    x: action.x + label.x,
    y: action.y + label.y,
  };
}

export function getTopSeatCardRect(): GameplayLayoutRect {
  return {
    ...GAMEPLAY_LAYOUT.topSeat.card,
    y: GAMEPLAY_LAYOUT.topSeat.y + GAMEPLAY_LAYOUT.topSeat.card.y,
  };
}

export function getTopSeatGlowRect(): GameplayLayoutRect {
  return {
    ...GAMEPLAY_LAYOUT.topSeat.currentGlow,
    y: GAMEPLAY_LAYOUT.topSeat.y + GAMEPLAY_LAYOUT.topSeat.currentGlow.y,
  };
}
