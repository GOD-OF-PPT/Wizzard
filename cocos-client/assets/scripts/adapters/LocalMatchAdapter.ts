import {
  advanceAuthoritativeMatch,
  applyMatchIntent,
  createMatch,
  createPlayerSnapshot,
  type AuthoritativeMatchState,
} from "@wizzard/game-core/authority";
import { chooseAiIntent } from "@wizzard/game-core";
import type {
  MatchEvent,
  MatchIntent,
  MatchPlayerSeed,
  RandomSource,
} from "@wizzard/game-core/contracts";
import type {
  IMatchAdapter,
  MatchIntentDraft,
  MatchUpdateListener,
} from "./IMatchAdapter";

const HUMAN_PLAYER_ID = "player-you";
const TURN_DURATION_SECONDS = 30;
const AI_THINK_SECONDS = 0.42;
const TRICK_RESULT_SECONDS = 1.5;
const UINT32_RANGE = 0x1_0000_0000;
const SEED_SEQUENCE_STEP = 0x9e3779b9;
const OPENING_HAND_REROLL_LIMIT = 16;

export type PracticeSeedSource = () => number;

export type LocalMatchAdapterOptions = Readonly<{
  avoidImmediateOpeningRepeat?: boolean;
  seedSource?: PracticeSeedSource;
}>;

const lastOpeningHandBySeedSource = new WeakMap<PracticeSeedSource, string>();

const PRACTICE_PLAYERS: readonly MatchPlayerSeed[] = [
  {
    avatarKey: "bamboo-cat",
    id: HUMAN_PLAYER_ID,
    isHuman: true,
    name: "你",
  },
  {
    avatarKey: "wandering-crane",
    id: "player-crane",
    name: "云游鹤",
  },
  {
    avatarKey: "flower-fox",
    id: "player-fox",
    name: "花间狐",
  },
  {
    avatarKey: "ink-panda",
    id: "player-panda",
    name: "墨隐熊",
  },
  {
    avatarKey: "sleepy-star-cat",
    id: "player-star-cat",
    name: "星眠猫",
  },
  {
    avatarKey: "masked-traveler",
    id: "player-traveler",
    name: "面具旅人",
  },
];

function createSeededRandom(seed: number): RandomSource {
  let value = seed >>> 0;

  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x1_0000_0000;
  };
}

function mixSeed(value: number): number {
  let mixed = value >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x85ebca6b);
  mixed ^= mixed >>> 13;
  mixed = Math.imul(mixed, 0xc2b2ae35);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

export function createPracticeSeedSource(
  clock: () => number = Date.now,
  entropy: () => number = Math.random,
): PracticeSeedSource {
  const timestamp = Math.trunc(clock()) >>> 0;
  const entropyValue = entropy();
  const entropyFraction = Number.isFinite(entropyValue)
    ? entropyValue - Math.floor(entropyValue)
    : 0;
  const entropyWord = Math.floor(entropyFraction * UINT32_RANGE) >>> 0;
  const salt = timestamp ^ entropyWord;
  let sequence = 0;

  return () => {
    sequence = (sequence + SEED_SEQUENCE_STEP) >>> 0;
    return mixSeed((salt + sequence) >>> 0);
  };
}

const runtimePracticeSeedSource = createPracticeSeedSource();

function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    throw new Error("INVALID_PRACTICE_SEED");
  }

  return Math.trunc(seed) >>> 0;
}

function createPracticeState(
  random: RandomSource,
  seed: number,
): AuthoritativeMatchState {
  return createMatch(
    {
      matchId: `cocos-local-practice:${seed.toString(16).padStart(8, "0")}`,
      mode: "quick",
      players: PRACTICE_PLAYERS,
    },
    random,
  );
}

function getOpeningHandSignature(state: AuthoritativeMatchState): string {
  const cardIds = createPlayerSnapshot(
    state,
    HUMAN_PLAYER_ID,
  ).privateState.hand
    .map((card) => card.id)
    .sort();

  return JSON.stringify(cardIds);
}

function isActiveTurn(state: AuthoritativeMatchState): boolean {
  return (
    state.currentPlayerId !== null &&
    (state.phase === "trump-select" ||
      state.phase === "bid" ||
      state.phase === "trick-play")
  );
}

export class LocalMatchAdapter implements IMatchAdapter {
  private readonly avoidImmediateOpeningRepeat: boolean;
  private commandCounter = 0;
  private disposed = false;
  private lastOpeningHandSignature: string | null = null;
  private lastCountdownValue: number | null = null;
  private listener: MatchUpdateListener | null = null;
  private random: RandomSource;
  private readonly seedSource: PracticeSeedSource;
  private state: AuthoritativeMatchState;
  private turnElapsedSeconds = 0;
  private turnKey = "";

  public constructor(options: LocalMatchAdapterOptions = {}) {
    this.seedSource = options.seedSource ?? runtimePracticeSeedSource;
    this.avoidImmediateOpeningRepeat =
      options.avoidImmediateOpeningRepeat ?? options.seedSource === undefined;

    if (this.avoidImmediateOpeningRepeat) {
      this.lastOpeningHandSignature =
        lastOpeningHandBySeedSource.get(this.seedSource) ?? null;
    }

    const session = this.createPracticeSession();
    this.random = session.random;
    this.state = session.state;
  }

  public dispose(): void {
    this.disposed = true;
    this.listener = null;
  }

  public requestContinueRound(): void {
    if (this.disposed || this.state.phase !== "round-score") {
      return;
    }

    const transition = advanceAuthoritativeMatch(
      this.state,
      "continue-round",
      this.random,
    );
    this.commit(transition.state, transition.events);
  }

  public requestRematch(): void {
    if (this.disposed) {
      return;
    }

    const session = this.createPracticeSession();
    this.random = session.random;
    this.commandCounter = 0;
    this.commit(session.state, []);
  }

  public start(listener: MatchUpdateListener): void {
    this.listener = listener;
    this.disposed = false;
    this.resetTurnClock();
    this.emit([]);
  }

  public submitIntent(draft: MatchIntentDraft): void {
    if (this.disposed || this.state.currentPlayerId !== HUMAN_PLAYER_ID) {
      return;
    }

    const intent = this.toMatchIntent(draft, "human");
    const transition = applyMatchIntent(this.state, HUMAN_PLAYER_ID, intent);
    this.commit(transition.state, transition.events);
  }

  public update(deltaSeconds: number): void {
    if (this.disposed || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return;
    }

    this.ensureTurnClockMatchesState();

    if (this.state.phase === "trick-result") {
      this.turnElapsedSeconds += deltaSeconds;

      if (this.turnElapsedSeconds >= TRICK_RESULT_SECONDS) {
        const transition = advanceAuthoritativeMatch(
          this.state,
          "resolve-trick",
          this.random,
        );
        this.commit(transition.state, transition.events);
      }

      return;
    }

    if (!isActiveTurn(this.state)) {
      return;
    }

    this.turnElapsedSeconds += deltaSeconds;
    const currentPlayerId = this.state.currentPlayerId;

    if (currentPlayerId === null) {
      return;
    }

    if (currentPlayerId !== HUMAN_PLAYER_ID) {
      if (this.turnElapsedSeconds >= AI_THINK_SECONDS) {
        this.submitAiIntent(currentPlayerId, "ai");
      }

      return;
    }

    const remaining = Math.max(
      0,
      Math.ceil(TURN_DURATION_SECONDS - this.turnElapsedSeconds),
    );

    if (remaining !== this.lastCountdownValue) {
      this.lastCountdownValue = remaining;
      this.emit([]);
    }

    if (this.turnElapsedSeconds >= TURN_DURATION_SECONDS) {
      this.submitAiIntent(HUMAN_PLAYER_ID, "timeout");
    }
  }

  private commit(state: AuthoritativeMatchState, events: MatchEvent[]): void {
    this.state = state;
    this.resetTurnClock();
    this.emit(events);
  }

  private createPracticeSession(): Readonly<{
    random: RandomSource;
    state: AuthoritativeMatchState;
  }> {
    for (let attempt = 0; attempt < OPENING_HAND_REROLL_LIMIT; attempt += 1) {
      const seed = normalizeSeed(this.seedSource());
      const random = createSeededRandom(seed);
      const state = createPracticeState(random, seed);

      if (!this.avoidImmediateOpeningRepeat) {
        return { random, state };
      }

      const openingHandSignature = getOpeningHandSignature(state);
      const repeatsPreviousOpening =
        this.lastOpeningHandSignature === openingHandSignature;
      const reachedRerollLimit = attempt === OPENING_HAND_REROLL_LIMIT - 1;

      if (!repeatsPreviousOpening || reachedRerollLimit) {
        this.lastOpeningHandSignature = openingHandSignature;
        lastOpeningHandBySeedSource.set(
          this.seedSource,
          openingHandSignature,
        );
        return { random, state };
      }
    }

    throw new Error("PRACTICE_SESSION_CREATION_FAILED");
  }

  private emit(events: MatchEvent[]): void {
    if (!this.listener || this.disposed) {
      return;
    }

    this.listener({
      connection: "local",
      events,
      snapshot: createPlayerSnapshot(this.state, HUMAN_PLAYER_ID),
      turnSecondsRemaining: this.getTurnSecondsRemaining(),
    });
  }

  private ensureTurnClockMatchesState(): void {
    const key = `${this.state.phase}:${this.state.currentPlayerId ?? "none"}:${this.state.version}`;

    if (key !== this.turnKey) {
      this.resetTurnClock();
    }
  }

  private getTurnSecondsRemaining(): number | null {
    if (!isActiveTurn(this.state)) {
      return null;
    }

    return Math.max(
      0,
      Math.ceil(TURN_DURATION_SECONDS - this.turnElapsedSeconds),
    );
  }

  private nextCommandId(origin: string): string {
    this.commandCounter += 1;
    return `cocos-${origin}:${this.commandCounter}`;
  }

  private resetTurnClock(): void {
    this.turnElapsedSeconds = 0;
    this.lastCountdownValue = this.getTurnSecondsRemaining();
    this.turnKey = `${this.state.phase}:${this.state.currentPlayerId ?? "none"}:${this.state.version}`;
  }

  private submitAiIntent(playerId: string, origin: string): void {
    const snapshot = createPlayerSnapshot(this.state, playerId);
    const intent = chooseAiIntent(snapshot, this.nextCommandId(origin));

    if (!intent) {
      return;
    }

    const transition = applyMatchIntent(this.state, playerId, intent);
    this.commit(transition.state, transition.events);
  }

  private toMatchIntent(draft: MatchIntentDraft, origin: string): MatchIntent {
    return {
      ...draft,
      commandId: this.nextCommandId(origin),
      expectedVersion: this.state.version,
    } as MatchIntent;
  }
}
