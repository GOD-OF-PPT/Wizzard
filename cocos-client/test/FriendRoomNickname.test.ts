import { describe, expect, it } from "vitest";
import { generateRandomFriendRoomNickname } from "../assets/scripts/views/FriendRoomNickname";

describe("friend-room random nicknames", () => {
  it("combines deterministic teahouse-style name fragments", () => {
    const firstValues = [0, 0, 0];
    const lastValues = [0.999_999, 0.999_999, 0.999_999];

    expect(
      generateRandomFriendRoomNickname(() => firstValues.shift() ?? 0),
    ).toBe("青竹茶客");
    expect(
      generateRandomFriendRoomNickname(() => lastValues.shift() ?? 0),
    ).toBe("霜叶行舟");
  });

  it("always produces a protocol-safe editable nickname", () => {
    for (const sample of [0, 0.2, 0.4, 0.6, 0.8, 0.999_999]) {
      const nickname = generateRandomFriendRoomNickname(() => sample);

      expect(nickname.length).toBeGreaterThan(0);
      expect(nickname.length).toBeLessThanOrEqual(16);
      expect(nickname).not.toMatch(/[\u0000-\u001f\u007f]/u);
    }
  });
});
