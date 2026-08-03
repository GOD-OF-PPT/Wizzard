import { describe, expect, it } from "vitest";
import {
  createHmacCounterRandomState,
  restoreHmacCounterRandom,
  withHmacCounterRandom,
} from "../src/random/index.js";

const FIXED_KEY = Uint8Array.from({ length: 32 }, (_, index) => index);

describe("SerializableHmacRandom", () => {
  it("continues the same secure stream after serialization", () => {
    const initial = createHmacCounterRandomState(FIXED_KEY);
    const uninterrupted = restoreHmacCounterRandom(initial);
    const expected = Array.from({ length: 6 }, () => uninterrupted.next());

    const firstProcess = restoreHmacCounterRandom(initial);
    const actual = [firstProcess.next(), firstProcess.next()];
    const restored = restoreHmacCounterRandom(
      JSON.parse(JSON.stringify(firstProcess.snapshot())),
    );
    actual.push(...Array.from({ length: 4 }, () => restored.next()));

    expect(actual).toEqual(expected);
    expect(actual.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(restored.snapshot().counter).toBe(6);
  });

  it("returns the consumed state alongside an atomic operation result", () => {
    const initial = createHmacCounterRandomState(FIXED_KEY);
    const transition = withHmacCounterRandom(initial, (random) => [
      random(),
      random(),
      random(),
    ]);

    expect(transition.result).toHaveLength(3);
    expect(transition.state.counter).toBe(3);
    expect(initial.counter).toBe(0);
  });

  it("rejects malformed keys and counters", () => {
    expect(() => createHmacCounterRandomState(new Uint8Array(31))).toThrow(
      "RANDOM_KEY_MUST_BE_32_BYTES",
    );
    expect(() =>
      restoreHmacCounterRandom({
        algorithm: "hmac-sha256-counter-v1",
        counter: -1,
        keyBase64: "invalid",
      }),
    ).toThrow("RANDOM_COUNTER_INVALID");
  });
});
