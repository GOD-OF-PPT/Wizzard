import { describe, expect, it } from "vitest";
import {
  PATROL_PROTOTYPE_BRIDGE_POSITIONS,
  PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS,
  PATROL_PROTOTYPE_LAYOUT,
  PATROL_PROTOTYPE_WECHAT_CAPSULE_EXCLUSION,
  arePatrolPrototypeRectsDisjoint,
  getPatrolPrototypeBridgePlacements,
  getPatrolPrototypeFixedHeightContentScale,
  getPatrolPrototypeRectEdges,
  getPatrolPrototypeRoutePoint,
  getPatrolPrototypeScaledSize,
  isPatrolPrototypeRectInside,
  type PatrolPrototypeRect,
} from "../assets/scripts/views/PatrolPrototypeLayout";

const distance = (
  first: Readonly<{ x: number; y: number }>,
  second: Readonly<{ x: number; y: number }>,
): number => Math.hypot(second.x - first.x, second.y - first.y);

function expectInsideViewport(rect: PatrolPrototypeRect): void {
  expect(
    isPatrolPrototypeRectInside(
      rect,
      PATROL_PROTOTYPE_LAYOUT.designViewport,
    ),
  ).toBe(true);
}

describe("local patrol prototype layout", () => {
  it("contains the full 16:9 composition on narrower landscape frames", () => {
    expect(getPatrolPrototypeFixedHeightContentScale(1683, 1080)).toBeCloseTo(
      1683 / 1920,
    );
    expect(getPatrolPrototypeFixedHeightContentScale(1334, 750)).toBe(1);
    expect(getPatrolPrototypeFixedHeightContentScale(2560, 1080)).toBe(1);
  });

  it("keeps every authored screen region inside the 1920 x 1080 design viewport", () => {
    expect(PATROL_PROTOTYPE_LAYOUT.designViewport).toEqual({
      height: 1080,
      width: 1920,
      x: 0,
      y: 0,
    });
    expect(PATROL_PROTOTYPE_LAYOUT.background).toEqual(
      PATROL_PROTOTYPE_LAYOUT.designViewport,
    );

    Object.values(PATROL_PROTOTYPE_LAYOUT).forEach(expectInsideViewport);
    Object.values(PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS).forEach(
      expectInsideViewport,
    );

    expect(
      isPatrolPrototypeRectInside(
        PATROL_PROTOTYPE_LAYOUT.roundScroll,
        PATROL_PROTOTYPE_LAYOUT.topHudBand,
      ),
    ).toBe(true);
    expect(
      isPatrolPrototypeRectInside(
        PATROL_PROTOTYPE_LAYOUT.timer,
        PATROL_PROTOTYPE_LAYOUT.topHudBand,
      ),
    ).toBe(true);
    expect(
      isPatrolPrototypeRectInside(
        PATROL_PROTOTYPE_LAYOUT.targetHud,
        PATROL_PROTOTYPE_LAYOUT.topHudBand,
      ),
    ).toBe(true);
    expect(
      isPatrolPrototypeRectInside(
        PATROL_PROTOTYPE_LAYOUT.returnHomeTouch,
        PATROL_PROTOTYPE_LAYOUT.topHudBand,
      ),
    ).toBe(true);
    Object.values(PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS).forEach((target) => {
      expect(
        isPatrolPrototypeRectInside(
          target,
          PATROL_PROTOTYPE_LAYOUT.controlRail,
        ),
      ).toBe(true);
    });
  });

  it("keeps the persistent HUD, portrait, course, and control bands disjoint", () => {
    const persistentBands = [
      PATROL_PROTOTYPE_LAYOUT.topHudBand,
      PATROL_PROTOTYPE_LAYOUT.leftPlayerColumn,
      PATROL_PROTOTYPE_LAYOUT.courseVisualBand,
      PATROL_PROTOTYPE_LAYOUT.controlRail,
    ];

    for (let first = 0; first < persistentBands.length; first += 1) {
      for (let second = first + 1; second < persistentBands.length; second += 1) {
        expect(
          arePatrolPrototypeRectsDisjoint(
            persistentBands[first],
            persistentBands[second],
            10,
          ),
        ).toBe(true);
      }
    }

    expect(
      arePatrolPrototypeRectsDisjoint(
        PATROL_PROTOTYPE_LAYOUT.returnHomeTouch,
        PATROL_PROTOTYPE_LAYOUT.roundScroll,
        24,
      ),
    ).toBe(true);
    expect(
      arePatrolPrototypeRectsDisjoint(
        PATROL_PROTOTYPE_LAYOUT.returnHomeTouch,
        PATROL_PROTOTYPE_LAYOUT.courseVisualBand,
        10,
      ),
    ).toBe(true);
    expect(
      arePatrolPrototypeRectsDisjoint(
        PATROL_PROTOTYPE_LAYOUT.returnHomeTouch,
        PATROL_PROTOTYPE_LAYOUT.controlRail,
        10,
      ),
    ).toBe(true);
    expect(
      arePatrolPrototypeRectsDisjoint(
        PATROL_PROTOTYPE_LAYOUT.targetHud,
        PATROL_PROTOTYPE_WECHAT_CAPSULE_EXCLUSION,
        24,
      ),
    ).toBe(true);
  });

  it("provides three expanded, disjoint touch targets aligned to the control rail", () => {
    const targets = Object.values(PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS);
    expect(targets).toHaveLength(3);

    for (let first = 0; first < targets.length; first += 1) {
      expect(targets[first].y).toBe(
        PATROL_PROTOTYPE_LAYOUT.controlRail.y,
      );
      for (let second = first + 1; second < targets.length; second += 1) {
        expect(
          arePatrolPrototypeRectsDisjoint(targets[first], targets[second], 24),
        ).toBe(true);
      }
    }
  });

  it("maps both continuous routes onto separated baked ellipses", () => {
    const courseEdges = getPatrolPrototypeRectEdges(
      PATROL_PROTOTYPE_LAYOUT.courseVisualBand,
    );

    for (let position = 0; position <= 60; position += 1) {
      const inner = getPatrolPrototypeRoutePoint("inner", position);
      const outer = getPatrolPrototypeRoutePoint("outer", position);

      for (const point of [inner, outer]) {
        expect(point.x).toBeGreaterThanOrEqual(courseEdges.left);
        expect(point.x).toBeLessThanOrEqual(courseEdges.right);
        expect(point.y).toBeGreaterThanOrEqual(courseEdges.bottom);
        expect(point.y).toBeLessThanOrEqual(courseEdges.top);
      }
      expect(distance(inner, outer)).toBeGreaterThanOrEqual(100);
    }

    expect(getPatrolPrototypeRoutePoint("inner", 60)).toEqual(
      expect.objectContaining({
        x: expect.closeTo(getPatrolPrototypeRoutePoint("inner", 0).x, 10),
        y: expect.closeTo(getPatrolPrototypeRoutePoint("inner", 0).y, 10),
      }),
    );
    expect(getPatrolPrototypeRoutePoint("outer", 60)).toEqual(
      expect.objectContaining({
        x: expect.closeTo(getPatrolPrototypeRoutePoint("outer", 0).x, 10),
        y: expect.closeTo(getPatrolPrototypeRoutePoint("outer", 0).y, 10),
      }),
    );
  });

  it("places exactly six bridge gates between matching route positions", () => {
    const bridges = getPatrolPrototypeBridgePlacements();
    expect(PATROL_PROTOTYPE_BRIDGE_POSITIONS).toEqual([
      0, 10, 20, 30, 40, 50,
    ]);
    expect(bridges).toHaveLength(6);
    expect(new Set(bridges.map((bridge) => bridge.position)).size).toBe(6);

    bridges.forEach((bridge, index) => {
      expect(bridge.index).toBe(index);
      expect(bridge.position).toBe(PATROL_PROTOTYPE_BRIDGE_POSITIONS[index]);
      expect(bridge.inner).toEqual(
        getPatrolPrototypeRoutePoint("inner", bridge.position),
      );
      expect(bridge.outer).toEqual(
        getPatrolPrototypeRoutePoint("outer", bridge.position),
      );
      expect(bridge.center.x).toBeCloseTo(
        (bridge.inner.x + bridge.outer.x) / 2,
        10,
      );
      expect(bridge.center.y).toBeCloseTo(
        (bridge.inner.y + bridge.outer.y) / 2,
        10,
      );
      expect(bridge.length).toBeCloseTo(
        distance(bridge.inner, bridge.outer),
        10,
      );
      expect(bridge.length).toBeGreaterThanOrEqual(100);
    });
  });

  it("keeps every persistent touch target at least 44 CSS px at 847 x 402", () => {
    const targets = [
      PATROL_PROTOTYPE_LAYOUT.returnHomeTouch,
      ...Object.values(PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS),
    ];

    targets.forEach((target) => {
      const scaled = getPatrolPrototypeScaledSize(target, 847, 402);
      expect(scaled.width).toBeGreaterThanOrEqual(44);
      expect(scaled.height).toBeGreaterThanOrEqual(44);
    });
  });

  it("rejects positions and safe-bound parameters outside the layout contract", () => {
    expect(() => getPatrolPrototypeRoutePoint("inner", -1)).toThrow(
      "INVALID_PATROL_ROUTE_POSITION:-1",
    );
    expect(() => getPatrolPrototypeRoutePoint("outer", 61)).toThrow(
      "INVALID_PATROL_ROUTE_POSITION:61",
    );
    expect(() =>
      isPatrolPrototypeRectInside(
        PATROL_PROTOTYPE_LAYOUT.timer,
        PATROL_PROTOTYPE_LAYOUT.designViewport,
        -1,
      ),
    ).toThrow("INVALID_PATROL_LAYOUT_INSET:-1");
    expect(() =>
      arePatrolPrototypeRectsDisjoint(
        PATROL_PROTOTYPE_LAYOUT.timer,
        PATROL_PROTOTYPE_LAYOUT.targetHud,
        -1,
      ),
    ).toThrow("INVALID_PATROL_LAYOUT_GAP:-1");
    expect(() => getPatrolPrototypeScaledSize(
      PATROL_PROTOTYPE_LAYOUT.returnHomeTouch,
      0,
      402,
    )).toThrow("INVALID_PATROL_VIEWPORT:0x402");
  });
});
