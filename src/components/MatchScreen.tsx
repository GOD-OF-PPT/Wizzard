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
  suitNames,
  type AvatarExpression,
} from "../game-assets";
import {
  type Card,
  type MatchErrorCode,
  type MatchPhase,
  type MatchPlayerState,
  type Suit,
} from "@wizzard/game-core/contracts";
import { useLocalMatch } from "../hooks/useLocalMatch";
import { MatchAudioTracker } from "../web/audio/cues";
import { gameAudio, playCues } from "../web/audio/player";
import type { LocalMatchController } from "../hooks/useLocalMatch";
import { CardView, type CardVisualState } from "./CardView";
import selectionLayout from "../../art/runtime/web-v3/selection-layout-v2.json";
import denseLayout from "../../art/runtime/web-v3/dense-hand-layout-v1.json";
import densePortraitScene from "../../art/runtime/web-v3/dense-scene-portrait-v1.png";
import bidHandLayout from "../../art/runtime/web-v3/bid-hand-layout-v1.json";
import { TrickArea } from "./TrickArea";
import { TableStatus } from "./TableStatus";
import { currentAction, tableStatus } from "../web/table-status";
import { WebResults } from "./WebResults";
import gameplayV3 from "../../art/runtime/web-v3/gameplay.png";
import gameplayChoicesPortraitV3 from "../../art/runtime/web-v3/portrait/gameplay-choices-v1.png";
import { WebTrumpChooser, WebBidPanel } from "./WebMatchChoices";
import { gameplaySeatHalo, gameplaySeatPortrait, gameplaySeatStyle } from "../web/gameplay-seats";
import { tableSlotForSeat } from "../web/table-seating";
import { roomModeNames } from "../web/room-mode";
import trumpPaper from "../../art/runtime/web-v3/trump-status-v2.png";
import { webSuitIcons } from "../web/suit-assets";
import noTimerPatch from "../../art/runtime/web-v3/no-timer-patch-v1.png";
import noTimerPortraitPatch from "../../art/runtime/web-v3/portrait/no-timer-patch-v1.png";
import noActionPatch from "../../art/runtime/web-v3/gameplay-no-action-patch-v1.png";
import modePlayer from "../../art/runtime/web-v3/mode-player-v1.png";
import { SourceActionArt } from "./SourceActionArt";
import { sourceActionStyle, type SourceActionState } from "../web/source-actions";
import {sourceRoundArt,sourceRoundStyle} from "../web/source-round";
import {sourceClockArt,sourceClockStyle,sourceDenseNoTimerArt,sourceDenseNoTimerStyle,type SourceClockVariant} from "../web/source-clocks";

type MatchScreenProps = {
  controller?: LocalMatchController;
  hostPlayerId?: string;
  onExit: () => void;
  showLegalHints?: boolean;
};


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
  action,
  handCount,
  isDealer,
  isLocal,
  phase,
  player,
}: {
  completedWinnerId?: string;
  currentPlayerId: string | null;
  displaySlot: number;
  action: string | null;
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
  const portrait = gameplaySeatPortrait(player.avatarKey);

  return (
    <article
      className={`player-seat player-seat--source player-seat--${displaySlot} ${isActive ? "is-active" : ""} ${player.isHuman ? "is-human" : "is-ai"}`}
      style={gameplaySeatStyle(displaySlot)}
      data-seat-index={player.seatIndex}
      data-table-slot={displaySlot}
      aria-current={isActive ? "true" : undefined}
      aria-label={`${player.name}${!player.isHuman ? "，AI" : ""}${isDealer ? "，发牌者" : ""}`}
    >
      <div className="player-seat__portrait-wrap">
        <picture className="player-seat__source-art">
          <source media="(orientation: portrait)" srcSet={portrait.portrait} />
          <img
            alt={`${player.name}头像`}
            className="player-seat__portrait"
            data-expression={expression}
            draggable={false}
            src={portrait.landscape}
          />
        </picture>
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
      {isActive && <picture className="player-seat__active-art"><source media="(orientation: portrait)" srcSet={gameplaySeatHalo.portrait} /><img src={gameplaySeatHalo.landscape} alt="" aria-hidden="true" draggable={false} /></picture>}
      {isActive && action && <span className="table-seat-action" aria-hidden="true">{action}</span>}
      <strong><span className="player-seat__name-text">{player.name}</span></strong>
      <div className="player-seat__stats">
        <span className="player-seat__stat">
          <span>预测 {player.bid ?? "—"}</span>
        </span>
        <span className="player-seat__stat player-seat__stat--won">
          <span>赢墩 {player.tricksWon}</span>
        </span>
      </div>
      {isLocal && <span className="player-seat__you"><span className="sr-only">你</span></span>}
      <div className="player-seat__hand-count" aria-label={`剩余 ${handCount} 张牌`}>
        <img alt="" aria-hidden="true" draggable="false" src={cardImages.back} />
        <span>{handCount}</span>
      </div>
    </article>
  );
}

function RoundHeader({
  dense,
  handSize,
  roundNumber,
}: {
  dense: boolean;
  handSize: number;
  roundNumber: number;
}) {
  const art=sourceRoundArt[dense?"dense":"normal"];
  return (
    <header className="match-round-header match-round-header--source" style={sourceRoundStyle(dense)}>
      <picture className="match-round-header__source" aria-hidden="true"><source media="(orientation: portrait)" srcSet={art.portrait}/><img src={art.landscape} alt="" draggable={false}/></picture>
      <div>
        <strong className="round-source__round">
          <span className="sr-only">第 </span>{roundNumber}<span className="sr-only"> 轮</span>
        </strong>
        <span className="round-source__hand">
          <span className="sr-only">每人 </span>{handSize}<span className="sr-only"> 张</span>
        </span>
      </div>
    </header>
  );
}

function TrumpStatus({ phase, trump }: { phase: MatchPhase; trump: Suit | null }) {
  const name = trump ? suitNames[trump] : phase === "trump-select" ? "待选择" : "无王牌";
  return (
    <aside id="round-trump-info" className="trump-status table-trump" data-suit={trump ?? "none"} aria-label={`本轮王牌：${name}`}>
      <img className="table-trump__paper" src={trumpPaper} alt="" draggable={false} />
      <div className="table-trump__line">
        {trump && <span className="table-trump__icon" aria-hidden="true" style={{ "--suit-symbol": `url("${webSuitIcons[trump]}")` } as CSSProperties} />}
        <span>本轮王牌 ·</span>
        <strong>{name}</strong>
      </div>
    </aside>
  );
}




function handCardStyle(index: number, count: number, dense = false, bid = false): CSSProperties {
  if (dense) {
    const wide = denseLayout.profiles.landscape;
    const tall = denseLayout.profiles.portrait;
    const x = 740 + (index - (count - 1) / 2) * 120;
    const [px, py] = densePortraitCardCenter(index, count);
    return {
      "--fan-left": `${(x - wide.hand.x) / wide.hand.width * 100}%`,
      "--portrait-fan-left": `${(px - tall.hand.x) / tall.hand.width * 100}%`,
      "--fan-rotation": "0deg",
      "--portrait-fan-rotation": "0deg",
      "--fan-rise": `${(wide.hand.y + wide.hand.height - wide.rows[0] - 96) / wide.hand.height * 100}%`,
      "--portrait-fan-rise": `${(tall.hand.y + tall.hand.height - py - 96) / tall.hand.height * 100}%`,
    } as CSSProperties;
  }
  // Independent source measurements own the four-card benchmark. Its card
  // centers do not come from a rendered implementation screenshot.
  if (count === 4) {
    const sourceLayout = bid ? bidHandLayout : selectionLayout;
    const wide = sourceLayout.profiles.landscape;
    const tall = sourceLayout.profiles.portrait;
    const wp = wide.poses[index], tp = tall.poses[index];
    const halfHeight = sourceLayout.contract.cardBox[1] / 2;
    return {
      "--fan-left": `${(wp.center[0] - wide.hand.x) / wide.hand.width * 100}%`,
      "--portrait-fan-left": `${(tp.center[0] - tall.hand.x) / tall.hand.width * 100}%`,
      "--fan-rotation": `${wp.angle}deg`,
      "--portrait-fan-rotation": `${tp.angle}deg`,
      "--fan-rise": `${(wide.hand.bottom - wp.center[1] - halfHeight) / wide.hand.height * 100}%`,
      "--portrait-fan-rise": `${(tall.hand.bottom - tp.center[1] - halfHeight) / tall.hand.height * 100}%`,
      zIndex: index + 1,
    } as CSSProperties;
  }
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

function densePortraitCardCenter(index: number, count: number): [number, number] {
  const p = denseLayout.profiles.portrait;
  const columns = Math.ceil(count / 2);
  const row = Math.floor(index / columns);
  const rowCount = row === 0 ? columns : count - columns;
  const column = index % columns;
  return [rowCount === 4 ? p.columns[column] : 470.5 + (column - (rowCount - 1) / 2) * 156, p.rows[row]];
}

const denseFrameStyle = Object.fromEntries(Object.entries(denseLayout.profiles).flatMap(([profile, p]) => {
  const prefix = profile === "portrait" ? "--dense-portrait" : "--dense";
  return [
    [`${prefix}-hand-left`, `${p.hand.x / p.canvas[0] * 100}%`],
    [`${prefix}-hand-top`, `${p.hand.y / p.canvas[1] * 100}%`],
    [`${prefix}-hand-width`, `${p.hand.width / p.canvas[0] * 100}%`],
    [`${prefix}-hand-height`, `${p.hand.height / p.canvas[1] * 100}%`],
    [`${prefix}-card-width`, `${denseLayout.contract.cardBox[0] / p.canvas[0] * 100}cqw`],
  ];
})) as CSSProperties;


function TurnTimer({
  variant,
  playerName,
  secondsRemaining,
}: {
  variant: SourceClockVariant;
  playerName: string;
  secondsRemaining: number;
}) {
  return (
    <div
      aria-label={`${playerName}剩余 ${secondsRemaining} 秒`}
      className={`turn-timer turn-timer--source ${secondsRemaining <= 5 ? "is-warning" : ""}`}
      data-source-clock={variant}
      role="timer"
      style={sourceClockStyle(variant)}
    >
      <picture className="source-clock__art" aria-hidden="true"><source media="(orientation: portrait)" srcSet={sourceClockArt.portrait[variant]}/><img src={sourceClockArt.landscape[variant]} alt="" draggable={false}/></picture>
      <strong className="source-clock__value" aria-hidden="true">{secondsRemaining}</strong>
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

function MatchSurface({ controller, network, hostPlayerId, onExit, showLegalHints = true }: Omit<MatchScreenProps, "controller"> & { controller: LocalMatchController; network: boolean }) {
  const sounds = useRef(new MatchAudioTracker());
  useEffect(() => {
    // Network events are observed synchronously at the room subscription;
    // React frame/countdown updates must not re-announce them here.
    if (!network) playCues(sounds.current.update(controller.snapshot, controller.events, { fresh: true }));
    return undefined;
  }, [network, controller.snapshot, controller.events]);
  const { privateState, publicState } = controller.snapshot;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackRevision, setFeedbackRevision] = useState(0);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [confirmPulse, setConfirmPulse] = useState(false);
  const hasSelectedThisTurn = useRef(false);
  const touchedCardId = useRef<string | null>(null);
  const currentPlayer = publicState.players.find(
    (player) => player.id === publicState.currentPlayerId,
  );
  const connectionReady = !network || controller.connection === "connected";
  const timerSeconds = connectionReady && currentPlayer?.isHuman ? controller.turnSecondsRemaining : null;
  const humanTurn = publicState.currentPlayerId === controller.humanPlayerId;
  const localBid = humanTurn && publicState.phase === "bid";
  const localSeat = publicState.players.find(player => player.id === controller.humanPlayerId)?.seatIndex ?? 0;
  const action = currentAction(publicState.phase, publicState.trick.plays.length === 0);
  const actor = connectionReady && action ? currentPlayer : undefined;
  const status = tableStatus(publicState, controller.humanPlayerId, connectionReady, !!controller.pendingIntent, network, hostPlayerId);
  const resultsOpen = publicState.phase === "round-score" || publicState.phase === "match-end";
  const legalCardIds = useMemo(
    () => new Set(privateState.legalCardIds),
    [privateState.legalCardIds],
  );
  const selectedCard = privateState.hand.find(
    (card) => card.id === selectedCardId,
  );
  const selectedCardIndex = privateState.hand.findIndex(card => card.id === selectedCardId);
  // Prediction and chooser own separate modal safety bands. Their dense
  // designs must be calibrated independently before adopting this play rail.
  const denseHand = privateState.hand.length > 4 && privateState.hand.length <= 8 &&
    (publicState.phase === "trick-play" || publicState.phase === "trick-result");
  const sourceAction: SourceActionState | null = humanTurn && publicState.phase === "trick-play" && !(denseHand && controller.pendingIntent)
    ? controller.pendingIntent ? "pending" : denseHand ? selectedCard ? "dense-confirm" : "dense-idle" : selectedCard ? "confirm" : "idle"
    : null;

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
  }, [feedback, feedbackRevision]);

  function showFeedback(message: string) {
    gameAudio.play({ id: "notice.soft" });
    setFeedback(message);
    // An identical explanation is still a fresh user action. Renew its
    // lifetime instead of letting the previous click's timer dismiss it.
    setFeedbackRevision(revision => revision + 1);
  }

  function selectCard(card: Card) {
    if (controller.pendingIntent) return;
    if (!humanTurn || publicState.phase !== "trick-play") {
      showFeedback("还没轮到你出牌");
      return;
    }

    if (!legalCardIds.has(card.id)) {
      showFeedback("必须跟随本墩领出花色");
      return;
    }

    if (!hasSelectedThisTurn.current) {
      hasSelectedThisTurn.current = true;
      setConfirmPulse(true);
    }
    // A successful selection supersedes the earlier illegal-card explanation.
    setFeedback(null);
    gameAudio.play({ id: "card.select" });
    setSelectedCardId((current) => (current === card.id ? null : card.id));
  }

  function playSelectedCard() {
    if (controller.pendingIntent) return;
    if (!selectedCard) {
      showFeedback("请先选择一张合法手牌");
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
      data-pending-intent={controller.pendingIntent || undefined}
      data-dense-hand={denseHand || undefined}
      data-crowded-trick={publicState.trick.plays.length > 4 || undefined}
      style={denseHand ? denseFrameStyle : undefined}
    >
      {publicState.phase !== "round-score" && publicState.phase !== "match-end" && <button className="v3-match-back v3-baked-hit" onClick={onExit} aria-label="返回首页"><span>返回首页</span></button>}
      <div className="v3-match-mode" role="status"><img src={modePlayer} alt="" aria-hidden="true" /><span>{!network ? "单人练习" : controller.connection === "connected" ? "好友对局" : controller.connection === "disconnected" ? "连接中断" : "重连中"}</span></div>
      <h1 className="sr-only" id="match-title">
        奇术茶馆{roomModeNames[publicState.mode]}牌桌
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
      {denseHand && <img className="v3-dense-portrait-scene" src={densePortraitScene} alt="" aria-hidden="true" />}
      {(timerSeconds === null || localBid) && !(timerSeconds === null && denseHand) && <picture className={`v3-no-timer-patch${timerSeconds !== null ? " v3-no-timer-patch--bid" : ""}`}><source media="(orientation: portrait)" srcSet={noTimerPortraitPatch} /><img src={noTimerPatch} alt="" /></picture>}
      {timerSeconds === null && denseHand && <picture className="source-dense-notimer" style={sourceDenseNoTimerStyle()} aria-hidden="true"><source media="(orientation: portrait)" srcSet={sourceDenseNoTimerArt.portrait}/><img src={sourceDenseNoTimerArt.landscape} alt="" draggable={false}/></picture>}
      {(!connectionReady || humanTurn && publicState.phase === "trump-select") && <img className="v3-no-action-patch" src={noActionPatch} alt="" />}
      <div className="match-stage__shade" />

      <RoundHeader
        dense={publicState.handSize > 4}
        handSize={publicState.handSize}
        roundNumber={publicState.roundIndex + 1}
      />

      {publicState.phase !== "round-score" && publicState.phase !== "match-end" &&
        <TrumpStatus phase={publicState.phase} trump={publicState.trump} />}

      <div className="player-seats">
        {publicState.players.map((player) => (
          <PlayerSeat
            completedWinnerId={publicState.completedTrick?.winnerId}
            currentPlayerId={actor?.id ?? null}
            action={action}
            displaySlot={tableSlotForSeat(publicState.players.length, localSeat, player.seatIndex)}
            handCount={publicState.handCounts[player.id] ?? 0}
            isDealer={player.seatIndex === publicState.dealerIndex}
            isLocal={player.id === controller.humanPlayerId}
            key={player.id}
            phase={publicState.phase}
            player={player}
          />
        ))}
      </div>

      {!resultsOpen && <>
        <TrickArea key={`${publicState.matchId}:${publicState.roundIndex}:${publicState.trick.number}`}
          completedWinnerId={publicState.completedTrick?.winnerId}
          plays={publicState.trick.plays} players={publicState.players} viewerId={controller.humanPlayerId}
          showEmpty={publicState.phase === "trick-play" && !actor}
        />
        <TableStatus status={status} />
      </>}

      {currentPlayer && timerSeconds !== null ? (
        <TurnTimer
          variant={denseHand ? "dense" : localBid ? "bid" : "normal"}
          playerName={currentPlayer.name}
          secondsRemaining={timerSeconds}
        />
      ) : null}

      <div
        aria-label="你的手牌"
        className={`player-hand ${humanTurn && publicState.phase === "trick-play" ? "is-active" : "is-locked"}`}
        role="group"
        onPointerDownCapture={event => {
          touchedCardId.current = null;
          if (event.pointerType !== "touch") return;
          // Chrome can retarget a touch to a neighbouring overlapping button.
          // Keep the card actually visible under the original contact point.
          const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>(".hand-card");
          if (hit && event.currentTarget.contains(hit) && !hit.disabled) {
            touchedCardId.current = hit.dataset.cardId ?? null;
          }
        }}
        onPointerCancel={() => { touchedCardId.current = null; }}
        onClickCapture={event => {
          const cardId = touchedCardId.current;
          touchedCardId.current = null;
          if ((event.nativeEvent as PointerEvent).pointerType !== "touch" || !cardId) return;
          const card = privateState.hand.find(candidate => candidate.id === cardId);
          if (!card) return;
          event.stopPropagation();
          selectCard(card);
        }}
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
              disabled={controller.pendingIntent || !humanTurn || publicState.phase !== "trick-play"}
              key={card.id}
              onClick={() => selectCard(card)}
              state={visualState}
              style={{
                ...handCardStyle(index, privateState.hand.length, denseHand, localBid),
                "--selection-offset": selectedCardIndex >= 0 && index !== selectedCardIndex ? (index < selectedCardIndex ? "calc(-1 * var(--hand-neighbor-offset, 9px))" : "var(--hand-neighbor-offset, 9px)") : "0px",
                "--portrait-selection-offset": denseHand && selectedCardIndex >= 0 && index !== selectedCardIndex
                  ? `${Math.sign(densePortraitCardCenter(index, privateState.hand.length)[0] - densePortraitCardCenter(selectedCardIndex, privateState.hand.length)[0]) * 7.03125}%`
                  : "0px",
                // Reveal the outward edge on either side of the raised card.
                // An always-increasing right stack sandwiches the immediate
                // neighbour on dense portrait hands between two higher cards.
                zIndex: index === selectedCardIndex ? 30 : selectedCardIndex < 0 || index < selectedCardIndex ? index + 1 : privateState.hand.length - index,
              } as CSSProperties}
            />
          );
        })}
      </div>

      <button
        aria-label={controller.pendingIntent ? "出牌中" : humanTurn ? (selectedCard ? "确认出牌" : "选择手牌") : "等待回合"}
        aria-busy={controller.pendingIntent || undefined}
        className={`turn-action ${confirmPulse ? "turn-action--pulse" : ""} ${sourceAction ? "source-action" : ""}`}
        data-source-action={sourceAction ?? undefined}
        style={sourceAction ? sourceActionStyle(sourceAction) : undefined}
        disabled={
          controller.pendingIntent || !selectedCard || !humanTurn || publicState.phase !== "trick-play"
        }
        onClick={playSelectedCard}
        type="button"
      >
        {sourceAction ? <SourceActionArt state={sourceAction}/> : <img alt="" aria-hidden="true" draggable="false" src={gameArt.turnButton} />}
        <span className={sourceAction ? "sr-only" : undefined}>{controller.pendingIntent ? "出牌中" : humanTurn ? (selectedCard ? "确认出牌" : "选择手牌") : "等待回合"}</span>
      </button>

      {humanTurn && publicState.phase === "trump-select" ? (
        <WebTrumpChooser
          pending={controller.pendingIntent}
          onExit={onExit}
          onChoose={(trump) =>
            controller.sendIntent({ trump, type: "choose-trump" })
          }
        />
      ) : null}

      {humanTurn && publicState.phase === "bid" ? (
        <WebBidPanel
          pending={controller.pendingIntent}
          handSize={publicState.handSize}
          onExit={onExit}
          onSubmit={(bid) => controller.sendIntent({ bid, type: "submit-bid" })}
        />
      ) : null}


      {publicState.phase === "round-score" ? (
        <WebResults
          tableStatus={status}
          isMatchEnd={false}
          mode={publicState.mode}
          isFinalRound={publicState.roundIndex + 1 >= publicState.roundHandCounts.length}
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
          tableStatus={status}
          isMatchEnd
          mode={publicState.mode}
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
