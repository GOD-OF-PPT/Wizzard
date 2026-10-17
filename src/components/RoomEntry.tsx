import { useEffect, useRef, useState, type FormEvent } from "react";
import createArt from "../../art/runtime/web-v3/create.png";
import joinArt from "../../art/runtime/web-v3/join.png";
import switchOn from "../../art/runtime/web-v3/switch-on-opaque-v3.png";
import switchOff from "../../art/runtime/web-v3/switch-off-opaque-v3.png";
import portraitCreate from "../../art/runtime/web-v3/portrait/create.png";
import portraitJoin from "../../art/runtime/web-v3/portrait/join.png";
import clearArt from "../../art/runtime/web-v3/input-clear.png";
import createStaticArt from "../../art/runtime/web-v3/create-static-v1.png";
import joinStaticArt from "../../art/runtime/web-v3/join-static-v1.png";
import portraitCreateStatic from "../../art/runtime/web-v3/portrait/create-static-v1.png";
import portraitJoinStatic from "../../art/runtime/web-v3/portrait/join-static-v1.png";
import { FormArtMasks } from "../web/form-art-masks";
import { ConnectionDialog, preloadConnectionArt } from "./ConnectionDialog";

export type RoomOptions = { name: string; seats: 3 | 4 | 5 | 6; fillAi: boolean; timer: boolean; code: string };
type Props = { mode: "create" | "join"; pending: boolean; error: string | null; onBack: () => void; onSubmit: (options: RoomOptions) => void; onEditConnection: () => void };

function freshName() {
  const names = ["茶客听雨", "竹下闲客", "月下煮茶", "灯下听风", "青山茶客", "松间来客", "花间问茶", "云归小馆"];
  return names[Math.floor(Math.random() * names.length)];
}

export function RoomEntry({ mode, pending, error, onBack, onSubmit, onEditConnection }: Props) {
  const [name, setName] = useState(freshName);
  const [seats, setSeats] = useState<3 | 4 | 5 | 6>(6);
  const [fillAi, setFillAi] = useState(true);
  const [timer, setTimer] = useState(false);
  const [code, setCode] = useState("");
  const [validation, setValidation] = useState("");
  const root = useRef<HTMLElement>(null);
  const nickname = useRef<HTMLInputElement>(null);
  const connectionOpen = pending || !!error;
  const wasConnectionOpen = useRef(false);
  const title = mode === "create" ? "创建房间" : "加入房间";
  useEffect(() => {
    preloadConnectionArt();
    // A phone should show the form before the user asks for its keyboard.
    if (window.matchMedia?.("(orientation: portrait)").matches) root.current?.focus({ preventScroll: true });
    else root.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, []);
  useEffect(() => {
    if (wasConnectionOpen.current && !connectionOpen) root.current?.querySelector<HTMLInputElement>(mode === "join" ? ".v3-entry-code input" : ".v3-entry-name input")?.focus();
    wasConnectionOpen.current = connectionOpen;
  }, [connectionOpen, mode]);
  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (pending) return;
    if (!name.trim()) { setValidation("请填写茶客昵称"); return; }
    if (mode === "join" && !/^\d{6}$/.test(code)) { setValidation("请输入六位数字房间码"); return; }
    setValidation("");
    onSubmit({ name: name.trim(), seats, fillAi, timer, code });
  }
  return <section ref={root} tabIndex={-1} className={`screen-stage v3-entry v3-entry--${mode}`} aria-labelledby="entry-title" onKeyDown={event => {
    if (event.key === "Escape" && !connectionOpen) onBack();
  }}>
    <div className="v3-entry-canvas">
    <picture className="v3-entry-art"><source media="(orientation: portrait)" srcSet={mode === "create" ? portraitCreateStatic : portraitJoinStatic} /><img className="screen-art" src={mode === "create" ? createStaticArt : joinStaticArt} alt="" draggable={false} /></picture>
    <FormArtMasks mode={mode} landscape={mode === "create" ? createArt : joinArt} portrait={mode === "create" ? portraitCreate : portraitJoin} />
    <h1 id="entry-title" className="sr-only">{title}</h1>
    <form onSubmit={submit} aria-busy={pending} aria-label={title} inert={connectionOpen} aria-hidden={connectionOpen || undefined}>
      <div className="v3-entry-name"><span className="v3-mobile-label">昵称</span><input ref={nickname} aria-label="昵称" autoComplete="off" maxLength={12} value={name} disabled={pending} onChange={event => { setName(event.target.value); setValidation(""); }} />{mode === "create" && name && <button type="button" className="v3-name-clear" aria-label="清空昵称" disabled={pending} onClick={() => { setName(""); nickname.current?.focus(); }}><img src={clearArt} alt="" /></button>}</div>
      {mode === "create" ? <>
        <fieldset className="v3-seat-options" disabled={pending}><legend className="sr-only">选择座位</legend>{([3, 4, 5, 6] as const).map(value => <button type="button" key={value} aria-pressed={value === seats} onClick={() => setSeats(value)}><span>{value}人</span></button>)}</fieldset>
        <label className="v3-entry-toggle v3-entry-ai"><span className="v3-mobile-label">AI补位</span><span className="v3-switch-art"><img src={fillAi ? switchOn : switchOff} alt="" /></span><input type="checkbox" checked={fillAi} disabled={pending} onChange={event => setFillAi(event.target.checked)} aria-label="AI补位" /><span>{fillAi ? "开启" : "关闭"}</span></label>
        <label className="v3-entry-toggle v3-entry-timer"><span className="v3-mobile-label">出牌倒计时</span><span className="v3-switch-art"><img src={timer ? switchOn : switchOff} alt="" /></span><input type="checkbox" checked={timer} disabled={pending} onChange={event => setTimer(event.target.checked)} aria-label="出牌倒计时" /><span>{timer ? "开启" : "关闭"}</span></label>
      </> : <label className="v3-entry-code"><span className="v3-mobile-label">房间码</span><span aria-hidden="true" className="v3-code-digits">{Array.from({ length: 6 }, (_, index) => <span key={index}>{code[index] ?? ""}</span>)}</span><input aria-label="六位房间码" inputMode="numeric" autoComplete="off" maxLength={6} value={code} disabled={pending} onChange={event => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setValidation(""); }} /></label>}
      <button type="button" aria-label="返回首页" className="v3-entry-back v3-baked-hit" disabled={pending} onClick={onBack}><span className="v3-mobile-label">返回首页</span></button>
      <button type="submit" aria-label={pending ? "正在连接" : title} className="v3-entry-submit v3-baked-hit" disabled={pending}><span className="v3-mobile-label">{title}</span></button>
      {validation && <p className="v3-entry-feedback" role="alert">{validation}</p>}
    </form>
    </div>
    {connectionOpen && <ConnectionDialog pending={pending} onReturn={onEditConnection} onRetry={() => submit()} />}
  </section>;
}
