import { describe, expect, it } from "vitest";
import * as Core from "@wizzard/game-core";
import {
  advanceAuthoritativeMatch,
  applyMatchIntent,
  createMatch,
  createPlayerSnapshot,
  getLegalCardIds,
} from "@wizzard/game-core/authority";

// The bare @wizzard/game-core specifier must NOT re-export authority functions.
// Cast the namespace to a record so we can probe for symbols TypeScript no longer
// advertises on the bare specifier once the authority re-export is removed.
const bare = Core as unknown as Record<string, unknown>;

describe("authority boundary", () => {
  describe("authority functions are undefined on the bare specifier", () => {
    it("advanceAuthoritativeMatch is undefined on the bare specifier", () => {
      expect(bare.advanceAuthoritativeMatch).toBeUndefined();
    });

    it("applyMatchIntent is undefined on the bare specifier", () => {
      expect(bare.applyMatchIntent).toBeUndefined();
    });

    it("createMatch is undefined on the bare specifier", () => {
      expect(bare.createMatch).toBeUndefined();
    });

    it("createPlayerSnapshot is undefined on the bare specifier", () => {
      expect(bare.createPlayerSnapshot).toBeUndefined();
    });

    it("getLegalCardIds is undefined on the bare specifier", () => {
      expect(bare.getLegalCardIds).toBeUndefined();
    });
  });

  describe("authority functions are accessible from the /authority subpath", () => {
    it("advanceAuthoritativeMatch is a function from /authority", () => {
      expect(typeof advanceAuthoritativeMatch).toBe("function");
    });

    it("applyMatchIntent is a function from /authority", () => {
      expect(typeof applyMatchIntent).toBe("function");
    });

    it("createMatch is a function from /authority", () => {
      expect(typeof createMatch).toBe("function");
    });

    it("createPlayerSnapshot is a function from /authority", () => {
      expect(typeof createPlayerSnapshot).toBe("function");
    });

    it("getLegalCardIds is a function from /authority", () => {
      expect(typeof getLegalCardIds).toBe("function");
    });
  });

  describe("non-authority functions remain accessible from the bare specifier", () => {
    it("chooseAiIntent is a function", () => {
      expect(typeof Core.chooseAiIntent).toBe("function");
    });

    it("resolveTrump is a function", () => {
      expect(typeof Core.resolveTrump).toBe("function");
    });

    it("scoreBid, scoreRound, and validateBid are functions", () => {
      expect(typeof Core.scoreBid).toBe("function");
      expect(typeof Core.scoreRound).toBe("function");
      expect(typeof Core.validateBid).toBe("function");
    });

    it("dealCards and shuffleCards are functions", () => {
      expect(typeof Core.dealCards).toBe("function");
      expect(typeof Core.shuffleCards).toBe("function");
    });

    it("createDeck is a function", () => {
      expect(typeof Core.createDeck).toBe("function");
    });

    it("getRoundHandCounts is a function", () => {
      expect(typeof Core.getRoundHandCounts).toBe("function");
    });

    it("getLeadSuit, getLegalCards, and resolveTrickWinner are functions", () => {
      expect(typeof Core.getLeadSuit).toBe("function");
      expect(typeof Core.getLegalCards).toBe("function");
      expect(typeof Core.resolveTrickWinner).toBe("function");
    });
  });
});
