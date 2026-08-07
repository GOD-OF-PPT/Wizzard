import { describe, expect, it, vi } from "vitest";
import { createLocalMatchAdapter } from "../assets/scripts/adapters/MatchAdapterFactory";
import { createPracticeSeedSource } from "../assets/scripts/adapters/LocalMatchAdapter";
import type {
  IMatchAdapter,
  MatchUpdate,
} from "../assets/scripts/adapters/IMatchAdapter";

function getOpeningHand(adapter: IMatchAdapter): string[] {
  let hand: string[] = [];
  adapter.start((update) => {
    hand = update.snapshot.privateState.hand.map((card) => card.id);
  });
  adapter.dispose();
  return hand;
}

describe("LocalMatchAdapter", () => {
  it("deals a different opening hand for each fresh practice session", () => {
    const seeds = [20260802, 20260803];
    const seedSource = vi.fn(() => {
      const seed = seeds.shift();
      if (seed === undefined) {
        throw new Error("PRACTICE_SEED_EXHAUSTED");
      }
      return seed;
    });

    const firstHand = getOpeningHand(createLocalMatchAdapter({ seedSource }));
    const secondHand = getOpeningHand(createLocalMatchAdapter({ seedSource }));

    expect(firstHand).toEqual(["number:leaf:11"]);
    expect(secondHand).toEqual(["number:sun:3"]);
    expect(secondHand).not.toEqual(firstHand);
    expect(seedSource).toHaveBeenCalledTimes(2);
  });

  it("keeps runtime practice seeds unique when time and entropy repeat", () => {
    const seedSource = createPracticeSeedSource(
      () => 1_700_000_000_000,
      () => 0.25,
    );
    const seeds = Array.from({ length: 4096 }, () => seedSource());

    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it("does not let changing entropy cancel the practice seed sequence", () => {
    const entropyWords = [0, 0xa2598acb];
    const clock = vi.fn(() => 0);
    const entropy = vi.fn(() => {
      const word = entropyWords.shift();
      if (word === undefined) {
        throw new Error("PRACTICE_ENTROPY_EXHAUSTED");
      }
      return word / 0x1_0000_0000;
    });
    const seedSource = createPracticeSeedSource(clock, entropy);

    const firstSeed = seedSource();
    const secondSeed = seedSource();

    expect(secondSeed).not.toBe(firstSeed);
    expect(clock).toHaveBeenCalledTimes(1);
    expect(entropy).toHaveBeenCalledTimes(1);
  });

  it("rerolls a fresh practice session when its opening hand repeats", () => {
    const seeds = [1, 11, 2];
    const seedSource = vi.fn(() => {
      const seed = seeds.shift();
      if (seed === undefined) {
        throw new Error("PRACTICE_SEED_EXHAUSTED");
      }
      return seed;
    });
    const options = {
      avoidImmediateOpeningRepeat: true,
      seedSource,
    };

    const firstHand = getOpeningHand(createLocalMatchAdapter(options));
    const secondHand = getOpeningHand(createLocalMatchAdapter(options));

    expect(firstHand).toEqual(["number:leaf:10"]);
    expect(secondHand).toEqual(["number:mountain:4"]);
    expect(secondHand).not.toEqual(firstHand);
    expect(seedSource).toHaveBeenCalledTimes(3);
  });

  it("uses the next practice seed when starting a local rematch", () => {
    const seeds = [20260802, 20260803];
    const adapter = createLocalMatchAdapter({
      seedSource: () => {
        const seed = seeds.shift();
        if (seed === undefined) {
          throw new Error("PRACTICE_SEED_EXHAUSTED");
        }
        return seed;
      },
    });
    let latestHand: string[] = [];
    adapter.start((update) => {
      latestHand = update.snapshot.privateState.hand.map((card) => card.id);
    });
    const firstHand = [...latestHand];

    adapter.requestRematch();
    const rematchHand = [...latestHand];

    expect(firstHand).toEqual(["number:leaf:11"]);
    expect(rematchHand).toEqual(["number:sun:3"]);
    expect(rematchHand).not.toEqual(firstHand);
    adapter.dispose();
  });

  it("rerolls an immediately repeated opening hand on local rematch", () => {
    const seeds = [1, 11, 2];
    const seedSource = vi.fn(() => {
      const seed = seeds.shift();
      if (seed === undefined) {
        throw new Error("PRACTICE_SEED_EXHAUSTED");
      }
      return seed;
    });
    const adapter = createLocalMatchAdapter({
      avoidImmediateOpeningRepeat: true,
      seedSource,
    });
    let latestHand: string[] = [];
    adapter.start((update) => {
      latestHand = update.snapshot.privateState.hand.map((card) => card.id);
    });
    const firstHand = [...latestHand];

    adapter.requestRematch();

    expect(firstHand).toEqual(["number:leaf:10"]);
    expect(latestHand).toEqual(["number:mountain:4"]);
    expect(seedSource).toHaveBeenCalledTimes(3);
    adapter.dispose();
  });

  it("allows a fixed seed source for deterministic replay", () => {
    const seedSource = vi.fn(() => 20260802);
    const firstHand = getOpeningHand(
      createLocalMatchAdapter({ seedSource }),
    );
    const replayHand = getOpeningHand(
      createLocalMatchAdapter({ seedSource }),
    );

    expect(replayHand).toEqual(firstHand);
    expect(seedSource).toHaveBeenCalledTimes(2);
  });

  it("drives a complete private-snapshot quick match through the Cocos seam", () => {
    const adapter = createLocalMatchAdapter({
      seedSource: () => 20260802,
    });
    let latest: MatchUpdate | null = null;
    const eventTypes: string[] = [];

    adapter.start((update) => {
      latest = update;
      eventTypes.push(...update.events.map((event) => event.type));
    });

    for (let guard = 0; guard < 4000; guard += 1) {
      if (!latest) {
        throw new Error("MATCH_UPDATE_NOT_EMITTED");
      }

      const snapshot = latest.snapshot;
      const state = snapshot.publicState;

      expect("hands" in state).toBe(false);

      if (state.phase === "match-end") {
        expect(state.roundIndex).toBe(7);
        expect(eventTypes).toContain("match-ended");
        adapter.dispose();
        return;
      }

      if (state.phase === "round-score") {
        adapter.requestContinueRound();
        continue;
      }

      if (state.phase === "trick-result") {
        adapter.update(2);
        continue;
      }

      if (state.currentPlayerId !== snapshot.privateState.playerId) {
        adapter.update(1);
        continue;
      }

      if (state.phase === "trump-select") {
        adapter.submitIntent({ trump: "mountain", type: "choose-trump" });
        continue;
      }

      if (state.phase === "bid") {
        adapter.submitIntent({ bid: 0, type: "submit-bid" });
        continue;
      }

      const cardId = snapshot.privateState.legalCardIds[0];
      if (!cardId) {
        throw new Error("LEGAL_CARD_NOT_FOUND");
      }
      adapter.submitIntent({ cardId, type: "play-card" });
    }

    adapter.dispose();
    throw new Error("MATCH_DID_NOT_COMPLETE");
  });
});
