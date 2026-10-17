import { useEffect, useRef, useState } from "react";
import { SUITS, type Suit } from "@wizzard/game-core/contracts";
import { suitNames } from "../game-assets";
import chooser from "../../art/runtime/web-v3/chooser.png";
import portraitChooser from "../../art/runtime/web-v3/portrait/chooser.png";
import bidArt from "../../art/runtime/web-v3/bid.png";

export function WebTrumpChooser({ onChoose, onExit }: { onChoose: (suit: Suit) => void; onExit: () => void }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  return <section className="v3-chooser" role="dialog" aria-modal="true" aria-labelledby="trump-title">
    <picture className="v3-chooser-art"><source media="(orientation: portrait)" srcSet={portraitChooser} /><img src={chooser} alt="" /></picture>
    <h2 id="trump-title" className="sr-only">请选择本轮王牌</h2>
    <p className="sr-only">翻出至高牌，由发牌者选择。</p>
    <button className="v3-match-back v3-baked-hit" onClick={onExit} aria-label="返回首页" />
    {SUITS.map((suit, index) => <button key={suit} ref={index === 0 ? first : undefined} className={`v3-suit-hit v3-baked-hit v3-suit-${index}`} aria-label={`选择${suitNames[suit]}为王牌`} onClick={() => onChoose(suit)} />)}
  </section>;
}

export function WebBidPanel({ handSize, onSubmit }: { handSize: number; onSubmit: (value: number) => void }) {
  const [bid, setBid] = useState(0);
  const confirm = useRef<HTMLButtonElement>(null);
  useEffect(() => { setBid(0); confirm.current?.focus(); }, [handSize]);
  return <section className="v3-bid" aria-labelledby="bid-title">
    <img className="v3-bid-art" src={bidArt} alt="" />
    <h2 id="bid-title" className="sr-only">预计赢几墩？</h2>
    <p className="v3-bid-range">本轮可预测 0–{handSize} 墩</p>
    <output className="v3-bid-value" aria-live="polite">{bid}</output>
    <button className="v3-bid-minus v3-baked-hit" aria-label="减少预测" disabled={bid === 0} onClick={() => setBid(value => Math.max(0, value - 1))} />
    <button className="v3-bid-plus v3-baked-hit" aria-label="增加预测" disabled={bid === handSize} onClick={() => setBid(value => Math.min(handSize, value + 1))} />
    <button ref={confirm} className="v3-bid-confirm v3-baked-hit" aria-label={`确认预测 ${bid}`} onClick={() => onSubmit(bid)}>确认预测</button>
  </section>;
}
