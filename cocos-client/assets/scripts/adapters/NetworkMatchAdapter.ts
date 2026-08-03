import { PROTOCOL_VERSION } from "@wizzard/room-protocol";
import type {
  ContinueRoundMessage,
  RematchMessage,
  SubmitMatchIntentMessage,
} from "@wizzard/room-protocol";
import type { MatchIntent } from "@wizzard/game-core/contracts";
import type {
  RoomSocketConnectionState,
  RoomSocketEvent,
} from "../network/RoomSocketClient";
import { RoomSocketClient } from "../network/RoomSocketClient";
import type {
  IMatchAdapter,
  MatchConnectionState,
  MatchIntentDraft,
  MatchUpdate,
  MatchUpdateListener,
} from "./IMatchAdapter";

export class NetworkMatchAdapter implements IMatchAdapter {
  private connection: MatchConnectionState = "reconnecting";
  private countdownSeconds: number | null = null;
  private disposed = false;
  private lastCountdownValue: number | null = null;
  private latestUpdate: MatchUpdate | null = null;
  private listener: MatchUpdateListener | null = null;
  private pendingIntentCommandId: string | null = null;
  private unsubscribe: (() => void) | null = null;

  public constructor(private readonly roomClient: RoomSocketClient) {}

  public dispose(): void {
    this.disposed = true;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.listener = null;
    this.roomClient.dispose();
  }

  public requestContinueRound(): void {
    const update = this.latestUpdate;

    if (
      !this.canSend() ||
      !update?.controls?.canContinueRound ||
      update.snapshot.publicState.phase !== "round-score"
    ) {
      return;
    }

    const requestId = this.roomClient.nextRequestId();
    const message: ContinueRoundMessage = {
      payload: {},
      requestId,
      type: "match.continue-round",
      v: PROTOCOL_VERSION,
    };
    this.roomClient.sendTracked(message);
  }

  public requestRematch(): void {
    const update = this.latestUpdate;

    if (
      !this.canSend() ||
      !update?.controls?.canRematch ||
      update.snapshot.publicState.phase !== "match-end"
    ) {
      return;
    }

    const requestId = this.roomClient.nextRequestId();
    const message: RematchMessage = {
      payload: {},
      requestId,
      type: "room.rematch",
      v: PROTOCOL_VERSION,
    };
    this.roomClient.sendTracked(message);
  }

  public start(listener: MatchUpdateListener): void {
    this.listener = listener;
    this.disposed = false;
    this.unsubscribe?.();
    this.unsubscribe = this.roomClient.subscribe((event) =>
      this.handleRoomEvent(event),
    );
    this.roomClient.start();
  }

  public submitIntent(draft: MatchIntentDraft): void {
    const update = this.latestUpdate;

    if (
      !this.canSend() ||
      !update ||
      this.pendingIntentCommandId ||
      (this.countdownSeconds !== null && this.countdownSeconds <= 0)
    ) {
      return;
    }

    const commandId = this.roomClient.nextRequestId();
    const intent = {
      ...draft,
      commandId,
      expectedVersion: update.snapshot.publicState.version,
    } as MatchIntent;
    const message: SubmitMatchIntentMessage = {
      payload: { intent },
      requestId: commandId,
      type: "match.intent",
      v: PROTOCOL_VERSION,
    };

    this.pendingIntentCommandId = commandId;
    this.roomClient.sendTracked(message);
  }

  public update(deltaSeconds: number): void {
    if (
      this.disposed ||
      this.countdownSeconds === null ||
      !Number.isFinite(deltaSeconds) ||
      deltaSeconds <= 0
    ) {
      return;
    }

    this.countdownSeconds = Math.max(
      0,
      this.countdownSeconds - deltaSeconds,
    );
    const nextValue = Math.ceil(this.countdownSeconds);

    if (nextValue === this.lastCountdownValue) {
      return;
    }

    this.lastCountdownValue = nextValue;
    this.emitLatest([]);
  }

  private canSend(): boolean {
    return (
      !this.disposed &&
      this.connection === "connected" &&
      this.roomClient.getConnectionState() === "connected"
    );
  }

  private emitLatest(events: MatchUpdate["events"]): void {
    if (!this.listener || !this.latestUpdate || this.disposed) {
      return;
    }

    this.latestUpdate = {
      ...this.latestUpdate,
      connection: this.connection,
      events,
      turnSecondsRemaining:
        this.countdownSeconds === null
          ? null
          : Math.ceil(this.countdownSeconds),
    };
    this.listener(this.latestUpdate);
  }

  private handleConnection(state: RoomSocketConnectionState): void {
    this.connection =
      state === "connected"
        ? "connected"
        : state === "disconnected"
          ? "disconnected"
          : "reconnecting";
    this.emitLatest([]);
  }

  private handleRoomEvent(event: RoomSocketEvent): void {
    if (this.disposed) {
      return;
    }

    if (event.type === "connection") {
      this.handleConnection(event.state);
      return;
    }

    if (event.type === "error") {
      if (event.requestId === this.pendingIntentCommandId) {
        this.pendingIntentCommandId = null;
      }

      if (this.latestUpdate) {
        this.latestUpdate = {
          ...this.latestUpdate,
          statusMessage: event.message,
        };
        this.emitLatest([]);
      }
      return;
    }

    const match = event.payload.match;

    if (!match) {
      return;
    }

    if (event.payload.ackCommandId === this.pendingIntentCommandId) {
      this.pendingIntentCommandId = null;
    }

    this.connection =
      this.roomClient.getConnectionState() === "connected"
        ? "connected"
        : "reconnecting";
    this.countdownSeconds =
      match.turnDeadlineAt === null
        ? null
        : Math.max(0, (match.turnDeadlineAt - event.serverTime) / 1_000);
    this.lastCountdownValue =
      this.countdownSeconds === null
        ? null
        : Math.ceil(this.countdownSeconds);
    this.latestUpdate = {
      connection: this.connection,
      controls: {
        canContinueRound: event.payload.permissions.canContinueRound,
        canRematch: event.payload.permissions.canRematch,
      },
      events: match.events,
      snapshot: match.snapshot,
      turnSecondsRemaining: this.lastCountdownValue,
    };
    this.listener?.(this.latestUpdate);
  }
}
