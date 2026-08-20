import { afterEach, describe, expect, it, vi } from "vitest";

// Spy on planNextMatchAction so we can assert the adapter drives pacing through
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

// Static import is fine: vitest hoists vi.mock above all imports, so the
// adapter receives the mocked module. The /authority and /contracts subpaths
// are separate aliases and stay real.
import { createLocalMatchAdapter } from "../assets/scripts/adapters/MatchAdapterFactory";
import source from "../assets/scripts/adapters/LocalMatchAdapter.ts?raw";

describe("LocalMatchAdapter match-driver integration (VAL-MD-021)", () => {
  describe("source contract", () => {
    it("contains no hardcoded pacing constants", () => {
      expect(source).not.toMatch(/TURN_DURATION_SECONDS/);
      expect(source).not.toMatch(/AI_THINK_SECONDS/);
      expect(source).not.toMatch(/TRICK_RESULT_SECONDS/);
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
    });

    it("plans pacing via planNextMatchAction with a client MatchPacingConfig", () => {
      const adapter = createLocalMatchAdapter({ seedSource: () => 20260802 });
      adapter.start(() => {});

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

      adapter.dispose();
    });
  });
});
