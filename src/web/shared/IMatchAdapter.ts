import type {
  Card,
  MatchEvent,
  PlayerMatchSnapshot,
  Suit,
} from "@wizzard/game-core/contracts";

export type MatchIntentDraft =
  | { type: "choose-trump"; trump: Suit }
  | { type: "submit-bid"; bid: number }
  | { type: "play-card"; cardId: Card["id"] };

export type MatchConnectionState =
  | "local"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type MatchControls = {
  canContinueRound: boolean;
  canRematch: boolean;
};

export type MatchUpdate = {
  connection: MatchConnectionState;
  controls?: MatchControls;
  events: readonly MatchEvent[];
  snapshot: PlayerMatchSnapshot;
  statusMessage?: string;
  turnSecondsRemaining: number | null;
};

export type MatchUpdateListener = (update: MatchUpdate) => void;

export interface IMatchAdapter {
  dispose(): void;
  requestContinueRound(): void;
  requestRematch(): void;
  start(listener: MatchUpdateListener): void;
  submitIntent(intent: MatchIntentDraft): void;
  update(deltaSeconds: number): void;
}
