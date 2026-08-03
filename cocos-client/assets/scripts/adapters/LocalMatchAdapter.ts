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
const DEFAULT_SEED = 20260802;
const TURN_DURATION_SECONDS = 30;
const AI_THINK_SECONDS = 0.42;
const TRICK_RESULT_SECONDS = 1.5;

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

function createPracticeState(random: RandomSource): AuthoritativeMatchState {
  return createMatch(
    {
      matchId: "cocos-local-practice",
      mode: "quick",
      players: PRACTICE_PLAYERS,
    },
    random,
  );
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
  private commandCounter = 0;
  private disposed = false;
  private lastCountdownValue: number | null = null;
  private listener: MatchUpdateListener | null = null;
  private random = createSeededRandom(DEFAULT_SEED);
  private state = createPracticeState(this.random);
  private turnElapsedSeconds = 0;
  private turnKey = "";

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

    this.random = createSeededRandom(DEFAULT_SEED);
    this.commandCounter = 0;
    this.commit(createPracticeState(this.random), []);
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

  private toMatchIntent(
    draft: MatchIntentDraft,
    origin: string,
  ): MatchIntent {
    return {
      ...draft,
      commandId: this.nextCommandId(origin),
      expectedVersion: this.state.version,
    } as MatchIntent;
  }
}
