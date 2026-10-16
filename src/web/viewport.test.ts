import { describe, expect, it } from "vitest";
import { createViewportSnapshot, getViewportMode } from "./viewport";

describe("web viewport contract", () => {
  it("chooses portrait below the landscape aspect threshold", () => {
    expect(getViewportMode(390, 844)).toBe("portrait");
    expect(getViewportMode(844, 390)).toBe("landscape");
  });

  it("normalizes dimensions and keeps a stable layout snapshot", () => {
    const snapshot = createViewportSnapshot(1080, 1920, 3, true, false, 7);
    expect(snapshot).toMatchObject({
      cssHeight: 1920,
      cssWidth: 1080,
      devicePixelRatio: 3,
      mode: "portrait",
      reducedMotion: true,
      revision: 7,
      visible: false,
    });
    expect(snapshot.safeInsets).toEqual({ bottom: 0, left: 0, right: 0, top: 0 });
  });
});
