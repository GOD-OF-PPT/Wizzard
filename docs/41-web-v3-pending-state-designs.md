# Web v3：选择与出牌提交态设计

日期：2026-10-20。整体目标 active，尚未通过像素级验收。

2026-10-21更新：三种pending的横竖Chrome当前图均在50批次，通过按钮提交进入；chooser的no-play-v4语义修订也已复拍。先前的控制超时/缺当前图描述为历史。精确选牌完成帧、艺术P2与真实异常传输仍未完成，详见docs/43。

## 本次设计与实现

使用内置 ImageGen，以原 `11-chooser.png`、`05-gameplay-final.png` 及各自竖屏稿为编辑目标，新增四张独立状态稿：

| 状态 | 横屏稿 | 竖屏稿 | 实现 |
| --- | --- | --- | --- |
| 选择提交中 | `art/mockups/web-v3/18-chooser-pending-v1.png` | `portrait/18-chooser-pending-v1.png` | 已接入独立透明局部层；选项禁用、aria-busy/status 仍为真实 DOM |
| 出牌提交中 | `art/mockups/web-v3/19-play-pending-v1.png` | `portrait/19-play-pending-v1.png` | 已有真实动态“出牌中”，本次去掉继承的灰化滤镜，保留选中牌 |

原始 ImageGen 产物在 `art/source/web-v3/{chooser,play}-pending-*`，完整提示词在 `art/prompts/web-v3-{chooser,play}-pending-*`。未覆盖原设计，也未将整张生成截图冒充运行时界面。

ImageGen 对非编辑区域有纹理漂移，因此只将指定 ROI 合入原稿，`41-{chooser,play}-{landscape,portrait}-source-20261020.json` 记录哈希、矩形与 `changedOutside=0`。透明运行时层通过 `tools/extract-web-chooser-pending.mjs` 原样复制生成像素，避免 Sharp alpha 往返改动外部边缘。横屏既有透明层实际为 1671×941，保留该历史一列差异，未静默缩放生成的 1672×941 图。

竖屏选择提示替换原副标题；横屏替换右上模式牌内容。这样提示始终处于面板安全区，不再挤占面板和手牌之间的窄缝。两种布局各自保持卡位，不能复用横屏坐标裁切竖屏。

## 交互合同

1. 点击一个选择或确认出牌后，立即进入 pending；同一动作不再重复提交。
2. pending 内四个花色/手牌及确认动作禁用，保留当前选择。出牌按钮保持绿色与米白文字，明确用“出牌中”表达等待，不与“未选择手牌”的灰化状态混同。
3. 无关快照、无关 ACK 与重连事件不得解锁；只有匹配的权威应答/拒绝才解锁。现有适配器实现不在本次重写。
4. 状态不会重新触发选牌抬升或确认脉冲。返回首页继续服从练习退出或联网离开应答合同。
5. `pending=on-submit` 是仅 DEV 的可点击冻结排版夹具，不发送网络请求，不证明真实延迟 ACK。

## Chrome 证据和边界

`41-*` 保存初次聚焦对照；`42-*-settled-20261020` 是所有可见图片解码及字体就绪后的统一基线；`43-*` 是后续修复复拍。当前有效对应关系在 `docs/42-web-v3-current-acceptance.md` 与 `art/review/web-v3/42-coverage-20261020.json`。

主代理已联合打开源稿/实现全景及局部对照。提交态四张稿补齐，但仍有牌桌头像、卡面、HUD 字形/材质差距。原稿选中牌倾斜与既定零度、12px 抬升完成帧存在冲突；新增两个 `selection-complete-*-v1` raw 候选没有达到精确坐标/halo 要求，未作为设计真值接入。不能据此宣布所有关键状态稿齐备或整体一致。

竖屏 chooser 原稿画有无意义的底部“确认出牌”，当前 chooser 不提供该动作。2026-10-20新增内置ImageGen局部修订 `portrait/11-chooser-no-play-v4.png` 与 `portrait/18-chooser-pending-no-play-v4.png`，旧稿保留，区域外变更为0。v2/v3因融合接缝与旧边框残留拒用，清单已选用v4；本轮Chrome控制超时，尚缺修订后的当前复拍，不能在实现中恢复错误操作来凑图。

本次只证明冻结样例中的点击进入 pending 与视觉锁定；真实传输延迟/丢失应答、重连所有权和联网终局仍需独立完成。
