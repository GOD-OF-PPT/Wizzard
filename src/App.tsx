import { useEffect, useRef, useState } from "react";
import smallPlaque from "../art/runtime/ui/small-plaque.png";
import { MatchScreen } from "./components/MatchScreen";
import { useFriendRoom } from "./hooks/useFriendRoom";
import { useNetworkMatch } from "./hooks/useNetworkMatch";
import { useViewport } from "./hooks/useViewport";
import { WebHome } from "./components/WebHome";
import { RoomEntry, type RoomOptions } from "./components/RoomEntry";
import { WebLobby } from "./components/WebLobby";
import { LeaveDialog } from "./components/LeaveDialog";
import { WebRules, loadWebPreferences } from "./components/WebRules";

type Screen = "home" | "create" | "join" | "room" | "match";

function Notice({ message }: { message: string }) {
  return <div className="notice" role="status"><img alt="" aria-hidden="true" draggable="false" src={smallPlaque} /><span>{message}</span></div>;
}

export function App() {
  const [notice, setNotice] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [preferences, setPreferences] = useState(loadWebPreferences);
  const [entryPending, setEntryPending] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [fillAi, setFillAi] = useState(true);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const rulesButtonRef = useRef<HTMLButtonElement>(null);
  const room = useFriendRoom();
  const networkMatch = useNetworkMatch(room.client);
  const viewport = useViewport();

  useEffect(() => {
    if (room.state.match && screen !== "match") {
      setScreen("match");
    } else if (room.state.room && !room.state.match && screen !== "room") {
      setEntryPending(false);
      setScreen("room");
    }
  }, [room.state.match, room.state.room, screen]);
  useEffect(() => { if (!notice) return undefined; const timeout = window.setTimeout(() => setNotice(null), 2400); return () => window.clearTimeout(timeout); }, [notice]);

  useEffect(() => {
    if (!entryPending) return;
    if (room.state.error) {
      setEntryError("暂时无法进入房间，请检查房间码或稍后重试。");
      setEntryPending(false);
      room.dispose();
      return;
    }
    const timeout = window.setTimeout(() => {
      setEntryPending(false);
      setEntryError("连接超时，请稍后重试。");
      room.dispose();
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [entryPending, room.state.error, room.dispose]);
  const openEntry = (mode: "create" | "join") => { setEntryError(null); setEntryPending(false); setScreen(mode); };
  const submitEntry = (options: RoomOptions) => {
    setEntryPending(true); setEntryError(null); setFillAi(options.fillAi);
    if (screen === "create") room.createRoom(options.name, options.seats, options.timer);
    else room.joinRoom(options.name, options.code);
  };
  const leaveRoom = async () => {
    if (leaving || room.pendingCommand) return;
    if (!room.state.room) { room.dispose(); setScreen("home"); return; }
    setLeaving(true); setLeaveError(null);
    const left = await room.leaveRoom();
    setLeaving(false);
    if (left) {
      room.dispose();
      setLeaveOpen(false);
      setScreen("home");
    } else {
      setLeaveError("离开请求未确认，请保持连接后重试。");
    }
  };

  return <main className="game-prototype" data-reduced-motion={preferences.reducedMotion || viewport.reducedMotion} data-viewport-mode={viewport.mode} data-viewport-visible={viewport.visible ? "true" : "false"}><div aria-hidden={rulesOpen || leaveOpen || undefined} className="screen-layer" inert={rulesOpen || leaveOpen}>
    {screen === "home" ? <WebHome onCreateRoom={() => openEntry("create")} onJoinRoom={() => openEntry("join")} onPractice={() => setScreen("match")} onRules={() => setRulesOpen(true)} rulesButtonRef={rulesButtonRef} /> : null}
    {screen === "create" || screen === "join" ? <RoomEntry key={screen} mode={screen} pending={entryPending} error={entryError} onBack={() => { room.dispose(); setScreen("home"); }} onSubmit={submitEntry} onEditConnection={() => { room.dispose(); setEntryPending(false); setEntryError(null); }} /> : null}
    {screen === "room" ? <WebLobby controller={room} fillAi={fillAi} onManualAi={() => setFillAi(false)} onExit={() => { setLeaveError(null); setLeaveOpen(true); }} onInvite={() => { const code = room.state.room?.roomCode; if (!code) return; if (!navigator.clipboard) { setNotice(`房间码：${code}`); return; } void navigator.clipboard.writeText(code).then(() => setNotice(`房间码 ${code} 已复制`), () => setNotice(`房间码：${code}`)); }} /> : null}
    {screen === "match" ? (room.state.match && networkMatch ? <MatchScreen showLegalHints={preferences.legalHints} controller={networkMatch} onExit={() => setLeaveOpen(true)} /> : <MatchScreen showLegalHints={preferences.legalHints} onExit={() => { room.dispose(); setScreen("home"); }} />) : null}
  </div>{leaveOpen ? <LeaveDialog pending={leaving} error={leaveError} onCancel={() => setLeaveOpen(false)} onConfirm={() => void leaveRoom()} /> : null}{rulesOpen ? <WebRules onClose={() => setRulesOpen(false)} returnFocusRef={rulesButtonRef} preferences={preferences} onPreferences={value => { setPreferences(value); try { localStorage.setItem("wizzard.web.preferences.v1", JSON.stringify(value)); } catch { /* Keep preferences in memory when storage is unavailable. */ } }} /> : null}{notice ? <Notice message={notice} /> : null}</main>;
}
