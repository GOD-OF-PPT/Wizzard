import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { MatchPlayerState, PlayedCard } from "@wizzard/game-core/contracts";
import layout from "../../art/runtime/web-v3/trick-layout-v1.json";
import { gameArt } from "../game-assets";
import { tablePlayerName } from "../web/table-status";
import { CardView, getCardLabel } from "./CardView";

function playStyle(index: number, count: number): CSSProperties {
  const slot = count <= 4 ? 1.5 + index - (count - 1) / 2 : index * 3 / (count - 1);
  const style: Record<string, string | number> = { "--play-order": index + 1 };
  for (const profile of ["landscape", "portrait"] as const) {
    const cards = layout.profiles[profile].cards;
    const lower = Math.floor(slot), upper = Math.ceil(slot), mix = slot - lower;
    const matrix = cards[lower].cssMatrix3d.map((v, i) => v + (cards[upper].cssMatrix3d[i] - v) * mix);
    style[profile === "landscape" ? "--trick-source-matrix" : "--portrait-trick-source-matrix"] = `matrix3d(${matrix.join(",")})`;
    // Project one point on the visible edge. The label stays horizontal
    // as the card moves and fans out after each authoritative play.
    const x = layout.contract.cardBox[0] * (count > 4 && index < count - 1 ? .38 : .5);
    const y = count > 4 && index % 2 === 1 ? layout.contract.cardBox[1] : 0;
    const w = matrix[3] * x + matrix[7] * y + matrix[15];
    style[`--owner-${profile}-x`] = `${(matrix[0] * x + matrix[4] * y + matrix[12]) / w}px`;
    style[`--owner-${profile}-y`] = `${(matrix[1] * x + matrix[5] * y + matrix[13]) / w}px`;
  }
  return style as CSSProperties;
}

export function TrickArea({ completedWinnerId, plays, players, viewerId, showEmpty }: {
  completedWinnerId?: string; plays: readonly PlayedCard[]; players: readonly MatchPlayerState[];
  viewerId: string; showEmpty: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!expanded) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !openButton.current?.contains(event.target)) setExpanded(null);
    }
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [expanded]);

  return <section className={`trick-area${plays.length ? " has-plays" : ""}`} data-crowded={plays.length > 4 || undefined} aria-label="当前一墩">
    {showEmpty && !plays.length && <span className="trick-area__empty">
      <img alt="" aria-hidden="true" draggable={false} src={gameArt.smallPlaque} /><span>等待领出</span>
    </span>}
    {plays.map(({ card, playerId }, index) => {
      const player = players.find(p => p.id === playerId);
      const name = player ? tablePlayerName(player, players) : "未知玩家";
      const owner = playerId === viewerId ? "你" : name;
      const detail = `第${index + 1}张 · ${playerId === viewerId ? `你（${name}）` : name} · ${getCardLabel(card)}`;
      const open = expanded === card.id;
      return <figure key={card.id} className="trick-play" style={playStyle(index, plays.length)} aria-label={detail}>
        <CardView card={card} className="trick-card" surface="trick" state="played" winner={completedWinnerId === playerId} />
        <figcaption className="trick-owner" data-expanded={open || undefined}>
          <button type="button" ref={open ? openButton : undefined} data-audio="silent"
            aria-label={detail} aria-expanded={open} onClick={() => setExpanded(open ? null : card.id)}
            onBlur={() => { if (open) setExpanded(null); }} onKeyDown={e => { if (e.key === "Escape" && open) { e.stopPropagation(); setExpanded(null); } }}>
            {open ? detail : owner}
          </button>
        </figcaption>
      </figure>;
    })}
  </section>;
}
