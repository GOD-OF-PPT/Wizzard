import {
  applyPatrolIntent,
  createPatrolPrototype,
  type PatrolEvent,
  type PatrolIntent,
  type PatrolState,
} from "@wizzard/game-core";

const OBSERVE_SECONDS = 5;
const SIMULATION_STEP_SECONDS = 1;
const TARGET_SELECT_SECONDS = 8;
const TIME_EPSILON = 1e-9;

export type PatrolUpdate = Readonly<{
  events: readonly PatrolEvent[];
  observeSecondsRemaining: number | null;
  state: PatrolState;
  targetSelectSecondsRemaining: number | null;
}>;

export type PatrolUpdateListener = (update: PatrolUpdate) => void;

export class LocalPatrolAdapter {
  private disposed = false;
  private listener: PatrolUpdateListener | null = null;
  private phaseElapsedSeconds = 0;
  private started = false;
  private state = createPatrolPrototype();
  private targetDraft = 4;

  public dispose(): void {
    this.disposed = true;
    this.listener = null;
    this.started = false;
  }

  public fast(): void {
    this.submitIntent("patrol", { type: "fast" });
  }

  public queueSwitch(): void {
    this.submitIntent("patrol", { type: "queue-switch" });
  }

  public restart(): void {
    if (this.disposed) {
      return;
    }

    this.state = createPatrolPrototype();
    this.phaseElapsedSeconds = 0;
    this.targetDraft = 4;

    if (this.started) {
      this.emit([]);
    }
  }

  public selectTarget(target: number): void {
    this.setTargetDraft(target);
    this.submitIntent("target-select", { target, type: "select-target" });
  }

  public setTargetDraft(target: number): void {
    if (
      this.disposed ||
      !this.started ||
      this.state.phase !== "target-select" ||
      !Number.isInteger(target) ||
      target < 0 ||
      target > 9
    ) {
      return;
    }

    this.targetDraft = target;
  }

  public slow(): void {
    this.submitIntent("patrol", { type: "slow" });
  }

  public start(listener: PatrolUpdateListener): void {
    if (this.disposed) {
      return;
    }

    this.listener = listener;
    this.started = true;
    this.emit([]);
  }

  public update(deltaSeconds: number): void {
    if (
      this.disposed ||
      !this.started ||
      !Number.isFinite(deltaSeconds) ||
      deltaSeconds <= 0
    ) {
      return;
    }

    const countdownBefore = this.getCountdownKey();
    const events: PatrolEvent[] = [];
    let remainingSeconds = deltaSeconds;

    while (remainingSeconds > TIME_EPSILON && this.state.phase !== "results") {
      if (this.state.phase === "observe") {
        remainingSeconds = this.consumeTimedPhase(
          remainingSeconds,
          OBSERVE_SECONDS,
          { type: "finish-observe" },
          events,
        );
        continue;
      }

      if (this.state.phase === "target-select") {
        remainingSeconds = this.consumeTimedPhase(
          remainingSeconds,
          TARGET_SELECT_SECONDS,
          { target: this.targetDraft, type: "select-target" },
          events,
        );
        continue;
      }

      this.phaseElapsedSeconds += remainingSeconds;
      remainingSeconds = 0;

      while (
        this.state.phase === "patrol" &&
        this.phaseElapsedSeconds + TIME_EPSILON >= SIMULATION_STEP_SECONDS
      ) {
        this.phaseElapsedSeconds = Math.max(
          0,
          this.phaseElapsedSeconds - SIMULATION_STEP_SECONDS,
        );
        events.push(...this.applyIntent({ type: "tick" }));
      }
    }

    if (events.length > 0 || this.getCountdownKey() !== countdownBefore) {
      this.emit(events);
    }
  }

  private applyIntent(intent: PatrolIntent): readonly PatrolEvent[] {
    const previousPhase = this.state.phase;
    const transition = applyPatrolIntent(this.state, intent);
    this.state = transition.state;

    if (this.state.phase !== previousPhase) {
      this.phaseElapsedSeconds = 0;
    }

    return transition.events;
  }

  private consumeTimedPhase(
    availableSeconds: number,
    durationSeconds: number,
    completionIntent: PatrolIntent,
    events: PatrolEvent[],
  ): number {
    const secondsUntilCompletion = Math.max(
      0,
      durationSeconds - this.phaseElapsedSeconds,
    );

    if (availableSeconds + TIME_EPSILON < secondsUntilCompletion) {
      this.phaseElapsedSeconds += availableSeconds;
      return 0;
    }

    this.phaseElapsedSeconds = durationSeconds;
    events.push(...this.applyIntent(completionIntent));
    return Math.max(0, availableSeconds - secondsUntilCompletion);
  }

  private submitIntent(
    requiredPhase: PatrolState["phase"],
    intent: PatrolIntent,
  ): void {
    if (this.disposed || !this.started || this.state.phase !== requiredPhase) {
      return;
    }

    this.emit(this.applyIntent(intent));
  }

  private emit(events: readonly PatrolEvent[]): void {
    if (!this.listener || this.disposed || !this.started) {
      return;
    }

    this.listener({
      events,
      observeSecondsRemaining: this.getObserveSecondsRemaining(),
      state: this.state,
      targetSelectSecondsRemaining: this.getTargetSelectSecondsRemaining(),
    });
  }

  private getObserveSecondsRemaining(): number | null {
    return this.state.phase === "observe"
      ? Math.max(0, Math.ceil(OBSERVE_SECONDS - this.phaseElapsedSeconds))
      : null;
  }

  private getCountdownKey(): string {
    return `${this.getObserveSecondsRemaining() ?? "none"}:${
      this.getTargetSelectSecondsRemaining() ?? "none"
    }`;
  }

  private getTargetSelectSecondsRemaining(): number | null {
    return this.state.phase === "target-select"
      ? Math.max(0, Math.ceil(TARGET_SELECT_SECONDS - this.phaseElapsedSeconds))
      : null;
  }
}
