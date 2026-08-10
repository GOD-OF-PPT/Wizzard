import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FRIEND_ROOM_LOBBY_LAYOUT,
  FRIEND_ROOM_LOBBY_SLOT_MAPS,
  getFriendRoomLobbySeatRect,
  type FriendRoomLobbyRect,
} from "../assets/scripts/views/FriendRoomLobbyLayout";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const top = (rect: FriendRoomLobbyRect): number => rect.y + rect.height / 2;
const bottom = (rect: FriendRoomLobbyRect): number =>
  rect.y - rect.height / 2;
const left = (rect: FriendRoomLobbyRect): number => rect.x - rect.width / 2;
const right = (rect: FriendRoomLobbyRect): number => rect.x + rect.width / 2;
const rectSeparation = (
  first: FriendRoomLobbyRect,
  second: FriendRoomLobbyRect,
): number =>
  Math.max(
    left(second) - right(first),
    left(first) - right(second),
    bottom(second) - top(first),
    bottom(first) - top(second),
  );
const childRect = (
  parent: FriendRoomLobbyRect,
  child: FriendRoomLobbyRect,
): FriendRoomLobbyRect => ({
  ...child,
  x: parent.x + child.x,
  y: parent.y + child.y,
});

describe("WeChat Mini Game friend-room lobby navigation", () => {
  it("uses explicit non-overlapping lobby layout bands", async () => {
    const source = await readFile(
      resolve(
        TEST_DIRECTORY,
        "../assets/scripts/views/FriendRoomLobbyLayout.ts",
      ),
      "utf8",
    );

    expect(source).toContain(
      "roomTitle: { height: 150, width: 340, x: -760, y: 410 }",
    );
    expect(source).toContain(
      "returnHome: { height: 90, width: 216, x: -810, y: 250 }",
    );
    expect(source).toContain("[9, -205]");
    expect(source).toContain(
      "readyButton: { height: 120, width: 300, x: 420, y: -430 }",
    );
    expect(source).toContain(
      "settings: { height: 300, width: 486, x: -690, y: -338 }",
    );

    const layout = FRIEND_ROOM_LOBBY_LAYOUT;
    const upperLeftSeat = getFriendRoomLobbySeatRect(1);
    const lowerRightSeat = getFriendRoomLobbySeatRect(4);
    const aiStandbySeat = getFriendRoomLobbySeatRect(5);
    const settingsStatus = childRect(layout.settings, layout.settingsStatus);
    expect(rectSeparation(layout.roomTitle, upperLeftSeat)).toBeGreaterThanOrEqual(
      15,
    );
    expect(rectSeparation(aiStandbySeat, layout.readyButton)).toBeGreaterThanOrEqual(
      8,
    );
    expect(rectSeparation(aiStandbySeat, layout.notice)).toBeGreaterThanOrEqual(
      64,
    );
    expect(rectSeparation(layout.notice, layout.readyButton)).toBeGreaterThanOrEqual(
      64,
    );
    expect(rectSeparation(layout.readyButton, layout.inviteButton)).toBeGreaterThanOrEqual(
      24,
    );
    expect(rectSeparation(layout.readyButton, layout.startButton)).toBeGreaterThanOrEqual(
      16,
    );
    expect(rectSeparation(layout.readyButton, layout.readyCount)).toBeGreaterThanOrEqual(
      24,
    );
    expect(rectSeparation(layout.startButton, layout.readyCount)).toBeGreaterThanOrEqual(
      16,
    );
    expect(rectSeparation(layout.startButton, lowerRightSeat)).toBeGreaterThanOrEqual(
      8,
    );
    expect(rectSeparation(layout.aiRemoveTouch, layout.aiAddTouch)).toBeGreaterThanOrEqual(
      8,
    );
    for (const control of [layout.aiRemoveTouch, layout.aiAddTouch]) {
      expect(left(control)).toBeGreaterThanOrEqual(left(layout.settings) + 64);
      expect(right(control)).toBeLessThanOrEqual(right(layout.settings) - 64);
      expect(bottom(control)).toBeGreaterThanOrEqual(bottom(layout.settings) + 42);
      expect(rectSeparation(settingsStatus, control)).toBeGreaterThanOrEqual(8);
    }
    expect(layout.aiRemoveTouch.height * (402 / 1080)).toBeGreaterThanOrEqual(
      44,
    );
    expect(layout.aiAddTouch.height * (402 / 1080)).toBeGreaterThanOrEqual(44);
    expect(rectSeparation(layout.aiStandbyTouch, layout.notice)).toBeGreaterThanOrEqual(
      64,
    );
    expect(rectSeparation(layout.aiStandbyTouch, layout.readyButton)).toBeGreaterThanOrEqual(
      64,
    );
    expect(layout.aiStandbyBadge.width / layout.aiStandbyBadge.height).toBeCloseTo(
      215 / 169,
      3,
    );
    expect(rectSeparation(layout.returnHomeTouch, layout.roomTitle)).toBeGreaterThanOrEqual(
      16,
    );
    expect(left(layout.roomTitle)).toBeGreaterThanOrEqual(
      left(layout.designViewport) + 24,
    );
    expect(top(layout.returnHomeTouch)).toBeLessThanOrEqual(
      top(layout.designViewport) - 24,
    );
    expect(layout.returnHomeTouch.height * (402 / 1080)).toBeGreaterThanOrEqual(
      44,
    );
    expect(layout.readyButton.height * (402 / 1080)).toBeGreaterThanOrEqual(44);
    expect(layout.roomTitle.width).toBeGreaterThan(
      2 * 180 * (layout.roomTitle.height / 236),
    );
    expect(
      layout.readyButtonGreenVisual.width /
        layout.readyButtonGreenVisual.height,
    ).toBe(3);
    expect(
      layout.readyButtonPaperVisual.width /
        layout.readyButtonPaperVisual.height,
    ).toBe(2.4);
    expect(layout.inviteButton.width / layout.inviteButton.height).toBe(2.4);
    expect(
      layout.occupiedSeatStatus.width / layout.occupiedSeatStatus.height,
    ).toBeCloseTo(600 / 168, 3);
    expect(layout.readyCount.width / layout.readyCount.height).toBeCloseTo(
      600 / 168,
      3,
    );
    expect(layout.startButton.width / layout.startButton.height).toBeCloseTo(
      343 / 328,
      3,
    );

    for (const playerCount of [3, 4, 5, 6] as const) {
      const slots = FRIEND_ROOM_LOBBY_SLOT_MAPS[playerCount];
      expect(slots).toHaveLength(playerCount);
      expect(new Set(slots).size).toBe(slots.length);
      for (const slot of slots) {
        const seat = getFriendRoomLobbySeatRect(slot);
        expect(left(seat)).toBeGreaterThanOrEqual(
          left(layout.designViewport) + 24,
        );
        expect(right(seat)).toBeLessThanOrEqual(
          right(layout.designViewport) - 24,
        );
        expect(top(seat)).toBeLessThanOrEqual(
          top(layout.designViewport) - 24,
        );
        expect(bottom(seat)).toBeGreaterThanOrEqual(
          bottom(layout.designViewport) + 24,
        );
      }
    }
  });

  it("renders a second-confirmation flow before leaving the room", async () => {
    const source = await readFile(
      resolve(TEST_DIRECTORY, "../assets/scripts/views/FriendRoomView.ts"),
      "utf8",
    );

    expect(source).toContain("leaveConfirmationOpen");
    expect(source).toContain("renderLeaveConfirmation");
    expect(source).toContain("this.leaveConfirmationOpen && state.error");
    expect(source).toContain("createHorizontalSliceSprite");
    expect(source).toContain("this.controller.leaveRoom()");
    expect(source).toContain('"返回首页"');
    expect(source).toContain('"继续等待"');
    expect(source).toContain('"确认离开"');
  });

  it("uses real action plaques and explicit AI controls in the lobby", async () => {
    const source = await readFile(
      resolve(TEST_DIRECTORY, "../assets/scripts/views/FriendRoomView.ts"),
      "utf8",
    );

    expect(source).toContain('assetKey: "ui.results.button.green.v2"');
    expect(source).toContain('"添加机器人"');
    expect(source).toContain('"移除机器人"');
    expect(source).toContain("this.controller.setAiCount");
    expect(source).toContain("`${readyHumans}/${humans.length} 真人已准备`");
    expect(source).toContain("this.fillWithAi = false");
    expect(source).toContain("开局补位");
    expect(source).toContain("this.controller.startRoom(this.fillWithAi)");
    expect(source.match(/FRIEND_ROOM_LOBBY_LAYOUT\.notice/g) ?? []).toHaveLength(2);
    expect(source).toContain('player.ready ? "ui.match.stat.green" : "ui.match.stat.paper"');
    expect(source).not.toContain('createSprite(seat, this.assets, "ui.status.green"');
  });
});
