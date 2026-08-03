import { Color, Node, Sprite, Vec3, view } from "cc";
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
import { createCardView } from "./CardView";
import { createPlayerSeatView } from "./PlayerSeatView";
import {
  createButton,
  createContainer,
  createModalBackdrop,
  createSprite,
  createText,
} from "./UiFactory";

const HUMAN_PLAYER_ID = "player-you";

const SUIT_NAMES: Record<Suit, string> = {
  knot: "结",
  leaf: "叶",
  mountain: "山",
  sun: "日",
};

const SEAT_POSITIONS = [
  [-760, -292],
  [-760, 8],
  [-525, 298],
  [0, 374],
  [525, 298],
  [760, 8],
] as const;

const TRICK_POSITIONS = [
  [0, -112],
  [-178, -34],
  [-142, 104],
  [0, 142],
  [142, 104],
  [178, -34],
] as const;

const SLOT_MAPS: Record<number, readonly number[]> = {
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

function getRelativePlayers(
  players: readonly MatchPlayerState[],
): MatchPlayerState[] {
  const humanIndex = Math.max(
    0,
    players.findIndex((player) => player.id === HUMAN_PLAYER_ID),
  );

  return players.map(
    (_, offset) => players[(humanIndex + offset) % players.length],
  );
}

function getPhaseLabel(snapshot: PlayerMatchSnapshot): string {
  const state = snapshot.publicState;
  const currentPlayer = state.players.find(
    (player) => player.id === state.currentPlayerId,
  );

  if (state.phase === "trump-select") {
    return currentPlayer?.id === HUMAN_PLAYER_ID
      ? "请选择本轮王牌"
      : `等待 ${currentPlayer?.name ?? "发牌者"} 选择王牌`;
  }

  if (state.phase === "bid") {
    return currentPlayer?.id === HUMAN_PLAYER_ID
      ? "轮到你预测赢墩数"
      : `等待 ${currentPlayer?.name ?? "玩家"} 预测`;
  }

  if (state.phase === "trick-play") {
    return currentPlayer?.id === HUMAN_PLAYER_ID
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

function getEventFeedback(events: readonly MatchEvent[]): string | null {
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
    return `已记录预测 ${event.bid}`;
  }

  if (event.type === "card-played") {
    return "出牌已确认";
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

export class MatchSceneView {
  private bidDraft = 0;
  private currentUpdate: MatchUpdate | null = null;
  private readonly dynamicRoot: Node;
  private feedbackText: string | null = null;
  private lastPhase = "";
  private lastTurnPlayerId: string | null = null;
  private selectedCardId: string | null = null;
  private readonly viewRoot: Node;

  public constructor(
    root: Node,
    private readonly assets: AssetRegistry,
    private readonly adapter: IMatchAdapter,
  ) {
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
    const turnChanged = this.lastTurnPlayerId !== state.currentPlayerId;
    const phaseChanged = this.lastPhase !== state.phase;

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
      state.currentPlayerId !== HUMAN_PLAYER_ID
    ) {
      this.selectedCardId = null;
    }

    const feedback = getEventFeedback(update.events);
    if (feedback) {
      this.feedbackText = feedback;
    }

    this.lastPhase = state.phase;
    this.lastTurnPlayerId = state.currentPlayerId;
    this.clearDynamicRoot();
    this.renderHeader(update);
    this.renderSeats(snapshot);
    this.renderTrick(snapshot);
    this.renderHand(snapshot);
    this.renderFeedback();
    this.renderPhaseOverlay(snapshot);
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

  private renderFeedback(): void {
    if (!this.feedbackText) {
      return;
    }

    createSprite(
      this.dynamicRoot,
      this.assets,
      "ui.status.green" as AssetKey,
      560,
      100,
      0,
      242,
      true,
    );
    createText(
      this.dynamicRoot,
      this.assets,
      this.feedbackText,
      510,
      54,
      0,
      244,
      {
        fontKey: "font.interface" as AssetKey,
        fontSize: 25,
        outlineColor: new Color(29, 54, 38, 255),
        outlineWidth: 2,
      },
    );
  }

  private renderHand(snapshot: PlayerMatchSnapshot): void {
    const state = snapshot.publicState;
    const hand = snapshot.privateState.hand;
    const legalCardIds = new Set(snapshot.privateState.legalCardIds);
    const canPlay =
      state.phase === "trick-play" && state.currentPlayerId === HUMAN_PLAYER_ID;
    const spacing = Math.min(118, hand.length > 1 ? 900 / (hand.length - 1) : 0);
    const center = (hand.length - 1) / 2;

    hand.forEach((card, index) => {
      const legal = legalCardIds.has(card.id);
      const selected = card.id === this.selectedCardId;
      const cardNode = createCardView(this.dynamicRoot, this.assets, card, {
        height: 230,
        onActivate:
          canPlay && legal
            ? () => {
                this.selectedCardId = card.id;
                this.feedbackText = null;
                this.refreshPresentation();
              }
            : undefined,
        state: selected
          ? "selected"
          : canPlay
            ? legal
              ? "legal"
              : "illegal"
            : "normal",
        width: 153,
      });
      const offset = index - center;
      cardNode.setPosition(
        new Vec3(
          offset * spacing,
          -430 + (selected ? 22 : 0) + Math.abs(offset) * -2,
          index,
        ),
      );
      cardNode.angle = offset * 2.8;
    });

    if (canPlay && this.selectedCardId) {
      createButton(
        this.dynamicRoot,
        this.assets,
        "确认出牌",
        250,
        110,
        720,
        -410,
        () => {
          if (!this.selectedCardId) {
            return;
          }

          this.adapter.submitIntent({
            cardId: this.selectedCardId,
            type: "play-card",
          });
        },
      );
    }
  }

  private renderHeader(update: MatchUpdate): void {
    const state = update.snapshot.publicState;
    createSprite(
      this.dynamicRoot,
      this.assets,
      "ui.roundTitleScroll" as AssetKey,
      470,
      148,
      0,
      456,
      true,
    );
    createText(
      this.dynamicRoot,
      this.assets,
      `第 ${state.roundIndex + 1} 轮 · 每人 ${state.handSize} 张`,
      420,
      72,
      0,
      459,
      {
        color: new Color(91, 45, 28, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: 36,
      },
    );

    createSprite(
      this.dynamicRoot,
      this.assets,
      "ui.status.green" as AssetKey,
      590,
      104,
      0,
      345,
      true,
    );
    createText(
      this.dynamicRoot,
      this.assets,
      getPhaseLabel(update.snapshot),
      530,
      58,
      0,
      348,
      {
        fontKey: "font.interface" as AssetKey,
        fontSize: 28,
        outlineColor: new Color(28, 52, 37, 255),
        outlineWidth: 2,
      },
    );

    this.renderTrumpStatus(update.snapshot);
    this.renderTimer(update);
  }

  private renderPhaseOverlay(snapshot: PlayerMatchSnapshot): void {
    const state = snapshot.publicState;

    if (
      state.phase === "trump-select" &&
      state.currentPlayerId === HUMAN_PLAYER_ID
    ) {
      this.renderTrumpChooser();
      return;
    }

    if (state.phase === "bid" && state.currentPlayerId === HUMAN_PLAYER_ID) {
      this.renderBidPanel(state.handSize);
      return;
    }

    if (state.phase === "round-score") {
      this.renderRoundResults(snapshot);
      return;
    }

    if (state.phase === "match-end") {
      this.renderMatchResults(snapshot);
    }
  }

  private renderSeats(snapshot: PlayerMatchSnapshot): void {
    const state = snapshot.publicState;
    const players = getRelativePlayers(state.players);
    const slots = SLOT_MAPS[players.length] ?? SLOT_MAPS[6];
    const dealerId = state.players[state.dealerIndex]?.id;

    players.forEach((player, relativeIndex) => {
      const slot = slots[relativeIndex];
      const [x, y] = SEAT_POSITIONS[slot];
      const seat = createPlayerSeatView(
        this.dynamicRoot,
        this.assets,
        player,
        {
          current: state.currentPlayerId === player.id,
          dealer: dealerId === player.id,
          handCount: state.handCounts[player.id] ?? 0,
        },
      );
      seat.setPosition(new Vec3(x, y, 0));
    });
  }

  private renderTimer(update: MatchUpdate): void {
    const remaining = update.turnSecondsRemaining;

    if (remaining === null) {
      return;
    }

    createSprite(
      this.dynamicRoot,
      this.assets,
      "ui.countdownRing" as AssetKey,
      104,
      104,
      802,
      438,
    );
    createText(
      this.dynamicRoot,
      this.assets,
      String(remaining),
      82,
      82,
      802,
      439,
      {
        fontKey: "font.interface" as AssetKey,
        fontSize: 36,
        outlineColor: new Color(44, 22, 14, 255),
        outlineWidth: 2,
      },
    );
  }

  private renderTrick(snapshot: PlayerMatchSnapshot): void {
    const state = snapshot.publicState;
    const players = getRelativePlayers(state.players);
    const slots = SLOT_MAPS[players.length] ?? SLOT_MAPS[6];
    const playerSlots = new Map(
      players.map((player, index) => [player.id, slots[index]]),
    );
    const winnerId = state.completedTrick?.winnerId ?? null;

    state.trick.plays.forEach((play) => {
      const slot = playerSlots.get(play.playerId) ?? 3;
      const [x, y] = TRICK_POSITIONS[slot];
      const card = createCardView(this.dynamicRoot, this.assets, play.card, {
        height: 162,
        state: "played",
        width: 108,
        winner: winnerId === play.playerId,
      });
      card.setPosition(new Vec3(x, y, slot));
      card.angle = (slot - 3) * 3;
    });

    if (state.trick.plays.length === 0) {
      createText(
        this.dynamicRoot,
        this.assets,
        state.phase === "bid" ? "完成预测后开始第一墩" : "等待领出",
        360,
        52,
        0,
        12,
        {
          color: new Color(222, 210, 178, 210),
          fontKey: "font.interface" as AssetKey,
          fontSize: 24,
          outlineColor: new Color(28, 21, 17, 255),
          outlineWidth: 2,
        },
      );
    }
  }

  private renderTrumpStatus(snapshot: PlayerMatchSnapshot): void {
    const state = snapshot.publicState;
    createSprite(
      this.dynamicRoot,
      this.assets,
      "ui.plaque.small" as AssetKey,
      250,
      130,
      -810,
      420,
      true,
    );
    createText(this.dynamicRoot, this.assets, "王牌", 112, 38, -838, 455, {
      color: new Color(86, 47, 29, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: 24,
    });

    if (state.trump) {
      createSprite(
        this.dynamicRoot,
        this.assets,
        `card.face.${state.trump}` as AssetKey,
        64,
        96,
        -748,
        420,
      );
      createText(
        this.dynamicRoot,
        this.assets,
        SUIT_NAMES[state.trump],
        74,
        38,
        -838,
        414,
        {
          color: new Color(86, 47, 29, 255),
          fontKey: "font.display" as AssetKey,
          fontSize: 30,
        },
      );
      return;
    }

    const label = state.phase === "trump-select" ? "待选择" : "无王牌";
    createText(this.dynamicRoot, this.assets, label, 138, 44, -810, 412, {
      color: new Color(86, 47, 29, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: 24,
    });

    if (state.revealedCard) {
      const reveal = createSprite(
        this.dynamicRoot,
        this.assets,
        getCardFaceKey(state.revealedCard),
        58,
        87,
        -718,
        420,
      );
      const sprite = reveal.getComponent(Sprite);
      if (sprite) {
        sprite.color = new Color(255, 255, 255, 210);
      }
    }
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
      createText(backdrop, this.assets, `${SUIT_NAMES[suit]}花色`, 150, 42, x, -102, {
        color: new Color(86, 47, 29, 255),
        fontKey: "font.interface" as AssetKey,
        fontSize: 26,
      });
    });
  }

  private renderBidPanel(handSize: number): void {
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
      color: new Color(91, 45, 28, 255),
      fontKey: "font.display" as AssetKey,
      fontSize: 40,
    });
    createText(
      backdrop,
      this.assets,
      String(this.bidDraft),
      220,
      126,
      0,
      54,
      {
        color: new Color(91, 45, 28, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: 74,
      },
    );
    createText(
      backdrop,
      this.assets,
      `可选 0–${handSize}`,
      260,
      40,
      0,
      -42,
      {
        color: new Color(104, 70, 49, 255),
        fontKey: "font.interface" as AssetKey,
        fontSize: 22,
      },
    );
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
  }

  private renderRoundResults(snapshot: PlayerMatchSnapshot): void {
    const backdrop = createModalBackdrop(this.dynamicRoot);
    const state = snapshot.publicState;
    createSprite(
      backdrop,
      this.assets,
      "ui.panel.primary" as AssetKey,
      1100,
      790,
      0,
      0,
      true,
    );
    createText(
      backdrop,
      this.assets,
      `第 ${state.roundIndex + 1} 轮结算`,
      620,
      76,
      0,
      315,
      {
        color: new Color(91, 45, 28, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: 42,
      },
    );
    createText(
      backdrop,
      this.assets,
      "玩家        预测        赢墩        本轮        总分",
      860,
      48,
      0,
      245,
      {
        color: new Color(99, 60, 37, 255),
        fontKey: "font.interface" as AssetKey,
        fontSize: 25,
      },
    );

    state.players.forEach((player, index) => {
      const entry = state.scoreEntries.find(
        (candidate) => candidate.playerId === player.id,
      );
      const y = 188 - index * 67;
      createSprite(
        backdrop,
        this.assets,
        "ui.scoreRibbon" as AssetKey,
        900,
        74,
        0,
        y,
        false,
      );
      createText(
        backdrop,
        this.assets,
        `${player.name}        ${entry?.bid ?? 0}        ${entry?.tricksWon ?? 0}        ${entry?.roundScore ?? 0}        ${entry?.total ?? player.totalScore}`,
        820,
        46,
        0,
        y + 1,
        {
          color: new Color(75, 43, 27, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: 23,
        },
      );
    });

    createButton(
      backdrop,
      this.assets,
      state.roundIndex + 1 >= state.roundHandCounts.length
        ? "查看总榜"
        : "继续下一轮",
      300,
      102,
      0,
      -322,
      () => this.adapter.requestContinueRound(),
    );
  }

  private renderMatchResults(snapshot: PlayerMatchSnapshot): void {
    const backdrop = createModalBackdrop(this.dynamicRoot);
    const ranking = [...snapshot.publicState.players].sort(
      (left, right) => right.totalScore - left.totalScore,
    );
    createSprite(
      backdrop,
      this.assets,
      "ui.panel.primary" as AssetKey,
      980,
      760,
      0,
      0,
      true,
    );
    createText(backdrop, this.assets, "八轮快速局总榜", 620, 78, 0, 292, {
      color: new Color(91, 45, 28, 255),
      fontKey: "font.display" as AssetKey,
      fontSize: 44,
    });
    ranking.forEach((player, index) => {
      const y = 205 - index * 72;
      createSprite(
        backdrop,
        this.assets,
        "ui.scoreRibbon" as AssetKey,
        760,
        76,
        0,
        y,
        false,
      );
      createText(
        backdrop,
        this.assets,
        `${index + 1}. ${player.name}        ${player.totalScore} 分`,
        700,
        48,
        0,
        y + 1,
        {
          color: new Color(75, 43, 27, 255),
          fontKey: "font.interface" as AssetKey,
          fontSize: index === 0 ? 29 : 24,
        },
      );
    });
    createButton(backdrop, this.assets, "再来一局", 280, 102, 0, -300, () => {
      this.feedbackText = null;
      this.adapter.requestRematch();
    });
  }
}
