# Web v3 恢复面板：原稿组件、焦点与真实会话

2026-10-25。分支 `codex/railway-release-20261024`，HEAD `43241221ae87cecf7a3f251a6056682717c48942`；此前及本轮改动未提交。目标 active，整体视觉验收 blocked。

## 结果与差异

四张独立重画的恢复/终止面板已换成原稿组件裁片。标题、正文、按钮文字、蓝底纹和金饰保持原稿像素；真实按钮负责重试/返回，ARIA、自动聚焦、Tab 约束及 inert 底层仍生效。

- **已修 P2：** 面板字形、基线、换行、按钮比例、纹样不再独立重画。竖屏恢复层与牌桌统一使用 941×1672 参考，动作最小 44 CSS px，向上扩展。116 对照发现隐藏返回按钮后仍有烘焙空牌匾，现用原稿顶部 280×95 装饰场景裁片移除，117 四种竖屏状态复拍没有该牌匾。
- **已修源语义：** 竖屏恢复稿的禁用首牌仍有选中光圈。内置 ImageGen 候选只取首牌外 2.5–23px，所有四张纸面凸包受保护。普通/焦点各改变 11,304 像素，ROI 外及保护纸面改变为 0。旧稿与候选保留，新版分别保存。
- **P2 仍在：** 全景头像大小/身份细节、名牌统计条、回合与连接 HUD、数字笔形、手牌透视/采样仍与源不同；源“藏日”与业务“赭日”误字未修。不能把局部接近算成整页通过。
- **P3：** 焦点环部分角部细小锯齿/缺口，冻结源与实现同形；面板边缘存在轻微重采样差别，不声称逐像素相等。
- **范围缺口：** active match/pending/延迟或丢失 ACK 恢复、网络终局/重开未验证；其他 hover/focus/error、密集无计时/pending/他人预测和完整模式 9–20 牌仍有缺稿。

## 原稿与资源

普通横屏：`15-reconnecting-network-v2.png`、`16-session-ended-network-v3.png`；竖屏：`portrait/15-reconnecting-inactive-hand-v3.png`、`portrait/16-session-ended-v2.png`。新增焦点：横屏 `29-reconnecting-focus-v2.png`、`30-session-ended-focus-v2.png`；竖屏 `29-reconnecting-focus-v3.png`、`30-session-ended-focus-v2.png`。路径均相对 `art/mockups/web-v3/`。

完整 ImageGen 焦点候选存在非局部漂移，只提取亮环，不直接替换整页。原动作 RGB 与环外 RGB 变化均为 0；竖屏 29-v3 另应用相同手牌去光圈修订，环本身不变。清单现 **34 个已保存页面/状态 × 双画幅**，不是 68 组通过，也不是所有必需状态已齐。

| 参考 | 画布 | 面板 x/y/w/h | 原动作 x/y/w/h | 焦点环 x/y/w/h |
| --- | --- | --- | --- | --- |
| 横屏 | 1672×941 | 445/230/783/457 | 665/567/343/87 | 658/560/357/101 |
| 竖屏 | 941×1672 | 173/508/609/642 | 242/983/457/104 | 235/976/471/118 |

`tools/extract-web-recovery-source-v1.mjs` 直接提取蓝色主体/孔洞、邻接金边及独立冠饰/云饰，附 1px alpha160 边缘。V1 连到场景、V2 带暗矩形均拒用；V3 清空透明 RGB，避免隐藏场景/玩家。看 RGBA 应使用 flattened mask proof，部分查看工具会显示 alpha0 RGB。

`tools/compose-web-recovery-focus-v1.mjs` 保存亮环与保护检查，`tools/compose-web-recovery-inactive-hand-v3.mjs` 保存去光圈与顶部裁片。来源/候选/SHA 在 `art/source/web-v3/recovery-source-v1/`，运行资产/布局在 `art/runtime/web-v3/recovery-source-v1/`。生产只消费四个 v3 面板、四个 v2 环和一个顶部场景裁片。

## Chrome 对照

[画廊](../art/review/web-v3/recovery-source-calibration-20261025/index.html) 与 [coverage](../art/review/web-v3/recovery-source-calibration-20261025/coverage.json) 当前为 **117 批八组**：恢复/终止 × 普通/焦点 × 横/竖。八张全景与八张无损面板局部均逐组联合打开审视。112 指针在正文、116 竖屏空牌匾保留历史；当前截图未改像素。

横屏捕获 1672×941，Chrome 实测 viewport1672×942、stage940.5/y≈0.55，设计以同一1672×941比较区归一化；竖屏390×694，941×1672源按实际视口缩放。DPR≈1、fonts loaded、图片解码、终止标记与 focus-visible 均实读。普通态原生点击阻塞 scrim (20,20)，焦点态随后原生 Tab。箭头在左上角且不挡面板，没有删除截图指针。

五项保真：固定标题/正文/动作保留原字形、粗细、行数；面板和动作几何接近、无覆盖；蓝底/纸温/旧金来自原图；花纹、冠饰/云饰保持原组件，边缘仍有采样差别；固定可见文案和辅助技术名称一致。全景其他字体/家具/颜色继续 P2。横屏最后一组控制超时并重置连接编号，前三组已落盘；按文档在同一 Chrome 新页补齐最后一组，未换渲染器或复用旧图。最终原图/分片及哈希见当前目录 `raw/`、`verification.json`。

## 功能与网络证据

`114-real-recovery-progress-20261025.json` / `114-real-recovery-recovered-20261025.json`：独立 loopback 代理5186→临时内存服务8796，实际建立大厅387885。关闭真实WS后出现恢复层、底层inert，Tab/Shift+Tab留在动作、Escape不退出；离线重试仍恢复中。恢复转发再重试，回到同 roomId/playerId，显示“已连接”。无 DOM/规则状态/wire 注入。

`115-real-recovery-terminal-20261025.json` / `115-real-recovery-cleared-20261025.json`：仅重启临时内存服务，使旧匿名会话真实失效；实际返回首页后 session/lease 清除，重载仍首页、无弹层。只证明大厅，不覆盖进行中/pending/ACK。记录仅身份对照与状态白名单，没有保存 resume/invite token。

`118-recovery-focus-fallback-20261025.json`：CDP Fetch 仅拦截焦点图的 `resourceType: Image`，不阻断模块。横屏失败、同组件切竖屏失败均 ready=false、环隐藏、按钮 focus-visible 且原生 outline solid/offset4px；原生Tab/Shift+Tab/Escape未穿透。清除拦截并重载，竖图naturalWidth471、ready=true、环显示。CSS轮廓3px，Chrome缩放量化后的样式读数2.4px。失败截图DPR1.25，原分片为设备像素，未强行按DPR1拼接/比较；`focus-fallback-button-chrome.png` 是包含整个按钮的原始分片副本。最初URL通配连Vite导入也阻断，不计入回退成功。已清空Fetch/URL拦截、恢复缓存和metrics、关闭故障页。

常驻5173/8787/5199保持，临时5186/8796停止。TypeScript、正式Web构建、来源/截图SHA及生产排除记录在 `build.json`、`verification.json`，不替代视觉验收。123项初次SHA检查通过；追加最终浏览器与首页证据后125项，生产仅9个本轮运行裁片，零旧重画/候选/DEV泄漏。

`119-recovery-browser-final-20261025.json` 及首页JPEG保存最终正常尺寸1536×650/DPR1.25首页和八图画廊，图片完整、error/warn均为空，已标记保留。新页metrics清除，图片故障页已恢复设置并关闭；连接重置前的旧fixture/5186代理页无法重新附着debugger，关闭请求未获确认，未标为输出，不声称已清掉。没有为此关闭用户Chrome或其他项目。下一项头像/名牌/HUD和源误字，再补缺稿与真实异常网络。

final result: blocked
