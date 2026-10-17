import { useEffect, useRef } from "react";
import failure from "../../art/runtime/web-v3/connection-error-v1.png";
import portraitFailure from "../../art/runtime/web-v3/portrait/connection-error-v1.png";
import connecting from "../../art/runtime/web-v3/connecting-v1.png";
import portraitConnecting from "../../art/runtime/web-v3/portrait/connecting-v1.png";

export function preloadConnectionArt() {
  for (const src of [failure, portraitFailure, connecting, portraitConnecting]) {
    const image = new Image(); image.src = src;
  }
}

/** Fixed, truthful connection copy is authored in the art; both actions are live.
 * The editable form stays mounted underneath, so retry/cancel never loses input. */
export function ConnectionDialog({ pending, onReturn, onRetry }: {
  pending: boolean; onReturn: () => void; onRetry: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => { back.current?.focus(); }, [pending]);
  return <div className="v3-confirm-scrim v3-connection-scrim"><section ref={root} className={`screen-stage v3-confirm v3-connection ${pending ? "is-connecting" : "is-failed"}`} role="dialog" aria-modal="true" aria-labelledby="connection-title" aria-describedby="connection-description" onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onReturn(); }
    if (event.key === "Tab") {
      const controls = [...(root.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
      if (controls.length === 1 || (!event.shiftKey && document.activeElement === controls.at(-1)) || (event.shiftKey && document.activeElement === controls[0])) {
        event.preventDefault(); (event.shiftKey ? controls.at(-1) : controls[0])?.focus();
      }
    }
  }}>
    <picture><source media="(orientation: portrait)" srcSet={pending ? portraitConnecting : portraitFailure} /><img className="screen-art" src={pending ? connecting : failure} alt="" /></picture>
    <h2 className="sr-only" id="connection-title">{pending ? "正在连接茶馆" : "暂未连上茶馆"}</h2>
    <p className="sr-only" id="connection-description" role={pending ? "status" : "alert"}>{pending ? "正在确认房间，请稍候。昵称与房间设置已为你保留。" : "请检查房间码或网络后重试。已填写的内容将为你保留。"}</p>
    <button ref={back} type="button" className="v3-confirm-cancel v3-baked-hit" aria-label="返回修改" onClick={onReturn} />
    {!pending && <button type="button" className="v3-confirm-submit v3-baked-hit" aria-label="重新连接" onClick={onRetry} />}
  </section></div>;
}
