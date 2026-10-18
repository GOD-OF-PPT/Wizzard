import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  cardImages,
  gameArt,
  suitLabels,
  suitNames,
  type AvatarExpression,
} from "../game-assets";
import {
  SUITS,
  type Card,
  type MatchErrorCode,
  type MatchPhase,
  type MatchPlayerState,
  type Suit,
} from "@wizzard/game-core/contracts";
import { useLocalMatch } from "../hooks/useLocalMatch";
import type { LocalMatchController } from "../hooks/useLocalMatch";
import { CardView, type CardVisualState } from "./CardView";
import { WebResults } from "./WebResults";
import gameplayV3 from "../../art/runtime/web-v3/gameplay.png";
import gameplayChoicesPortraitV3 from "../../art/runtime/web-v3/portrait/gameplay-choices-v1.png";
import { WebTrumpChooser, WebBidPanel } from "./WebMatchChoices";
import { webGameplayAvatar } from "../web/avatar-assets";
import hourglass from "../../art/runtime/web-v3/hourglass-v1.png";
import trumpStatusArt from "../../art/runtime/web-v3/trump-status-v2.png";
import { webSuitIcons } from "../web/suit-assets";
import noTimerPatch from "../../art/runtime/web-v3/no-timer-patch-v1.png";
import noTimerPortraitPatch from "../../art/runtime/web-v3/portrait/no-timer-patch-v1.png";
import noActionPatch from "../../art/runtime/web-v3/gameplay-no-action-patch-v1.png";

type MatchScreenProps = {
  controller?: LocalMatchController;
  onExit: () => void;
  showLegalHints?: boolean;
};

const phaseLabels = {
  bid: "依次预测本轮赢墩数",
  "match-end": "快速局结束",
  "round-score": "本轮结算",
  "trick-play": "按领出花色出牌",
  "trick-result": "本墩结算",
  "trump-select": "发牌者选择王牌",
} as const;

const errorMessages: Record<MatchErrorCode, string> = {
  BID_NOT_INTEGER: "预测必须是整数",
  BID_OUT_OF_RANGE: "预测超出本轮可选范围",
  CARD_NOT_FOUND: "这张牌已经不在手中",
  CARD_NOT_LEGAL: "必须跟随本墩领出花色",
  DUPLICATE_COMMAND: "操作已经处理，请勿重复提交",
  INVALID_TRUMP: "请选择一种有效花色",
  NOT_YOUR_TURN: "还没轮到你",
  PLAYER_NOT_FOUND: "玩家状态已失效",
  STALE_VERSION: "牌桌已更新，请按最新状态操作",
  WRONG_PHASE: "当前阶段不能执行这个操作",
};

function getPlayerExpression(
  player: MatchPlayerState,
  currentPlayerId: string | null,
  completedWinnerId: string | undefined,
  phase: MatchPhase,
): AvatarExpression {
  if (completedWinnerId === player.id) {
    return "proud";
  }

  if (phase === "round-score" && (player.roundScore ?? 0) < 0) {
    return "mistake";
  }

  if (currentPlayerId === player.id) {
    return "thinking";
  }

  return "normal";
}

function PlayerSeat({
  completedWinnerId,
  currentPlayerId,
  displaySlot,
  handCount,
  isDealer,
  isLocal,
  phase,
  player,
}: {
  completedWinnerId?: string;
  currentPlayerId: string | null;
  displaySlot: number;
  handCount: number;
  isDealer: boolean;
  isLocal: boolean;
  phase: MatchPhase;
  player: MatchPlayerState;
}) {
  const expression = getPlayerExpression(
    player,
    currentPlayerId,
    completedWinnerId,
    phase,
  );
  const isActive = currentPlayerId === player.id;

  return (
    <article
      className={`player-seat player-seat--${displaySlot} ${isActive ? "is-active" : ""} ${player.isHuman ? "is-human" : "is-ai"}`}
      aria-label={`${player.name}${!player.isHuman ? "，AI" : ""}${isDealer ? "，发牌者" : ""}`}
    >
      <div className="player-seat__portrait-wrap">
        <img
          alt={`${player.name}头像`}
          className="player-seat__portrait"
          data-expression={expression}
          draggable="false"
          src={webGameplayAvatar(player.avatarKey)}
        />
        {!player.isHuman ? (
          <img
            alt="AI"
            className="player-seat__ai-badge"
            draggable="false"
            src={gameArt.aiBadge}
          />
        ) : null}
        {isDealer ? (
          <span className="player-seat__dealer">
            <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
            <span>发牌</span>
          </span>
        ) : null}
      </div>
      <strong>{player.name}</strong>
      <div className="player-seat__stats">
        <span className="player-seat__stat">
          <span>预测 {player.bid ?? "—"}</span>
        </span>
        <span className="player-seat__stat player-seat__stat--won">
          <span>赢墩 {player.tricksWon}</span>
        </span>
      </div>
      {isLocal && <span className="player-seat__you">你</span>}
      <div className="player-seat__hand-count" aria-label={`剩余 ${handCount} 张牌`}>
        <img alt="" aria-hidden="true" draggable="false" src={cardImages.back} />
        <span>{handCount}</span>
      </div>
    </article>
  );
}

function RoundHeader({
  handSize,
  phase,
  roundNumber,
  totalRounds,
}: {
  handSize: number;
  phase: MatchPhase;
  roundNumber: number;
  totalRounds: number;
}) {
  return (
    <header className="match-round-header">
      <img alt="" aria-hidden="true" draggable="false" src={gameArt.roundTitleScroll} />
      <div>
        <strong>
          第 {roundNumber} 轮
        </strong>
        <span>
          每人 {handSize} 张
        </span>
      </div>
    </header>
  );
}

function TrumpStatus({
  phase,
  revealedCard,
  trump,
}: {
  phase: MatchPhase;
  revealedCard: Card | null;
  trump: Suit | null;
}) {
  return (
    <aside className="trump-status">
      <img
        alt=""
        aria-hidden="true"
        className="trump-status__panel"
        draggable="false"
        src={trumpStatusArt}
      />
      {trump ? (
        <img
          alt=""
          aria-hidden="true"
          className="trump-status__suit"
          draggable="false"
          src={webSuitIcons[trump]}
        />
      ) : null}
      <div className="trump-status__content">
        <span>本轮王牌 ·</span>
        <strong>
          {trump
            ? suitNames[trump]
            : phase === "trump-select"
              ? "待选择"
              : "无王牌"}
        </strong>
      </div>
      {revealedCard ? (
        <div className="trump-status__reveal">
          <CardView card={revealedCard} state="played" />
        </div>
      ) : null}
    </aside>
  );
}

function TrickArea({
  completedWinnerId,
  plays,
  showEmpty,
}: {
  completedWinnerId?: string;
  plays: readonly { card: Card; playerId: string }[];
  showEmpty: boolean;
}) {
  return (
    <section aria-label="当前一墩" className="trick-area">
      {plays.length === 0 && showEmpty ? (
        <span className="trick-area__empty">
          <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
          <span>等待领出</span>
        </span>
      ) : null}
      {plays.map((play, index) => (
        <CardView
          card={play.card}
          className="trick-card"
          key={`${play.playerId}:${play.card.id}`}
          state="played"
          style={trickCardStyle(index, plays.length)}
          winner={completedWinnerId === play.playerId}
        />
      ))}
    </section>
  );
}

function trickCardStyle(index: number, count: number): CSSProperties {
  const midpoint = (count - 1) / 2;
  const offset = index - midpoint;
  const spread = count === 1 ? 0 : Math.min(25, 100 / (count - 1));

  return {
    "--trick-left": `${50 + offset * spread}%`,
    "--trick-rotation": "0deg",
    "--trick-top": "0%",
  } as CSSProperties;
}



function handCardStyle(index: number, count: number): CSSProperties {
  const midpoint = (count - 1) / 2;
  const offset = index - midpoint;
  // Reserve the right action lane, including card rotation and the 9px
  // selection-neighbour shift. The four-card reference remains unchanged.
  const spread = Math.min(14.8, 58 / Math.max(1, count - 1));
  const portraitSpread = Math.min(24, 63 / Math.max(1, count - 1));
  const customStyle = {
    "--fan-left": `${50 + offset * spread}%`,
    "--portrait-fan-left": `${50 + offset * portraitSpread}%`,
    "--fan-rotation": `${offset * Math.min(3.7, 18 / Math.max(1, count - 1))}deg`,
    "--fan-rise": `${Math.abs(offset) * 0.55}%`,
    zIndex: index + 1,
  };

  return customStyle as CSSProperties;
}

const displaySlotsByPlayerCount: Record<number, readonly number[]> = {
  3: [0, 1, 3],
  4: [0, 1, 2, 3],
  5: [0, 1, 2, 3, 4],
  6: [0, 2, 3, 1, 4, 5],
};

function getDisplaySlotMap(
  players: readonly MatchPlayerState[],
  localPlayerId: string,
): Map<string, number> {
  const localIndex = Math.max(
    0,
    players.findIndex((player) => player.id === localPlayerId),
  );
  const orderedPlayers = players.map(
    (_, offset) => players[(localIndex + offset) % players.length],
  );
  const slots = displaySlotsByPlayerCount[players.length] ??
    players.map((_, index) => index);

  return new Map(
    orderedPlayers.map((player, index) => [player.id, slots[index] ?? index]),
  );
}

function TurnTimer({
  playerName,
  secondsRemaining,
}: {
  playerName: string;
  secondsRemaining: number;
}) {
  return (
    <div
      aria-label={`${playerName}剩余 ${secondsRemaining} 秒`}
      className={`turn-timer ${secondsRemaining <= 5 ? "is-warning" : ""}`}
      role="timer"
    >
      <img alt="" aria-hidden="true" draggable="false" src={gameArt.countdownRing} />
      <div>
        <img className="turn-timer__hourglass" src={hourglass} alt="" />
        <span className="turn-timer__value"><strong>{secondsRemaining}</strong><span>秒</span></span>
      </div>
    </div>
  );
}

export function MatchScreen({ controller, ...props }: MatchScreenProps) {
  return controller ? <MatchSurface {...props} controller={controller} network={controller.connection !== undefined && controller.connection !== "local"} /> : <PracticeSurface {...props} />;
}

function PracticeSurface(props: Omit<MatchScreenProps, "controller">) {
  const controller = useLocalMatch();
  return <MatchSurface {...props} controller={controller} network={false} />;
}

function MatchSurface({ controller, network, onExit, showLegalHints = true }: Omit<MatchScreenProps, "controller"> & { controller: LocalMatchController; network: boolean }) {
  const { privateState, publicState } = controller.snapshot;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [confirmPulse, setConfirmPulse] = useState(false);
  const hasSelectedThisTurn = useRef(false);
  const currentPlayer = publicState.players.find(
    (player) => player.id === publicState.currentPlayerId,
  );
  const connectionReady = !network || controller.connection === "connected";
  const timerSeconds = connectionReady && currentPlayer?.isHuman ? controller.turnSecondsRemaining : null;
  const humanTurn = publicState.currentPlayerId === controller.humanPlayerId;
  const displaySlotByPlayerId = useMemo(
    () => getDisplaySlotMap(publicState.players, controller.humanPlayerId),
    [controller.humanPlayerId, publicState.players],
  );
  const legalCardIds = useMemo(
    () => new Set(privateState.legalCardIds),
    [privateState.legalCardIds],
  );
  const selectedCard = privateState.hand.find(
    (card) => card.id === selectedCardId,
  );

  useEffect(() => {
    if (!privateState.hand.some((card) => card.id === selectedCardId)) {
      setSelectedCardId(null);
    }
  }, [privateState.hand, selectedCardId]);

  useEffect(() => {
    if (!humanTurn || publicState.phase !== "trick-play") {
      hasSelectedThisTurn.current = false;
      setConfirmPulse(false);
      setSelectedCardId(null);
    }
  }, [humanTurn, publicState.phase]);

  useEffect(() => {
    if (!confirmPulse) return;
    const timeout = window.setTimeout(() => setConfirmPulse(false), 560);
    return () => window.clearTimeout(timeout);
  }, [confirmPulse]);

  useEffect(() => {
    const rejection = controller.events.find(
      (event) => event.type === "intent-rejected",
    );

    if (rejection?.type === "intent-rejected") {
      setFeedback(errorMessages[rejection.code]);
    }
  }, [controller.events]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 1900);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function selectCard(card: Card) {
    if (!humanTurn || publicState.phase !== "trick-play") {
      setFeedback("还没轮到你出牌");
      return;
    }

    if (!legalCardIds.has(card.id)) {
      setFeedback("必须跟随本墩领出花色");
      return;
    }

    if (!hasSelectedThisTurn.current) {
      hasSelectedThisTurn.current = true;
      setConfirmPulse(true);
    }
    // A successful selection supersedes the earlier illegal-card explanation.
    setFeedback(null);
    setSelectedCardId((current) => (current === card.id ? null : card.id));
  }

  function playSelectedCard() {
    if (!selectedCard) {
      setFeedback("请先选择一张合法手牌");
      return;
    }

    controller.sendIntent({ cardId: selectedCard.id, type: "play-card" });
  }

  return (
    <section
      aria-labelledby="match-title"
      className="screen-stage match-stage v3-match"
      data-phase={publicState.phase}
      data-local-phase={humanTurn ? publicState.phase : "waiting"}
      data-has-timer={timerSeconds !== null}
    >
      <button className="v3-match-back v3-baked-hit" onClick={onExit} aria-label="返回首页"><span>返回首页</span></button>
      <div className="v3-match-mode" role="status">{!network ? "单人练习" : controller.connection === "connected" ? "好友对局" : "重连中"}</div>
      <h1 className="sr-only" id="match-title">
        奇术茶馆快速局牌桌
      </h1>
      <picture className="match-stage__background-picture">
        <source media="(orientation: portrait)" srcSet={gameplayChoicesPortraitV3} />
        <source media="(orientation: landscape)" srcSet={gameplayV3} />
        <img
          alt="夜间奇术茶馆漆木圆桌"
          className="match-stage__background"
          draggable="false"
          src={gameArt.table}
        />
      </picture>
      {timerSeconds === null && <picture className="v3-no-timer-patch"><source media="(orientation: portrait)" srcSet={noTimerPortraitPatch} /><img src={noTimerPatch} alt="" /></picture>}
      {(!connectionReady || humanTurn && publicState.phase === "trump-select") && <img className="v3-no-action-patch" src={noActionPatch} alt="" />}
      <div className="match-stage__shade" />

      <RoundHeader
        handSize={publicState.handSize}
        phase={publicState.phase}
        roundNumber={publicState.roundIndex + 1}
        totalRounds={publicState.roundHandCounts.length}
      />

      <TrumpStatus
        phase={publicState.phase}
        revealedCard={publicState.revealedCard}
        trump={publicState.trump}
      />

      <div className="player-seats">
        {publicState.players.map((player) => (
          <PlayerSeat
            completedWinnerId={publicState.completedTrick?.winnerId}
            currentPlayerId={publicState.currentPlayerId}
            displaySlot={displaySlotByPlayerId.get(player.id) ?? player.seatIndex}
            handCount={publicState.handCounts[player.id] ?? 0}
            isDealer={player.seatIndex === publicState.dealerIndex}
            isLocal={player.id === controller.humanPlayerId}
            key={player.id}
            phase={publicState.phase}
            player={player}
          />
        ))}
      </div>

      <TrickArea
        completedWinnerId={publicState.completedTrick?.winnerId}
        plays={publicState.trick.plays}
        showEmpty={publicState.phase === "trick-play"}
      />

      <div className="match-status-strip" role="status">
        <img alt="" aria-hidden="true" draggable="false" src={gameArt.secondaryPanel} />
        <div>
          <span>{phaseLabels[publicState.phase]}</span>
          <strong>
            {currentPlayer
              ? currentPlayer.id === controller.humanPlayerId
                ? publicState.phase === "trick-play" ? "轮到你出牌" : "轮到你"
                : `${currentPlayer.name}${currentPlayer.isHuman ? "操作中" : "思考中"}`
              : publicState.completedTrick
                ? `${publicState.players.find((player) => player.id === publicState.completedTrick?.winnerId)?.name ?? "玩家"}赢得本墩`
                : "等待牌桌推进"}
          </strong>
        </div>
      </div>

      {currentPlayer && timerSeconds !== null ? (
        <TurnTimer
          playerName={currentPlayer.name}
          secondsRemaining={timerSeconds}
        />
      ) : null}

      <div
        aria-label="你的手牌"
        className={`player-hand ${humanTurn && publicState.phase === "trick-play" ? "is-active" : "is-locked"}`}
        role="group"
      >
        {privateState.hand.map((card, index) => {
          let visualState: CardVisualState = "normal";

          if (showLegalHints && humanTurn && publicState.phase === "trick-play") {
            visualState = legalCardIds.has(card.id) ? "legal" : "illegal";
          }

          if (selectedCardId === card.id) {
            visualState = "selected";
          }

          return (
            <CardView
              card={card}
              className="hand-card"
              disabled={!humanTurn || publicState.phase !== "trick-play"}
              key={card.id}
              onClick={() => selectCard(card)}
              state={visualState}
              style={{
                ...handCardStyle(index, privateState.hand.length),
                "--selection-offset": selectedCardId && selectedCardId !== card.id ? (index < privateState.hand.findIndex(item => item.id === selectedCardId) ? "-9px" : "9px") : "0px",
                ...(selectedCardId === card.id ? { zIndex: 30 } : {}),
              } as CSSProperties}
            />
          );
        })}
      </div>

      <button
        aria-label="确认出牌"
        className={`turn-action ${confirmPulse ? "turn-action--pulse" : ""}`}
        disabled={
          !selectedCard || !humanTurn || publicState.phase !== "trick-play"
        }
        onClick={playSelectedCard}
        type="button"
      >
        <img alt="" aria-hidden="true" draggable="false" src={gameArt.turnButton} />
        <span>{humanTurn ? (selectedCard ? "确认出牌" : "选择手牌") : "等待回合"}</span>
      </button>

      {humanTurn && publicState.phase === "trump-select" ? (
        <WebTrumpChooser
          onExit={onExit}
          onChoose={(trump) =>
            controller.sendIntent({ trump, type: "choose-trump" })
          }
        />
      ) : null}

      {humanTurn && publicState.phase === "bid" ? (
        <WebBidPanel
          handSize={publicState.handSize}
          onExit={onExit}
          onSubmit={(bid) => controller.sendIntent({ bid, type: "submit-bid" })}
        />
      ) : null}

      {publicState.phase === "trick-result" && publicState.completedTrick ? (
        <div className="trick-result-banner" role="status">
          <img alt="" aria-hidden="true" draggable="false" src={gameArt.trickWin} />
          <strong>
            {publicState.players.find(
              (player) => player.id === publicState.completedTrick?.winnerId,
            )?.name ?? "玩家"}
            赢得第 {publicState.completedTrick.number} 墩
          </strong>
        </div>
      ) : null}

      {publicState.phase === "round-score" ? (
        <WebResults
          isMatchEnd={false}
          onContinue={controller.advance}
          onExit={onExit}
          onRestart={controller.restart}
          players={publicState.players}
          roundNumber={publicState.roundIndex + 1}
          network={network}
          canContinue={!network || controller.connection === "connected" && controller.controls?.canContinueRound === true}
          blockedLabel={network && controller.connection !== "connected" ? "等待恢复连接" : undefined}
        />
      ) : null}

      {publicState.phase === "match-end" ? (
        <WebResults
          isMatchEnd
          network={network}
          canRestart={!network || controller.connection === "connected" && controller.controls?.canRematch === true}
          blockedLabel={network && controller.connection !== "connected" ? "等待恢复连接" : undefined}
          onContinue={controller.advance}
          onExit={onExit}
          onRestart={controller.restart}
          players={publicState.players}
          roundNumber={publicState.roundIndex + 1}
        />
      ) : null}

      {feedback ? (
        <div className="match-feedback" role="status">
          <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
          <span>{feedback}</span>
        </div>
      ) : null}
    </section>
  );
}
