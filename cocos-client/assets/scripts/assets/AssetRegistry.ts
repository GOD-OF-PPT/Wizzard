import { resources, SpriteFrame, Texture2D, TTFFont } from "cc";
import {
  ASSET_ADDRESSES,
  type AssetKey,
} from "./AssetAddresses.generated";

type Insets = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

type HorizontalSliceSpec = Readonly<{
  left: number;
  right: number;
  sourceHeight: number;
}>;

const NINE_SLICE_INSETS: Record<string, Insets> = {
  "ui.roundTitleScroll": { bottom: 72, left: 64, right: 64, top: 72 },
  "ui.panel.primary": { bottom: 52, left: 80, right: 80, top: 52 },
  "ui.panel.secondary": { bottom: 42, left: 64, right: 64, top: 42 },
  "ui.plaque.small": { bottom: 36, left: 44, right: 44, top: 36 },
  "ui.status.green": { bottom: 48, left: 72, right: 72, top: 48 },
  "ui.scoreRibbon": { bottom: 56, left: 180, right: 180, top: 56 },
};

const HORIZONTAL_SLICE_SPECS: Record<string, HorizontalSliceSpec> = {
  "ui.plaque.small": { left: 44, right: 44, sourceHeight: 161 },
  "ui.scoreRibbon": { left: 180, right: 180, sourceHeight: 236 },
};

export class AssetRegistry {
  private readonly fonts = new Map<AssetKey, TTFFont>();
  private readonly spriteFrames = new Map<AssetKey, SpriteFrame>();

  public getFont(key: AssetKey): TTFFont {
    const font = this.fonts.get(key);

    if (!font) {
      throw new Error(`FONT_NOT_LOADED:${key}`);
    }

    return font;
  }

  public getSpriteFrame(key: AssetKey): SpriteFrame {
    const frame = this.spriteFrames.get(key);

    if (!frame) {
      throw new Error(`SPRITE_FRAME_NOT_LOADED:${key}`);
    }

    return frame;
  }

  public has(key: string): key is AssetKey {
    return this.fonts.has(key as AssetKey) || this.spriteFrames.has(key as AssetKey);
  }

  /**
   * Builds a per-node three-slice frame. The authored artwork is scaled
   * uniformly to the requested height, then only its quiet horizontal center
   * is allowed to stretch. Never mutate the shared registry frame here:
   * plaques and ribbons are used at several different heights.
   */
  public createHorizontalSliceFrame(
    key: AssetKey,
    targetHeight: number,
  ): SpriteFrame {
    const spec = HORIZONTAL_SLICE_SPECS[key];

    if (!spec) {
      throw new Error(`HORIZONTAL_SLICE_NOT_SUPPORTED:${key}`);
    }
    if (targetHeight <= 0) {
      throw new Error(`INVALID_HORIZONTAL_SLICE_HEIGHT:${key}:${targetHeight}`);
    }

    const source = this.getSpriteFrame(key);
    const scale = targetHeight / spec.sourceHeight;
    const frame = new SpriteFrame();
    frame.texture = source.texture;
    frame.insetBottom = 0;
    frame.insetLeft = spec.left * scale;
    frame.insetRight = spec.right * scale;
    frame.insetTop = 0;
    return frame;
  }

  public async preload(): Promise<void> {
    const entries = Object.entries(ASSET_ADDRESSES) as Array<
      [AssetKey, (typeof ASSET_ADDRESSES)[AssetKey]]
    >;

    await Promise.all(
      entries.map(async ([key, address]) => {
        if (address.kind === "font") {
          const font = await this.loadFont(address.resourcePath);
          this.fonts.set(key, font);
          return;
        }

        const frame = await this.loadSpriteFrame(address.resourcePath);
        const insets = NINE_SLICE_INSETS[key];

        if (insets) {
          frame.insetBottom = insets.bottom;
          frame.insetLeft = insets.left;
          frame.insetRight = insets.right;
          frame.insetTop = insets.top;
        }

        this.spriteFrames.set(key, frame);
      }),
    );
  }

  private loadFont(resourcePath: string): Promise<TTFFont> {
    return new Promise((resolve, reject) => {
      resources.load(resourcePath, TTFFont, (error, font) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(font);
      });
    });
  }

  private loadSpriteFrame(resourcePath: string): Promise<SpriteFrame> {
    return new Promise((resolve, reject) => {
      resources.load(resourcePath, Texture2D, (error, texture) => {
        if (error) {
          reject(error);
          return;
        }

        const frame = new SpriteFrame();
        frame.texture = texture;
        resolve(frame);
      });
    });
  }
}
