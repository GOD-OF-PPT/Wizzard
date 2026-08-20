import { Color, Node, Sprite, Vec3, tween, view } from "cc";
import type {
  Card,
  MatchEvent,
  MatchPlayerState,
  PlayerMatchSnapshot,
  Suit,
} from "@wizzard/game-core/contracts";
import type { AssetKey } from "../assets/AssetAddresses.generated";
import { AssetRegistry } from "../assets/AssetRegistry";
import type { IMatchAdapter, MatchUpdate } from "../adapters/IMatchAdapter";
import {
  DEFAULT_GAME_PREFERENCES,
  type GamePreferences,
} from "../platform/GamePreferences";
import { createCardView } from "./CardView";
import {
  createPlayerSeatView,
  getPlayerAvatarAssetKey,
} from "./PlayerSeatView";
import {
  GAMEPLAY_ASSETS,
  GAMEPLAY_LAYOUT,
  GAMEPLAY_SEAT_POSITIONS,
  GAMEPLAY_SLOT_MAPS,
  getGameplayLocalHandPlacement,
  getGameplayRightActionOccupant,
  getGameplayTrumpStatusRects,
  getPracticeHomeActionPlacement,
  type GameplayLayoutRect,
} from "./GameplayLayout";
import {
  ROUND_RESULTS_ASSETS,
  ROUND_RESULTS_LAYOUT,
  getRoundResultsRowY,
} from "./RoundResultsLayout";
import {
  createButton,
  createContainer,
  createModalBackdrop,
  createSprite,
  createText,
  type ButtonStyle,
} from "./UiFactory";

const SUIT_NAMES: Record<Suit, string> = {
  knot: "结",
  leaf: "叶",
  mountain: "山",
  sun: "日",
};

const PAPER_BUTTON: ButtonStyle = {
  assetKey: ROUND_RESULTS_ASSETS.paperButton as AssetKey,
  fontKey: "font.display" as AssetKey,
  fontSize: ROUND_RESULTS_LAYOUT.footer.secondaryLabel.fontSize,
  hitHeight: ROUND_RESULTS_LAYOUT.footer.touchHeight,
  labelHeight: ROUND_RESULTS_LAYOUT.footer.secondaryLabel.height,
  labelWidth: ROUND_RESULTS_LAYOUT.footer.secondaryLabel.width,
  outlineWidth: 0,
  textColor: new Color(72, 42, 24, 255),
  textOffsetX: ROUND_RESULTS_LAYOUT.footer.secondaryLabel.offsetX,
  textOffsetY: ROUND_RESULTS_LAYOUT.footer.secondaryLabel.offsetY,
};

const GREEN_BUTTON: ButtonStyle = {
  assetKey: ROUND_RESULTS_ASSETS.greenButton as AssetKey,
  fontKey: "font.display" as AssetKey,
  fontSize: ROUND_RESULTS_LAYOUT.footer.primaryLabel.fontSize,
  hitHeight: ROUND_RESULTS_LAYOUT.footer.touchHeight,
  labelHeight: ROUND_RESULTS_LAYOUT.footer.primaryLabel.height,
  labelWidth: ROUND_RESULTS_LAYOUT.footer.primaryLabel.width,
  textColor: new Color(245, 229, 188, 255),
  textOffsetX: ROUND_RESULTS_LAYOUT.footer.primaryLabel.offsetX,
  textOffsetY: ROUND_RESULTS_LAYOUT.footer.primaryLabel.offsetY,
};

const PRACTICE_HOME_BUTTON: ButtonStyle = {
  assetKey: ROUND_RESULTS_ASSETS.paperButton as AssetKey,
  fontKey: "font.interface" as AssetKey,
  fontSize: 23,
  hitHeight: GAMEPLAY_LAYOUT.practiceHomeTouch.height,
  hitWidth: GAMEPLAY_LAYOUT.practiceHomeTouch.width,
  labelHeight: 44,
  labelWidth: 120,
  outlineWidth: 0,
  textColor: new Color(72, 42, 24, 255),
};

const TURN_ACTION_BUTTON: ButtonStyle = {
  assetKey: "ui.turnButton" as AssetKey,
  fontKey: "font.display" as AssetKey,
  fontSize: GAMEPLAY_LAYOUT.turnActionLabel.fontSize,
  labelHeight: GAMEPLAY_LAYOUT.turnActionLabel.height,
  labelWidth: GAMEPLAY_LAYOUT.turnActionLabel.width,
  outlineWidth: 0,
  textColor: new Color(70, 39, 21, 255),
  textOffsetX: GAMEPLAY_LAYOUT.turnActionLabel.x,
  textOffsetY: GAMEPLAY_LAYOUT.turnActionLabel.y,
};

export type MatchSceneViewOptions = Readonly<{
  onReturnHome: (() => void) | null;
  onVibrate: () => Promise<void>;
  preferences: GamePreferences;
}>;

function getRelativePlayers(
  players: readonly MatchPlayerState[],
  viewerPlayerId: string,
): MatchPlayerState[] {
  const viewerIndex = players.findIndex(
    (player) => player.id === viewerPlayerId,
  );

  if (viewerIndex < 0) {
    throw new Error(`VIEWER_PLAYER_NOT_FOUND:${viewerPlayerId}`);
  }

  return players.map(
    (_, offset) => players[(viewerIndex + offset) % players.length],
  );
}

function getPhaseLabel(snapshot: PlayerMatchSnapshot): string {
  const state = snapshot.publicState;
  const viewerPlayerId = snapshot.privateState.playerId;
  const currentPlayer = state.players.find(
    (player) => player.id === state.currentPlayerId,
  );

  if (state.phase === "trump-select") {
    return currentPlayer?.id === viewerPlayerId
      ? "请选择本轮王牌"
      : `等待 ${currentPlayer?.name ?? "发牌者"} 选择王牌`;
  }

  if (state.phase === "bid") {
    return currentPlayer?.id === viewerPlayerId
      ? "轮到你预测赢墩数"
      : `等待 ${currentPlayer?.name ?? "玩家"} 预测`;
  }

  if (state.phase === "trick-play") {
    return currentPlayer?.id === viewerPlayerId
      ? "轮到你出牌"
      : `等待 ${currentPlayer?.name ?? "玩家"} 出牌`;
  }

  if (state.phase === "trick-result") {
    const winner = state.players.find(
      (player) => player.id === state.completedTrick?.winnerId,
    );
    return `${winner?.name ?? "玩家"} 赢得这一墩`;
  }

  if (state.phase === "round-score") {
    return "本轮结算";
  }

  return "快速局结束";
}

function getEventFeedback(
  events: readonly MatchEvent[],
  snapshot: PlayerMatchSnapshot,
): string | null {
  const event = events[events.length - 1];

  if (!event) {
    return null;
  }

  if (event.type === "intent-rejected") {
    const messages: Record<string, string> = {
      BID_NOT_INTEGER: "预测必须是整数",
      BID_OUT_OF_RANGE: "预测超出本轮范围",
      CARD_NOT_FOUND: "这张牌已不在手中",
      CARD_NOT_LEGAL: "需要跟随领出花色",
      INVALID_TRUMP: "王牌选择无效",
      NOT_YOUR_TURN: "还没有轮到你",
      PLAYER_NOT_FOUND: "玩家会话已失效",
      STALE_VERSION: "状态已更新，请重试",
      WRONG_PHASE: "当前阶段不能执行此操作",
    };
    return messages[event.code] ?? "操作未被权威状态机接受";
  }

  if (event.type === "trump-selected") {
    return `本轮王牌：${SUIT_NAMES[event.trump]}`;
  }

  if (event.type === "bid-accepted") {
    return event.playerId === snapshot.privateState.playerId
      ? `已记录预测 ${event.bid}`
      : null;
  }

  if (event.type === "card-played") {
    if (event.playerId === snapshot.privateState.playerId) {
      return "出牌已确认";
    }

    const player = snapshot.publicState.players.find(
      (candidate) => candidate.id === event.playerId,
    );
    return `${player?.name ?? "玩家"} 已出牌`;
  }

  if (event.type === "trick-resolved") {
    return "一墩结算完成";
  }

  if (event.type === "round-started") {
    return `第 ${event.roundNumber} 轮开始`;
  }

  return null;
}

function getCardFaceKey(card: Card): AssetKey {
  if (card.kind === "highest") {
    return "card.special.highest" as AssetKey;
  }

  if (card.kind === "lowest") {
    return "card.special.lowest" as AssetKey;
  }

  return `card.face.${card.suit}` as AssetKey;
}

function formatSignedScore(score: number): string {
  return score > 0 ? `+${score}` : String(score);
}

function getScoreColor(score: number): Color {
  if (score > 0) {
    return new Color(164, 53, 39, 255);
  }

  if (score < 0) {
    return new Color(36, 65, 104, 255);
  }

  return new Color(75, 43, 27, 255);
}

export class MatchSceneView {
  private bidDraft = 0;
  private currentUpdate: MatchUpdate | null = null;
  private readonly dynamicRoot: Node;
  private feedbackText: string | null = null;
  private lastPhase = "";
  private lastTurnPlayerId: string | null = null;
  private lastVibrationActionKey: string | null = null;
  private readonly options: MatchSceneViewOptions;
  private pendingConfirmActionPulse = false;
  private pendingSelectedCardAnimationId: string | null = null;
  private selectedCardId: string | null = null;
  private showRoundRanking = false;
  private readonly viewRoot: Node;

  public constructor(
    root: Node,
    private readonly assets: AssetRegistry,
    private readonly adapter: IMatchAdapter,
    options?: Partial<MatchSceneViewOptions>,
  ) {
    this.options = {
      onReturnHome: options?.onReturnHome ?? null,
      onVibrate: options?.onVibrate ?? (() => Promise.resolve()),
      preferences: options?.preferences ?? DEFAULT_GAME_PREFERENCES,
    };
    const visibleSize = view.getVisibleSize();
    const backgroundScale = Math.max(1, visibleSize.width / 1920);
    this.viewRoot = createContainer(root, "MatchScene", 1920, 1080);
    createSprite(
      this.viewRoot,
      assets,
      "scene.teahouse.table" as AssetKey,
      1920 * backgroundScale,
      1080 * backgroundScale,
    );
    this.dynamicRoot = createContainer(
      this.viewRoot,
      "MatchDynamicLayer",
      1920,
      1080,
    );
    const contentScale = Math.min(1, visibleSize.width / 1920);
    this.dynamicRoot.setScale(contentScale, contentScale, 1);
  }

  public dispose(): void {
    this.viewRoot.destroy();
  }

  public render(update: MatchUpdate): void {
    this.currentUpdate = update;
    const snapshot = update.snapshot;
    const state = snapshot.publicState;
    const viewerPlayerId = snapshot.privateState.playerId;
    const turnChanged = this.lastTurnPlayerId !== state.currentPlayerId;
    const phaseChanged = this.lastPhase !== state.phase;
    const vibrationActionKey = [
      state.matchId,
      state.roundIndex,
      state.phase,
      state.trick.number,
      state.currentPlayerId ?? "none",
    ].join(":");

    if (
      this.options.preferences.vibrationEnabled &&
      this.lastVibrationActionKey !== vibrationActionKey &&
      state.currentPlayerId === viewerPlayerId &&
      (state.phase === "trump-select" ||
        state.phase === "bid" ||
        state.phase === "trick-play") &&
      this.isInteractionEnabled(update)
    ) {
      this.lastVibrationActionKey = vibrationActionKey;
      void this.options.onVibrate().catch(() => {
        // Haptics are optional and never block a turn.
      });
    }

    if (phaseChanged || turnChanged) {
      this.bidDraft = 0;
    }

    if (
      this.selectedCardId &&
      !snapshot.privateState.hand.some(
        (card) => card.id === this.selectedCardId,
      )
    ) {
      this.selectedCardId = null;
    }

    if (
      state.phase !== "trick-play" ||
      state.currentPlayerId !== viewerPlayerId ||
      !this.isInteractionEnabled(update)
    ) {
      this.selectedCardId = null;
    }

    if (state.phase !== "round-score") {
      this.showRoundRanking = false;
    }

    const feedback = getEventFeedback(update.events, snapshot);
    this.feedbackText = update.statusMessage ?? feedback;

    this.lastPhase = state.phase;
    this.lastTurnPlayerId = state.currentPlayerId;
    this.clearDynamicRoot();
    this.renderSeats(snapshot);
    this.renderHeader(update);
    this.renderTrick(update);
    this.renderHand(update);
    this.renderPhaseOverlay(update);
    this.renderConnectionOverlay(update);
    this.renderPracticeHomeAction(state.phase);
  }

  private refreshPresentation(): void {
    if (this.currentUpdate) {
      this.render(this.currentUpdate);
    }
  }

  private clearDynamicRoot(): void {
    const children = [...this.dynamicRoot.children];
    this.dynamicRoot.removeAllChildren();

    for (const child of children) {
      child.destroy();
    }
  }

  private isInteractionEnabled(update: MatchUpdate): boolean {
    if (update.connection === "local") {
      return true;
    }

    return (
      update.connection === "connected" &&
      (update.turnSecondsRemaining === null || update.turnSecondsRemaining > 0)
    );
  }

  private renderConnectionOverlay(update: MatchUpdate): void {
    if (
      update.connection !== "reconnecting" &&
      update.connection !== "disconnected"
    ) {
      return;
    }

    const backdrop = createModalBackdrop(this.dynamicRoot);
    createSprite(
      backdrop,
      this.assets,
      "ui.panel.secondary" as AssetKey,
      720,
      330,
      0,
      0,
      true,
    );
    createSprite(
      backdrop,
      this.assets,
      "fx.connection.reconnecting" as AssetKey,
      96,
      96,
      0,
      52,
    );
    createText(
      backdrop,
      this.assets,
      update.connection === "reconnecting"
        ? "正在重新连接好友房…"
        : "好友房连接已中断",
      580,
      60,
      0,
      -54,
      {
        fontKey: "font.interface" as AssetKey,
        fontSize: 30,
        outlineColor: new Color(44, 22, 14, 255),
        outlineWidth: 2,
      },
    );
  }

  private renderPracticeHomeAction(
    phase: PlayerMatchSnapshot["publicState"]["phase"],
  ): void {
    const onReturnHome = this.options.onReturnHome;
    const placement = getPracticeHomeActionPlacement(
      phase,
      onReturnHome !== null,
    );
    if (!onReturnHome || placement !== "floating") {
      return;
    }

    const action = GAMEPLAY_LAYOUT.practiceHomeAction;
    createButton(
      this.dynamicRoot,
      this.assets,
      "返回首页",
      action.width,
      action.height,
      action.x,
      action.y,
      onReturnHome,
      true,
      PRACTICE_HOME_BUTTON,
    );
  }

  private renderHand(update: MatchUpdate): void {
    const snapshot = update.snapshot;
    const state = snapshot.publicState;
    const hand = snapshot.privateState.hand;
    const viewerPlayerId = snapshot.privateState.playerId;
    const legalCardIds = new Set(snapshot.privateState.legalCardIds);
    const rightActionOccupant = getGameplayRightActionOccupant(
      this.isInteractionEnabled(update),
      state.phase,
      state.currentPlayerId === viewerPlayerId,
    );
    const canPlay = rightActionOccupant === "turn-action";
    const compactChoiceHand =
      state.phase === "bid" || state.phase === "trump-select";
    const handLayout = GAMEPLAY_LAYOUT.localHand;
    const handBaseY = handLayout.baseY;
    const cardHeight = compactChoiceHand
      ? handLayout.choiceHeight
      : handLayout.height;
    const cardWidth = compactChoiceHand
      ? handLayout.choiceWidth
      : handLayout.width;

    const selectedIndex = hand.findIndex(
      (card) => card.id === this.selectedCardId,
    );
    const selectedAnimationId = this.pendingSelectedCardAnimationId;
    this.pendingSelectedCardAnimationId = null;
    const pulseConfirmAction = this.pendingConfirmActionPulse;
    this.pendingConfirmActionPulse = false;
    const handLayer = createContainer(
      this.dynamicRoot,
      "LocalHandLayer",
      1920,
      420,
      0,
      0,
    );
    const cards = hand.map((card, index) => {
      const legal = legalCardIds.has(card.id);
      const selected = card.id === this.selectedCardId;
      const placement = compactChoiceHand
        ? {
            angle: (index - (hand.length - 1) / 2) * handLayout.anglePerStep,
            renderOrder: index,
            x:
              (index - (hand.length - 1) / 2) *
              Math.min(
                handLayout.choiceMaxSpacing,
                hand.length > 1
                  ? handLayout.maxSpread / (hand.length - 1)
                  : 0,
              ),
            y:
              handBaseY +
              Math.abs(index - (hand.length - 1) / 2) * handLayout.risePerStep,
          }
        : getGameplayLocalHandPlacement(
            hand.length,
            index,
            selectedIndex >= 0 ? selectedIndex : null,
          );
      const restingPlacement = compactChoiceHand
        ? placement
        : getGameplayLocalHandPlacement(hand.length, index, null);
      return { card, index, legal, placement, restingPlacement, selected };
    });
    cards
      .sort(
        (left, right) =>
          left.placement.renderOrder - right.placement.renderOrder,
      )
      .forEach(
        ({ card, legal, placement, restingPlacement, selected }) => {
          const cardNode = createCardView(handLayer, this.assets, card, {
            height: cardHeight,
            onActivate:
              canPlay && legal
                ? () => {
                    if (this.selectedCardId === card.id) {
                      return;
                    }
                    this.pendingConfirmActionPulse =
                      this.selectedCardId === null;
                    this.selectedCardId = card.id;
                    this.pendingSelectedCardAnimationId = card.id;
                    this.feedbackText = null;
                    if (this.options.preferences.vibrationEnabled) {
                      void this.options.onVibrate().catch(() => {
                        // Selection haptics are optional and never block play.
                      });
                    }
                    this.refreshPresentation();
                  }
                : undefined,
            selectedHaloOffsetY: handLayout.selectedHaloOffsetY,
            state: selected
              ? "selected"
              : canPlay && this.options.preferences.showLegalHints
                ? legal
                  ? "legal"
                  : "illegal"
                : "normal",
            width: cardWidth,
          });
          const targetPosition = new Vec3(placement.x, placement.y, 0);
          cardNode.setPosition(targetPosition);
          cardNode.angle = placement.angle;
          if (selected && selectedAnimationId === card.id) {
            cardNode.setPosition(
              new Vec3(restingPlacement.x, restingPlacement.y, 0),
            );
            cardNode.angle = restingPlacement.angle;
            tween(cardNode)
              .to(
                handLayout.selectedAnimationSeconds,
                { angle: placement.angle, position: targetPosition },
                { easing: "cubicOut" },
              )
              .start();
          }
        },
      );

    if (!canPlay) {
      return;
    }

    if (this.selectedCardId) {
      const action = GAMEPLAY_LAYOUT.turnAction;
      const confirmButton = createButton(
        this.dynamicRoot,
        this.assets,
        "确认\n出牌",
        action.width,
        action.height,
        action.x,
        action.y,
        () => {
          if (!this.selectedCardId) {
            return;
          }

          this.adapter.submitIntent({
            cardId: this.selectedCardId,
            type: "play-card",
          });
        },
        true,
        TURN_ACTION_BUTTON,
      );
      if (pulseConfirmAction) {
        tween(confirmButton)
          .to(
            handLayout.confirmPulseStepSeconds,
            {
              scale: new Vec3(
                handLayout.confirmPulseScale,
                handLayout.confirmPulseScale,
                1,
              ),
            },
            { easing: "cubicOut" },
          )
          .to(
            handLayout.confirmPulseStepSeconds,
            { scale: new Vec3(1, 1, 1) },
            { easing: "cubicOut" },
          )
          .start();
      }
      return;
    }

    const action = GAMEPLAY_LAYOUT.turnAction;
    const actionLabel = GAMEPLAY_LAYOUT.turnActionLabel;
    const turnCallout = createSprite(
      this.dynamicRoot,
      this.assets,
      "ui.turnButton" as AssetKey,
      action.width,
      action.height,
      action.x,
      action.y,
    );
    createText(
      turnCallout,
      this.assets,
      "你的\n回合",
      actionLabel.width,
      actionLabel.height,
      actionLabel.x,
      actionLabel.y,
      {
        color: new Color(70, 39, 21, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: actionLabel.fontSize,
        lineHeight: 48,
      },
    );
  }

  private renderHeader(update: MatchUpdate): void {
    const state = update.snapshot.publicState;
    const roundHeader = createSprite(
      this.dynamicRoot,
      this.assets,
      GAMEPLAY_ASSETS.roundHeader as AssetKey,
      GAMEPLAY_LAYOUT.roundHeader.width,
      GAMEPLAY_LAYOUT.roundHeader.height,
      GAMEPLAY_LAYOUT.roundHeader.x,
      GAMEPLAY_LAYOUT.roundHeader.y,
    );
    createText(
      roundHeader,
      this.assets,
      `第 ${state.roundIndex + 1} 轮\n每人 ${state.handSize} 张`,
      GAMEPLAY_LAYOUT.roundHeaderLabel.width,
      GAMEPLAY_LAYOUT.roundHeaderLabel.height,
      0,
      GAMEPLAY_LAYOUT.roundHeaderLabel.y - GAMEPLAY_LAYOUT.roundHeader.y,
      {
        color: new Color(91, 45, 28, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: GAMEPLAY_LAYOUT.roundHeaderLabel.fontSize,
        lineHeight: GAMEPLAY_LAYOUT.roundHeaderLabel.lineHeight,
      },
    );

    this.renderTrumpStatus(update.snapshot);
    this.renderTimer(update);
  }

  private renderPhaseOverlay(update: MatchUpdate): void {
    const snapshot = update.snapshot;
    const state = snapshot.publicState;
    const viewerPlayerId = snapshot.privateState.playerId;
    const canInteract = this.isInteractionEnabled(update);
    const rightActionOccupant = getGameplayRightActionOccupant(
      canInteract,
      state.phase,
      state.currentPlayerId === viewerPlayerId,
    );

    if (
      canInteract &&
      state.phase === "trump-select" &&
      state.currentPlayerId === viewerPlayerId
    ) {
      this.renderTrumpChooser();
      return;
    }

    if (rightActionOccupant === "bid-trump-status") {
      this.renderBidPanel(snapshot);
      return;
    }

    if (state.phase === "round-score") {
      const canContinue =
        canInteract && (update.controls?.canContinueRound ?? true);
      if (this.showRoundRanking) {
        this.renderRoundRanking(snapshot, canContinue);
      } else {
        this.renderRoundResults(snapshot, canContinue);
      }
      return;
    }

    if (state.phase === "match-end") {
      this.renderMatchResults(
        snapshot,
        canInteract && (update.controls?.canRematch ?? true),
      );
    }
  }

  private renderSeats(snapshot: PlayerMatchSnapshot): void {
    const state = snapshot.publicState;
    const players = getRelativePlayers(
      state.players,
      snapshot.privateState.playerId,
    );
    const slots =
      players.length === 3
        ? GAMEPLAY_SLOT_MAPS[3]
        : players.length === 4
          ? GAMEPLAY_SLOT_MAPS[4]
          : players.length === 5
            ? GAMEPLAY_SLOT_MAPS[5]
            : GAMEPLAY_SLOT_MAPS[6];
    const dealerId = state.players[state.dealerIndex]?.id;

    const localPlayer = players[0];
    if (localPlayer) {
      this.renderLocalStats(localPlayer);
    }

    players.forEach((player, relativeIndex) => {
      if (relativeIndex === 0) {
        return;
      }

      const slot = slots[relativeIndex];
      const [x, y] = GAMEPLAY_SEAT_POSITIONS[slot];
      const seat = createPlayerSeatView(this.dynamicRoot, this.assets, player, {
        current: state.currentPlayerId === player.id,
        dealer: dealerId === player.id,
        handCount: state.handCounts[player.id] ?? 0,
        local: false,
        slot,
      });
      seat.setPosition(new Vec3(x, y, 0));
    });
  }

  private renderLocalStats(player: MatchPlayerState): void {
    const bid = player.bid === null ? "—" : String(player.bid);
    const bidPanel = createSprite(
      this.dynamicRoot,
      this.assets,
      GAMEPLAY_ASSETS.statPaper as AssetKey,
      GAMEPLAY_LAYOUT.localStats.paper.width,
      GAMEPLAY_LAYOUT.localStats.paper.height,
      GAMEPLAY_LAYOUT.localStats.paper.x,
      GAMEPLAY_LAYOUT.localStats.paper.y,
    );
    createText(
      bidPanel,
      this.assets,
      `预测 ${bid}`,
      GAMEPLAY_LAYOUT.localStats.labelWidth,
      GAMEPLAY_LAYOUT.localStats.labelHeight,
      0,
      0,
      {
        color: new Color(83, 49, 29, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: 26,
      },
    );

    const wonPanel = createSprite(
      this.dynamicRoot,
      this.assets,
      GAMEPLAY_ASSETS.statGreen as AssetKey,
      GAMEPLAY_LAYOUT.localStats.green.width,
      GAMEPLAY_LAYOUT.localStats.green.height,
      GAMEPLAY_LAYOUT.localStats.green.x,
      GAMEPLAY_LAYOUT.localStats.green.y,
    );
    createText(
      wonPanel,
      this.assets,
      `已赢 ${player.tricksWon}`,
      GAMEPLAY_LAYOUT.localStats.labelWidth,
      GAMEPLAY_LAYOUT.localStats.labelHeight,
      GAMEPLAY_LAYOUT.localStats.greenLabelOffsetX,
      0,
      {
        color: new Color(239, 228, 185, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: 26,
        outlineColor: new Color(29, 54, 38, 255),
        outlineWidth: 1,
      },
    );
  }

  private renderTimer(update: MatchUpdate): void {
    const remaining = update.turnSecondsRemaining;

    if (remaining === null) {
      return;
    }

    const timer = GAMEPLAY_LAYOUT.timer;

    createSprite(
      this.dynamicRoot,
      this.assets,
      "ui.countdownRing" as AssetKey,
      timer.width,
      timer.height,
      timer.x,
      timer.y,
    );
    createText(
      this.dynamicRoot,
      this.assets,
      String(remaining),
      82,
      56,
      timer.x,
      timer.y + 11,
      {
        fontKey: "font.interface" as AssetKey,
        fontSize: 34,
        outlineColor: new Color(44, 22, 14, 255),
        outlineWidth: 2,
      },
    );
    createText(
      this.dynamicRoot,
      this.assets,
      "秒",
      42,
      24,
      timer.x,
      timer.y - 26,
      {
        color: new Color(246, 225, 184, 255),
        fontKey: "font.interface" as AssetKey,
        fontSize: 15,
        outlineColor: new Color(44, 22, 14, 255),
        outlineWidth: 1,
      },
    );
  }

  private renderTrick(update: MatchUpdate): void {
    const snapshot = update.snapshot;
    const state = snapshot.publicState;
    const winnerId = state.completedTrick?.winnerId ?? null;
    const playedCard = GAMEPLAY_LAYOUT.playedCard;
    const spacing = Math.min(
      playedCard.maxSpacing,
      state.trick.plays.length > 1
        ? playedCard.maxSpread / (state.trick.plays.length - 1)
        : 0,
    );
    const center = (state.trick.plays.length - 1) / 2;

    state.trick.plays.forEach((play, index) => {
      const offset = index - center;
      const card = createCardView(this.dynamicRoot, this.assets, play.card, {
        height: playedCard.height,
        state: "played",
        width: playedCard.width,
        winner: winnerId === play.playerId,
      });
      card.setPosition(
        new Vec3(
          offset * spacing,
          playedCard.baseY - Math.abs(offset) * playedCard.arcDropPerStep,
          index,
        ),
      );
      card.angle = offset * playedCard.anglePerStep;
    });

    if (state.trick.plays.length === 0) {
      const viewerPlayerId = snapshot.privateState.playerId;
      let phaseLabel = getPhaseLabel(snapshot);
      if (
        state.phase === "trick-play" &&
        state.currentPlayerId === viewerPlayerId
      ) {
        phaseLabel = this.selectedCardId
          ? "已选好手牌，点击右侧确认出牌"
          : "轮到你出牌 · 请选择一张可出的手牌";
      }
      const statusText = this.feedbackText
        ? `${phaseLabel} · ${this.feedbackText}`
        : phaseLabel;
      createText(
        this.dynamicRoot,
        this.assets,
        statusText,
        GAMEPLAY_LAYOUT.tableStatus.width,
        GAMEPLAY_LAYOUT.tableStatus.height,
        GAMEPLAY_LAYOUT.tableStatus.x,
        GAMEPLAY_LAYOUT.tableStatus.y,
        {
          color: new Color(222, 210, 178, 210),
          fontKey: "font.interface" as AssetKey,
          fontSize: 23,
          outlineColor: new Color(28, 21, 17, 255),
          outlineWidth: 2,
        },
      );
    }
  }

  private renderTrumpStatus(
    snapshot: PlayerMatchSnapshot,
    parent: Node = this.dynamicRoot,
    origin: GameplayLayoutRect = GAMEPLAY_LAYOUT.trumpStatus,
  ): Node {
    const state = snapshot.publicState;
    const trumpLayout = getGameplayTrumpStatusRects(origin);
    const trumpStatus = trumpLayout.status;
    const trumpIcon = trumpLayout.icon;
    const trumpLabel = trumpLayout.label;
    const statusNode = createContainer(
      parent,
      "TrumpStatus",
      trumpStatus.width,
      trumpStatus.height,
      trumpStatus.x,
      trumpStatus.y,
    );
    createSprite(
      statusNode,
      this.assets,
      GAMEPLAY_ASSETS.statPaper as AssetKey,
      trumpStatus.width,
      trumpStatus.height,
    );

    const iconKey = state.trump
      ? (`card.face.${state.trump}` as AssetKey)
      : state.revealedCard
        ? getCardFaceKey(state.revealedCard)
        : null;
    if (iconKey) {
      const icon = createSprite(
        statusNode,
        this.assets,
        iconKey,
        trumpIcon.width,
        trumpIcon.height,
        trumpIcon.x - trumpStatus.x,
        trumpIcon.y - trumpStatus.y,
      );
      if (!state.trump) {
        const sprite = icon.getComponent(Sprite);
        if (sprite) {
          sprite.color = new Color(255, 255, 255, 210);
        }
      }
    }

    const label = state.trump
      ? `王牌 · ${SUIT_NAMES[state.trump]}`
      : state.phase === "trump-select"
        ? "等待选牌"
        : "本轮无王牌";
    const labelWidth = iconKey
      ? trumpLabel.width
      : trumpLayout.contentSafe.width - 12;
    const labelX = iconKey ? trumpLabel.x - trumpStatus.x : 0;
    createText(
      statusNode,
      this.assets,
      label,
      labelWidth,
      trumpLabel.height,
      labelX,
      trumpLabel.y - trumpStatus.y,
      {
        color: new Color(86, 47, 29, 255),
        fontKey: "font.interface" as AssetKey,
        fontSize: GAMEPLAY_LAYOUT.trumpLabel.fontSize,
      },
    );
    return statusNode;
  }

  private renderTrumpChooser(): void {
    const backdrop = createModalBackdrop(this.dynamicRoot);
    createSprite(
      backdrop,
      this.assets,
      "ui.panel.primary" as AssetKey,
      900,
      500,
      0,
      0,
      true,
    );
    createText(backdrop, this.assets, "选择本轮王牌", 620, 78, 0, 174, {
      color: new Color(91, 45, 28, 255),
      fontKey: "font.display" as AssetKey,
      fontSize: 42,
    });

    const suits: readonly Suit[] = ["mountain", "knot", "leaf", "sun"];
    suits.forEach((suit, index) => {
      const x = (index - 1.5) * 190;
      const card = createSprite(
        backdrop,
        this.assets,
        `card.face.${suit}` as AssetKey,
        126,
        189,
        x,
        28,
      );
      card.on(Node.EventType.TOUCH_END, () => {
        this.adapter.submitIntent({ trump: suit, type: "choose-trump" });
      });
      createText(
        backdrop,
        this.assets,
        `${SUIT_NAMES[suit]}花色`,
        150,
        42,
        x,
        -102,
        {
          color: new Color(246, 225, 184, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 26,
          outlineColor: new Color(56, 28, 17, 255),
          outlineWidth: 2,
        },
      );
    });
  }

  private renderBidPanel(snapshot: PlayerMatchSnapshot): void {
    const handSize = snapshot.publicState.handSize;
    const backdrop = createModalBackdrop(this.dynamicRoot);
    createSprite(
      backdrop,
      this.assets,
      "ui.panel.primary" as AssetKey,
      720,
      500,
      0,
      0,
      true,
    );
    createText(backdrop, this.assets, "预测本轮赢墩数", 540, 72, 0, 170, {
      color: new Color(246, 225, 184, 255),
      fontKey: "font.display" as AssetKey,
      fontSize: 40,
      outlineColor: new Color(56, 28, 17, 255),
      outlineWidth: 2,
    });
    createText(backdrop, this.assets, String(this.bidDraft), 220, 126, 0, 54, {
      color: new Color(255, 224, 152, 255),
      fontKey: "font.display" as AssetKey,
      fontSize: 74,
      outlineColor: new Color(56, 28, 17, 255),
      outlineWidth: 2,
    });
    createText(backdrop, this.assets, `可选 0–${handSize}`, 260, 40, 0, -42, {
      color: new Color(224, 205, 171, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: 22,
      outlineColor: new Color(56, 28, 17, 255),
      outlineWidth: 1,
    });
    createButton(backdrop, this.assets, "少一墩", 190, 82, -206, 46, () => {
      this.bidDraft = Math.max(0, this.bidDraft - 1);
      this.refreshPresentation();
    });
    createButton(backdrop, this.assets, "多一墩", 190, 82, 206, 46, () => {
      this.bidDraft = Math.min(handSize, this.bidDraft + 1);
      this.refreshPresentation();
    });
    createButton(backdrop, this.assets, "确认预测", 250, 98, 0, -150, () => {
      this.adapter.submitIntent({ bid: this.bidDraft, type: "submit-bid" });
    });
    this.renderTrumpStatus(snapshot, backdrop, GAMEPLAY_LAYOUT.bidTrumpStatus);
  }

  private createScoreSheet(parent: Node, title: string): Node {
    const sheet = createSprite(
      parent,
      this.assets,
      ROUND_RESULTS_ASSETS.panel as AssetKey,
      ROUND_RESULTS_LAYOUT.panel.width,
      ROUND_RESULTS_LAYOUT.panel.height,
      ROUND_RESULTS_LAYOUT.panel.x,
      ROUND_RESULTS_LAYOUT.panel.y,
    );
    sheet.name = `ScoreSheet:${title}`;
    createText(
      sheet,
      this.assets,
      title,
      ROUND_RESULTS_LAYOUT.title.width,
      ROUND_RESULTS_LAYOUT.title.height,
      ROUND_RESULTS_LAYOUT.title.x,
      ROUND_RESULTS_LAYOUT.title.y,
      {
        color: new Color(74, 42, 24, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: ROUND_RESULTS_LAYOUT.title.fontSize,
      },
    );
    return sheet;
  }

  private renderRoundScoreRows(
    sheet: Node,
    snapshot: PlayerMatchSnapshot,
  ): void {
    const state = snapshot.publicState;
    const headings = [
      ["玩家", ROUND_RESULTS_LAYOUT.header.player],
      ["预测", ROUND_RESULTS_LAYOUT.header.bid],
      ["赢墩", ROUND_RESULTS_LAYOUT.header.tricks],
      ["本轮", ROUND_RESULTS_LAYOUT.header.round],
      ["总分", ROUND_RESULTS_LAYOUT.header.total],
    ] as const;
    headings.forEach(([label, rect]) => {
      createText(
        sheet,
        this.assets,
        label,
        rect.width,
        rect.height,
        rect.x,
        rect.y,
        {
          color: new Color(243, 222, 177, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 25,
          outlineColor: new Color(35, 24, 24, 255),
          outlineWidth: 1,
        },
      );
    });

    state.players.forEach((player, index) => {
      const entry = state.scoreEntries.find(
        (candidate) => candidate.playerId === player.id,
      );
      const roundScore = entry?.roundScore ?? player.roundScore ?? 0;
      const total = entry?.total ?? player.totalScore;
      const y = getRoundResultsRowY(index);
      createSprite(
        sheet,
        this.assets,
        getPlayerAvatarAssetKey(player),
        ROUND_RESULTS_LAYOUT.rows.avatar.width,
        ROUND_RESULTS_LAYOUT.rows.avatar.height,
        ROUND_RESULTS_LAYOUT.rows.avatar.x,
        y,
      );
      createText(
        sheet,
        this.assets,
        player.name,
        ROUND_RESULTS_LAYOUT.rows.name.width,
        ROUND_RESULTS_LAYOUT.rows.name.height,
        ROUND_RESULTS_LAYOUT.rows.name.x,
        y,
        {
          color: new Color(70, 42, 25, 255),
          fontKey: "font.display" as AssetKey,
          fontSize: 32,
        },
      );
      createText(
        sheet,
        this.assets,
        String(entry?.bid ?? player.bid ?? 0),
        ROUND_RESULTS_LAYOUT.rows.bid.width,
        ROUND_RESULTS_LAYOUT.rows.bid.height,
        ROUND_RESULTS_LAYOUT.rows.bid.x,
        y,
        {
          color: new Color(70, 42, 25, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 30,
        },
      );
      createText(
        sheet,
        this.assets,
        String(entry?.tricksWon ?? player.tricksWon),
        ROUND_RESULTS_LAYOUT.rows.tricks.width,
        ROUND_RESULTS_LAYOUT.rows.tricks.height,
        ROUND_RESULTS_LAYOUT.rows.tricks.x,
        y,
        {
          color: new Color(70, 42, 25, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 30,
        },
      );
      createText(
        sheet,
        this.assets,
        formatSignedScore(roundScore),
        ROUND_RESULTS_LAYOUT.rows.round.width,
        ROUND_RESULTS_LAYOUT.rows.round.height,
        ROUND_RESULTS_LAYOUT.rows.round.x,
        y,
        {
          color: getScoreColor(roundScore),
          fontKey: "font.display" as AssetKey,
          fontSize: 32,
        },
      );
      createText(
        sheet,
        this.assets,
        String(total),
        ROUND_RESULTS_LAYOUT.rows.total.width,
        ROUND_RESULTS_LAYOUT.rows.total.height,
        ROUND_RESULTS_LAYOUT.rows.total.x,
        y,
        {
          color: new Color(70, 42, 25, 255),
          fontKey: "font.display" as AssetKey,
          fontSize: 32,
        },
      );
    });
  }

  private renderRoundResults(
    snapshot: PlayerMatchSnapshot,
    canContinueRound: boolean,
  ): void {
    const backdrop = createModalBackdrop(this.dynamicRoot);
    const state = snapshot.publicState;
    const sheet = this.createScoreSheet(
      backdrop,
      `第 ${state.roundIndex + 1} 轮结算`,
    );
    this.renderRoundScoreRows(sheet, snapshot);

    createText(
      sheet,
      this.assets,
      "预测准确获得 20 分基础分",
      ROUND_RESULTS_LAYOUT.footer.hint.width,
      ROUND_RESULTS_LAYOUT.footer.hint.height,
      ROUND_RESULTS_LAYOUT.footer.hint.x,
      ROUND_RESULTS_LAYOUT.footer.hint.y,
      {
        color: new Color(80, 46, 26, 255),
        fontKey: "font.interface" as AssetKey,
        fontSize: 24,
      },
    );

    createButton(
      sheet,
      this.assets,
      "查看总榜",
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.width,
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.height,
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.x,
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.y,
      () => {
        this.showRoundRanking = true;
        this.refreshPresentation();
      },
      true,
      PAPER_BUTTON,
    );

    if (canContinueRound) {
      createButton(
        sheet,
        this.assets,
        state.roundIndex + 1 >= state.roundHandCounts.length
          ? "进入最终总榜"
          : "继续下一轮",
        ROUND_RESULTS_LAYOUT.footer.primaryButton.width,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.height,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.x,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.y,
        () => this.adapter.requestContinueRound(),
        true,
        GREEN_BUTTON,
      );
    } else {
      createText(
        sheet,
        this.assets,
        "等待房主继续",
        ROUND_RESULTS_LAYOUT.footer.primaryButton.width,
        52,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.x,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.y,
        {
          color: new Color(86, 54, 34, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 23,
        },
      );
    }
  }

  private renderRoundRanking(
    snapshot: PlayerMatchSnapshot,
    canContinueRound: boolean,
  ): void {
    const backdrop = createModalBackdrop(this.dynamicRoot);
    const state = snapshot.publicState;
    const ranking = [...state.players].sort(
      (left, right) => right.totalScore - left.totalScore,
    );
    const sheet = this.createScoreSheet(backdrop, "当前总榜");
    const rankingHeadings = [
      ["名次", ROUND_RESULTS_LAYOUT.rankingHeader.rank],
      ["玩家", ROUND_RESULTS_LAYOUT.rankingHeader.player],
      ["本轮", ROUND_RESULTS_LAYOUT.rankingHeader.round],
      ["总分", ROUND_RESULTS_LAYOUT.rankingHeader.total],
    ] as const;
    rankingHeadings.forEach(([label, rect]) => {
      createText(
        sheet,
        this.assets,
        label,
        rect.width,
        rect.height,
        rect.x,
        rect.y,
        {
          color: new Color(243, 222, 177, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 25,
          outlineColor: new Color(35, 24, 24, 255),
          outlineWidth: 1,
        },
      );
    });

    ranking.forEach((player, index) => {
      const y = getRoundResultsRowY(index);
      createText(sheet, this.assets, String(index + 1), 72, 44, -520, y, {
        color:
          index === 0
            ? new Color(164, 53, 39, 255)
            : new Color(70, 42, 25, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: index === 0 ? 31 : 27,
      });
      createSprite(
        sheet,
        this.assets,
        getPlayerAvatarAssetKey(player),
        ROUND_RESULTS_LAYOUT.rankingRows.avatar.width,
        ROUND_RESULTS_LAYOUT.rankingRows.avatar.height,
        ROUND_RESULTS_LAYOUT.rankingRows.avatar.x,
        y,
      );
      createText(
        sheet,
        this.assets,
        player.name,
        ROUND_RESULTS_LAYOUT.rankingRows.name.width,
        ROUND_RESULTS_LAYOUT.rankingRows.name.height,
        ROUND_RESULTS_LAYOUT.rankingRows.name.x,
        y,
        {
          color: new Color(70, 42, 25, 255),
          fontKey: "font.display" as AssetKey,
          fontSize: 32,
        },
      );
      createText(
        sheet,
        this.assets,
        formatSignedScore(player.roundScore ?? 0),
        ROUND_RESULTS_LAYOUT.rankingRows.round.width,
        ROUND_RESULTS_LAYOUT.rankingRows.round.height,
        ROUND_RESULTS_LAYOUT.rankingRows.round.x,
        y,
        {
          color: getScoreColor(player.roundScore ?? 0),
          fontKey: "font.display" as AssetKey,
          fontSize: 32,
        },
      );
      createText(
        sheet,
        this.assets,
        String(player.totalScore),
        ROUND_RESULTS_LAYOUT.rankingRows.total.width,
        ROUND_RESULTS_LAYOUT.rankingRows.total.height,
        ROUND_RESULTS_LAYOUT.rankingRows.total.x,
        y,
        {
          color: new Color(70, 42, 25, 255),
          fontKey: "font.display" as AssetKey,
          fontSize: 32,
        },
      );
    });

    createButton(
      sheet,
      this.assets,
      "返回本轮",
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.width,
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.height,
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.x,
      ROUND_RESULTS_LAYOUT.footer.secondaryButton.y,
      () => {
        this.showRoundRanking = false;
        this.refreshPresentation();
      },
      true,
      PAPER_BUTTON,
    );
    if (canContinueRound) {
      createButton(
        sheet,
        this.assets,
        state.roundIndex + 1 >= state.roundHandCounts.length
          ? "进入最终总榜"
          : "继续下一轮",
        ROUND_RESULTS_LAYOUT.footer.primaryButton.width,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.height,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.x,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.y,
        () => this.adapter.requestContinueRound(),
        true,
        GREEN_BUTTON,
      );
    } else {
      createText(
        sheet,
        this.assets,
        "等待房主继续",
        ROUND_RESULTS_LAYOUT.footer.primaryButton.width,
        52,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.x,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.y,
        {
          color: new Color(86, 54, 34, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 23,
        },
      );
    }
  }

  private renderMatchResults(
    snapshot: PlayerMatchSnapshot,
    canRematch: boolean,
  ): void {
    const backdrop = createModalBackdrop(this.dynamicRoot);
    const state = snapshot.publicState;
    const ranking = [...state.players].sort(
      (left, right) => right.totalScore - left.totalScore,
    );
    const sheet = this.createScoreSheet(
      backdrop,
      `${state.mode === "quick" ? "快速局" : "经典局"} · 最终总榜`,
    );
    const finalHeadings = [
      ["名次", ROUND_RESULTS_LAYOUT.finalHeader.rank],
      ["玩家", ROUND_RESULTS_LAYOUT.finalHeader.player],
      ["完成轮数", ROUND_RESULTS_LAYOUT.finalHeader.completed],
      ["总分", ROUND_RESULTS_LAYOUT.finalHeader.total],
    ] as const;
    finalHeadings.forEach(([label, rect]) => {
      createText(
        sheet,
        this.assets,
        label,
        rect.width,
        rect.height,
        rect.x,
        rect.y,
        {
          color: new Color(243, 222, 177, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 25,
          outlineColor: new Color(35, 24, 24, 255),
          outlineWidth: 1,
        },
      );
    });
    ranking.forEach((player, index) => {
      const y = getRoundResultsRowY(index);
      createText(sheet, this.assets, String(index + 1), 72, 44, -520, y, {
        color:
          index === 0
            ? new Color(164, 53, 39, 255)
            : new Color(70, 42, 25, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: index === 0 ? 31 : 27,
      });
      createSprite(
        sheet,
        this.assets,
        getPlayerAvatarAssetKey(player),
        ROUND_RESULTS_LAYOUT.finalRows.avatar.width,
        ROUND_RESULTS_LAYOUT.finalRows.avatar.height,
        ROUND_RESULTS_LAYOUT.finalRows.avatar.x,
        y,
      );
      createText(
        sheet,
        this.assets,
        player.name,
        ROUND_RESULTS_LAYOUT.finalRows.name.width,
        ROUND_RESULTS_LAYOUT.finalRows.name.height,
        ROUND_RESULTS_LAYOUT.finalRows.name.x,
        y,
        {
          color: new Color(70, 42, 25, 255),
          fontKey: "font.display" as AssetKey,
          fontSize: 32,
        },
      );
      createText(
        sheet,
        this.assets,
        `${state.roundHandCounts.length} 轮`,
        ROUND_RESULTS_LAYOUT.finalRows.completed.width,
        ROUND_RESULTS_LAYOUT.finalRows.completed.height,
        ROUND_RESULTS_LAYOUT.finalRows.completed.x,
        y,
        {
          color: new Color(70, 42, 25, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 30,
        },
      );
      createText(
        sheet,
        this.assets,
        String(player.totalScore),
        ROUND_RESULTS_LAYOUT.finalRows.total.width,
        ROUND_RESULTS_LAYOUT.finalRows.total.height,
        ROUND_RESULTS_LAYOUT.finalRows.total.x,
        y,
        {
          color: new Color(70, 42, 25, 255),
          fontKey: "font.display" as AssetKey,
          fontSize: 32,
        },
      );
    });
    createText(
      sheet,
      this.assets,
      `共完成 ${state.roundHandCounts.length} 轮好友牌局`,
      ROUND_RESULTS_LAYOUT.footer.hint.width,
      ROUND_RESULTS_LAYOUT.footer.hint.height,
      ROUND_RESULTS_LAYOUT.footer.hint.x,
      ROUND_RESULTS_LAYOUT.footer.hint.y,
      {
        color: new Color(85, 54, 33, 255),
        fontKey: "font.interface" as AssetKey,
        fontSize: 22,
      },
    );
    const onReturnHome = this.options.onReturnHome;
    const homePlacement = getPracticeHomeActionPlacement(
      "match-end",
      onReturnHome !== null,
    );
    if (onReturnHome && homePlacement === "results-footer") {
      createButton(
        sheet,
        this.assets,
        "返回首页",
        ROUND_RESULTS_LAYOUT.footer.secondaryButton.width,
        ROUND_RESULTS_LAYOUT.footer.secondaryButton.height,
        ROUND_RESULTS_LAYOUT.footer.secondaryButton.x,
        ROUND_RESULTS_LAYOUT.footer.secondaryButton.y,
        onReturnHome,
        true,
        PAPER_BUTTON,
      );
    }
    if (canRematch) {
      createButton(
        sheet,
        this.assets,
        "再来一局",
        ROUND_RESULTS_LAYOUT.footer.primaryButton.width,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.height,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.x,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.y,
        () => {
          this.feedbackText = null;
          this.adapter.requestRematch();
        },
        true,
        GREEN_BUTTON,
      );
    } else {
      createText(
        sheet,
        this.assets,
        "等待房主发起重赛",
        ROUND_RESULTS_LAYOUT.footer.primaryButton.width,
        56,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.x,
        ROUND_RESULTS_LAYOUT.footer.primaryButton.y,
        {
          color: new Color(86, 54, 34, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 23,
        },
      );
    }
  }
}
