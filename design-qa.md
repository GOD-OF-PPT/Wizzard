# Design QA — 页面设计稿对照与高清资源返修

## 当前有效结论：Web v3 逐页重新设计 — 2026-10-16

final result: blocked

新一轮逐页设计与实现已启动，清单见 `docs/18-web-v3-design-and-interaction.md`。以下历史passed仅描述各自历史范围，不能代表本轮完成。上轮截图中大厅为未连接空房间，results文件实际含出牌画面；没有同状态并排比较或成功选牌动效证据，因此撤回上轮“逐像素校准完成”的总体结论。当前须完成每页新设计稿、动态实现及Chrome同状态对照后再给出新结论。

### Web v3 当前检查点 — 2026-10-17

- 视觉真值：`art/mockups/web-v3/01-home.png`至`11-chooser.png`，牌桌使用返修后的`05-gameplay-final.png`。
- 实现证据：`art/review/web-v3/`；横屏主窗口1672×941附近，独立加入窗口1536×683，后者仅为流程证据，不能直接当同尺寸像素对照。
- 同内容对照：`06-results-comparison.png`包含第4轮设计和冻结相同玩家/分数的Chrome无损截屏；冻结样例明确标识为设计验收，不连接服务、不证明游戏流程。
- 真实操作：Chrome两个独立origin匿名会话创建/加入房间659456，双方准备，添加4名AI补齐6席，开始按钮由等待好友/等待准备/补齐座位转为可用；离开确认的取消保留原房间。
- 真实练习链：选择朱结→预测0→选中朱结2→确认出牌→第1轮结算，分别保存`11-chooser-live.jpg`、`10-bid-live.jpg`、`05-selected-live.jpg`、`06-results-live.jpg`。此集合经打开检查确实为文件名描述状态。
- 动效实测：选中牌transform矩阵Y=-12、zIndex=30、transition=0.14s；确认按钮enabled=true且animation=0.56s cubic-bezier(0.22,0.8,0.3,1) both turn-action-pulse。
- 已修复：创建/加入入口不再直接进入空大厅；恢复真实表单、等待服务器确认；大厅移除表单；顶部标题行高；规则各章内容；设置实际接线；牌桌阶段专用面板；结算动态表格；快速切牌导致确认动画清理计时被取消的问题。

#### 尚未关闭的差异

- P1：创建/加入已切换到独立941×1672竖屏底板；规则竖屏稿已生成但动态值清理未完成，仍需独立清理底板与同状态复拍。横屏底板不可直接裁切当竖屏验收。
- P2：原始运行时头像与ImageGen重绘头像的笔触、裁剪、比例有差异，不能称像素一致。字体也有手绘字形与Noto字形的差异；需逐页放大对照。
- P2：规则标签及章节选中形状、步骤字号、输入焦点态、开关尺寸待最终同尺寸比较；最新导航资产已替换，但尚未全部复拍。
- P2：牌桌缩小头像/调节席位后、替换新选中光效后的证据尚须刷新。现有首轮截图不能代表4–8张手牌的重叠、邻牌让位和切换选择全部通过。
- P2：总榜真实结束状态、离开服务端应答、重连/错误反馈、3–5人布局及各模态键盘焦点仍需覆盖。
- P2：现有对照图只完整覆盖结算样例；其余页面须补齐同状态并排和细节裁区，不以截图数量替代比较。
- 竖屏证据：`art/review/web-v3/02-create-portrait-before.jpg`、`02-create-portrait-after.jpg`、`03-join-portrait-after.jpg`；390×694 Chrome实测创建表单已使用独立清理底板，输入、座位和底部按钮命中区均在视口内。
- 新增竖屏设计稿：`art/mockups/web-v3/portrait/01-home.png`、`04-lobby.png`、`05-gameplay.png`、`06-results.png`。这些稿件已入库但对应动态清理底板和Chrome同状态实现复拍尚未完成，不能计入通过页数。

#### 五项视觉标准

- 字体：待校准，未通过。
- 间距/布局：横屏基础已接入并处理碰撞；全页面全状态和竖屏未通过。
- 色彩：场景来自对应生成底板；动态控件还需采样对比。
- 素材：17项独立运行时素材已入库；头像/选中光效仍有差异或待复拍。
- 内容：真实表单、状态、分数和规则已接线；错误态文案与最终交互覆盖待完成。

#### 工程检查

2026-10-17检查：`npm test`通过51文件/447项；`npm run web:build`退出0；`npx tsc --noEmit`退出0；`git diff --check`通过。开发样例入口未出现在生产JS中。后续仅素材和CSS的小调整仍须视觉复拍；这些检查不替代视觉通过。

final result: blocked

- QA 日期：2026-08-04
- 设计真值：`art/mockups/home-screen.png`、`art/mockups/friend-room-screen.png`、`art/mockups/gameplay-screen.png`、`art/mockups/round-results-screen.png`
- 实现截图：`art/qa/design-fidelity-pass-2026-08-04/30-home-after.png`、`38-lobby-after.png`、`40-gameplay-after.png`、`48-round-results-after.png`、`45-round-results-after.png`
- 视口：1280×720，横版 16:9
- 状态：首页、创建房间、加入房间、规则 1–4、设置、6 人好友房大厅、牌局、6 行轮次结算、6 行最终总榜

## Full-view comparison evidence

- 总览：`art/qa/design-fidelity-pass-2026-08-04/59-after-comparison-overview.png`
- 首页：`50-home-after-comparison.png`
- 好友房大厅：`51-lobby-after-comparison.png`
- 牌局：`52-gameplay-after-comparison.png`
- 轮次结算：`53-score-after-comparison.png`
- 规则页修复前后：`54-rules-after-comparison.png`

## Focused comparison evidence

- 绿色修复标注总览：`art/qa/design-fidelity-pass-2026-08-04/60-marked-after-overview.png`
- 首页高清背景：`55-marked-after-home.png`
- 规则标题卷轴与高清插图：`56-marked-after-rules.png`
- 空座剪影：`57-marked-after-lobby.png`
- 结算行密度与头像：`58-marked-after-score.png`

## Findings and fixes

- P2-01 已修复：首页由低码率 JPEG 改为 1920×1080 无损 PNG，标题、人物和装饰边缘不再因二次放大而发虚。
- P1-02 已修复：规则页标题卷轴由 520×138 调整为 480×190，实际高度大于九宫格 144px 的上下边距总和，不再被纵向压扁。
- P2-03 已修复：规则提示插图由 768 级运行时图升级为 1536×910 RGBA，并保留原透明遮罩。
- P2-04 已修复：空座剪影改为中性浅色乘色和 112 透明度；角色可辨认，但仍明显弱于已入座头像。
- P2-05 已修复：轮次结算、当前总榜和最终总榜统一使用 72px 头像、84px 行距和 27–29px 主体字号；6 行极限状态仍有稳定留白。

## Required fidelity surfaces

- 字体与排版：通过。展示字体继续使用 Noto Serif SC，界面字体继续使用 Noto Sans SC；标题、列头、玩家名和分数层级清晰。
- 间距与布局节奏：通过。1280×720 下核心控件无裁切；规则卷轴、6 个大厅席位和 6 行结算均保持稳定。
- 颜色与视觉令牌：通过。朱漆、宣纸、午夜蓝、旧金和绿漆按钮与设计稿一致；空座使用同体系中的弱化中性色。
- 图片质量与资源忠实度：通过。首页和规则插图已升级高清；可见背景、头像、卡牌、面板、卷轴与按钮均来自正式位图资源，无 CSS/SVG/emoji 占位替代。
- 文案与内容：通过。首页入口、房间表单、规则、设置、房间状态、回合提示和结算文案均完整可读。

## Comparison history

### Iteration 1 — blocked

证据：`24-before-comparison-overview.png`、`25-marked-before-overview.png`。

- 首页背景软化。
- 规则标题卷轴纵向塌缩、规则插图分辨率不足。
- 空座剪影像暗洞。
- 结算头像、字号和行距偏小。

### Iteration 2 — passed

修复：替换两张高清运行时资源；校正规则卷轴；提升空座可读性；统一三套结算表的头像、行距与字号。

修复后证据：`59-after-comparison-overview.png`、`60-marked-after-overview.png`，以及 `30-home-after.png` 至 `49-current-ranking-after.png` 的逐页复拍集。

## Interaction and runtime checks

- 已操作：首页 → 创建房间 → 6 人好友房 → 准备 → 开始游戏 → 预测 → 出牌 → 轮次结算 → 最终总榜 → 再来一局。
- 已打开并复拍：创建、加入、规则 1–4、设置。
- 浏览器控制台 error / warning：0。
- `npm run cocos:typecheck`：通过。
- `CocosBuildCompatibility.test.ts`、`FriendRoomController.test.ts`：6 项通过。
- `npm run build`：通过。
- Cocos Web Desktop release：清理旧资源后于 2026-08-04 02:50 重建完成。
- Cocos 微信小游戏 release：清理旧资源后于 2026-08-04 02:51 重建完成；`game.json.deviceOrientation` 为 `landscape`。

## Mobile safe-area comparison — 2026-08-04

- 设计真值：`art/mockups/gameplay-screen.png`、`art/mockups/round-results-screen.png`。
- 手机模拟器原始截图：`art/qa/user-screenshot-pass-2026-08-04-2/07-mobile-gameplay-user.png`、`08-mobile-score-user.png`。
- 修复后浏览器截图：`27-mobile-selected-card-confirm-after.png`（855×389，已选牌并等待确认）、`r2-result-frame-20.png`（855×389，第 2 轮结算）。
- 结算同宽归一化：`30a-mobile-score-after-841x389.png`（由浏览器原始截图居中裁为 841×389，仅移除两侧各 7px 的额外背景）。
- 全景并排证据：`32-mobile-gameplay-safe-comparison-after.png`、`33-mobile-score-safe-comparison-after.png`。
- 聚焦标注证据：`30-mobile-gameplay-marked-after.png`、`31-mobile-score-marked-after.png`、`34-mobile-marked-after-overview.png`。

### Mobile findings and fixes

- P1-M01 已修复：本地玩家不再占用第六个头像席位；左下角恢复独立“预测 / 已赢”状态牌。
- P1-M02 已修复：1–2 张手牌锚点上移，选中抬升后仍完整避开底部 Home Indicator 安全区。
- P1-M03 已修复：“你的回合 / 确认出牌”操作区上移，与手牌一起保持可点击和无遮挡。
- P2-M04 已修复：倒计时向左避让微信右上角胶囊，牌局信息不再与系统控件争抢空间。
- P2-M05 已修复：对手头像、名字、状态、卡背，以及三种结算表的标题、列头、头像、姓名和数值统一放大。
- P3-M06 可继续优化：正式设计稿的结算标题牌纵向更厚；当前实现已可读，但后续可把标题牌高度再提高约 10–15%。

### Mobile required fidelity surfaces

- 字体与排版：通过。手机结算页标题、列头、姓名和分数已从偏小状态提升到可稳定扫读的层级。
- 间距与布局：通过。超宽屏按等高 16:9 安全区居中，额外宽度只展示桌面背景；底部手牌、按钮及右上倒计时均无系统控件遮挡。
- 颜色与视觉令牌：通过。修复仅改变布局与尺寸，未偏离既有朱漆、宣纸、旧金和绿漆状态色。
- 图片质量与资源忠实度：通过。所有可见背景、头像、卡牌、卷轴和按钮继续使用正式位图资源；本轮未引入占位图或代码绘图。
- 文案与内容：通过。“预测”“已赢”“你的回合”“确认出牌”和结算列头均与玩法状态一致。

### Mobile comparison history

#### Iteration M1 — blocked

证据：`15-mobile-marked-before-overview.png`、`18-mobile-gameplay-safe-comparison-before.png`、`19-mobile-score-safe-comparison-before.png`。

发现：本地玩家重复头像席位；手牌和确认按钮过低；倒计时贴近微信胶囊；结算头像、列头、姓名和数值偏小。

#### Iteration M2 — passed

修复：恢复左下角本地状态牌；按手牌数量设置底部锚点；上移回合按钮；左移倒计时；统一放大对手 HUD 和结算表信息。

修复后证据：`32-mobile-gameplay-safe-comparison-after.png`、`33-mobile-score-safe-comparison-after.png`、`34-mobile-marked-after-overview.png`。已实际操作好友房准备、开始游戏、预测、两张手牌选择、确认出牌和第 2 轮结算；浏览器控制台 error / warning 为 0。

## Mobile bid and render-resolution comparison — 2026-08-04

- 用户截图：`art/qa/user-screenshot-pass-2026-08-04-3/01-mobile-bid-user-before.png`（847×402，第三轮预测）。
- 设计真值：`art/mockups/gameplay-screen.png`，并以已验收预测面板组件生成同状态对照 `02-mobile-bid-design-safe-area.png`。
- 修复后浏览器截图：`13-mobile-bid-round3-after.png`（847×402，同为第三轮、3 张手牌、预测值 0）。
- 全景对照：`19-mobile-bid-comparison-after.png`。
- 修复前后标注：`20-mobile-bid-before-after-overview.png`。
- 渲染分辨率诊断：`12-render-resolution-comparison.png`。

### Findings and fixes

- P1-B01 已修复：预测 / 王牌选择期间改用 220×146 的紧凑手牌、112 间距和 -330 锚点；3 张手牌完整停在 Home Indicator 上方，并与预测面板保持间隔。
- P1-B02 已确认并消除陈旧构建：用户截图仍显示旧版本地头像席位和旧倒计时位置；11:37 Web Desktop 与 11:39 微信小游戏重建后，修复后截图已显示左下角状态牌和避让胶囊的倒计时。
- P1-B03 已修复：微信开发者工具在横版模拟器报告 1× DPR 时，微信模板把帧缓冲提升到 2×；真机继续使用系统原生 2×/3× DPR。
- P2-B04 已排除资源根因：桌面背景为 1920×1080、头像为 512×512、卡牌为 256×384，纹理导入为 linear；全页面同时锯齿来自 1× 帧缓冲，不需要重做美术资源。

### Required fidelity surfaces

- 字体与排版：通过。预测标题、数值、范围和操作按钮保持原有层级；2× 帧缓冲同时改善 TTF 边缘。
- 间距与布局：通过。预测面板比例未改；第三轮 3 张手牌、左下角状态牌和右上倒计时全部落入手机安全区。
- 颜色与视觉令牌：通过。仅调整手牌尺寸、位置和渲染像素比，既有色彩不变。
- 图片质量与资源忠实度：通过。正式位图源文件尺寸充足，纹理使用线性采样；未生成替代资源。
- 文案与内容：通过。“预测本轮赢墩数”“可选 0–3”“少一墩”“多一墩”“确认预测”均完整准确。

### Comparison history

#### Iteration B1 — blocked

证据：`06-mobile-bid-comparison-before.png`。问题为旧版本地头像、旧倒计时位置、3 张手牌进入 Home Indicator，以及 DevTools 1× 帧缓冲导致的全屏锯齿。

#### Iteration B2 — passed

证据：`13-mobile-bid-round3-after.png`、`19-mobile-bid-comparison-after.png`、`20-mobile-bid-before-after-overview.png`。微信模板 1×→2× 行为由 `CocosBuildCompatibility.test.ts` 的 DevTools / 真机两条回归用例覆盖。

## Mobile rules and settings comparison — 2026-08-04

- 用户截图：`art/qa/user-screenshot-pass-2026-08-04-4/01-mobile-settings-user-before.png`（847×402）。
- 设计真值：`art/qa/user-screenshot-pass-2026-08-04-4/02-mobile-settings-design-safe-area.png`，来源为已验收的 `art/qa/design-fidelity-pass-2026-08-04/32-settings-after.png`。
- 修复前并排标注：`art/qa/user-screenshot-pass-2026-08-04-4/06-mobile-settings-comparison-before.png`。
- 修复后并排标注：`art/qa/user-screenshot-pass-2026-08-04-4/12-mobile-settings-comparison-after.png`。
- 修复前后总览：`art/qa/user-screenshot-pass-2026-08-04-4/13-mobile-settings-before-after-overview.png`。

### Findings and fixes

- P1-S01 已修复：设置页正文、三条设置项说明、页签和按钮边缘在 DevTools 1× 帧缓冲下出现明显锯齿；沿用微信模板 2× DevTools 超采样修复。
- P2-S02 已确认：面板宽度、页签、返回首页、设置项纵向节奏和底部恢复默认按钮与 16:9 安全区基本一致，无需改动 `RulesSettingsView.ts` 的布局。
- P2-S03 已确认：用户截图中的系统胶囊与 Home Indicator 没有遮挡设置页核心操作；修复重点是清晰度而不是安全区重排。

### Required fidelity surfaces

- 字体与排版：通过。2× 复拍后标题、页签、设置项标题和说明的边缘更稳定。
- 间距与布局：通过。面板和三条设置项与设计安全区保持相同位置和密度。
- 颜色与视觉令牌：通过。朱漆面板、宣纸按钮、蓝色行动时限条和金色描边保持一致。
- 图片质量与资源忠实度：通过。该页继续使用正式面板、卷轴、按钮和背景位图，不替换美术资源。
- 文案与内容：通过。合法牌提示、轮到我时震动、行动时限和恢复默认均完整可读。

### Comparison history

#### Iteration S1 — blocked

证据：`06-mobile-settings-comparison-before.png`。页面布局已接近设计稿，但 1× 渲染让小字号与高对比纹理边缘显得粗糙。

#### Iteration S2 — passed

证据：`12-mobile-settings-comparison-after.png`、`13-mobile-settings-before-after-overview.png`。2× 下采样复拍后，内容层级和边缘清晰度改善；Cocos 构建回归测试保持通过。

## Evidence limits

截图可以证明可见布局、清晰度、层级和状态变化，但不能单独证明真机读屏、色觉模拟、震动反馈、不同 GPU 的纹理压缩结果或微信真机安全区；这些仍需在微信开发者工具和真机上复核。

final result: passed

## Internal PC Web 微信视觉重设计巡查 — 2026-10-16

- Audit scope: React/Vite internal web home, anonymous friend-room shell, local practice table, trump chooser, bid panel, round results, and rules/settings dialog.
- Design source: `art/mockups/web-pc-experience-v1.png` plus the approved WeChat runtime masters under `art/runtime/`.
- Viewports: 1280×720 landscape and 390×844 portrait.
- Live capture: clean Wizzard Vite instance at `http://localhost:5173/`; the earlier port-conflict page from another app was discarded and never used as evidence.
- Accepted evidence contact sheet: `art/review/web-patrol-contact-sheet.jpg`.
- Individual evidence: `art/review/web-patrol-{home,room,match,play,results,rules}-{landscape,portrait}.jpg`.

### Findings and fixes

- P1 fixed — room controls and footer labels were hidden by the home-only transparent hit-target rule. Room action buttons now retain readable labels and distinct lacquer-blue / lacquer-brown states.
- P1 fixed — the room shell had an implicit fifth grid row, producing a scrollbar and clipping the footer. The shell now has explicit rows, a bounded player region, and no desktop overflow.
- P1 fixed — raw `SOCKET_TRANSPORT_ERROR` was shown to users. The room surface now maps transport failure to `房间服务暂不可用，可先进行单人练习。`.
- P1 fixed — the full-width PC utility bar covered the gameplay round scroll. Match screens now use a compact top-right utility rail that clears the round HUD and timer.
- P1 fixed — portrait home previously cropped the 16:9 master, cutting off the create plaque and producing a false landscape layout. ImageGen produced and the web runtime now selects `art/runtime/backgrounds/home-screen-portrait-v1.png` for 9:16, with portrait-aligned hit targets.
- P1 fixed — portrait match and room layouts produced horizontal overflow. Portrait stage overflow is clipped, room bands reflow, seat cards shrink to fit, and the footer remains visible.
- P1 fixed — portrait rules dialog reused a short landscape height and pushed copy/actions outside the panel. It now uses a dedicated responsive vertical band with contained copy and actions.
- P2 fixed — local practice could retain a stale room adapter when leaving. Local practice exit now disposes the preview surface and returns to the home screen directly; network matches keep the acknowledged leave path.

### Required fidelity surfaces

- Visual language: passed. Warm lacquer, parchment, midnight-blue, old-gold, lantern, and animal-traveler assets remain the visible system across every captured surface.
- Layout hierarchy: passed. Desktop uses the compact PC utility rail, lacquered room shell, central table, bottom action band, and parchment results hierarchy; portrait uses independent vertical reflow.
- Interaction clarity: passed. Home entry hit targets, room controls, practice exit, rules close, trump selection, prediction controls, and round continuation were all present and reachable in the captured states.
- Asset fidelity: passed. No CSS art, inline SVG, emoji, or generic icon replacements were introduced. The only new bitmap is the versioned portrait home master generated from the approved home reference.
- Responsive containment: passed. The final evidence set has no document-level horizontal overflow, no clipped room footer, no hidden room labels, and no rules-dialog action outside the authored frame.

### Evidence limits

These captures verify browser layout, visible hierarchy, interaction state, and responsive containment. They do not replace WeChat DevTools/device acceptance, real GPU texture checks, screen-reader verification, or a live room-server connection. The friend-room evidence intentionally records the disconnected internal-preview state.

final result: passed (internal web visual patrol)

### Web patrol iteration 2 — friend-room composition

- Previous evidence: `art/review/web-patrol-room-landscape.jpg` and `art/review/web-patrol-room-portrait.jpg`.
- New evidence: `art/review/web-patrol-room-landscape-v2.jpg` and `art/review/web-patrol-room-portrait-v2.jpg`.
- Finding fixed: the first web room pass used a full dark shell with grid cards, which hid the lacquer table and diverged from the friend-room design. The revised composition exposes the table as the visual field, places waiting plaques around the oval, moves room controls to the lower-left safe column, keeps actions in the lower-right lane, and separates the utility rail from room information.
- Responsive result: desktop and portrait both keep all six seat targets, room inputs, status copy, and footer actions inside the viewport with no document overflow.

final result: passed (friend-room iteration 2)

## ImageGen PC design implementation coverage — 2026-10-16

The ImageGen composite `art/mockups/web-pc-experience-v1.png` is implemented as four runtime surfaces rather than shipped as a flattened background:

| Design region | Runtime implementation | Current evidence |
| --- | --- | --- |
| Home entry | `HomeScreen` uses the authored landscape master and dedicated portrait master with transparent semantic hit targets | `web-patrol-home-landscape.jpg`, `web-patrol-home-portrait.jpg` |
| Friend-room table | `FriendRoomScreen` uses the clean teahouse table, oval seat positions, real avatar/green-status assets, room info plaque, lower-left controls, and lower-right actions | `web-patrol-room-landscape-v2.jpg`, `web-patrol-room-portrait-v2.jpg`, `web-patrol-room-comparison-v2.jpg` |
| Gameplay | `MatchScreen` composes the table, round scroll, six seats, hand, turn HUD, chooser, bid panel, and compact PC utility rail from runtime assets | `web-patrol-match-landscape.jpg`, `web-patrol-match-portrait.jpg`, `web-patrol-play-landscape.jpg`, `web-patrol-play-portrait.jpg` |
| Results | `ResultsPanel` uses the parchment score ribbon, authored footer actions, dynamic player rows, and responsive portrait reflow | `web-patrol-results-landscape.jpg`, `web-patrol-results-portrait.jpg` |
| Rules/settings | `RulesDialog` uses the authored lacquer panel, runtime text/actions, and a portrait-specific contained layout | `web-patrol-rules-landscape.jpg`, `web-patrol-rules-portrait.jpg` |

Coverage verdict: passed for the internal browser carrier. The composite reference is fully represented by live components and formal raster assets; no flattened composite image is used as a runtime screen.

final result: passed (ImageGen PC implementation coverage)

## ImageGen v2 browser design implementation — 2026-10-16

- New design board: `art/mockups/web-pc-experience-v2.png`.
- Combined evidence sheet: `art/review/web-imagegen-v2-contact-sheet.jpg`.
- Dedicated PC home master: `art/runtime/backgrounds/home-screen-web-pc-v2.png`.
- Fresh browser evidence: `art/review/web-imagegen-v2-home-landscape.jpg` and `art/review/web-imagegen-v2-room-landscape.jpg`.
- Home implementation now uses the v2 master at landscape breakpoints, with authored left action plaques, visible runtime labels, centered brand title, and the baked top-right utility rail. Portrait keeps the independent v1 portrait master and reflow contract.
- Friend-room implementation now keeps the same v2 scene language: transparent table field, oval seats, waiting plaques, room info, lower-left controls, and lower-right actions.
- Friend-room and gameplay now consume dedicated ImageGen v2 scene masters (`friend-room-web-pc-v2.png` and `gameplay-web-pc-v2.png`) at the landscape breakpoint; dynamic UI remains layered from React and formal assets.
- The v2 board is a design source only; runtime remains composed from page components and versioned raster assets so room/player/score state stays dynamic.

Current v2 implementation status: home and friend-room PC surfaces have been migrated and visually rechecked. Gameplay, results, and rules continue to use the existing runtime asset composition while the remaining v2 state-specific overlays are being brought into the same visual contract.

### V2 implementation evidence update

- Home: `art/review/web-imagegen-v2-home-landscape.jpg` — dedicated ImageGen v2 master with authored action plaques, visible runtime labels, brand title, and top utility rail.
- Friend room: `art/review/web-imagegen-v2-room-landscape.jpg` — table-first lobby with oval waiting seats, room info, control panel, and action lane.
- Gameplay: `art/review/web-imagegen-v2-gameplay-landscape.jpg` — live local practice state with round scroll, seats, central trick, prediction panel, timer, and compact browser utility rail.
- Results: `art/review/web-imagegen-v2-results-landscape.jpg` — parchment score sheet with six rows and contained footer actions.
- Rules/settings: `art/review/web-imagegen-v2-rules-landscape.jpg` — redesigned tabbed rules modal with chapter navigation, content card, sound toggle, and close action.

The v2 browser carrier now has live evidence for every named design state. Remaining platform limits are the existing internal disconnected-room preview and the separate WeChat carrier acceptance boundary.

### ImageGen v2 pixel and motion calibration — Chrome — 2026-10-16

- Chrome viewport: `2048×971`, device scale factor `1.25`; the authored landscape canvas is now held at `16:9` (`1726.6×971.2`) with quiet side letterboxing so percentage coordinates stay on the source master.
- Chrome evidence captured after the fixes: `art/review/chrome-calibration-2026-10-16/home.png`, `room.png`, `gameplay-chooser.png`, `results.png`, and `rules.png`.
- Refreshed review derivatives: `art/review/web-imagegen-v2-home-landscape.jpg`, `web-imagegen-v2-room-landscape.jpg`, `web-imagegen-v2-gameplay-landscape.jpg`, `web-imagegen-v2-results-landscape.jpg`, `web-imagegen-v2-rules-landscape.jpg`, and `web-imagegen-v2-contact-sheet.jpg`.
- Home action centers now map to the authored plaque bands without the prior ultra-wide vertical drift. Friend-room room information is centered on a parchment plaque, the return action is in the left safe column, the connection rail is compact in the upper-right pocket, and the lower-left control panel no longer crowds the table edge.
- Runtime motion is calibrated to the design rhythm: screen enter `240ms` cubic-out, modal fade `220ms` cubic-out, control hover `180ms`, selected hand lift `140ms` with a `12px` lift and zero-degree rotation, and a one-shot `560ms` confirmation pulse only when the confirm action first appears after selection.
- Chrome interaction checks: home → rules/settings tabs and close; home → friend-room entry and return; home → local practice → trump chooser → bid → trick play → round results. No layout clipping or stale scene asset was observed in the final captures.
- Static gates after calibration: `npm test` (51 files / 447 tests), `npm run typecheck`, and `git diff --check` passed.

final result: passed

## 漆环巡游独立微信评审切片 — 2026-08-23

- Source visual truth: `art/mockups/patrol-gameplay-screen-v1.png`.
- Rendered implementation: `art/review/patrol-active-wechat-devtools-final-847x392.png` and `art/review/patrol-home-wechat-devtools-final-847x392.png`.
- Viewport: WeChat DevTools iPhone 12/13 landscape simulator, captured at `847×392`; normalized comparison content is `694×390`.
- State: independent review home → 5-second observe → target 4 changed to 5 → 60-second simultaneous patrol → queued/cancelled bridge switch → results → return to the independent review home.
- Full-view comparison evidence: `art/review/patrol-active-wechat-comparison-final.png`, containing the selected visual source and the WeChat implementation in one image.
- Flow evidence: `art/review/patrol-review-video-contact-sheet-v2.png` and the uncut `art/review/patrol-wechat-devtools-review-flow-v2.mp4`.
- Focused evidence: `art/review/patrol-active-wechat-content-final-694x390.png`, plus the individually inspected home, observe, target, active-control, results, and returned-home captures. No smaller focused crop was needed because the normalized implementation crop keeps the required HUD, labels, traveler sprites, tea spirits, bridge geometry, and controls readable at native evidence scale.

### Findings

- No actionable P0, P1, P2, or P3 findings remain.
- The final independent audit confirmed that the visible interaction grammar is real-time movement, same-kind tea-spirit collection, speed control, and bridge switching. No hand, deck, suit, rank, trump, trick, dealt-card, or turn-by-turn play surface is visible.
- Intentional runtime differences from the concept image are accepted: the playable slice uses one same-value green tea-spirit type, dynamic traveler positions, target `5`, live counts, a persistent return-home action, and larger bottom touch controls. These changes support truthful behavior and Mini Game usability without changing the selected art direction or layout hierarchy.

### Required fidelity surfaces

- Fonts and typography: passed. The display/interface font split is retained; home, phase, timer, target, control, and result text is readable at `847×392`, with no clipping or unintended wrapping.
- Spacing and layout rhythm: passed. Round, return, timer, target, traveler progress, route, and control bands remain disjoint. The right target HUD clears the WeChat capsule, and the bottom controls clear the system home indicator.
- Colors and visual tokens: passed. Warm lacquer, parchment, old-gold trim, midnight-blue panels, green secondary action, and red/green speed controls match the selected Enchanted Teahouse language.
- Image quality and asset fidelity: passed. The implementation uses synchronized raster masters and the two shipped CJK fonts; no CSS drawing, inline SVG, emoji, placeholder, or unrelated icon asset is present.
- Copy and content: passed. `漆环巡游`, observe, target adjustment, `减速 / 预备换轨 / 取消换轨 / 加速`, target/actual/difference, results, replay, and return-home labels describe the behavior actually demonstrated.

### Comparison history

#### Iteration P1 — blocked

The first WeChat comparison exposed three review-facing problems: no complete return-home path, core copy too small at phone scale, and a right HUD placement that competed with the WeChat capsule. The inherited card-themed share image was also still packaged at the root.

Fixes: added a standalone patrol-native home; added return-home actions during observe, target, patrol, and results; enlarged review-critical typography; moved the target HUD left under an explicit capsule exclusion contract; and replaced the share image with the original non-card `share-card-patrol-v2.jpg`.

#### Iteration P2 — passed after evidence correction

Post-fix evidence: `patrol-home-wechat-devtools-final-847x392.png`, `patrol-target-edited-wechat-devtools-final-847x392.png`, `patrol-active-controls-wechat-devtools-final-847x392.png`, `patrol-results-wechat-devtools-final-847x392.png`, and `patrol-active-wechat-comparison-final.png`.

An independent evidence review found that `patrol-returned-home-wechat-devtools-final-847x392.png` had been overwritten with a results frame even though the video proved the route. The file was recaptured from the final `22:20` WeChat build and now shows the actual independent home. The return action also owns a `152×132` touch rect around its `144×60` paper visual while preserving a 24px design gap from the round scroll. A second independent review found no remaining P0/P1/P2/P3 issue.

### Interactions and console check

- Tested in WeChat DevTools: start, automatic observe transition, target `4→5`, confirm, continuous traveler movement, prepare/cancel switch, accelerate, decelerate, results, replay, and return home.
- The 82-second H.264/yuv420p recording demonstrates the full flow without edits and holds results long enough to read before returning home.
- The Windows simulator emitted one DevTools-side `WAService` device-orientation bridge diagnostic while the flow remained fully rendered and operable; no application blank state, crash, or interrupted transition was observed. Real-device GPU, safe-area, and touch behavior remains a required release check.

### Build evidence and limits

- Latest isolated review build: `cocos-client/build/wechatgame-patrol-review/`.
- Exact package sizes: main `2,271,498` bytes, resources `8,126,228` bytes, total `10,397,726` bytes.
- The package contains exactly 19 whitelisted runtime assets and the original patrol share image; its compiled home/start/return markers are gated.
- Final static captures were taken only after the DevTools touch-feedback circle faded; the uncut video intentionally retains touch feedback as interaction evidence.
- Final repository gates: `npm test` passed 50 files / 445 tests; `npm run typecheck`, `npm run build`, `npm run cocos:build:web`, and `npm run cocos:build:wechat:patrol-review` passed.
- This is intentionally a category-investigation artifact. `legacyCodePathsIncluded: true` and `submissionReady: false` remain accurate; blind testing, platform manual category feedback, a clean final submission carrier without old compiled paths, and iPhone/Android real-device acceptance are still pending.

final result: passed

## Latest authoritative verdict — patrol review slice — 2026-08-23

The current `wechatgame-patrol-review` evidence set supersedes earlier patrol captures. The selected source and refreshed Mini Game implementation were compared at the same normalized `694×390` content size; the 82-second uncut recording and its eight-frame contact sheet cover home, observe, target editing, live controls, results, and the confirmed return-home state. No actionable visual issue remains in this investigation slice. Release acceptance still requires blind testing, platform category feedback, a clean final carrier without compiled legacy paths, and iPhone/Android device checks.

final result: passed

## Mobile rules and settings comparison — latest user screenshot (2026-08-04)

- Evidence: `art/qa/user-screenshot-pass-2026-08-04-5/04-design-vs-user.png` and `03-latest-marked-before.png`.
- P1-S03 marked: the supplied simulator screenshot is byte-identical to the previous 1× pre-fix capture, so the DevTools cache/build has not picked up the 2× canvas template yet.
- P2-S04: panel geometry, tabs, setting rows, timer strip, and restore action remain within the 16:9 safe-area contract.
- Fix: `cocos-client/build-templates/wechatgame/game.js` now preserves logical canvas dimensions and prevents repeated DevTools reloads from compounding the supersample factor.
- Verification limit: clear DevTools cache, rebuild the WeChat target, and recapture before accepting runtime clarity.

final result: source fixed; simulator recheck pending cache clear and rebuild

## Mobile rules page comparison — latest user screenshot (2026-08-04)

- Evidence: `art/qa/user-screenshot-pass-2026-08-04-6/03-rules-design-vs-user.png` and `04-rules-marked-before.png`.
- P1-R01: the supplied rules-page screenshot still shows 1× DevTools raster stair-stepping on TTF copy and gold borders.
- P2-R02: page geometry, tabs, instruction panel, illustration, footer, pagination, and safe-area placement match the 16:9 reference.
- Fix status: the WeChat template already provides 2× DevTools supersampling, idempotent canvas scaling, and the rules illustration is already 1536×910 with linear filtering.
- Verification limit: clear DevTools cache, rebuild the WeChat target, and capture this exact page again.

final result: layout passed; runtime clarity recheck pending cache clear and rebuild

## Mobile selected-card comparison — latest user screenshot (2026-08-04)

- Evidence: `art/qa/user-screenshot-pass-2026-08-04-7/03-selected-design-vs-user.png` and `04-selected-marked-before.png`.
- P1-M07: the supplied screenshot still shows 1× raster stair-stepping on HUD copy, card edges, and the confirm CTA; its timestamp predates the latest 2× build.
- P2-M08: selected hand, local status badge, confirm CTA, six-seat HUD, and countdown remain inside the mobile safe area.
- Fix status: WeChat template supersampling and idempotent scaling are in place; `MatchSceneView.renderHand()` retains compact choice-hand anchoring.
- Verification limit: clear DevTools cache, rebuild, and recapture the same selected-card state.

final result: safe-area layout passed; runtime clarity recheck pending cache clear and rebuild

## Round-results footer actions — latest user screenshot (2026-08-07)

- Source visual truth: `art/mockups/round-results-screen.png` and the dedicated footer band in `art/runtime/ui/round-results-panel.png`.
- Implementation screenshot before the fix: `art/qa/round-results-actions-followup-2026-08-07/01-round-results-actions-marked.png`.
- Viewport: 637×331 landscape Mini Game capture.
- State: round 1 results, local player may continue the round.
- Full-view comparison evidence: `01-round-results-actions-marked.png` and `02-selected-reference.png` were inspected together.
- Focused comparison evidence: `02-actions-crop.png`, `03-current-assets-90.png`, and `04-proposed-assets-100.png`.

### Finding and implementation

- P2 fixed in code: the paper action rendered at `240×100`, while the green primary action rendered at `270×90`; the primary action was therefore 10% shorter and had cramped label-safe margins.
- Fix: the green action now renders at `300×100`, preserving its authored 3:1 proportion and sharing the paper action's 100px visual height. Font size, optical baseline, 120px touch height, footer position, and existing SIMPLE bitmap assets remain unchanged.
- Fonts and copy: unchanged; both actions continue to use the 32px display font and the existing labels.
- Spacing and layout: layout tests confirm both actions and expanded touch targets remain inside the dedicated footer-safe band with at least 20px between actions.
- Colors and image quality: unchanged; source and runtime button assets are byte-consistent and do not require regeneration.

### Verification limit

- The user requested that WeChat DevTools verification remain manual. A post-fix Mini Game screenshot is therefore not available in this run, so the visible result cannot be compared at the same viewport and state yet.

### Iteration 2 — footer border containment

- New evidence: `art/qa/round-results-actions-followup-2026-08-07/06-buttons-overflow-before.png` showed that the enlarged primary action entered the baked footer's rounded right cap.
- Root cause: the previous `1060×120 @ (0,-292)` safe rectangle described an abstract layout band rather than the actual `round-results-panel.png` footer frame, which measures approximately `1016×103 @ (-10,-306)` at runtime.
- Fix: separate the `1020×104` visual frame from the `1020×120` invisible touch band, move all footer visuals to `y=-306`, and redistribute the row to `hint x=-305`, `secondary x=40`, `primary x=335`.
- Post-fix rendered Mini Game evidence is still pending manual recapture.

final result: blocked

## 好友房弹窗高清素材与布局 — 2026-08-08

- Source visual truth: `art/qa/audits/2026-08-08-room-dialog-blur/01-join-room-blur.png` and `02-create-room-blur.png`.
- Implementation screenshots: `07-create-room-v2-web-diagnostic.png` and `08-join-room-v2-web-diagnostic.png`.
- Viewport: 847×402 landscape, matching the project's ultra-wide Mini Game diagnostic viewport.
- State: create-room entry with AI auto-fill enabled; join-room entry with empty room-code field.
- Full-view comparison evidence: `07-create-room-v2-web-diagnostic.png` and `08-join-room-v2-web-diagnostic.png`.
- Focused side-by-side comparison evidence: `09-create-before-after-comparison.png` and `10-join-before-after-comparison.png`.

### Findings and fixes

- P1 fixed — stretched panel texture: the old 482×234 general lacquer panel was nine-sliced to 1060×760 / 1060×650, visibly magnifying its quiet center and ornaments. Create and join now use dedicated final-ratio `v2` panel bitmaps rendered as SIMPLE sprites.
- P2 fixed — text rows and decorative interference: nickname, room-code, and AI-fill controls now use three final-ratio `v2` SIMPLE assets with ornament-free content-safe centers. Runtime text remains centered and readable in both empty and filled states.
- P2 fixed — footer containment: back and primary actions sit fully inside each authored modal frame. The create dialog's AI-fill row occupies its own layout band, and the seat, mode, and footer bands do not overlap.
- P1 fixed — authored safe-area containment: the create panel now renders at its original 1200×860 ratio and every title/content/action band stays inside the decoration-free safe rectangle with at least 8 design pixels between adjacent bands. Join actions were raised into the same contract.
- P1 fixed — compressed selected controls: create-room seat and mode controls now render at 88px, above the 84px combined top/bottom cap height of `ui.panel.secondary`; selected blue controls no longer flatten their nine-slice corners.
- P2 fixed — AI switch affordance: the row now says “开启 · 至少 2 真人后补位” or “关闭 · 不添加机器人”, so state is not conveyed by opacity alone.
- P2 fixed — Mini Game texture caching: all five materially replaced bitmaps use new semantic keys and unique UUID paths instead of reusing the old panel texture identity.

### Required fidelity surfaces

- Fonts and typography: passed. The display/interface font split, font weights, line heights, centered input copy, and action labels remain consistent; no label wraps or clips.
- Spacing and layout rhythm: passed. Title, avatar, input, seat, AI, mode, and action bands remain distinct. Both action rows stay inside the lacquer border.
- Colors and visual tokens: passed. Warm lacquer, old gold, parchment, and midnight-blue controls remain in the selected Enchanted Teahouse direction.
- Image quality and asset fidelity: passed. Five dedicated high-resolution PNGs are rendered without nine-slice stretching. The rebuilt `wechatgame` package contains all five native PNGs at their source dimensions with byte-identical SHA-256 hashes.
- Copy and content: passed. Create/join titles, nickname and room-code prompts, player counts, modes, action labels, and “开启 · 至少 2 真人后补位” are coherent and fit their safe areas.
- Icons and imagery: passed. Existing authored avatar portraits remain unchanged, correctly cropped, and evenly spaced; no CSS/SVG/emoji placeholders were introduced.
- States and interactions: passed. Create/join entry, nickname editing, six-digit room-code editing, AI-fill on/off, and back navigation were exercised. Browser diagnostic logs contained zero errors or warnings.

### Comparison history

#### Iteration FR1 — blocked

Evidence: `01-join-room-blur.png` and `02-create-room-blur.png`. The general panel texture was visibly enlarged, the repeated center decoration competed with input text, and the modal had no dedicated AI-fill band.

#### Iteration FR2 — blocked

Evidence: `05-join-room-fixed-web-diagnostic.png` and `06-create-room-fixed-web-diagnostic.png`. Dedicated final-ratio panels and rows removed the stretched texture, but the create title/footer and join footer still entered the authored ornament-safe insets; the 76/82px selected blue controls also compressed 84px of vertical nine-slice caps.

#### Iteration FR3 — passed

Evidence: `09-create-before-after-comparison.png` and `10-join-before-after-comparison.png`. The enlarged proportional create panel, explicit safe rectangles, 8px minimum band gaps, raised footer actions, 88px selected controls, and explicit AI state copy remove the remaining P1/P2 layout findings.

### Verification

- `npm test`: 26 files, 148 tests passed.
- `npm run typecheck`: passed across game core, protocol, room server, React diagnostic client, and Cocos client.
- `npm run cocos:build:wechat`: passed; `game.json.deviceOrientation` remains `landscape`.
- The rebuilt Mini Game resource config contains all five versioned `/texture` paths. Their native output dimensions are 1482×1062, 1601×982, 1400×152, 1400×164, and 1080×152, with hashes matching the synchronized sources.

### Acceptance limit

The browser captures are layout diagnostics only. Per project policy and the user's instruction, WeChat DevTools/device visual acceptance is intentionally left to manual QA; this run did not connect to or operate WeChat DevTools.

final result: passed
