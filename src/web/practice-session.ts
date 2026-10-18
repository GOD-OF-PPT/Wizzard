import { createMatch, createPlayerSnapshot, type AuthoritativeMatchState } from "@wizzard/game-core/authority";
import type { MatchPlayerSeed, RandomSource } from "@wizzard/game-core/contracts";

export type PracticeSessionOptions = Readonly<{
  seedSource?: () => number;
  avoidImmediateOpeningRepeat?: boolean;
}>;

const OPENING_REROLL_LIMIT = 16;
const previousOpenings = new WeakMap<() => number, string>();
const entropy = new Uint32Array(1);
const salt = typeof globalThis.crypto?.getRandomValues === "function"
  ? globalThis.crypto.getRandomValues(entropy)[0]
  : (Date.now() ^ Math.floor(Math.random() * 0x1_0000_0000)) >>> 0;
let sequence = 0;

// Session entropy only, not authentication or a second rules engine.
function runtimeSeedSource(): number {
  sequence = (sequence + 0x9e3779b9) >>> 0;
  let value = (salt + sequence) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  return (value ^ (value >>> 16)) >>> 0;
}

function createSeededRandom(seed: number): RandomSource {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let result = Math.imul(value ^ (value >>> 15), value | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

export function createWebPracticeSession(
  players: readonly MatchPlayerSeed[],
  humanPlayerId: string,
  options: PracticeSessionOptions = {},
): { state: AuthoritativeMatchState; random: RandomSource; commitOpening: () => void } {
  const seedSource = options.seedSource ?? runtimeSeedSource;
  // An injected source defaults to exact replay. Runtime entries/rematches
  // share recent-opening memory even after the practice view unmounts.
  const avoidRepeat = options.avoidImmediateOpeningRepeat ?? options.seedSource === undefined;
  for (let attempt = 0; attempt < OPENING_REROLL_LIMIT; attempt++) {
    const rawSeed = seedSource();
    if (!Number.isFinite(rawSeed)) throw new Error("INVALID_PRACTICE_SEED");
    const seed = Math.trunc(rawSeed) >>> 0;
    const random = createSeededRandom(seed);
    const state = createMatch({
      dealerIndex: 0, matchId: `web-practice:${seed.toString(16).padStart(8, "0")}`,
      mode: "quick", players,
    }, random);
    if (!avoidRepeat) return { state, random, commitOpening: () => undefined };
    // Special-card copies can have different IDs but identical visible faces.
    const signature = JSON.stringify(createPlayerSnapshot(state, humanPlayerId).privateState.hand
      .map(card => card.kind === "number" ? `${card.suit}:${card.rank}` : card.kind).sort());
    if (signature !== previousOpenings.get(seedSource) || attempt === OPENING_REROLL_LIMIT - 1) {
      // Remember only after React commits the prepared session. An abandoned
      // render/Strict Mode probe must not replace the last visible opening.
      return { state, random, commitOpening: () => { previousOpenings.set(seedSource, signature); } };
    }
  }
  throw new Error("PRACTICE_SESSION_CREATION_FAILED");
}
