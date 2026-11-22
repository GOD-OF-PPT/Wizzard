import { createDeck, SUITS } from "@wizzard/game-core";
import { cardImages, suitNames } from "../game-assets";
import { webSuitIcons } from "../web/suit-assets";
import type { CSSProperties } from "react";
import "./deck-guide.css";

const deck = createDeck();
const numberCards = deck.filter(card => card.kind === "number");
const ranks = numberCards.map(card => card.rank);
const suits = SUITS.map(suit => ({
  suit, count: numberCards.filter(card => card.suit === suit).length,
}));
const specials = [
  { kind: "highest", name: "至高牌", play: "随时可出，本墩最先打出至高牌的人获胜。若第一张就出至高牌，其他人可以出任意牌。", reveal: "由发牌者选择本轮王牌花色。" },
  { kind: "lowest", name: "虚无牌", play: "随时可出。用它领出后，由接下来的首张数字牌定花色。若先出现至高牌，就不必跟色。整墩都是虚无牌时，第一张获胜。", reveal: "本轮没有王牌。" },
] as const;

export function DeckGuide() {
  return <article className="deck-guide" id="rules-content" role="tabpanel" aria-labelledby="tab-rules">
    <header className="deck-guide__header">
      <h3>牌型与数量</h3>
      <span>全副 <b>{deck.length}</b> 张</span>
    </header>
    <div className="deck-guide__scroll" tabIndex={0} role="region" aria-label="全部牌型与牌力说明">
      <section>
        <h4>数字牌 <small>{numberCards.length} 张</small></h4>
        <p>每种花色都有 {Math.min(...ranks)} 到 {Math.max(...ranks)}，每个点数各一张。</p>
        <dl className="deck-guide__suits">
          {suits.map(({ suit, count }) => <div key={suit} data-suit={suit}>
            <dt><span className="deck-guide__symbol" aria-hidden="true" style={{ "--symbol": `url("${webSuitIcons[suit]}")` } as CSSProperties} />{suitNames[suit]}</dt>
            <dd>{count} 张</dd>
          </div>)}
        </dl>
        <p>轮初翻出数字牌，它的花色就是本轮王牌。出数字牌时，手里有领出花色就必须跟色。</p>
      </section>
      <section>
        <h4>特殊牌 <small>{deck.length - numberCards.length} 张</small></h4>
        <dl className="deck-guide__specials">
          {specials.map(({ kind, name, play, reveal }) => <div key={kind}>
            <dt><img src={cardImages[kind]} alt="" loading="lazy" /><strong>{name}</strong><small>{deck.filter(card => card.kind === kind).length} 张</small></dt>
            <dd>{play}<br /><b>轮初翻出</b> · {reveal}</dd>
          </div>)}
        </dl>
      </section>
      <section>
        <h4>怎样赢下这一墩？</h4>
        <p>先看首张至高牌。若本墩无人出至高牌，就看谁出的王牌点数最大。若也无人出王牌，就比较领出花色的点数。</p>
        <p>经典局最后一轮发完全部牌，没有翻牌，也没有王牌。</p>
      </section>
    </div>
  </article>;
}
