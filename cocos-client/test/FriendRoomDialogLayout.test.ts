import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FRIEND_ROOM_DIALOG_LAYOUT,
  type FriendRoomDialogRect,
} from "../assets/scripts/views/FriendRoomDialogLayout";

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));

const top = (rect: FriendRoomDialogRect): number => rect.y + rect.height / 2;
const bottom = (rect: FriendRoomDialogRect): number => rect.y - rect.height / 2;

function expectInside(
  rect: FriendRoomDialogRect,
  panel: FriendRoomDialogRect,
  inset: number,
): void {
  expect(rect.x - rect.width / 2).toBeGreaterThanOrEqual(
    panel.x - panel.width / 2 + inset,
  );
  expect(rect.x + rect.width / 2).toBeLessThanOrEqual(
    panel.x + panel.width / 2 - inset,
  );
  expect(bottom(rect)).toBeGreaterThanOrEqual(bottom(panel) + inset);
  expect(top(rect)).toBeLessThanOrEqual(top(panel) - inset);
}

async function readPngSize(relativePath: string): Promise<{
  height: number;
  width: number;
}> {
  const png = await readFile(resolve(TEST_DIRECTORY, relativePath));
  return { height: png.readUInt32BE(20), width: png.readUInt32BE(16) };
}

describe("friend-room dialog layout", () => {
  it("uses final-ratio SIMPLE panel art at or above design resolution", async () => {
    const create = FRIEND_ROOM_DIALOG_LAYOUT.create.panel;
    const join = FRIEND_ROOM_DIALOG_LAYOUT.join.panel;
    const [createSource, joinSource] = await Promise.all([
      readPngSize("../../art/runtime/ui/friend-room-create-panel-v2.png"),
      readPngSize("../../art/runtime/ui/friend-room-join-panel-v2.png"),
    ]);

    expect(create.sliced).toBe(false);
    expect(join.sliced).toBe(false);
    expect(createSource.width).toBeGreaterThanOrEqual(create.width);
    expect(createSource.height).toBeGreaterThanOrEqual(create.height);
    expect(joinSource.width).toBeGreaterThanOrEqual(join.width);
    expect(joinSource.height).toBeGreaterThanOrEqual(join.height);
    expect(createSource.width / createSource.height).toBeCloseTo(
      create.width / create.height,
      2,
    );
    expect(joinSource.width / joinSource.height).toBeCloseTo(
      join.width / join.height,
      2,
    );
  });

  it("uses 2x final-ratio SIMPLE rows with ornament-free text centers", async () => {
    const create = FRIEND_ROOM_DIALOG_LAYOUT.create;
    const join = FRIEND_ROOM_DIALOG_LAYOUT.join;
    const [nameSource, codeSource, aiSource] = await Promise.all([
      readPngSize("../../art/runtime/ui/friend-room-input-row-v2.png"),
      readPngSize("../../art/runtime/ui/friend-room-code-row-v2.png"),
      readPngSize("../../art/runtime/ui/friend-room-ai-row-v2.png"),
    ]);

    expect(create.name.sliced).toBe(false);
    expect(join.roomCode!.sliced).toBe(false);
    expect(create.aiFill!.sliced).toBe(false);
    expect(nameSource).toEqual({
      height: create.name.height * 2,
      width: create.name.width * 2,
    });
    expect(codeSource).toEqual({
      height: join.roomCode!.height * 2,
      width: join.roomCode!.width * 2,
    });
    expect(aiSource).toEqual({
      height: create.aiFill!.height * 2,
      width: create.aiFill!.width * 2,
    });
  });

  it("keeps every create-room band ordered and inside the lacquer frame", () => {
    const layout = FRIEND_ROOM_DIALOG_LAYOUT.create;
    const bands = [
      layout.title,
      layout.avatars,
      layout.name,
      layout.seats!,
      layout.aiFill!,
      layout.mode!,
      layout.actions,
    ];

    bands.forEach((band) => expectInside(band, layout.safeArea, 0));
    for (let index = 0; index < bands.length - 1; index += 1) {
      expect(bottom(bands[index]) - top(bands[index + 1])).toBeGreaterThanOrEqual(
        8,
      );
    }
    expect(layout.seats!.height).toBeGreaterThan(84);
    expect(layout.mode!.height).toBeGreaterThan(84);
  });

  it("keeps every join-room band ordered and inside the lacquer frame", () => {
    const layout = FRIEND_ROOM_DIALOG_LAYOUT.join;
    const bands = [
      layout.title,
      layout.avatars,
      layout.name,
      layout.roomCode!,
      layout.actions,
    ];

    bands.forEach((band) => expectInside(band, layout.safeArea, 0));
    for (let index = 0; index < bands.length - 1; index += 1) {
      expect(bottom(bands[index]) - top(bands[index + 1])).toBeGreaterThanOrEqual(
        8,
      );
    }
  });
});
