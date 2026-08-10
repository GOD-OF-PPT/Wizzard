import { describe, expect, it } from "vitest";
import {
  reconcileFriendRoomEntryMode,
  type FriendRoomEntryMode,
} from "../assets/scripts/views/FriendRoomNavigation";

describe("friend-room entry navigation", () => {
  it("does not reopen the create dialog after an established room ends", () => {
    let mode: FriendRoomEntryMode = "create";

    mode = reconcileFriendRoomEntryMode(mode, true);
    expect(mode).toBe("home");

    mode = reconcileFriendRoomEntryMode(mode, false);
    expect(mode).toBe("home");
  });

  it("preserves an entry dialog while no room has been established", () => {
    expect(reconcileFriendRoomEntryMode("join", false)).toBe("join");
    expect(reconcileFriendRoomEntryMode("rules", false)).toBe("rules");
  });
});
