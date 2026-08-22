export type PatrolPrototypeRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export type PatrolPrototypePoint = Readonly<{
  x: number;
  y: number;
}>;

export type PatrolPrototypeRoute = "inner" | "outer";
export type PatrolPrototypeBridgeIndex = 0 | 1 | 2 | 3 | 4 | 5;

export type PatrolPrototypeEllipse = Readonly<{
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}>;

export type PatrolPrototypeRectEdges = Readonly<{
  bottom: number;
  left: number;
  right: number;
  top: number;
}>;

export type PatrolPrototypeBridgePlacement = Readonly<{
  center: PatrolPrototypePoint;
  index: PatrolPrototypeBridgeIndex;
  inner: PatrolPrototypePoint;
  length: number;
  outer: PatrolPrototypePoint;
  position: number;
  rotationDegrees: number;
}>;

export type PatrolPrototypeScaledSize = Readonly<{
  height: number;
  scale: number;
  width: number;
}>;

/**
 * Authored against art/mockups/patrol-gameplay-screen-v1.png at 1920 x 1080.
 * Coordinates use Cocos' centered design space: +x points right and +y points up.
 */
export const PATROL_PROTOTYPE_LAYOUT = {
  designViewport: { height: 1080, width: 1920, x: 0, y: 0 },
  background: { height: 1080, width: 1920, x: 0, y: 0 },
  topHudBand: { height: 210, width: 1920, x: 0, y: 435 },
  leftPlayerColumn: { height: 610, width: 220, x: -850, y: 15 },
  roundScroll: { height: 160, width: 300, x: -795, y: 445 },
  timer: { height: 200, width: 200, x: 0, y: 435 },
  targetHud: { height: 150, width: 500, x: 600, y: 455 },
  courseVisualBand: { height: 610, width: 1690, x: 115, y: 15 },
  controlRail: { height: 240, width: 1920, x: 0, y: -420 },
  returnHomeTouch: { height: 132, width: 152, x: -545, y: 445 },
  targetSelectionModal: { height: 520, width: 760, x: 40, y: 15 },
  resultsModal: { height: 720, width: 1180, x: 40, y: 0 },
} as const satisfies Readonly<Record<string, PatrolPrototypeRect>>;

// Only the portion of the native WeChat capsule that can overlap the authored
// 16:9 content is represented here; the rest sits in the ultra-wide side band.
export const PATROL_PROTOTYPE_WECHAT_CAPSULE_EXCLUSION = {
  height: 170,
  width: 80,
  x: 920,
  y: 455,
} as const satisfies PatrolPrototypeRect;

export const PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS = {
  decelerate: { height: 168, width: 400, x: -680, y: -420 },
  prepareSwitch: { height: 168, width: 430, x: -55, y: -420 },
  accelerate: { height: 168, width: 460, x: 640, y: -420 },
} as const satisfies Readonly<Record<string, PatrolPrototypeRect>>;

export const PATROL_PROTOTYPE_ROUTE_ELLIPSES = {
  inner: {
    centerX: 45,
    centerY: 5,
    radiusX: 480,
    radiusY: 190,
  },
  outer: {
    centerX: 45,
    centerY: 5,
    radiusX: 700,
    radiusY: 290,
  },
} as const satisfies Readonly<
  Record<PatrolPrototypeRoute, PatrolPrototypeEllipse>
>;

export const PATROL_PROTOTYPE_BRIDGE_POSITIONS = [
  0, 10, 20, 30, 40, 50,
] as const;

const FULL_ROUTE_POSITION = 60;

export function getPatrolPrototypeRectEdges(
  rect: PatrolPrototypeRect,
): PatrolPrototypeRectEdges {
  return {
    bottom: rect.y - rect.height / 2,
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y + rect.height / 2,
  };
}

export function isPatrolPrototypeRectInside(
  rect: PatrolPrototypeRect,
  container: PatrolPrototypeRect = PATROL_PROTOTYPE_LAYOUT.designViewport,
  inset = 0,
): boolean {
  if (!Number.isFinite(inset) || inset < 0) {
    throw new Error(`INVALID_PATROL_LAYOUT_INSET:${inset}`);
  }

  const rectEdges = getPatrolPrototypeRectEdges(rect);
  const containerEdges = getPatrolPrototypeRectEdges(container);
  return (
    rectEdges.left >= containerEdges.left + inset &&
    rectEdges.right <= containerEdges.right - inset &&
    rectEdges.bottom >= containerEdges.bottom + inset &&
    rectEdges.top <= containerEdges.top - inset
  );
}

export function arePatrolPrototypeRectsDisjoint(
  first: PatrolPrototypeRect,
  second: PatrolPrototypeRect,
  minimumGap = 0,
): boolean {
  if (!Number.isFinite(minimumGap) || minimumGap < 0) {
    throw new Error(`INVALID_PATROL_LAYOUT_GAP:${minimumGap}`);
  }

  const firstEdges = getPatrolPrototypeRectEdges(first);
  const secondEdges = getPatrolPrototypeRectEdges(second);
  return (
    firstEdges.right + minimumGap <= secondEdges.left ||
    secondEdges.right + minimumGap <= firstEdges.left ||
    firstEdges.top + minimumGap <= secondEdges.bottom ||
    secondEdges.top + minimumGap <= firstEdges.bottom
  );
}

export function getPatrolPrototypeViewportScale(
  viewportWidth: number,
  viewportHeight: number,
): number {
  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    throw new Error(
      `INVALID_PATROL_VIEWPORT:${viewportWidth}x${viewportHeight}`,
    );
  }

  const design = PATROL_PROTOTYPE_LAYOUT.designViewport;
  return Math.min(viewportWidth / design.width, viewportHeight / design.height);
}

/**
 * Cocos' FIXED_HEIGHT policy keeps the authored 1080 design-height even when
 * the host surface is narrower than 16:9. Scale the whole patrol composition
 * in that case so review-critical HUD and controls are letterboxed instead of
 * cropped. Wider landscape surfaces retain the authored 1:1 design scale.
 */
export function getPatrolPrototypeFixedHeightContentScale(
  frameWidth: number,
  frameHeight: number,
): number {
  if (
    !Number.isFinite(frameWidth) ||
    !Number.isFinite(frameHeight) ||
    frameWidth <= 0 ||
    frameHeight <= 0
  ) {
    throw new Error(`INVALID_PATROL_FRAME:${frameWidth}x${frameHeight}`);
  }

  const design = PATROL_PROTOTYPE_LAYOUT.designViewport;
  return Math.min(
    1,
    (frameWidth / frameHeight) / (design.width / design.height),
  );
}

export function getPatrolPrototypeScaledSize(
  rect: PatrolPrototypeRect,
  viewportWidth: number,
  viewportHeight: number,
): PatrolPrototypeScaledSize {
  const scale = getPatrolPrototypeViewportScale(viewportWidth, viewportHeight);
  return {
    height: rect.height * scale,
    scale,
    width: rect.width * scale,
  };
}

export function getPatrolPrototypeRoutePoint(
  route: PatrolPrototypeRoute,
  position: number,
): PatrolPrototypePoint {
  if (!Number.isFinite(position) || position < 0 || position > 60) {
    throw new Error(`INVALID_PATROL_ROUTE_POSITION:${position}`);
  }

  const ellipse = PATROL_PROTOTYPE_ROUTE_ELLIPSES[route];
  if (!ellipse) {
    throw new Error(`INVALID_PATROL_ROUTE:${String(route)}`);
  }

  // Position zero starts at the top bridge and proceeds clockwise. Position 60
  // closes the loop at the same authored coordinate as position zero.
  const angle =
    Math.PI / 2 - (position / FULL_ROUTE_POSITION) * Math.PI * 2;
  return {
    x: ellipse.centerX + ellipse.radiusX * Math.cos(angle),
    y: ellipse.centerY + ellipse.radiusY * Math.sin(angle),
  };
}

export function getPatrolPrototypeBridgePlacement(
  index: PatrolPrototypeBridgeIndex,
): PatrolPrototypeBridgePlacement {
  const position = PATROL_PROTOTYPE_BRIDGE_POSITIONS[index];
  if (position === undefined) {
    throw new Error(`INVALID_PATROL_BRIDGE_INDEX:${index}`);
  }

  const inner = getPatrolPrototypeRoutePoint("inner", position);
  const outer = getPatrolPrototypeRoutePoint("outer", position);
  const deltaX = outer.x - inner.x;
  const deltaY = outer.y - inner.y;
  return {
    center: {
      x: (inner.x + outer.x) / 2,
      y: (inner.y + outer.y) / 2,
    },
    index,
    inner,
    length: Math.hypot(deltaX, deltaY),
    outer,
    position,
    rotationDegrees: (Math.atan2(deltaY, deltaX) * 180) / Math.PI,
  };
}

export function getPatrolPrototypeBridgePlacements(): readonly PatrolPrototypeBridgePlacement[] {
  return PATROL_PROTOTYPE_BRIDGE_POSITIONS.map((_, index) =>
    getPatrolPrototypeBridgePlacement(index as PatrolPrototypeBridgeIndex),
  );
}
