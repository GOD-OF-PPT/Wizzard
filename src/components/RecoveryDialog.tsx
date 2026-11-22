import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import reconnecting from "../../art/runtime/web-v3/recovery-source-v1/landscape-reconnecting-v3.png";
import reconnectingPortrait from "../../art/runtime/web-v3/recovery-source-v1/portrait-reconnecting-v3.png";
import ended from "../../art/runtime/web-v3/recovery-source-v1/landscape-session-ended-v3.png";
import endedPortrait from "../../art/runtime/web-v3/recovery-source-v1/portrait-session-ended-v3.png";
import sourceLayout from "../../art/runtime/web-v3/recovery-source-v1/layout-v3.json";
import focusLayout from "../../art/runtime/web-v3/recovery-source-v1/focus-layout-v2.json";
import reconnectingFocus from "../../art/runtime/web-v3/recovery-source-v1/landscape-reconnecting-focus-v2.png";
import endedFocus from "../../art/runtime/web-v3/recovery-source-v1/landscape-session-ended-focus-v2.png";
import reconnectingFocusPortrait from "../../art/runtime/web-v3/recovery-source-v1/portrait-reconnecting-focus-v2.png";
import endedFocusPortrait from "../../art/runtime/web-v3/recovery-source-v1/portrait-session-ended-focus-v2.png";
import portraitTopScene from "../../art/runtime/web-v3/recovery-source-v1/portrait-top-scene-v1.png";
import { trapDialogTab } from "../web/dialog-focus";

const recoveryStyle = Object.fromEntries(Object.entries(sourceLayout.profiles).flatMap(([profile, value]) => {
  const prefix = profile === "portrait" ? "--recovery-portrait" : "--recovery";
  return [["panel", value.roi], ["action", value.action], ["focus", focusLayout.profiles[profile as keyof typeof focusLayout.profiles].ring]].flatMap(([part, box]) => {
    const [x, y, width, height] = box as number[];
    return [[`${prefix}-${part}-left`, `${x / value.canvas[0] * 100}%`], [`${prefix}-${part}-top`, `${y / value.canvas[1] * 100}%`], [`${prefix}-${part}-width`, `${width / value.canvas[0] * 100}%`], [`${prefix}-${part}-height`, `${height / value.canvas[1] * 100}%`]];
  });
})) as CSSProperties;

/** Fixed panel pixels come from the selected source; room state stays live. */
export function RecoveryDialog({ terminal, onRetry, onHome, returnFocusRef }: {
  terminal: boolean; onRetry: () => void; onHome: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const action = useRef<HTMLButtonElement>(null);
  const [focusReady, setFocusReady] = useState(false);
  useEffect(() => {
    action.current?.focus();
    return () => {
      if (returnFocusRef?.current?.isConnected) returnFocusRef.current.focus({ preventScroll: true });
    };
  }, [terminal, returnFocusRef]);
  return <div className="v3-recovery-scrim"><section style={recoveryStyle} data-focus-ready={focusReady} className={`screen-stage v3-recovery ${terminal ? "is-terminal" : "is-reconnecting"}`} role="alertdialog" aria-modal="true" aria-labelledby="recovery-title" aria-describedby="recovery-description" onKeyDown={event => {
    trapDialogTab(event);
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); }
  }}>
    <img className="v3-recovery-portrait-top-scene" src={portraitTopScene} alt="" aria-hidden="true" draggable={false} />
    <picture className="v3-recovery-panel"><source media="(orientation: portrait)" srcSet={terminal ? endedPortrait : reconnectingPortrait} /><img src={terminal ? ended : reconnecting} alt="" draggable={false} /></picture>
    <h2 className="sr-only" id="recovery-title">{terminal ? "本次连接已结束" : "正在恢复连接"}</h2>
    <p className="sr-only" id="recovery-description">{terminal ? "茶馆暂时无法继续当前连接。返回首页后，可重新加入好友房。" : "暂时与茶馆失去联系。恢复后将继续当前对局，请勿关闭页面。"}</p>
    <button ref={action} type="button" className="v3-recovery-action v3-baked-hit" aria-label={terminal ? "返回首页" : "立即重试"} onClick={terminal ? onHome : onRetry} />
    <picture className="v3-recovery-focus"><source media="(orientation: portrait)" srcSet={terminal ? endedFocusPortrait : reconnectingFocusPortrait} /><img src={terminal ? endedFocus : reconnectingFocus} alt="" aria-hidden="true" draggable={false} onLoad={() => setFocusReady(true)} onError={() => setFocusReady(false)} /></picture>
  </section></div>;
}
