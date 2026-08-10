import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { MatchPhase } from "@wizzard/game-core/contracts";
import {
  GAMEPLAY_LAYOUT,
  getGameplaySeatCoreRect,
  getPracticeHomeActionPlacement,
  type GameplayLayoutRect,
} from "../assets/scripts/views/GameplayLayout";
import { ROUND_RESULTS_LAYOUT } from "../assets/scripts/views/RoundResultsLayout";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));

const top = (rect: GameplayLayoutRect): number => rect.y + rect.height / 2;
const bottom = (rect: GameplayLayoutRect): number => rect.y - rect.height / 2;
const left = (rect: GameplayLayoutRect): number => rect.x - rect.width / 2;
const right = (rect: GameplayLayoutRect): number => rect.x + rect.width / 2;
const rectSeparation = (
  first: GameplayLayoutRect,
  second: GameplayLayoutRect,
): number =>
  Math.max(
    left(second) - right(first),
    left(first) - right(second),
    bottom(second) - top(first),
    bottom(first) - top(second),
  );

describe("WeChat Mini Game practice home navigation", () => {
  it("wires a practice-only return-home action through the bootstrap owner", async () => {
    const source = await readFile(
      resolve(TEST_DIRECTORY, "../assets/scripts/bootstrap/GameBootstrap.ts"),
      "utf8",
    );

    expect(source).toContain("? () => this.returnPracticeToHome()");
    expect(source).toContain("private returnPracticeToHome(): void");
    expect(source).toContain('this.activeSurface !== "practice"');
    expect(source).toContain('this.activeSurface = "boot"');
    expect(source).toContain("this.startFriendRoomFlow(false)");

    const networkStart = source.indexOf("private startNetworkMatch(): void");
    const practiceStart = source.indexOf("private startPractice(): void");
    expect(networkStart).toBeGreaterThanOrEqual(0);
    expect(practiceStart).toBeGreaterThan(networkStart);
    expect(source.slice(networkStart, practiceStart)).not.toContain(
      "onReturnHome",
    );
  });

  it("renders distinct return-home entries during play and on the final results", async () => {
    const source = await readFile(
      resolve(TEST_DIRECTORY, "../assets/scripts/views/MatchSceneView.ts"),
      "utf8",
    );

    expect(source).toContain("renderPracticeHomeAction");
    expect(source.match(/"返回首页"/gu)).toHaveLength(2);
    expect(source).toContain("ROUND_RESULTS_LAYOUT.footer.secondaryButton");
  });

  it("keeps the in-play action in the top-left safe gap", () => {
    expect(GAMEPLAY_LAYOUT.practiceHomeAction).toEqual({
      height: 60,
      width: 144,
      x: -670,
      y: 480,
    });

    const touch = GAMEPLAY_LAYOUT.practiceHomeTouch;
    const viewport = GAMEPLAY_LAYOUT.designViewport;
    expect(left(touch)).toBeGreaterThanOrEqual(left(viewport) + 12);
    expect(right(touch)).toBeLessThanOrEqual(right(viewport) - 12);
    expect(top(touch)).toBeLessThanOrEqual(top(viewport));
    expect(bottom(touch)).toBeGreaterThanOrEqual(bottom(viewport) + 12);
    expect(
      rectSeparation(touch, GAMEPLAY_LAYOUT.roundHeader),
    ).toBeGreaterThanOrEqual(8);
    expect(rectSeparation(touch, getGameplaySeatCoreRect(2))).toBeGreaterThanOrEqual(
      8,
    );
    expect(
      bottom(GAMEPLAY_LAYOUT.practiceHomeAction) -
        top(ROUND_RESULTS_LAYOUT.panel),
    ).toBeGreaterThanOrEqual(8);
  });

  it("uses the floating entry for every active phase and the footer at match end", () => {
    const activePhases: MatchPhase[] = [
      "trump-select",
      "bid",
      "trick-play",
      "trick-result",
      "round-score",
    ];

    for (const phase of activePhases) {
      expect(getPracticeHomeActionPlacement(phase, true)).toBe("floating");
    }
    expect(getPracticeHomeActionPlacement("match-end", true)).toBe(
      "results-footer",
    );
    for (const phase of [...activePhases, "match-end"] as MatchPhase[]) {
      expect(getPracticeHomeActionPlacement(phase, false)).toBeNull();
    }
  });
});
