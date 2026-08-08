# Design QA — 页面设计稿对照与高清资源返修

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
