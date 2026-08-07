# Build targets and WeChat DevTools

The repository contains two different build pipelines:

| Command | Output | Consumer |
| --- | --- | --- |
| `npm run build` | `dist/` | React/Vite browser validation app |
| `npm run build:wechat` | `cocos-client/build/wechatgame/` | WeChat DevTools Mini Game |
| `npm run cocos:build:web` | `cocos-client/build/web-desktop/` | Cocos browser validation |

`npm run build` intentionally does not invoke Cocos Creator. Running it will not change the directory already open in WeChat DevTools.

## WeChat build

From the repository root:

```powershell
npm run build:wechat
```

This performs shared-package compilation, asset synchronization, Cocos type checking, and a Creator 3.8.8 release build using `cocos-client/build-config/wechatgame.json`. The command verifies that:

- `cocos-client/build/wechatgame/` has fresh generated files;
- `game.json.deviceOrientation` is `landscape`;
- the generated `game.js` contains the DevTools supersampling marker.

Creator 3.8.8 may log `EPERM` while closing `temp/logs/project.log` and may return exit code 36 after `build Task (wechatgame) Finished`. The wrapper accepts that known shutdown behavior only when the output checks pass.

## WeChat DevTools import

1. Close the old project in WeChat DevTools.
2. Import/open exactly `cocos-client/build/wechatgame/` from this checkout.
3. Clear cache: **工具 → 构建 npm / 清缓存 → 全部清除** (wording varies by DevTools version).
4. Compile the project again.

The generated `game.js` applies the DevTools 2x fallback before Cocos loads
`web-adapter.js`; that ordering is required because the adapter snapshots
`wx.getSystemInfoSync().devicePixelRatio` during module initialization. To
verify that the current build is the one running, inspect the game console
after compile and check that `canvas.__wizzardRenderDpr` is `2` and that
`wx.getSystemInfoSync().pixelRatio` is also `2` in the DevTools simulator.

Do not open the repository root, `dist/`, `cocos-client/`, or `cocos-client/build/web-desktop/` when validating the Mini Game build.
