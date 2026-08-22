import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PATROL_REVIEW_ASSET_KEYS } from "../assets/scripts/assets/AssetAddresses.generated";

describe("standalone patrol review asset contract", () => {
  it("uses a versioned patrol-native share card instead of the legacy card image", async () => {
    const manifest = JSON.parse(
      await readFile(resolve("art/asset-manifest.json"), "utf8"),
    ) as {
      social: {
        patrolShareCardV2: {
          buildPath: string;
          runtime: string;
          runtimeSha256: string;
        };
      };
    };
    const share = manifest.social.patrolShareCardV2;
    const image = await readFile(resolve(share.runtime));

    expect(share.buildPath).toBe("share-card-patrol-v2.jpg");
    expect(share.runtime).toBe("art/runtime/social/patrol-share-card-v2.jpg");
    expect(share.runtime).not.toContain("wechat-share-card-v1");
    expect(createHash("sha256").update(image).digest("hex").toUpperCase()).toBe(
      share.runtimeSha256,
    );
  });

  it("keeps the generated whitelist aligned with the art manifest", async () => {
    const manifest = JSON.parse(
      await readFile(resolve("art/asset-manifest.json"), "utf8"),
    ) as { patrol: { reviewAssetKeys: string[] } };

    expect(PATROL_REVIEW_ASSET_KEYS).toEqual(
      manifest.patrol.reviewAssetKeys,
    );
    expect(PATROL_REVIEW_ASSET_KEYS).toHaveLength(19);
    expect(PATROL_REVIEW_ASSET_KEYS).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^(?:card\.|fx\.card|fx\.prediction|fx\.trick)/u),
      ]),
    );
  });

});
