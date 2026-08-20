import { describe, expect, it } from "vitest";
import { DEFAULT_ROOM_SERVICE_CONFIG } from "../src/index.js";
import coordinatorSource from "../src/room/RoomCoordinator.ts?raw";
import schedulerSource from "../src/room/MatchScheduler.ts?raw";

describe("MatchScheduler match-driver integration (VAL-MD-022, VAL-MD-023)", () => {
  describe("source contract", () => {
    it("contains no local planDeadline implementation", () => {
      expect(coordinatorSource).not.toMatch(/function planDeadline\b/);
      expect(schedulerSource).not.toMatch(/function planDeadline\b/);
    });

    it("imports planNextMatchAction and executeMatchAction from the bare game-core specifier", () => {
      expect(schedulerSource).toMatch(/planNextMatchAction/);
      expect(schedulerSource).toMatch(/executeMatchAction/);
      expect(schedulerSource).toMatch(/from "@wizzard\/game-core"/);
    });

    it("constructs a MatchPacingConfig from RoomServiceConfig", () => {
      expect(schedulerSource).toMatch(/MatchPacingConfig/);
      expect(schedulerSource).toMatch(/buildPacingConfig/);
    });

    it("has no hardcoded pacing magic numbers (only config references)", () => {
      // Pacing constants live in DEFAULT_ROOM_SERVICE_CONFIG (config.ts), not
      // in the source files. The only pacing references should be config
      // field accesses inside buildPacingConfig.
      expect(coordinatorSource).not.toMatch(/aiActionDelayMs:\s*\d{3,}/);
      expect(coordinatorSource).not.toMatch(/turnTimeoutMs:\s*\d{4,}/);
      expect(coordinatorSource).not.toMatch(/trickResultDelayMs:\s*\d{3,}/);
      expect(schedulerSource).not.toMatch(/aiActionDelayMs:\s*\d{3,}/);
      expect(schedulerSource).not.toMatch(/turnTimeoutMs:\s*\d{4,}/);
      expect(schedulerSource).not.toMatch(/trickResultDelayMs:\s*\d{3,}/);
    });

    it("wake() applies playerPacingChanges from executeMatchAction", () => {
      expect(schedulerSource).toMatch(/playerPacingChanges/);
      expect(schedulerSource).toMatch(/executeMatchAction/);
    });

    it("synchronizeMatch delegates to planNextMatchAction", () => {
      expect(schedulerSource).toMatch(/function synchronizeMatch/);
      expect(schedulerSource).toMatch(/planNextMatchAction/);
    });
  });

  describe("cross-runtime pacing consistency (VAL-MD-023)", () => {
    it("server aiActionDelayMs matches client value (420, eliminating 420/450 drift)", () => {
      // The React useLocalMatch and Cocos LocalMatchAdapter both construct
      // their MatchPacingConfig with `aiActionDelayMs: toMs(0.42)` = 420.
      // The server must use the same value so all three runtimes pass
      // identical pacing to planNextMatchAction.
      expect(DEFAULT_ROOM_SERVICE_CONFIG.aiActionDelayMs).toBe(420);
    });

    it("server constructs MatchPacingConfig with auto-advance roundScoreDelayMs", () => {
      // The server uses a non-null roundScoreDelayMs (8000) for auto-advance,
      // while clients use null for manual advance.
      expect(DEFAULT_ROOM_SERVICE_CONFIG.roundScoreDelayMs).toBe(8_000);
    });

    it("server trickResultDelayMs matches client value (1500)", () => {
      expect(DEFAULT_ROOM_SERVICE_CONFIG.trickResultDelayMs).toBe(1_500);
    });

    it("server turnTimeoutMs matches client value (30000)", () => {
      expect(DEFAULT_ROOM_SERVICE_CONFIG.turnTimeoutMs).toBe(30_000);
    });
  });
});
