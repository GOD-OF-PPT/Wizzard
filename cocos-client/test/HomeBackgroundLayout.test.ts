import { describe, expect, it } from "vitest";
import { getHomeBackgroundLayout } from "../assets/scripts/views/HomeBackgroundLayout";

describe("WeChat Mini Game home background layout", () => {
  it("uses one 16:9 sprite on the design viewport", () => {
    expect(getHomeBackgroundLayout(1920, 1080)).toEqual({
      assetKey: "screen.home",
      height: 1080,
      width: 1920,
    });
  });

  it("uses one continuous ultrawide sprite on the reported simulator size", () => {
    expect(getHomeBackgroundLayout(847, 402)).toEqual({
      assetKey: "screen.home.wechat.ultrawide",
      height: 1080,
      width: 2560,
    });
  });

  it("switches to the ultrawide master at modern 19.5:9 ratios", () => {
    expect(getHomeBackgroundLayout(2340, 1080).assetKey).toBe(
      "screen.home.wechat.ultrawide",
    );
  });
});
