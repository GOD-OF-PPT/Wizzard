# 规则与设置页面

## 目标

首页“规则与设置”入口打开 Cocos 内的横版模态页面，不创建新路由、不释放好友房控制器，也不建立 WebSocket。页面帮助第一次加入的好友在数分钟内理解预测、王牌、跟色与计分，并只提供已经真实接入的本机体验设置。

## 视觉与信息结构

- 设计基准为 `1920×1080` 横版，继续使用“奇术茶馆”的朱漆、宣纸、午夜蓝、旧金属与灯笼暖光；
- 外框、页签、章节按钮和状态按钮只复用 `ui.panel.primary`、`ui.panel.secondary`、`ui.status.green`、`ui.plaque.small`、`ui.roundTitleScroll` 与 `ui.scoreRibbon`；
- 规则总览使用正式 `tutorial.ruleHint`，牌力说明使用现有花色牌、至高牌、虚无牌和计分带；
- 标题使用 `font.display`，正文使用 `font.interface`，正文左对齐；不使用系统字体、emoji、文本图标、CSS/SVG 临摹或占位图；
- 页面分为“玩法规则”和“体验设置”两个页签。规则采用固定四章分页，不使用长滚动：
  1. 快速上手；
  2. 王牌与牌力；
  3. 出牌规则；
  4. 计分与局制。

规则文字来自 [`02-game-rules.md`](02-game-rules.md)，但界面不会展示当前实现尚未完全统一的“公开抽牌决定首位发牌者”和“掉线后独立保留 60 秒”细节。它们仍是规则/服务端后续对齐项，不应由表现层自行实现。

## 本机体验设置

偏好保存键为 `wizzard.client-preferences.v1`，与 `wizzard.room-session.v1` 完全分离。浏览器使用 `localStorage`，微信小游戏使用 `wx.getStorageSync` / `wx.setStorageSync`；浏览器不存在 `localStorage` 时使用内存存储，存储读写失败不会中断当前启动中的设置状态。

当前设置仅有：

- **合法牌提示**：开启时，轮到自己出牌会高亮合法牌并弱化非法牌；关闭时隐藏这组视觉提示，但可点击牌仍严格来自服务端/规则核心提供的 `legalCardIds`；
- **轮到我时震动**：开启时，在轮到自己选择王牌、预测或出牌的状态切换上触发一次轻震；微信使用可选 `wx.vibrateShort`，不支持震动的平台静默跳过；
- **恢复默认**：恢复以上两项的默认开启状态并立即持久化。

音效和减少动效暂不展示。当前 Cocos 构建没有正式音频资源或 `AudioSource`，表现代码也没有可由“减少动效”开关控制的 Tween/Animation；仅添加开关而没有实际效果不属于可交付功能。

## 技术边界

- `RulesSettingsView` 只构建 Cocos 表现节点与交互控件；
- `FriendRoomView` 只维护页面打开状态、当前规则章节与页签；
- `GamePreferences` 负责校验、合并默认值与持久化；
- `PlatformServices` 收敛浏览器/微信存储和震动能力；
- `MatchSceneView` 读取偏好决定提示表现和震动，不修改 `MatchIntent`、牌力、合法牌集合、计分或行动时限；
- `packages/game-core`、房间协议和服务端不依赖此页面，也不因设置产生分支。

## 资源与字体

`tutorial.ruleHint` 从完整资源层提升到当前 `core-only` 切片，因此核心同步清单变为 33 张图片（32 PNG + 1 JPG）和 2 套字体。规则与设置新增汉字已加入 `art/source/fonts/subset-glyphs.txt`，两套静态 Noto SC 子集随之重新生成；来源、大小与 SHA-256 见 `art/source/fonts/README.md`。

## 验收范围

本切片的代码验收包括入口、关闭、双页签、四章分页、偏好保存、默认恢复、牌桌合法牌提示和本人回合震动接线。根据当前开发优先级，浏览器人工试玩、视觉对照和微信真机震动验证在页面开发完成后另行继续。
