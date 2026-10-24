import { useEffect, useRef, useState } from "react";
import { SUITS, type Suit } from "@wizzard/game-core/contracts";
import { suitNames } from "../game-assets";
import chooser from "../../art/runtime/web-v3/chooser.png";
import portraitChooser from "../../art/runtime/web-v3/portrait/chooser.png";
import pendingChooser from "../../art/runtime/web-v3/chooser-pending-v2.png";
import portraitPendingChooser from "../../art/runtime/web-v3/portrait/chooser-pending-v2.png";
import bidArt from "../../art/runtime/web-v3/bid.png";
import portraitBidArt from "../../art/runtime/web-v3/portrait/bid.png";
import { trapDialogTab } from "../web/dialog-focus";

export function WebTrumpChooser({ onChoose, onExit, pending = false }: { onChoose: (suit: Suit) => void; onExit: () => void; pending?: boolean }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  return <section className="v3-chooser" role="dialog" aria-modal="true" aria-busy={pending || undefined} aria-labelledby="trump-title" onKeyDown={trapDialogTab}>
    <picture className="v3-chooser-art"><source media="(orientation: portrait)" srcSet={pending ? portraitPendingChooser : portraitChooser} /><img src={pending ? pendingChooser : chooser} alt="" /></picture>
    <h2 id="trump-title" className="sr-only">请选择本轮王牌</h2>
    <p className="sr-only">翻出至高牌，由发牌者选择。</p>
    <button className="v3-match-back v3-baked-hit" onClick={onExit} aria-label="返回首页"><span>返回首页</span></button>
    {pending && <p className="sr-only" role="status">正在提交选择…</p>}
    {SUITS.map((suit, index) => <button key={suit} disabled={pending} ref={index === 0 ? first : undefined} className={`v3-suit-hit v3-baked-hit v3-suit-${index}`} aria-label={`选择${suitNames[suit]}为王牌`} onClick={() => onChoose(suit)} />)}
  </section>;
}

export function WebBidPanel({ handSize, onSubmit, onExit, pending = false }: { handSize: number; onSubmit: (value: number) => void; onExit: () => void; pending?: boolean }) {
  const [bid, setBid] = useState(0);
  const confirm = useRef<HTMLButtonElement>(null);
  useEffect(() => { setBid(0); confirm.current?.focus(); }, [handSize]);
  return <section className="v3-bid" role="dialog" aria-modal="true" aria-busy={pending || undefined} aria-labelledby="bid-title" onKeyDown={event => {
    trapDialogTab(event);
    if (pending) return;
    if (event.key === "ArrowUp" || event.key === "ArrowRight") { event.preventDefault(); setBid(value => Math.min(handSize, value + 1)); }
    if (event.key === "ArrowDown" || event.key === "ArrowLeft") { event.preventDefault(); setBid(value => Math.max(0, value - 1)); }
  }}>
    <picture className="v3-bid-art"><source media="(orientation: portrait)" srcSet={portraitBidArt} /><img src={bidArt} alt="" /></picture>
    <button className="v3-match-back v3-baked-hit" onClick={onExit} aria-label="返回首页"><span>返回首页</span></button>
    <h2 id="bid-title" className="sr-only">预计赢几墩？</h2>
    <p className="v3-bid-range">本轮可预测 0 – {handSize} 墩</p>
    <output className="v3-bid-value" aria-live="polite">{bid}</output>
    <button className="v3-bid-minus v3-baked-hit" aria-label="减少预测" disabled={pending || bid === 0} onClick={() => setBid(value => Math.max(0, value - 1))} />
    <button className="v3-bid-plus v3-baked-hit" aria-label="增加预测" disabled={pending || bid === handSize} onClick={() => setBid(value => Math.min(handSize, value + 1))} />
    <button ref={confirm} disabled={pending} className="v3-bid-confirm v3-baked-hit" aria-label={pending ? `正在提交预测 ${bid}` : `确认预测 ${bid}`} onClick={() => onSubmit(bid)}>{pending ? "提交中" : "确认预测"}</button>
  </section>;
}
