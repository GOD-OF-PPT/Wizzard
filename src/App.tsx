import { useEffect, useRef, useState, type RefObject } from "react";
import homeScreen from "../art/runtime/backgrounds/home-screen-hd.png";
import homeScreenPortrait from "../art/runtime/backgrounds/home-screen-portrait-v1.png";
import primaryPanel from "../art/runtime/ui/primary-panel.png";
import secondaryPanel from "../art/runtime/ui/secondary-panel.png";
import smallPlaque from "../art/runtime/ui/small-plaque.png";
import { avatarImages, gameArt, type AvatarKey } from "./game-assets";
import { MatchScreen } from "./components/MatchScreen";
import { useFriendRoom, type FriendRoomState } from "./hooks/useFriendRoom";
import { useNetworkMatch } from "./hooks/useNetworkMatch";
import { useViewport } from "./hooks/useViewport";

type Screen = "home" | "room" | "match";

function WebUtilityBar({
  connection,
  onExit,
  status,
  title,
}: {
  connection?: string;
  onExit?: () => void;
  status: string;
  title: string;
}) {
  return (
    <div className="web-pc-utility" role="status">
      <div className="web-pc-utility__identity">
        <span className="web-pc-utility__seal" aria-hidden="true">茶</span>
        <div><strong>{title}</strong><span>{status}</span></div>
      </div>
      <div className="web-pc-utility__chips">
        <span>匿名访客</span>
        {connection ? <span className={`web-connection web-connection--${connection}`}>{connection === "connected" ? "已连接" : connection}</span> : null}
      </div>
      {onExit ? <button className="web-pc-utility__exit" onClick={onExit} type="button">退出</button> : null}
    </div>
  );
}

type ArtButtonProps = {
  buttonRef?: RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
  className?: string;
  image: string;
  label?: string;
  onClick: () => void;
};

function ArtButton({ buttonRef, children, className = "", image, label, onClick }: ArtButtonProps) {
  return (
    <button aria-label={label} className={`art-button ${className}`} onClick={onClick} ref={buttonRef} type="button">
      <img alt="" aria-hidden="true" draggable="false" src={image} />
      <span>{children}</span>
    </button>
  );
}

function HomeScreen({
  onCreateRoom,
  onJoinRoom,
  onPractice,
  onRules,
  rulesButtonRef,
}: {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onPractice: () => void;
  onRules: () => void;
  rulesButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <section aria-labelledby="home-title" className="screen-stage web-home-stage">
      <h1 className="sr-only" id="home-title">奇术茶馆</h1>
      <picture className="screen-art-picture">
        <source media="(orientation: portrait)" srcSet={homeScreenPortrait} />
        <img alt="奇术茶馆首页背景" className="screen-art" draggable="false" src={homeScreen} />
      </picture>
      <WebUtilityBar status="内部 PC 体验" title="奇术茶馆" />
      <div className="web-home-content">
        <div className="web-home-actions">
          <button aria-label="创建房间" className="web-home-action web-home-action--primary" onClick={onCreateRoom} type="button"><span>创建房间</span></button>
          <button aria-label="加入房间" className="web-home-action web-home-action--secondary" onClick={onJoinRoom} type="button"><span>加入房间</span></button>
          <button aria-label="单人练习" className="web-home-action web-home-action--practice" onClick={onPractice} type="button"><span>单人练习</span></button>
        </div>
        <button aria-label="规则与设置" className="web-home-rules" onClick={onRules} ref={rulesButtonRef} type="button"><span>规则与设置</span></button>
      </div>
    </section>
  );
}

function FriendRoomScreen({ onBack, onInvite, onJoin, onReady, onAddAi, onStart, roomState }: {
  onBack: () => void | Promise<void>;
  onInvite: () => void;
  onJoin: (displayName: string, roomCode: string) => void;
  onReady: () => void;
  onAddAi: () => void;
  onStart: () => void;
  roomState: FriendRoomState;
}) {
  const [displayName, setDisplayName] = useState("茶客");
  const [roomCode, setRoomCode] = useState("");
  const room = roomState.room;
  const players = room?.players ?? [];
  const canStart = roomState.permissions?.canStart ?? true;
  const roomAvatarKeys: AvatarKey[] = ["bamboo-cat", "wandering-crane", "flower-fox", "ink-panda", "sleepy-star-cat", "masked-traveler"];

  return (
    <section aria-labelledby="room-title" className="screen-stage web-room-stage">
      <img alt="茶馆桌面背景" className="screen-art" draggable="false" src={gameArt.table} />
      <WebUtilityBar connection={roomState.connection} onExit={onBack} status="好友房大厅" title={room?.roomCode ? `好友房 ${room.roomCode}` : "好友房大厅"} />
      <div className="web-room-shell">
        <header className="web-room-header">
          <button className="web-text-button" onClick={() => void onBack()} type="button">返回首页</button>
          <div><p className="web-eyebrow">匿名内部房间</p><h1 id="room-title">好友房 {room?.roomCode ?? "内部预览"}</h1></div>
          <span className={`web-connection web-connection--${roomState.connection}`}>{roomState.connection === "connected" ? "已连接" : roomState.connection}</span>
        </header>
        <div className="web-room-controls">
          <label>昵称<input maxLength={12} onChange={(event) => setDisplayName(event.target.value)} value={displayName} /></label>
          <label>六位房间码<input inputMode="numeric" maxLength={6} onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="创建后自动显示" value={roomCode} /></label>
          <div className="web-room-control-actions"><button onClick={() => onJoin(displayName, roomCode)} type="button">加入</button><button onClick={onInvite} type="button">复制邀请</button>{room ? <button onClick={onReady} type="button">准备/取消</button> : null}{room ? <button onClick={onAddAi} type="button">添加 AI</button> : null}</div>
        </div>
        <div className="web-room-players" aria-label="房间座位">
          {Array.from({ length: room?.maxPlayers ?? 6 }, (_, index) => {
            const player = players[index];
            return <article className={`web-room-seat ${player ? "is-occupied" : "is-open"}`} key={player?.playerId ?? index}>{player ? <><img alt={`${player.name}头像`} className="web-room-seat__avatar" src={avatarImages[roomAvatarKeys[index]].normal} /><span className="web-room-seat__name">{player.name}</span><span className="web-room-seat__state">{player.isAi ? "AI" : player.ready ? "已准备" : "等待准备"}</span></> : <span className="web-room-seat__empty">等待好友</span>}</article>;
          })}
        </div>
        {(roomState.error || !room) ? <p className="web-room-status" role="status">{roomState.error ? "房间服务暂不可用，可先进行单人练习。" : "本地预览可直接开始单人牌桌；连接房间服务后会显示真实座位。"}</p> : null}
        <footer className="web-room-footer"><button className="web-secondary-action" onClick={() => void onBack()} type="button">离开</button><button className="web-primary-action" disabled={!canStart} onClick={onStart} type="button">{canStart ? "开始游戏" : "等待准备"}</button></footer>
      </div>
    </section>
  );
}

function RulesDialog({ onClose, onToggleSound, returnFocusRef, soundEnabled }: { onClose: () => void; onToggleSound: () => void; returnFocusRef: RefObject<HTMLButtonElement | null>; soundEnabled: boolean }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => { window.removeEventListener("keydown", closeOnEscape); returnFocusRef.current?.focus(); };
  }, [onClose, returnFocusRef]);
  return <div className="dialog-scrim"><section aria-labelledby="rules-dialog-title" aria-modal="true" className="rules-dialog" role="dialog"><img alt="" aria-hidden="true" className="rules-dialog-art" draggable="false" src={primaryPanel} /><div className="rules-dialog-content"><h2 id="rules-dialog-title">规则与设置</h2><p>每轮先决定王牌，再依次预测自己会赢几墩。出牌时必须跟随领出花色，至高牌与虚无牌可随时打出。</p><div className="rules-summary"><span>快速局：8 轮</span><span>座位：3–6 人</span><span>匿名内网房</span></div><div className="rules-dialog-actions"><ArtButton image={smallPlaque} onClick={onToggleSound}>音效：{soundEnabled ? "开" : "关"}</ArtButton><ArtButton buttonRef={closeButtonRef} image={secondaryPanel} label="关闭规则与设置" onClick={onClose}>关闭</ArtButton></div></div></section></div>;
}

function Notice({ message }: { message: string }) {
  return <div className="notice" role="status"><img alt="" aria-hidden="true" draggable="false" src={smallPlaque} /><span>{message}</span></div>;
}

export function App() {
  const [notice, setNotice] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const rulesButtonRef = useRef<HTMLButtonElement>(null);
  const room = useFriendRoom();
  const networkMatch = useNetworkMatch(room.client);
  const viewport = useViewport();

  useEffect(() => {
    if (room.state.match && screen !== "match") {
      setScreen("match");
    } else if (room.state.room && !room.state.match && screen === "home") {
      setScreen("room");
    }
  }, [room.state.match, room.state.room, screen]);
  useEffect(() => { if (!notice) return undefined; const timeout = window.setTimeout(() => setNotice(null), 2400); return () => window.clearTimeout(timeout); }, [notice]);

  const openRoom = () => { room.createRoom("茶客"); setScreen("room"); };
  const leaveRoom = async () => {
    const left = await room.leaveRoom();
    if (left) {
      room.dispose();
      setScreen("home");
    } else {
      setNotice("离开请求未确认，请保持房间连接后重试");
    }
  };

  return <main className="game-prototype" data-viewport-mode={viewport.mode} data-viewport-visible={viewport.visible ? "true" : "false"}><div aria-hidden={rulesOpen || undefined} className="screen-layer" inert={rulesOpen}>
    {screen === "home" ? <HomeScreen onCreateRoom={openRoom} onJoinRoom={() => setScreen("room")} onPractice={() => setScreen("match")} onRules={() => setRulesOpen(true)} rulesButtonRef={rulesButtonRef} /> : null}
    {screen === "room" ? <FriendRoomScreen onBack={leaveRoom} onInvite={() => { const code = room.state.room?.roomCode; if (!code) { setNotice("请先连接房间服务"); return; } void navigator.clipboard?.writeText(code).then(() => setNotice(`房间码 ${code} 已复制`), () => setNotice(`房间码：${code}`)); }} onJoin={(displayName, code) => code.length === 6 ? room.joinRoom(displayName || "茶客", code) : setNotice("请输入六位数字房间码")} onReady={() => { const self = room.state.room?.players.find((player) => player.playerId === room.state.room?.selfPlayerId); room.setReady(!(self?.ready ?? false)); }} onAddAi={() => room.setAiCount(Math.min(4, (room.state.room?.players.filter((player) => player.isAi).length ?? 0) + 1))} onStart={() => room.state.room ? room.startRoom(true) : setScreen("match")} roomState={room.state} /> : null}
    {screen === "match" ? (room.state.match && networkMatch ? <MatchScreen controller={networkMatch} onExit={leaveRoom} /> : <MatchScreen onExit={() => { room.dispose(); setScreen("home"); }} />) : null}
  </div>{rulesOpen ? <RulesDialog onClose={() => setRulesOpen(false)} onToggleSound={() => setSoundEnabled((enabled) => !enabled)} returnFocusRef={rulesButtonRef} soundEnabled={soundEnabled} /> : null}{notice ? <Notice message={notice} /> : null}</main>;
}
