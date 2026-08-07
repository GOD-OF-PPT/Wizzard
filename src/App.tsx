import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import friendRoomScreen from "../art/mockups/friend-room-screen.png";
import homeScreen from "../art/runtime/backgrounds/home-screen-hd.png";
import primaryPanel from "../art/runtime/ui/primary-panel.png";
import secondaryPanel from "../art/runtime/ui/secondary-panel.png";
import smallPlaque from "../art/runtime/ui/small-plaque.png";
import { MatchScreen } from "./components/MatchScreen";

type Screen = "home" | "room" | "match";

type HotspotProps = {
  buttonRef?: RefObject<HTMLButtonElement | null>;
  className: string;
  label: string;
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

function Hotspot({ buttonRef, className, label, onClick }: HotspotProps) {
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
      <Hotspot className="home-create" label="创建房间" onClick={onCreateRoom} />
      <Hotspot className="home-join" label="加入房间" onClick={onCreateRoom} />
      <Hotspot className="home-practice" label="单人练习" onClick={onPractice} />
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
            每轮先决定王牌，再依次预测自己会赢几墩。出牌时必须跟随领出花色，至高牌与虚无牌可随时打出。
            每次操作限时 30 秒，超时后由茶馆托管完成本次行动。
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
            onPractice={() => setScreen("match")}
            onRules={() => setRulesOpen(true)}
            rulesButtonRef={rulesButtonRef}
          />
        ) : null}

        {screen === "room" ? (
          <FriendRoomScreen
            onInvite={() => setNotice("邀请链接已准备")}
            onStart={() => setScreen("match")}
          />
        ) : null}

        {screen === "match" ? (
          <MatchScreen onExit={() => setScreen("room")} />
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
