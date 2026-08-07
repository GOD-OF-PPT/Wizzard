import type { AssetKey } from "../assets/AssetAddresses.generated";

export type HomeBackgroundLayout = Readonly<{
  assetKey: AssetKey;
  height: number;
  width: number;
}>;

const STANDARD_HOME: HomeBackgroundLayout = {
  assetKey: "screen.home" as AssetKey,
  height: 1080,
  width: 1920,
};

const WECHAT_ULTRAWIDE_HOME: HomeBackgroundLayout = {
  assetKey: "screen.home.wechat.ultrawide" as AssetKey,
  height: 1080,
  width: 2560,
};

const WECHAT_ULTRAWIDE_MIN_ASPECT_RATIO = 1.9;

export function getHomeBackgroundLayout(
  visibleWidth: number,
  visibleHeight: number,
): HomeBackgroundLayout {
  if (
    visibleHeight > 0 &&
    visibleWidth / visibleHeight >= WECHAT_ULTRAWIDE_MIN_ASPECT_RATIO
  ) {
    return WECHAT_ULTRAWIDE_HOME;
  }

  return STANDARD_HOME;
}
