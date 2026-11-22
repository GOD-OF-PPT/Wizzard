import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrickArea } from "./TrickArea";
import { reviewMatchController } from "../web/review-match-fixture";
import { tableStatus } from "../web/table-status";

describe("public trick information", () => {
  it("pairs cards with their owners even when the leader is not seat zero and two names match", () => {
    const state = reviewMatchController("trick-play", 4, true, "sun", 3).snapshot.publicState;
    state.players[1].name = state.players[3].name = "同名茶客";
    render(<TrickArea plays={state.trick.plays} players={state.players} viewerId={state.players[2].id} showEmpty={false}/>);
    const cards = [...document.querySelectorAll<HTMLElement>(".trick-play")];
    expect(cards.map(card => within(card).getByRole("button").textContent)).toEqual(["2号·同名茶客", "你", "4号·同名茶客"]);
    expect(within(cards[0]).getByRole("img", { name: "青叶 7" })).toBeInTheDocument();
    const tag = screen.getByRole("button", { name: "第2张 · 你（花间狐） · 朱结 3" });
    fireEvent.click(tag);
    expect(tag).toHaveTextContent("你（花间狐）");
    expect(tag).toHaveTextContent("朱结 3");
    fireEvent.keyDown(tag, { key: "Escape" });
    expect(tag).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps pending, settlement, and reconnection distinct from the next player's turn", () => {
    const state = reviewMatchController("trick-play").snapshot.publicState;
    const [self, host, winner] = state.players;
    const read = (connected = true, pending = false) => tableStatus(state, self.id, connected, pending, true, host.id);
    expect(read(true, true)).toMatchObject({ who: "你", action: "正在提交出牌" });
    state.currentPlayerId = host.id;
    expect(read(true, true)).toMatchObject({ who: host.name, action: "出牌" });
    expect(read(false)).not.toHaveProperty("who");
    state.phase = "trick-result";
    state.currentPlayerId = null;
    state.completedTrick = { ...state.trick, winnerId: winner.id };
    expect(read()).toMatchObject({ who: winner.name, action: "赢得本墩" });
    state.phase = "round-score";
    expect(read()).toMatchObject({ who: "任一玩家", action: "可继续下一轮" });
    state.phase = "match-end";
    expect(read()).toMatchObject({ who: host.name, action: "可再来一局" });
  });
});
