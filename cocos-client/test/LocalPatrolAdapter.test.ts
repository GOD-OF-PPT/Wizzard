import { describe, expect, it } from "vitest";
import {
  LocalPatrolAdapter,
  type PatrolUpdate,
} from "../assets/scripts/adapters/LocalPatrolAdapter";

describe("LocalPatrolAdapter", () => {
  it("publishes the full initial patrol state and advances observation after five seconds", () => {
    const adapter = new LocalPatrolAdapter();
    const updates: PatrolUpdate[] = [];

    adapter.start((update) => updates.push(update));

    expect(updates.at(-1)).toMatchObject({
      events: [],
      observeSecondsRemaining: 5,
      state: {
        elapsedTicks: 0,
        phase: "observe",
        players: [
          { id: "traveler-you" },
          { id: "traveler-pine" },
          { id: "traveler-rain" },
        ],
      },
      targetSelectSecondsRemaining: null,
    });

    adapter.update(4.25);
    expect(updates.at(-1)).toMatchObject({
      observeSecondsRemaining: 1,
      state: { phase: "observe" },
    });

    adapter.update(0.75);
    expect(updates.at(-1)).toMatchObject({
      events: [{ phase: "target-select", type: "phase-changed" }],
      observeSecondsRemaining: null,
      state: { phase: "target-select" },
      targetSelectSecondsRemaining: 8,
    });
  });

  it("defaults the target after eight seconds and carries a long frame into patrol ticks", () => {
    const adapter = new LocalPatrolAdapter();
    const updates: PatrolUpdate[] = [];
    adapter.start((update) => updates.push(update));

    adapter.update(14);

    const latest = updates.at(-1);
    expect(latest?.state.phase).toBe("patrol");
    expect(latest?.state.elapsedTicks).toBe(1);
    expect(latest?.state.players.find((player) => player.isHuman)?.target).toBe(
      4,
    );
    expect(latest?.observeSecondsRemaining).toBeNull();
    expect(latest?.targetSelectSecondsRemaining).toBeNull();
    expect(latest?.events).toEqual(
      expect.arrayContaining([
        { phase: "target-select", type: "phase-changed" },
        {
          playerId: "traveler-you",
          target: 4,
          type: "target-selected",
        },
        { phase: "patrol", type: "phase-changed" },
        { elapsedTicks: 1, type: "tick-advanced" },
      ]),
    );
  });

  it("accepts target and movement controls only in their matching phases", () => {
    const adapter = new LocalPatrolAdapter();
    const updates: PatrolUpdate[] = [];
    adapter.start((update) => updates.push(update));

    adapter.fast();
    adapter.queueSwitch();
    adapter.slow();
    adapter.selectTarget(2);
    expect(updates).toHaveLength(1);

    adapter.update(5);
    adapter.fast();
    expect(updates).toHaveLength(2);

    adapter.selectTarget(2);
    expect(updates.at(-1)?.state.phase).toBe("patrol");
    expect(
      updates.at(-1)?.state.players.find((player) => player.isHuman),
    ).toMatchObject({
      id: "traveler-you",
      speed: "cruise",
      switchQueued: false,
      target: 2,
    });

    adapter.fast();
    expect(updates.at(-1)).toMatchObject({
      events: [
        {
          playerId: "traveler-you",
          speed: "fast",
          type: "speed-changed",
        },
      ],
    });
    expect(
      updates.at(-1)?.state.players.find((player) => player.isHuman)?.speed,
    ).toBe("fast");

    adapter.queueSwitch();
    expect(updates.at(-1)?.state.players[0].switchQueued).toBe(true);

    adapter.slow();
    expect(updates.at(-1)?.state.players[0].speed).toBe("cruise");

    const updateCount = updates.length;
    const version = updates.at(-1)?.state.version;
    adapter.selectTarget(5);
    expect(updates).toHaveLength(updateCount);
    expect(updates.at(-1)?.state.version).toBe(version);
  });

  it("produces the same state and core events for coarse and fine frame deltas", () => {
    const run = (deltas: readonly number[]) => {
      const adapter = new LocalPatrolAdapter();
      let latest: PatrolUpdate | null = null;
      const events: PatrolUpdate["events"][number][] = [];
      adapter.start((update) => {
        latest = update;
        events.push(...update.events);
      });

      for (const delta of deltas) {
        adapter.update(delta);
      }

      return { events, latest };
    };

    const coarse = run([17]);
    const fine = run(Array.from({ length: 170 }, () => 0.1));

    expect(coarse.latest?.state.elapsedTicks).toBe(4);
    expect(fine.latest?.state).toEqual(coarse.latest?.state);
    expect(fine.events).toEqual(coarse.events);
  });

  it("restarts from a fresh observation and ignores every call after disposal", () => {
    const adapter = new LocalPatrolAdapter();
    const updates: PatrolUpdate[] = [];
    adapter.start((update) => updates.push(update));
    adapter.update(17);

    expect(updates.at(-1)?.state.elapsedTicks).toBe(4);

    adapter.restart();
    expect(updates.at(-1)).toMatchObject({
      events: [],
      observeSecondsRemaining: 5,
      state: { elapsedTicks: 0, phase: "observe", version: 0 },
      targetSelectSecondsRemaining: null,
    });

    adapter.update(1);
    expect(updates.at(-1)?.observeSecondsRemaining).toBe(4);

    adapter.dispose();
    const updateCount = updates.length;
    adapter.update(100);
    adapter.selectTarget(4);
    adapter.slow();
    adapter.queueSwitch();
    adapter.fast();
    adapter.restart();
    adapter.start((update) => updates.push(update));

    expect(updates).toHaveLength(updateCount);
  });

  it("stops after exactly sixty patrol ticks and emits the final results", () => {
    const adapter = new LocalPatrolAdapter();
    const updates: PatrolUpdate[] = [];
    adapter.start((update) => updates.push(update));

    adapter.update(73);

    const latest = updates.at(-1);
    expect(latest?.state).toMatchObject({
      elapsedTicks: 60,
      phase: "results",
    });
    expect(
      latest?.events.filter((event) => event.type === "tick-advanced"),
    ).toHaveLength(60);
    expect(latest?.events.at(-1)?.type).toBe("patrol-completed");

    const updateCount = updates.length;
    adapter.update(10);
    expect(updates).toHaveLength(updateCount);
  });
});
