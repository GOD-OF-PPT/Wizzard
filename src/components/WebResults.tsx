import { useEffect, useRef, useState } from "react";
import type { MatchPlayerState } from "@wizzard/game-core/contracts";
import { webResultsAvatar } from "../web/avatar-assets";
import results from "../../art/runtime/web-v3/results.png";
import rankingArt from "../../art/runtime/web-v3/ranking-clean-v3.png";
import portraitResults from "../../art/runtime/web-v3/portrait/results.png";
import portraitRanking from "../../art/runtime/web-v3/portrait/ranking-v2.png";
import { trapDialogTab } from "../web/dialog-focus";

export function WebResults({ isMatchEnd, isFinalRound = false, onContinue, onExit, onRestart, players, roundNumber, network = false, canContinue = true, canRestart = true, blockedLabel }: {
  isMatchEnd: boolean; onContinue: () => void; onExit: () => void; onRestart: () => void;
  isFinalRound?: boolean;
  players: readonly MatchPlayerState[]; roundNumber: number; network?: boolean;
  canContinue?: boolean; canRestart?: boolean; blockedLabel?: string;
}) {
  const [showRanking, setShowRanking] = useState(false);
  const rank = isMatchEnd || showRanking;
  const primary = useRef<HTMLButtonElement>(null);
  const ordered = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const primaryLabel = (isMatchEnd ? !canRestart : !canContinue)
    ? blockedLabel ?? (isMatchEnd ? "等待房主再开" : "等待牌桌继续")
    : isMatchEnd ? "再来一局" : isFinalRound ? "查看最终总榜" : "继续下一轮";
  useEffect(() => { primary.current?.focus(); }, [rank]);
  return <section className={`v3-results ${rank ? "v3-ranking" : ""}`} role="dialog" aria-modal="true" aria-labelledby="results-title" onKeyDown={event => {
    trapDialogTab(event);
    if (event.key === "Escape" && showRanking && !isMatchEnd) setShowRanking(false);
  }}>
    <div className="v3-results-canvas">
    <picture className="v3-results-art"><source media="(orientation: portrait)" srcSet={rank ? portraitRanking : portraitResults} /><img src={rank ? rankingArt : results} className="screen-art" alt="" /></picture>
    <h2 id="results-title" className="v3-results-title">{rank ? isMatchEnd ? "快速局总榜" : "当前总榜" : <>第 <span className="v3-results-round-number">{roundNumber}</span> 轮结算</>}</h2>
    {rank && <p className="v3-ranking-subtitle">{isMatchEnd ? "八轮已毕 · 下回再会" : `已完成第${roundNumber}轮`}</p>}
    <div className="v3-results-table" role="table" aria-label={rank ? "总分排名" : "本轮计分"}>
      <div className="sr-only" role="row">{(rank ? ["名次", "玩家", "总分"] : ["玩家", "预测", "赢墩", "本轮", "总分"]).map(label => <span key={label} role="columnheader">{label}</span>)}</div>
      {ordered.map((player, index) => {
        const standing = ordered.findIndex(other => other.totalScore === player.totalScore) + 1;
        return <div className={`v3-results-row ${rank && index === 0 ? "is-leading" : ""}`} role="row" key={player.id}>
          {rank && <span role="cell">{standing}</span>}
          <span className="v3-results-player" role="cell"><img src={webResultsAvatar(player.avatarKey)} alt="" draggable={false} /><span title={player.name}>{player.name}</span></span>
          {!rank && <><span role="cell">{player.bid ?? "—"}</span><span role="cell">{player.tricksWon}</span><span role="cell" className={(player.roundScore ?? 0) >= 0 ? "is-positive" : "is-negative"}>{player.roundScore === null ? "—" : `${player.roundScore >= 0 ? "+" : ""}${player.roundScore}`}</span></>}
          <span role="cell">{player.totalScore}</span>
        </div>;
      })}
    </div>
    {!rank && <p className="v3-results-note">预测准确获得20分基础分</p>}
    <button className="v3-results-secondary v3-baked-hit" onClick={rank ? isMatchEnd ? onExit : () => setShowRanking(false) : () => setShowRanking(true)}>{rank ? isMatchEnd ? network ? "离开房间" : "返回首页" : "返回结算" : "查看总榜"}</button>
    <button ref={primary} className="v3-results-primary v3-baked-hit" aria-label={primaryLabel} disabled={isMatchEnd ? !canRestart : !canContinue} onClick={isMatchEnd ? onRestart : onContinue}>{primaryLabel}</button>
    </div>
  </section>;
}
