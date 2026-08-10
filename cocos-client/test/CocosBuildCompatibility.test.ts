import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const LISTENER_SOURCES = [
  "../assets/scripts/controllers/FriendRoomController.ts",
  "../assets/scripts/network/RoomSocketClient.ts",
] as const;
const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));

describe("Cocos listener collection compatibility", () => {
  it.each(LISTENER_SOURCES)(
    "avoids iterable spread in %s",
    async (relativePath) => {
      const source = await readFile(new URL(relativePath, import.meta.url), "utf8");

      // Creator's loose Babel transform lowers `[...set]` to
      // `[].concat(set)`, leaving the Set itself as a non-callable entry.
      expect(source).not.toMatch(/\[\s*\.\.\.this\.listeners\s*\]/u);
    },
  );
});

type MockSystemInfo = Readonly<{
  pixelRatio: number;
  platform: "devtools" | "ios";
  screenHeight: number;
  screenWidth: number;
}>;

async function executeWechatTemplate(
  systemInfo: MockSystemInfo,
  rerun = false,
  windowAvailable = true,
): Promise<{
  adapterPixelRatio: number;
  height: number;
  pixelRatio: number;
  width: number;
}> {
  const source = await readFile(
    resolve(TEST_DIRECTORY, "../build-templates/wechatgame/game.js"),
    "utf8",
  );
  const canvas = {
    height: systemInfo.screenHeight,
    width: systemInfo.screenWidth,
  };
  const testWindow = { devicePixelRatio: systemInfo.pixelRatio };
  let adapterPixelRatio = 0;
  const pending = new Promise<never>(() => undefined);
  const wx = { getSystemInfoSync: () => systemInfo };
  const executableSource = rerun
    ? source.replace("  __initApp();\n}", "  __initApp();\n  __initApp();\n}")
    : source;

  const context: Record<string, unknown> = {
    System: { warmup: () => undefined },
    canvas,
    console,
    globalThis: {},
    require: (request: string) => {
      if (request === "./web-adapter") {
        adapterPixelRatio = wx.getSystemInfoSync().pixelRatio;
        return {};
      }
      if (request === "./first-screen") {
        return { start: () => pending };
      }
      if (request === "src/import-map.js") {
        return { default: {} };
      }
      return {};
    },
    wx,
  };
  if (windowAvailable) {
    context.window = testWindow;
  }

  runInNewContext(executableSource, context);

  return {
    adapterPixelRatio,
    height: canvas.height,
    pixelRatio: wx.getSystemInfoSync().pixelRatio,
    width: canvas.width,
  };
}

describe("WeChat rendering scale compatibility", () => {
  it("builds for the same AppID that owns the cloud-container environment", async () => {
    const config = JSON.parse(
      await readFile(
        resolve(TEST_DIRECTORY, "../build-config/wechatgame.json"),
        "utf8",
      ),
    ) as {
      packages?: {
        wechatgame?: { appid?: string; libVersion?: string };
      };
    };

    expect(config.packages?.wechatgame?.appid).toBe(
      "wx4376a5b67a747d28",
    );
    expect(config.packages?.wechatgame?.libVersion).toBe("2.23.0");
  });

  it("persists the resources bundle as a WeChat Mini Game subpackage", async () => {
    const [resourcesMeta, builderSettings] = await Promise.all([
      readFile(resolve(TEST_DIRECTORY, "../assets/resources.meta"), "utf8"),
      readFile(
        resolve(TEST_DIRECTORY, "../settings/v2/packages/builder.json"),
        "utf8",
      ),
    ]).then((sources) => sources.map((source) => JSON.parse(source)));
    const configId = resourcesMeta.userData?.bundleConfigID;
    const bundleConfig = builderSettings.bundleConfig?.custom?.[configId];

    expect(configId).toBe("wizzard-wechat-resources-v1");
    expect(
      bundleConfig?.configs?.miniGame?.overwriteSettings?.wechatgame,
    ).toEqual({ compressionType: "subpackage", isRemote: false });
    expect(bundleConfig?.configs?.web?.preferredOptions).toEqual({
      compressionType: "merge_dep",
      isRemote: false,
    });
  });

  it("injects the AppID-bound cloud-container friend-room target", async () => {
    const source = await readFile(
      resolve(TEST_DIRECTORY, "../build-templates/wechatgame/game.js"),
      "utf8",
    );

    expect(source).toContain('transport: "wechat-cloud-container"');
    expect(source).toContain('environmentId: "prod-d9g3qr6rqdbba6605"');
    expect(source).toContain('serviceName: "wizzard-room-server"');
    expect(source).toContain('path: "/ws"');
    expect(source).not.toContain("sh.run.tcloudbase.com");
    expect(source).toContain(
      "globalThis.__WIZZARD_APP_RUNTIME_CONFIG__ === undefined",
    );
  });

  it("supersamples the 1x DevTools simulator at 2x", async () => {
    await expect(
      executeWechatTemplate({
        pixelRatio: 1,
        platform: "devtools",
        screenHeight: 402,
        screenWidth: 847,
      }),
    ).resolves.toEqual({ adapterPixelRatio: 2, height: 804, pixelRatio: 2, width: 1694 });
  });

  it("keeps a real device's native pixel ratio", async () => {
    await expect(
      executeWechatTemplate({
        pixelRatio: 3,
        platform: "ios",
        screenHeight: 402,
        screenWidth: 847,
      }),
    ).resolves.toEqual({ adapterPixelRatio: 3, height: 1206, pixelRatio: 3, width: 2541 });
  });

  it("does not compound the scale on a DevTools reload", async () => {
    await expect(
      executeWechatTemplate(
        {
          pixelRatio: 1,
          platform: "devtools",
          screenHeight: 402,
          screenWidth: 847,
        },
        true,
      ),
    ).resolves.toEqual({ adapterPixelRatio: 2, height: 804, pixelRatio: 2, width: 1694 });
  });

  it("propagates the DevTools render scale to Cocos system info", async () => {
    await expect(
      executeWechatTemplate({
        pixelRatio: 1,
        platform: "devtools",
        screenHeight: 402,
        screenWidth: 847,
      }),
    ).resolves.toEqual({ adapterPixelRatio: 2, height: 804, pixelRatio: 2, width: 1694 });
  });

  it("does not require window to exist before loading the adapter", async () => {
    await expect(
      executeWechatTemplate(
        {
          pixelRatio: 1,
          platform: "devtools",
          screenHeight: 402,
          screenWidth: 847,
        },
        false,
        false,
      ),
    ).resolves.toEqual({ adapterPixelRatio: 2, height: 804, pixelRatio: 2, width: 1694 });
  });
});
