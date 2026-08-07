# Wizzard / 奇术茶馆（工作名）

面向微信好友的小范围、非商业化预测型墩牌游戏。仓库名称沿用 `Wizzard`，正式产品名尚未确定。

当前基线已经确认：

- 横版 16:9，3–6 个玩家座位；
- 好友房为主，空位可由不作弊的 AI 补足；
- 经典规则与 8 轮移动端快速局并存；
- 采用第二套“奇术茶馆”原创视觉方向；
- 不使用原版 Wizard/巫师牌的名称、商标、卡面或符号；
- 暂不包含广告、支付、公共匹配、聊天、成长和运营系统。

## 文档

- [产品范围](docs/01-product-brief.md)
- [完整游戏规则](docs/02-game-rules.md)
- [美术方向与资源清单](docs/03-art-direction.md)
- [小程序与小游戏技术选择](docs/04-platform-decision.md)
- [系统架构](docs/05-architecture.md)
- [实施计划与验收](docs/06-implementation-plan.md)
- [资料来源与研究记录](docs/07-research-notes.md)
- [Cocos 客户端实施记录](docs/08-cocos-client-implementation.md)
- [构建目标与微信开发者工具导入](docs/11-build-targets.md)
- [WebSocket 好友房服务](docs/09-friend-room-service.md)
- [规则与设置页面](docs/10-rules-settings.md)
- [关键决策记录](docs/decisions/README.md)
- [美术资源包与界面稿](art/README.md)
- [Cocos 正式客户端](cocos-client/README.md)

选定视觉基准位于 [public/assets/selected-art-direction.png](public/assets/selected-art-direction.png)。原始规则照片保存在 `docs/reference/source-rulebook/`，仅用于规则研究与内部追溯。

## 本地运行

```bash
npm install
npm run dev
```

辅助验证命令：

```bash
npm test
npm run typecheck
npm run build
npm run cocos:prepare
```

`npm run build` is the React/Vite validation build. It refreshes `dist/` and does not build the Cocos WeChat Mini Game. To refresh the directory opened by WeChat DevTools, run:

```powershell
npm run build:wechat
```

This runs asset sync, shared-package compilation, Cocos type checking, and the Creator 3.8.8 release build. The verified output is `cocos-client/build/wechatgame/`; open that directory in WeChat DevTools, then clear its cache and recompile.

## 当前已实现

### 共享权威规则核心

- `packages/game-core` 是 Web、Cocos 与未来 Node 服务共用的唯一规则源码，构建为私有 ESM 包 `@wizzard/game-core`；
- 包提供根入口、只读契约入口 `@wizzard/game-core/contracts` 与权威入口 `@wizzard/game-core/authority`，正式网络客户端不会导入权威函数；
- `packages/game-core/src/match.ts` 已实现平台无关、纯 TypeScript 的权威比赛状态机；
- 客户端或 AI 只能提交 `MatchIntent`，状态机返回新的权威状态和 `MatchEvent[]`；
- 意图只携带动作参数、`commandId` 与 `expectedVersion`；行动者身份由本地/网络适配器从会话注入，不能由客户端请求体冒充；
- 首次成功命令的事件结果会按 `commandId` 缓存并在重试时重放，旧版本、错误阶段、越权回合和非法行动仍稳定拒绝；
- `createPlayerSnapshot` 生成按查看者过滤并隔离复制的快照：公共状态只暴露各座位手牌数量，私有状态只包含查看者自己的手牌与当前合法牌 ID；
- AI 通过同一份过滤快照产生同一种 `MatchIntent`，不能读取其他玩家手牌或牌库顺序。

状态机现已覆盖：

- 发牌与翻牌决定王牌；
- 发牌者在翻出至高牌时选择王牌；
- 全员依次叫墩；
- 跟随领出花色与合法牌过滤；
- 完整一墩的逐人出牌、胜者判定和下一墩领出权；
- 轮结算、累计计分、下一轮发牌者轮转；
- 完整 8 轮快速局与比赛总榜。

### 本地适配器与动态牌桌

- `src/hooks/useLocalMatch.ts` 是当前进程内本地适配器，负责种子随机源、命令编号、人类意图、AI 意图及自动推进；
- 本地适配器不再向界面暴露完整权威状态；随机发牌转换在 React reducer 外计算，避免 Strict Mode 重放消耗随机源；
- 每次选王牌、叫墩与出牌显示 30 秒倒计时，超时由本地权威适配器通过同一 Intent 接口托管一次行动；
- `src/components/MatchScreen.tsx` 与 `CardView.tsx` 根据查看者快照动态渲染 3–6 席布局、手牌、合法/非法牌、已出牌、叫墩面板、王牌面板、一墩结果、羊皮卷轮结算和总榜；
- 桌面 `1600×900` 与横屏手机 `844×390` 已完成浏览器视觉复核，设计 QA 记录见 `design-qa.md`；
- 牌桌已从整屏截图热点演示升级为由状态驱动、资源可替换的动态界面，结构可映射为 Cocos Creator 的 Scene、Node、SpriteFrame、Prefab 和 UI 组件；
- React 首页与好友房只承担交互验证；正式创建、加入、准备、AI 补位、房主开始与重赛返回流程已在 Cocos 客户端接入 WebSocket 房间服务。

### Cocos Creator 正式客户端与好友房切片

- `cocos-client/` 已按 Cocos Creator 3.8.8 2D 工程格式初始化，设计分辨率为横版 `1920×1080`，微信小游戏模板与实际构建产物均锁定横屏；
- `GameBootstrap`、好友房控制器、`IMatchAdapter`、本地/网络适配器与视图已建立房间、输入、资源和渲染分层，Cocos Node 不持有权威比赛状态；
- 正式客户端通过 `@wizzard/game-core` 的构建产物复用同一状态机，没有复制第二份规则源码；
- 首个本地牌桌切片已覆盖选择王牌、预测、合法选牌、确认出牌、AI 行动、30 秒托管、一墩结算、轮结算、8 轮总榜和重新开始；
- 好友房首页、大厅和联网牌桌复用同一个 `RoomSocketClient`，已支持 3–6 人房、准备/取消、AI 补位、房主开始、断线恢复和重赛返回原大厅；
- 首页“规则与设置”已接入四章规则手册和本机体验设置；合法牌提示与回合震动均真实作用于 Cocos 牌桌并独立持久化；
- `tools/sync-cocos-assets.mjs` 从 `art/asset-manifest.json` 生成稳定语义地址，核心切片同步 43 张 PNG 与两套精简 Noto SC 字体；
- 牌桌只使用正式背景、卡牌、头像、漆器/羊皮纸 UI 和反馈 FX，动态王牌使用正式花色卡面裁切，不依赖错误的通用 `ui.trumpTile`；
- Cocos 适配器的完整 8 轮闭环已有进程内集成验证，客户端 TypeScript 可使用官方 Creator 3.8 类型声明检查；
- 当前机器已安装 Creator 3.8.8，并已成功生成 Web Desktop 与微信小游戏 release 构建；微信产物的 `game.json` 为 `deviceOrientation: landscape`。

## 当前边界

React/Vite 版本仍是交互与架构验证工具，不是正式发布客户端。正式客户端入口已经转移到 `cocos-client/`；单人练习使用进程内本地权威适配器，好友房则通过 WebSocket 连接 Node.js 权威服务。

以下工作尚未完成或尚未在目标工具链验证：

- 两个隔离浏览器会话的完整好友房人工闭环与 Cocos 1920×1080 视觉 QA；
- 微信开发者工具导入、体验成员、iPhone/Android 真机横屏与弱网验收；
- 微信登录、原生分享/邀请、合法 `wss://` 域名和线上部署；
- Prefab、Auto Atlas、纹理压缩、Asset Bundle 与小游戏分包。加入规则页正式插图后的微信 release 构建目录约 11.69 MiB，仍超过可直接上传的首包预算，必须先完成包体分析、压缩和分包。

联网房间中，Cocos 客户端只提交意图并消费服务端事件/查看者快照；`packages/game-core` 继续作为本地练习与服务端共用的唯一平台无关规则核心。
