import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  avatarImages,
  cardImages,
  gameArt,
  suitLabels,
  suitNames,
  type AvatarExpression,
  type AvatarKey,
} from "../game-assets";
import {
  SUITS,
  type Card,
  type MatchErrorCode,
  type MatchPhase,
  type MatchPlayerState,
  type Suit,
} from "../game";
import { useLocalMatch } from "../hooks/useLocalMatch";
import { CardView, type CardVisualState } from "./CardView";

type MatchScreenProps = {
  onExit: () => void;
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

function asAvatarKey(value: string): AvatarKey {
  return value in avatarImages ? (value as AvatarKey) : "masked-traveler";
}

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
  phase,
  player,
}: {
  completedWinnerId?: string;
  currentPlayerId: string | null;
  displaySlot: number;
  handCount: number;
  isDealer: boolean;
  phase: MatchPhase;
  player: MatchPlayerState;
}) {
  const expression = getPlayerExpression(
    player,
    currentPlayerId,
    completedWinnerId,
    phase,
  );
  const avatarKey = asAvatarKey(player.avatarKey);
  const isActive = currentPlayerId === player.id;

  return (
    <article
      className={`player-seat player-seat--${displaySlot} ${isActive ? "is-active" : ""} ${player.isHuman ? "is-human" : "is-ai"}`}
    >
      <div className="player-seat__portrait-wrap">
        <img
          alt={`${player.name}头像`}
          className="player-seat__portrait"
          draggable="false"
          src={avatarImages[avatarKey][expression]}
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
          <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
          <span>预测 {player.bid ?? "—"}</span>
        </span>
        <span className="player-seat__stat player-seat__stat--won">
          <img alt="" aria-hidden="true" draggable="false" src={gameArt.greenStatus} />
          <span>已赢 {player.tricksWon}</span>
        </span>
      </div>
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
          第 {roundNumber} / {totalRounds} 轮
        </strong>
        <span>
          每人 {handSize} 张 · {phaseLabels[phase]}
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
        src={gameArt.smallPlaque}
      />
      {trump ? (
        <img
          alt=""
          aria-hidden="true"
          className="trump-status__suit"
          draggable="false"
          src={cardImages[trump]}
        />
      ) : null}
      <div className="trump-status__content">
        <span>本轮王牌</span>
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
  const spread = count === 1 ? 0 : Math.min(18, 72 / (count - 1));

  return {
    "--trick-left": `${50 + offset * spread}%`,
    "--trick-rotation": `${offset * 3.5}deg`,
    "--trick-top": `${4 + Math.abs(offset) * 4.2}%`,
  } as CSSProperties;
}

function TrumpChooser({ onChoose }: { onChoose: (trump: Suit) => void }) {
  const firstChoiceRef = useRef<HTMLButtonElement>(null);

  useEffect(() => firstChoiceRef.current?.focus(), []);

  return (
    <div className="blocking-overlay">
      <section
        aria-labelledby="trump-title"
        aria-modal="true"
        className="choice-panel trump-chooser"
        role="dialog"
      >
        <img alt="" aria-hidden="true" draggable="false" src={gameArt.primaryPanel} />
        <div className="choice-panel__content">
          <span className="choice-panel__eyebrow">翻出至高牌</span>
          <h2 id="trump-title">请选择本轮王牌</h2>
          <p>你是本轮发牌者。选择后，所有玩家开始依次预测。</p>
          <div className="trump-chooser__grid">
            {SUITS.map((suit) => (
              <button
                aria-label={`选择${suitNames[suit]}为王牌`}
                className={`trump-choice trump-choice--${suit}`}
                key={suit}
                onClick={() => onChoose(suit)}
                ref={suit === SUITS[0] ? firstChoiceRef : undefined}
                type="button"
              >
                <img
                  alt=""
                  aria-hidden="true"
                  className="trump-choice__card"
                  draggable="false"
                  src={cardImages[suit]}
                />
                <span className="trump-choice__label">
                  <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
                  <span>
                    {suitLabels[suit]} · {suitNames[suit]}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function BidPanel({
  handSize,
  onSubmit,
}: {
  handSize: number;
  onSubmit: (bid: number) => void;
}) {
  const [bid, setBid] = useState(0);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setBid(0), [handSize]);
  useEffect(() => confirmRef.current?.focus(), []);

  return (
    <section
      aria-labelledby="bid-title"
      aria-modal="true"
      className="bid-panel"
      role="dialog"
    >
      <img alt="" aria-hidden="true" draggable="false" src={gameArt.primaryPanel} />
      <div className="bid-panel__content">
        <span>轮到你预测</span>
        <h2 id="bid-title">预计赢几墩？</h2>
        <div className="bid-stepper">
          <button
            aria-label="减少预测"
            disabled={bid === 0}
            onClick={() => setBid((value) => Math.max(0, value - 1))}
            type="button"
          >
            <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
            <span>减少</span>
          </button>
          <strong>{bid}</strong>
          <button
            aria-label="增加预测"
            disabled={bid === handSize}
            onClick={() => setBid((value) => Math.min(handSize, value + 1))}
            type="button"
          >
            <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
            <span>增加</span>
          </button>
        </div>
        <button
          className="lacquer-action"
          onClick={() => onSubmit(bid)}
          ref={confirmRef}
          type="button"
        >
          <img alt="" aria-hidden="true" draggable="false" src={gameArt.secondaryPanel} />
          <span>确认预测 {bid}</span>
        </button>
      </div>
    </section>
  );
}

function ResultsOverlay({
  isMatchEnd,
  onContinue,
  onExit,
  onRestart,
  players,
  roundNumber,
}: {
  isMatchEnd: boolean;
  onContinue: () => void;
  onExit: () => void;
  onRestart: () => void;
  players: readonly MatchPlayerState[];
  roundNumber: number;
}) {
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const orderedPlayers = [...players].sort(
    (left, right) => right.totalScore - left.totalScore,
  );
  const topScore = orderedPlayers[0]?.totalScore ?? 0;
  const winners = orderedPlayers.filter((player) => player.totalScore === topScore);
  const summaryText = isMatchEnd
    ? `${winners.map((player) => player.name).join("、")} 获得最高分`
    : "预测准确可获得 20 分基础分";

  useEffect(() => primaryActionRef.current?.focus(), []);

  return (
    <div className="blocking-overlay blocking-overlay--results">
      <section
        aria-describedby="results-summary"
        aria-labelledby="results-title"
        aria-modal="true"
        className="results-panel"
        role="dialog"
      >
        <div className="results-panel__content">
          <div className="results-panel__title">
            <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
            <h2 id="results-title">
              {isMatchEnd ? "快速局总榜" : `第 ${roundNumber} 轮结算`}
            </h2>
          </div>
          <div aria-label="本轮计分" className="score-table" role="table">
            <div className="score-table__row score-table__head" role="row">
              <span role="columnheader">玩家</span>
              <span role="columnheader">预测</span>
              <span role="columnheader">赢墩</span>
              <span role="columnheader">本轮</span>
              <span role="columnheader">总分</span>
            </div>
            {orderedPlayers.map((player) => {
              const avatarKey = asAvatarKey(player.avatarKey);
              const isWinner = winners.some((winner) => winner.id === player.id);
              const expression: AvatarExpression =
                isMatchEnd && isWinner
                  ? "proud"
                  : (player.roundScore ?? 0) < 0
                    ? "mistake"
                    : "normal";

              return (
                <div className="score-table__row" key={player.id} role="row">
                  <span className="score-table__player" role="cell">
                    <img
                      alt=""
                      aria-hidden="true"
                      draggable="false"
                      src={avatarImages[avatarKey][expression]}
                    />
                    <span>{player.name}</span>
                  </span>
                  <span role="cell">{player.bid ?? "—"}</span>
                  <span role="cell">{player.tricksWon}</span>
                  <span
                    className={(player.roundScore ?? 0) >= 0 ? "is-positive" : "is-negative"}
                    role="cell"
                  >
                    {player.roundScore === null
                      ? "—"
                      : `${player.roundScore >= 0 ? "+" : ""}${player.roundScore}`}
                  </span>
                  <strong role="cell">{player.totalScore}</strong>
                </div>
              );
            })}
          </div>
          <div className="results-panel__footer">
            <div className="results-panel__summary">
              <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
              <p id="results-summary">{summaryText}</p>
            </div>
            <div className="results-panel__actions">
              {isMatchEnd ? (
                <>
                  <button
                    className="result-action result-action--paper"
                    onClick={onExit}
                    ref={primaryActionRef}
                    type="button"
                  >
                    <img alt="" aria-hidden="true" draggable="false" src={gameArt.smallPlaque} />
                    <span>返回好友房</span>
                  </button>
                  <button className="result-action" onClick={onRestart} type="button">
                    <img alt="" aria-hidden="true" draggable="false" src={gameArt.secondaryPanel} />
                    <span>再来一局</span>
                  </button>
                </>
              ) : (
                <button
                  className="result-action"
                  onClick={onContinue}
                  ref={primaryActionRef}
                  type="button"
                >
                  <img alt="" aria-hidden="true" draggable="false" src={gameArt.secondaryPanel} />
                  <span>继续下一轮</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function handCardStyle(index: number, count: number): CSSProperties {
  const midpoint = (count - 1) / 2;
  const offset = index - midpoint;
  const spread = Math.min(8.8, 68 / Math.max(1, count - 1));
  const customStyle = {
    "--fan-left": `${50 + offset * spread}%`,
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
  6: [0, 1, 2, 3, 4, 5],
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
        <strong>{secondsRemaining}</strong>
        <span>秒</span>
      </div>
    </div>
  );
}

export function MatchScreen({ onExit }: MatchScreenProps) {
  const controller = useLocalMatch();
  const { privateState, publicState } = controller.snapshot;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const currentPlayer = publicState.players.find(
    (player) => player.id === publicState.currentPlayerId,
  );
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
      setSelectedCardId(null);
    }
  }, [humanTurn, publicState.phase]);

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
      className="screen-stage match-stage"
      data-phase={publicState.phase}
    >
      <h1 className="sr-only" id="match-title">
        奇术茶馆快速局牌桌
      </h1>
      <img
        alt="夜间奇术茶馆漆木圆桌"
        className="match-stage__background"
        draggable="false"
        src={gameArt.table}
      />
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
                ? "轮到你"
                : `${currentPlayer.name}${currentPlayer.isHuman ? "操作中" : "思考中"}`
              : publicState.completedTrick
                ? `${publicState.players.find((player) => player.id === publicState.completedTrick?.winnerId)?.name ?? "玩家"}赢得本墩`
                : "等待牌桌推进"}
          </strong>
        </div>
      </div>

      {currentPlayer && controller.turnSecondsRemaining !== null ? (
        <TurnTimer
          playerName={currentPlayer.name}
          secondsRemaining={controller.turnSecondsRemaining}
        />
      ) : null}

      <div
        aria-label="你的手牌"
        className={`player-hand ${humanTurn && publicState.phase === "trick-play" ? "is-active" : "is-locked"}`}
        role="group"
      >
        {privateState.hand.map((card, index) => {
          let visualState: CardVisualState = "normal";

          if (humanTurn && publicState.phase === "trick-play") {
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
              style={handCardStyle(index, privateState.hand.length)}
            />
          );
        })}
      </div>

      <button
        aria-label="确认出牌"
        className="turn-action"
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
        <TrumpChooser
          onChoose={(trump) =>
            controller.sendIntent({ trump, type: "choose-trump" })
          }
        />
      ) : null}

      {humanTurn && publicState.phase === "bid" ? (
        <BidPanel
          handSize={publicState.handSize}
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
        <ResultsOverlay
          isMatchEnd={false}
          onContinue={controller.advance}
          onExit={onExit}
          onRestart={controller.restart}
          players={publicState.players}
          roundNumber={publicState.roundIndex + 1}
        />
      ) : null}

      {publicState.phase === "match-end" ? (
        <ResultsOverlay
          isMatchEnd
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
