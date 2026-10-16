import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

function enterMatch() {
  fireEvent.click(screen.getByRole("button", { name: "单人练习" }));

  expect(
    screen.getByRole("heading", { name: "奇术茶馆快速局牌桌" }),
  ).toBeInTheDocument();
}

describe("friends-only game prototype", () => {
  it("opens editable room options before submitting a creation request", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "奇术茶馆" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "创建房间" }));
    expect(screen.getByRole("heading", { name: "创建房间" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "昵称" })).not.toHaveValue("");
    expect(screen.getByRole("checkbox", { name: "出牌倒计时" })).not.toBeChecked();
  });

  it("starts a dynamic match with private hand state and trump selection", () => {
    render(<App />);

    enterMatch();

    expect(
      within(screen.getByRole("group", { name: "你的手牌" })).getAllByRole(
        "button",
      ),
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "请选择本轮王牌" }),
    ).toBeInTheDocument();
  });

  it("submits a trump intent before bidding begins", () => {
    render(<App />);

    enterMatch();
    fireEvent.click(
      screen.getByRole("button", { name: "选择靛山为王牌" }),
    );

    expect(
      screen.queryByRole("heading", { name: "请选择本轮王牌" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("靛山")).toBeInTheDocument();
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
});
