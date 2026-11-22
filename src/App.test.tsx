import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Explicit highest-reveal replay for this test, never a production seed/URL.
vi.mock("./hooks/useLocalMatch", async importOriginal => {
  const actual = await importOriginal<typeof import("./hooks/useLocalMatch")>();
  const seedSource = () => 1;
  return { ...actual, useLocalMatch: () => actual.useLocalMatch({ seedSource }) };
});
import { App } from "./App";
import { RoomEntry } from "./components/RoomEntry";

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

  it("submits the selected game mode after the seat count changes", () => {
    const submit = vi.fn();
    render(<RoomEntry mode="create" pending={false} error={null} onSubmit={submit} onEditConnection={() => {}} onBack={() => {}} />);
    const mode = screen.getByRole("combobox", { name: "对局模式" });
    expect(mode).toHaveValue("quick");
    fireEvent.change(mode, { target: { value: "classic" } });
    fireEvent.click(screen.getByRole("button", { name: "3人" }));
    expect(screen.getByRole("option", { name: "经典局 · 20轮", selected: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "创建房间" }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ seats: 3, gameMode: "classic" }));
  });

  it("keeps a nickname when reopening either entry and discarding a blank edit", () => {
    render(<App />);
    const button = (name: string) => screen.getByRole("button", { name });
    const nickname = () => screen.getByRole("textbox", { name: "昵称" });
    fireEvent.click(button("创建房间"));
    fireEvent.change(nickname(), { target: { value: "月下试茶" } });
    fireEvent.click(button("返回首页"));
    fireEvent.click(button("加入房间"));
    expect(nickname()).toHaveValue("月下试茶");
    fireEvent.change(nickname(), { target: { value: "   " } });
    fireEvent.click(button("返回首页"));
    fireEvent.click(button("创建房间"));
    expect(nickname()).toHaveValue("月下试茶");
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
