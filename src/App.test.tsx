import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

function enterFriendRoom() {
  fireEvent.click(screen.getByRole("button", { name: "创建房间" }));

  expect(
    screen.getByRole("heading", { name: "好友房 628315" }),
  ).toBeInTheDocument();
}

function enterGame() {
  enterFriendRoom();
  fireEvent.click(screen.getByRole("button", { name: "开始游戏" }));

  expect(
    screen.getByRole("heading", { name: "第 4 轮" }),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("group", { name: "你的手牌" })).getAllByRole(
      "button",
    ),
  ).toHaveLength(4);
}

function finishRound() {
  enterGame();

  const card = screen.getByRole("button", { name: "山 1" });
  fireEvent.click(card);

  expect(card).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(
    screen.getByRole("button", { name: /^(出牌|你的回合)$/ }),
  );

  expect(
    screen.getByRole("heading", { name: "第 4 轮结算" }),
  ).toBeInTheDocument();
}

describe("friends-only game prototype", () => {
  it("lets a player create a friend room from the home screen", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "奇术茶馆" }),
    ).toBeInTheDocument();

    enterFriendRoom();
  });

  it("starts the game from a prepared friend room", () => {
    render(<App />);

    enterGame();
  });

  it("selects and plays a hand card before showing the round result", () => {
    render(<App />);

    finishRound();
  });

  it("continues from the round result into the next round", () => {
    render(<App />);

    finishRound();
    fireEvent.click(screen.getByRole("button", { name: "继续" }));

    expect(
      screen.getByRole("heading", { name: "第 5 轮" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "你的手牌" })).getAllByRole(
        "button",
      ),
    ).toHaveLength(5);
  });

  it("opens and closes the rules and settings overlay", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "规则与设置" }));

    expect(
      screen.getByRole("dialog", { name: "规则与设置" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "关闭规则与设置" }),
    );

    expect(
      screen.queryByRole("dialog", { name: "规则与设置" }),
    ).not.toBeInTheDocument();
  });

  it("keeps keyboard focus inside the rules dialog and restores it on escape", () => {
    render(<App />);

    const rulesButton = screen.getByRole("button", { name: "规则与设置" });
    fireEvent.click(rulesButton);

    expect(
      screen.getByRole("button", { name: "关闭规则与设置" }),
    ).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      screen.queryByRole("dialog", { name: "规则与设置" }),
    ).not.toBeInTheDocument();
    expect(rulesButton).toHaveFocus();
  });
});
