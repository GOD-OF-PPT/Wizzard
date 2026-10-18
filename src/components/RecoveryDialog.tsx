import { useEffect, useRef, type RefObject } from "react";
import reconnecting from "../../art/runtime/web-v3/reconnecting-panel-landscape-v1.png";
import reconnectingPortrait from "../../art/runtime/web-v3/reconnecting-panel-portrait-v1.png";
import ended from "../../art/runtime/web-v3/session-ended-panel-landscape-v2.png";
import endedPortrait from "../../art/runtime/web-v3/session-ended-panel-portrait-v2.png";
import { trapDialogTab } from "../web/dialog-focus";

/** Independent authored panel, not a screenshot replacing the live room behind it. */
export function RecoveryDialog({ terminal, onRetry, onHome, returnFocusRef }: {
  terminal: boolean; onRetry: () => void; onHome: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const action = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    action.current?.focus();
    return () => {
      if (returnFocusRef?.current?.isConnected) returnFocusRef.current.focus({ preventScroll: true });
    };
  }, [terminal, returnFocusRef]);
  return <div className="v3-recovery-scrim"><section className={`screen-stage v3-recovery ${terminal ? "is-terminal" : "is-reconnecting"}`} role="alertdialog" aria-modal="true" aria-labelledby="recovery-title" aria-describedby="recovery-description" onKeyDown={event => {
    trapDialogTab(event);
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); }
  }}>
    <picture className="v3-recovery-panel"><source media="(orientation: portrait)" srcSet={terminal ? endedPortrait : reconnectingPortrait} /><img src={terminal ? ended : reconnecting} alt="" draggable={false} /></picture>
    <h2 className="sr-only" id="recovery-title">{terminal ? "本次连接已结束" : "正在恢复连接"}</h2>
    <p className="sr-only" id="recovery-description">{terminal ? "茶馆暂时无法继续当前连接。返回首页后，可重新加入好友房。" : "暂时与茶馆失去联系。恢复后将继续当前对局，请勿关闭页面。"}</p>
    <button ref={action} type="button" className="v3-recovery-action v3-baked-hit" aria-label={terminal ? "返回首页" : "立即重试"} onClick={terminal ? onHome : onRetry} />
  </section></div>;
}
