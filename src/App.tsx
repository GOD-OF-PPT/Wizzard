import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import friendRoomScreen from "../art/mockups/friend-room-screen.png";
import gameplayScreen from "../art/mockups/gameplay-screen.png";
import homeScreen from "../art/mockups/home-screen.png";
import roundResultsScreen from "../art/mockups/round-results-screen.png";
import primaryPanel from "../art/runtime/ui/primary-panel.png";
import roundTitleScroll from "../art/runtime/ui/round-title-scroll.png";
import secondaryPanel from "../art/runtime/ui/secondary-panel.png";
import selectedHalo from "../art/runtime/ui/selected-halo.png";
import smallPlaque from "../art/runtime/ui/small-plaque.png";

type Screen = "home" | "room" | "game" | "results";

type HotspotProps = {
  buttonRef?: RefObject<HTMLButtonElement | null>;
  label: string;
  className: string;
  onClick: () => void;
};

type ArtButtonProps = {
  buttonRef?: RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
  className?: string;
  image: string;
  label?: string;
  onClick: () => void;
};

type HandCard = {
  id: string;
  label: string;
};

const handCards: HandCard[] = [
  { id: "mountain-1", label: "山 1" },
  { id: "knot-2", label: "结 2" },
  { id: "leaf-4", label: "叶 4" },
  { id: "sun-6", label: "日 6" },
  { id: "knot-7", label: "结 7" },
  { id: "mountain-8", label: "山 8" },
  { id: "leaf-10", label: "叶 10" },
  { id: "sun-12", label: "日 12" },
];

// Visual interaction harness only. Production Cocos screens will submit
// intents to an authoritative adapter and render accepted server events.

function Hotspot({ buttonRef, label, className, onClick }: HotspotProps) {
  return (
    <button
      aria-label={label}
      className={`hotspot ${className}`}
      onClick={onClick}
      ref={buttonRef}
      type="button"
    />
  );
}

function ArtButton({
  buttonRef,
  children,
  className = "",
  image,
  label,
  onClick,
}: ArtButtonProps) {
  return (
    <button
      aria-label={label}
      className={`art-button ${className}`}
      onClick={onClick}
      ref={buttonRef}
      type="button"
    >
      <img alt="" aria-hidden="true" draggable="false" src={image} />
      <span>{children}</span>
    </button>
  );
}

function HomeScreen({
  onCreateRoom,
  onPractice,
  onRules,
  rulesButtonRef,
}: {
  onCreateRoom: () => void;
  onPractice: () => void;
  onRules: () => void;
  rulesButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <section aria-labelledby="home-title" className="screen-stage">
      <h1 className="sr-only" id="home-title">
        奇术茶馆
      </h1>
      <img
        alt="奇术茶馆首页，包含创建房间、加入房间和单人练习入口"
        className="screen-art"
        draggable="false"
        src={homeScreen}
      />
      <Hotspot
        className="home-create"
        label="创建房间"
        onClick={onCreateRoom}
      />
      <Hotspot
        className="home-join"
        label="加入房间"
        onClick={onCreateRoom}
      />
      <Hotspot
        className="home-practice"
        label="单人练习"
        onClick={onPractice}
      />
      <Hotspot
        buttonRef={rulesButtonRef}
        className="home-rules"
        label="规则与设置"
        onClick={onRules}
      />
    </section>
  );
}

function FriendRoomScreen({
  onInvite,
  onStart,
}: {
  onInvite: () => void;
  onStart: () => void;
}) {
  return (
    <section aria-labelledby="room-title" className="screen-stage">
      <h1 className="sr-only" id="room-title">
        好友房 628315
      </h1>
      <img
        alt="六人好友房，四位好友已经准备，包含一个等待座位和一个 AI 座位"
        className="screen-art"
        draggable="false"
        src={friendRoomScreen}
      />
      <Hotspot className="room-invite" label="邀请好友" onClick={onInvite} />
      <Hotspot className="room-start" label="开始游戏" onClick={onStart} />
    </section>
  );
}

function GameScreen({
  onNeedCard,
  onPlay,
  round,
}: {
  onNeedCard: () => void;
  onPlay: () => void;
  round: number;
}) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const activeHandCards = handCards.slice(0, Math.min(round, handCards.length));

  function playSelectedCard() {
    if (!selectedCard) {
      onNeedCard();
      return;
    }

    onPlay();
  }

  return (
    <section aria-labelledby="game-title" className="screen-stage">
      <h1 className="sr-only" id="game-title">
        第 {round} 轮
      </h1>
      <img
        alt={`奇术茶馆第 ${round} 轮牌桌，六位玩家围桌进行预测型墩牌游戏`}
        className="screen-art"
        draggable="false"
        src={gameplayScreen}
      />

      {round !== 4 ? (
        <div aria-hidden="true" className="dynamic-round-title">
          <img alt="" draggable="false" src={roundTitleScroll} />
          <span>第 {round} 轮</span>
        </div>
      ) : null}

      <div aria-label="你的手牌" className="hand-hotspots" role="group">
        {activeHandCards.map((card, index) => {
          const isSelected = selectedCard === card.id;

          return (
            <button
              aria-label={card.label}
              aria-pressed={isSelected}
              className={`card-hotspot card-hotspot-${index + 1}`}
              key={card.id}
              onClick={() => setSelectedCard(card.id)}
              type="button"
            >
              {isSelected ? (
                <img
                  alt=""
                  aria-hidden="true"
                  className="selected-card-fx"
                  draggable="false"
                  src={selectedHalo}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <Hotspot
        className="game-turn-action"
        label={selectedCard ? "出牌" : "你的回合"}
        onClick={playSelectedCard}
      />
    </section>
  );
}

function RoundResultsScreen({
  onContinue,
  onLeaderboard,
  round,
}: {
  onContinue: () => void;
  onLeaderboard: () => void;
  round: number;
}) {
  return (
    <section aria-labelledby="results-title" className="screen-stage">
      <h1 className="sr-only" id="results-title">
        第 {round} 轮结算
      </h1>
      <img
        alt={`第 ${round} 轮结算榜，展示六位玩家的预测、赢墩、本轮得分与总分`}
        className="screen-art"
        draggable="false"
        src={roundResultsScreen}
      />
      <Hotspot
        className="results-leaderboard"
        label="查看总榜"
        onClick={onLeaderboard}
      />
      <Hotspot
        className="results-continue"
        label="继续"
        onClick={onContinue}
      />
    </section>
  );
}

function RulesDialog({
  onClose,
  onToggleSound,
  returnFocusRef,
  soundEnabled,
}: {
  onClose: () => void;
  onToggleSound: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  soundEnabled: boolean;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      returnFocusRef.current?.focus();
    };
  }, [onClose, returnFocusRef]);

  return (
    <div className="dialog-scrim">
      <section
        aria-labelledby="rules-dialog-title"
        aria-modal="true"
        className="rules-dialog"
        role="dialog"
      >
        <img
          alt=""
          aria-hidden="true"
          className="rules-dialog-art"
          draggable="false"
          src={primaryPanel}
        />
        <div className="rules-dialog-content">
          <h2 id="rules-dialog-title">规则与设置</h2>
          <p>
            每轮先预测自己会赢几墩。准确预测可获得基础分与赢墩奖励；误差越大，扣分越多。
          </p>
          <div className="rules-summary">
            <span>快速局：8 轮</span>
            <span>座位：3–6 人</span>
            <span>空位：AI 可补位</span>
          </div>
          <div className="rules-dialog-actions">
            <ArtButton image={smallPlaque} onClick={onToggleSound}>
              音效：{soundEnabled ? "开" : "关"}
            </ArtButton>
            <ArtButton
              buttonRef={closeButtonRef}
              image={secondaryPanel}
              label="关闭规则与设置"
              onClick={onClose}
            >
              关闭
            </ArtButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function Notice({ message }: { message: string }) {
  return (
    <div className="notice" role="status">
      <img alt="" aria-hidden="true" draggable="false" src={smallPlaque} />
      <span>{message}</span>
    </div>
  );
}

export function App() {
  const [notice, setNotice] = useState<string | null>(null);
  const [round, setRound] = useState(4);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const rulesButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setNotice(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function startGame() {
    setRound(4);
    setScreen("game");
  }

  function continueGame() {
    setRound((currentRound) => currentRound + 1);
    setScreen("game");
  }

  return (
    <main className="game-prototype">
      <div
        aria-hidden={rulesOpen || undefined}
        className="screen-layer"
        inert={rulesOpen}
      >
        {screen === "home" ? (
          <HomeScreen
            onCreateRoom={() => setScreen("room")}
            onPractice={startGame}
            onRules={() => setRulesOpen(true)}
            rulesButtonRef={rulesButtonRef}
          />
        ) : null}

        {screen === "room" ? (
          <FriendRoomScreen
            onInvite={() => setNotice("邀请链接已准备")}
            onStart={startGame}
          />
        ) : null}

        {screen === "game" ? (
          <GameScreen
            onNeedCard={() => setNotice("请先选择一张手牌")}
            onPlay={() => setScreen("results")}
            round={round}
          />
        ) : null}

        {screen === "results" ? (
          <RoundResultsScreen
            onContinue={continueGame}
            onLeaderboard={() => setNotice("总榜将在完整对局中展示")}
            round={round}
          />
        ) : null}
      </div>

      {rulesOpen ? (
        <RulesDialog
          onClose={() => setRulesOpen(false)}
          onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
          returnFocusRef={rulesButtonRef}
          soundEnabled={soundEnabled}
        />
      ) : null}

      {notice ? <Notice message={notice} /> : null}
    </main>
  );
}
