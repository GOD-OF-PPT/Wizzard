import { act, renderHook } from "@testing-library/react";
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
import { createWebPracticeSession } from "../web/practice-session";

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

    it("creates a fresh runtime session and visible opening on restart", () => {
      vi.useFakeTimers();
      const { result, unmount } = renderHook(() => useLocalMatch());
      const initial = result.current.snapshot;
      act(() => result.current.restart());
      expect(result.current.snapshot.publicState.matchId).not.toBe(initial.publicState.matchId);
      expect(result.current.snapshot.privateState.hand).not.toEqual(initial.privateState.hand);
      expect(result.current.snapshot.publicState.roundIndex).toBe(0);
      expect(result.current.events).toEqual([]);
      unmount();
    });

    it("keeps an explicitly injected replay deterministic across restarts", () => {
      vi.useFakeTimers();
      const seedSource = () => 1;
      const { result, unmount } = renderHook(() => useLocalMatch({ seedSource }));
      const initial = result.current.snapshot;
      act(() => result.current.restart());
      expect(result.current.snapshot).toEqual(initial);
      unmount();
    });

    it("does not consume another session seed on ordinary rerenders", () => {
      vi.useFakeTimers();
      const seedSource = vi.fn(() => 1);
      const { result, rerender, unmount } = renderHook(() => useLocalMatch({ seedSource }));
      const initial = result.current.snapshot;
      rerender();
      expect(seedSource).toHaveBeenCalledTimes(1);
      expect(result.current.snapshot).toBe(initial);
      unmount();
    });

    it("bounds an opted-in repeat guard when a supplied seed never changes", () => {
      vi.useFakeTimers();
      const seedSource = vi.fn(() => 1);
      const { result, unmount } = renderHook(() => useLocalMatch({ seedSource, avoidImmediateOpeningRepeat: true }));
      act(() => result.current.restart());
      expect(seedSource).toHaveBeenCalledTimes(17);
      expect(result.current.snapshot.privateState.hand).toHaveLength(1);
      unmount();
    });

    it("treats different physical special-card copies as one visible face", () => {
      const players = ["human", "a", "b"].map(id => ({ id, name:id, avatarKey:"bamboo-cat", isHuman:id === "human" }));
      const special = new Map<string, number>();
      let firstSeed: number | undefined, secondSeed: number | undefined, otherSeed: number | undefined;
      for (let seed = 0; seed < 1000 && (secondSeed === undefined || otherSeed === undefined); seed++) {
        const card = createWebPracticeSession(players, "human", { seedSource: () => seed }).state.hands.human[0];
        if (card.kind === "number") otherSeed ??= seed;
        if (card.kind !== "highest") continue;
        if (special.size && !special.has(card.id)) { firstSeed = special.values().next().value; secondSeed = seed; }
        special.set(card.id, seed);
      }
      expect(firstSeed).toBeDefined(); expect(secondSeed).toBeDefined(); expect(otherSeed).toBeDefined();
      const seeds = [firstSeed!, secondSeed!, otherSeed!];
      const seedSource = vi.fn(() => seeds.shift() ?? otherSeed!);
      const initial = createWebPracticeSession(players, "human", { seedSource, avoidImmediateOpeningRepeat:true });
      initial.commitOpening();
      const next = createWebPracticeSession(players, "human", { seedSource, avoidImmediateOpeningRepeat:true });
      expect(next.state.hands.human[0].kind).toBe("number");
      expect(seedSource).toHaveBeenCalledTimes(3);
    });
  });
});
