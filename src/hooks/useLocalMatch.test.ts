import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Spy on planNextMatchAction so we can assert the hook drives pacing through
// the shared match-driver with a client MatchPacingConfig. vi.hoisted keeps
// the spy reference available inside the hoisted mock factory.
const { planSpy } = vi.hoisted(() => ({ planSpy: vi.fn() }));

vi.mock("@wizzard/game-core", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@wizzard/game-core");
  planSpy.mockImplementation(actual.planNextMatchAction);
  return {
    ...actual,
    planNextMatchAction: planSpy,
  };
});

// Static import is fine: vitest hoists vi.mock above all imports, so the hook
// receives the mocked module. The /authority and /contracts subpaths are
// separate aliases and stay real.
import { useLocalMatch } from "./useLocalMatch";
import source from "./useLocalMatch.ts?raw";

describe("useLocalMatch match-driver integration (VAL-MD-020)", () => {
  describe("source contract", () => {
    it("contains no hardcoded pacing literals", () => {
      expect(source).not.toMatch(/TURN_DURATION_SECONDS/);
      expect(source).not.toMatch(/420/);
      expect(source).not.toMatch(/1500/);
    });

    it("imports planNextMatchAction and executeMatchAction from the bare game-core specifier", () => {
      expect(source).toMatch(/planNextMatchAction/);
      expect(source).toMatch(/executeMatchAction/);
      expect(source).toMatch(/from "@wizzard\/game-core"/);
    });

    it("constructs a MatchPacingConfig with manual round-score advance", () => {
      expect(source).toMatch(/MatchPacingConfig/);
      expect(source).toMatch(/roundScoreDelayMs:\s*null/);
    });

    it("derives the countdown from the scheduled action dueAt", () => {
      expect(source).toMatch(/dueAt/);
    });
  });

  describe("runtime wiring", () => {
    afterEach(() => {
      planSpy.mockClear();
      vi.useRealTimers();
    });

    it("plans pacing via planNextMatchAction with a client MatchPacingConfig", () => {
      vi.useFakeTimers();
      const { unmount } = renderHook(() => useLocalMatch());

      expect(planSpy).toHaveBeenCalled();
      const [, , , config, options] = planSpy.mock.calls[0] as [
        unknown,
        unknown,
        unknown,
        { roundScoreDelayMs: number | null },
        { turnTimerEnabled: boolean },
      ];
      expect(config.roundScoreDelayMs).toBeNull();
      expect(options.turnTimerEnabled).toBe(true);

      unmount();
    });
  });
});
