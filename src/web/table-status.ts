import type { MatchPhase, MatchPlayerState, PublicMatchState } from "@wizzard/game-core/contracts";

export type TableStatusText = { phase: string; who?: string; prefix?: string; action: string };

export function tablePlayerName(player: MatchPlayerState, players: readonly MatchPlayerState[]): string {
  return players.some(other => other.id !== player.id && other.name === player.name)
    ? `${player.seatIndex + 1}号·${player.name}` : player.name;
}

export function currentAction(phase: MatchPhase, isOpeningPlay: boolean): string | null {
  if (phase === "trick-play") return isOpeningPlay ? "领出" : "出牌";
  if (phase === "bid") return "预测";
  if (phase === "trump-select") return "选王牌";
  return null;
}

export function tableStatus(state: PublicMatchState, viewer: string, connected: boolean, pending: boolean,
  network: boolean, hostId?: string): TableStatusText {
  const round = `第${state.roundIndex + 1}轮`;
  const name = (id?: string) => {
    const player = state.players.find(p => p.id === id);
    if (!player) return undefined;
    return player.id === viewer ? "你" : tablePlayerName(player, state.players);
  };
  if (!connected) return { phase: "连接恢复中", action: "等待同步牌桌" };
  if (state.phase === "match-end") {
    return { phase: "对局结束", who: network ? name(hostId) ?? "房主" : "你", action: "可再来一局" };
  }
  if (state.phase === "round-score") {
    return { phase: round + " · 结算", who: network ? "任一玩家" : "你",
      action: state.roundIndex + 1 === state.roundHandCounts.length ? "可揭晓总榜" : "可继续下一轮" };
  }
  if (state.phase === "trick-result") {
    const winner = name(state.completedTrick?.winnerId);
    return { phase: `第${state.trick.number}墩 · 结算`, who: winner, action: winner ? "赢得本墩" : "正在结算" };
  }
  const played = state.trick.plays.length;
  const phase = state.phase === "trick-play" ? `第${state.trick.number}墩 · 已出 ${played}/${state.players.length} 张`
    : round + (state.phase === "bid" ? " · 预测" : " · 选王牌");
  const who = name(state.currentPlayerId ?? undefined);
  if (!who) return { phase, action: "等待同步行动人" };
  const action = currentAction(state.phase, played === 0)!;
  if (pending && state.currentPlayerId === viewer) {
    return { phase, who, action: "正在提交" + (state.phase === "trick-play" ? "出牌" : state.phase === "bid" ? "预测" : "选择") };
  }
  return { phase, prefix: "轮到", who, action };
}
