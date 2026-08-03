import { describe, expect, it } from "vitest";
import { LocalMatchAdapter } from "../assets/scripts/adapters/LocalMatchAdapter";
import type { MatchUpdate } from "../assets/scripts/adapters/IMatchAdapter";

describe("LocalMatchAdapter", () => {
  it("drives a complete private-snapshot quick match through the Cocos seam", () => {
    const adapter = new LocalMatchAdapter();
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
