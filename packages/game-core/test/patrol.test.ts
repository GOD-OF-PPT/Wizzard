import { describe, expect, it } from "vitest";
import {
  applyPatrolIntent,
  createPatrolPrototype,
  scorePatrolTarget,
} from "@wizzard/game-core";

describe("tea-spirit patrol prototype", () => {
  it("scores exact targets at +20 and misses at -5 per absolute difference", () => {
    expect(scorePatrolTarget(4, 4)).toBe(20);
    expect(scorePatrolTarget(4, 2)).toBe(-10);
    expect(scorePatrolTarget(4, 7)).toBe(-15);
  });

  it("starts a deterministic three-traveler observation and enters target selection", () => {
    const initial = createPatrolPrototype();

    expect(initial.phase).toBe("observe");
    expect(initial.players).toHaveLength(3);
    expect(initial.players.filter((player) => player.isHuman)).toHaveLength(1);
    expect(new Set(initial.players.map((player) => player.route))).toEqual(
      new Set(["inner", "outer"]),
    );
    expect(initial.bridges).toHaveLength(6);
    expect(new Set(initial.spirits.map((spirit) => spirit.kind))).toEqual(
      new Set(["tea-spirit"]),
    );

    const transition = applyPatrolIntent(initial, { type: "finish-observe" });

    expect(transition.state.phase).toBe("target-select");
    expect(transition.state.version).toBe(1);
    expect(transition.events).toEqual([
      { phase: "target-select", type: "phase-changed" },
    ]);
    expect(initial.phase).toBe("observe");
  });

  it("starts simultaneous patrol after the human selects an exact target", () => {
    const observed = applyPatrolIntent(createPatrolPrototype(), {
      type: "finish-observe",
    }).state;
    const transition = applyPatrolIntent(observed, {
      target: 4,
      type: "select-target",
    });

    expect(transition.state.phase).toBe("patrol");
    expect(transition.state.players.map((player) => player.target)).toEqual([
      4, 4, 5,
    ]);
    expect(transition.events).toEqual([
      { playerId: "traveler-you", target: 4, type: "target-selected" },
      { playerId: "traveler-pine", target: 4, type: "target-selected" },
      { playerId: "traveler-rain", target: 5, type: "target-selected" },
      { phase: "patrol", type: "phase-changed" },
    ]);
  });

  it("changes speed by one level and toggles a next-bridge route switch", () => {
    const targetSelection = applyPatrolIntent(
      applyPatrolIntent(createPatrolPrototype(), {
        type: "finish-observe",
      }).state,
      { target: 4, type: "select-target" },
    ).state;

    const accelerated = applyPatrolIntent(targetSelection, { type: "fast" });
    const queued = applyPatrolIntent(accelerated.state, {
      type: "queue-switch",
    });
    const cancelled = applyPatrolIntent(queued.state, {
      type: "queue-switch",
    });
    const slowed = applyPatrolIntent(cancelled.state, { type: "slow" });

    expect(accelerated.state.players[0].speed).toBe("fast");
    expect(accelerated.events).toEqual([
      {
        playerId: "traveler-you",
        speed: "fast",
        type: "speed-changed",
      },
    ]);
    expect(queued.state.players[0].switchQueued).toBe(true);
    expect(queued.events).toEqual([
      {
        playerId: "traveler-you",
        queued: true,
        type: "route-switch-queued",
      },
    ]);
    expect(cancelled.state.players[0].switchQueued).toBe(false);
    expect(slowed.state.players[0].speed).toBe("cruise");
    expect(targetSelection.players[0].speed).toBe("cruise");
  });

  it("advances simultaneous movement only through ticks and switches at the next bridge", () => {
    let state = applyPatrolIntent(
      applyPatrolIntent(createPatrolPrototype(), {
        type: "finish-observe",
      }).state,
      { target: 4, type: "select-target" },
    ).state;
    state = applyPatrolIntent(state, { type: "fast" }).state;
    state = applyPatrolIntent(state, { type: "queue-switch" }).state;
    let seventhTickEvents = [] as ReturnType<
      typeof applyPatrolIntent
    >["events"];

    for (let tick = 0; tick < 7; tick += 1) {
      const transition = applyPatrolIntent(state, { type: "tick" });
      state = transition.state;
      seventhTickEvents = transition.events;
    }

    expect(state.elapsedTicks).toBe(7);
    expect(state.players[0]).toMatchObject({
      position: 10.5,
      route: "inner",
      switchQueued: false,
    });
    expect(seventhTickEvents).toContainEqual({
      bridge: 10,
      playerId: "traveler-you",
      route: "inner",
      type: "route-switched",
    });
  });

  it("awards a tea spirit to the first simultaneous crossing, not processing order", () => {
    let state = applyPatrolIntent(
      applyPatrolIntent(createPatrolPrototype(), {
        type: "finish-observe",
      }).state,
      { target: 4, type: "select-target" },
    ).state;
    let thirdTickEvents = [] as ReturnType<
      typeof applyPatrolIntent
    >["events"];

    for (let tick = 0; tick < 3; tick += 1) {
      const transition = applyPatrolIntent(state, { type: "tick" });
      state = transition.state;
      thirdTickEvents = transition.events;
    }

    const contestedSpirit = state.spirits.find(
      (spirit) => spirit.route === "outer" && spirit.position === 3,
    );

    expect(state.players.map((player) => player.speed)).toEqual([
      "cruise",
      "fast",
      "fast",
    ]);
    expect(contestedSpirit?.collectedBy).toBe("traveler-rain");
    expect(contestedSpirit?.collectedAt).toBeCloseTo(8 / 3);
    expect(state.players[0].collectedSpiritIds).not.toContain(
      contestedSpirit?.id,
    );
    expect(thirdTickEvents).toContainEqual({
      collectedAt: expect.closeTo(8 / 3),
      playerId: "traveler-rain",
      spiritId: contestedSpirit?.id,
      type: "spirit-collected",
    });
  });

  it("ends after exactly sixty tick intents and scores every traveler", () => {
    let state = applyPatrolIntent(
      applyPatrolIntent(createPatrolPrototype(), {
        type: "finish-observe",
      }).state,
      { target: 3, type: "select-target" },
    ).state;
    let finalEvents = [] as ReturnType<
      typeof applyPatrolIntent
    >["events"];

    for (let tick = 0; tick < 60; tick += 1) {
      const transition = applyPatrolIntent(state, { type: "tick" });
      state = transition.state;
      finalEvents = transition.events;
    }

    expect(state.phase).toBe("results");
    expect(state.elapsedTicks).toBe(60);
    expect(state.results).toEqual([
      {
        actual: 3,
        difference: 0,
        playerId: "traveler-you",
        score: 20,
        target: 3,
      },
      {
        actual: 5,
        difference: 1,
        playerId: "traveler-pine",
        score: -5,
        target: 4,
      },
      {
        actual: 6,
        difference: 1,
        playerId: "traveler-rain",
        score: -5,
        target: 5,
      },
    ]);

    for (const result of state.results) {
      expect(result.difference).toBe(result.actual - result.target);
      expect(result.score).toBe(
        scorePatrolTarget(result.target, result.actual),
      );
      expect(
        state.players.find((player) => player.id === result.playerId)?.score,
      ).toBe(result.score);
    }

    expect(finalEvents).toContainEqual({
      phase: "results",
      type: "phase-changed",
    });
    expect(finalEvents).toContainEqual({
      results: state.results,
      type: "patrol-completed",
    });

    const extraTick = applyPatrolIntent(state, { type: "tick" });

    expect(extraTick.state).toBe(state);
    expect(extraTick.events).toEqual([
      {
        code: "WRONG_PHASE",
        intentType: "tick",
        type: "intent-rejected",
      },
    ]);
  });

  it("rejects a non-integer target without changing target-selection state", () => {
    const targetSelection = applyPatrolIntent(createPatrolPrototype(), {
      type: "finish-observe",
    }).state;
    const transition = applyPatrolIntent(targetSelection, {
      target: 3.5,
      type: "select-target",
    });

    expect(transition.state).toBe(targetSelection);
    expect(transition.events).toEqual([
      {
        code: "INVALID_TARGET",
        intentType: "select-target",
        type: "intent-rejected",
      },
    ]);
  });
});
