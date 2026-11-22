import { describe, expect, it } from "vitest";
import layout from "../../art/runtime/web-v3/gameplay-seats-v1/layout-v2.json";
import { tableSlotForSeat } from "./table-seating";

describe.each(Object.entries(layout.profiles))("%s table", (_, profile) => {
  it.each([3, 4, 5, 6])("visits %i seats clockwise once, from every viewer", count => {
    for (let viewer = 0; viewer < count; viewer++) {
      const slots = Array.from({ length: count }, (_, seat) => tableSlotForSeat(count, viewer, seat));
      expect(slots[viewer]).toBe(0);
      expect(new Set(slots).size).toBe(count);
      const points = slots.map(slot => {
        const [x, y, w, h] = profile.seats.find(s => s.slot === slot)!.portrait;
        return { x: x + w / 2, y: y + h / 2 };
      });
      const cx = points.reduce((sum, p) => sum + p.x, 0) / count;
      const cy = points.reduce((sum, p) => sum + p.y, 0) / count;
      const angles = points.map(p => Math.atan2(p.y - cy, p.x - cx));
      const circle = 2 * Math.PI;
      const travel = angles.reduce((sum, angle, i) =>
        sum + ((angles[(i + 1) % count] - angle + circle) % circle), 0);
      expect(travel).toBeCloseTo(circle);
    }
  });
});
