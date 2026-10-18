import { useEffect, useRef, type RefObject } from "react";
import art from "../../art/runtime/web-v3/confirm.png";
import portraitArt from "../../art/runtime/web-v3/portrait/confirm.png";

export function LeaveDialog({ pending, error, onCancel, onConfirm, returnFocusRef }: { pending: boolean; error: string | null; onCancel: () => void; onConfirm: () => void; returnFocusRef?: RefObject<HTMLElement | null> }) {
  const cancel = useRef<HTMLButtonElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  useEffect(() => {
    const trigger = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    cancel.current?.focus();
    return () => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, [returnFocusRef]);
  return <div className="v3-confirm-scrim"><section className="screen-stage v3-confirm" role="dialog" aria-modal="true" aria-labelledby="leave-title" aria-describedby="leave-description" onKeyDown={event => {
    if (event.key === "Escape" && !pending) onCancelRef.current();
    if (event.key === "Tab") { event.preventDefault(); (document.activeElement === cancel.current ? confirm.current : cancel.current)?.focus(); }
  }}>
    <picture><source media="(orientation: portrait)" srcSet={portraitArt} /><img className="screen-art" src={art} alt="" /></picture>
    <h2 className="sr-only" id="leave-title">确认离开？</h2><p id="leave-description" className="sr-only">离开后将退出当前好友房。继续等待可保留当前座位。</p>
    <button ref={cancel} className="v3-confirm-cancel v3-baked-hit" aria-label="继续等待" onClick={onCancel} disabled={pending} />
    <button ref={confirm} className="v3-confirm-submit v3-baked-hit" aria-label="确认离开" onClick={onConfirm} disabled={pending} />
    {(pending || error) && <p className="v3-entry-feedback" role="status">{error || "正在确认离开，请稍候…"}</p>}
  </section></div>;
}
