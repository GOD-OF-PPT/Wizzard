# 网页无王牌标签居中修复

2026-10-29。用户截图中的预测界面保留了花色图标空位，并将“无王牌”放进只适合两个字的名称栏，导致整行偏右、三个字溢出。

`MatchScreen.TrumpStatus` 对 `trump === null` 使用独立文字布局，整行 `本轮王牌 · 无王牌` / `本轮王牌 · 待选择` 在牌匾中央排列。有花色时继续使用原固定前缀、花色图标和名称位置。

两个版本化文字底板由 `tools/prepare-web-trump-text-panel.mjs` 从已有ImageGen空白纸面母版导出，沿用原有注册/色彩校准，只清理当前底板内部的固定前缀。边框、侧饰和alpha保留，未重新生成或替换整体画面。导出来源和哈希在 `art/source/web-v3/hud-source-v1/trump-text-panel-provenance-v1.json`，资源登记在 `art/web-v3-manifest.json`。

Chrome证据：`art/review/web-v3/no-trump-centering-20261029/`。

- 修复前同视口预测样例：三个字宽77.74px，名称栏仅58.81px；名称栏中心偏离牌匾中心97.69px。
- 修复后2048×938横屏预测、待选择，以及390×844竖屏出牌样例：整行文字未溢出，中心偏差约0.01px。
- 赭日、青叶回归样例仍使用原图标、名称及底板。
- `chrome-measurements.json`保存逐项测量，`before-landscape.png` / `after-landscape.png`保存同视口同状态前后截图，`after-detail.png`为局部结果。
- `npx tsc --noEmit`与`npm run build`通过。

这些证据验证本次标签排版修复；开发期固定样例不是实际游戏回放，也不表示整个web-v3重设计或其他界面通过最终视觉验收。用户实际练习页由同一组件接收热更新，未重启或操作其牌局。
