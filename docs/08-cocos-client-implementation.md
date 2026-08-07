# Cocos Creator 客户端实施记录

状态：**好友房大厅与联网牌桌交接已实现，Creator 3.8.8 首次导入、Web Desktop 与横屏微信小游戏 release 构建均已完成。**

## 工程选择

- 路径：`cocos-client/`
- 目标：Cocos Creator 3.8.x 2D，项目元数据固定为 3.8.8；
- 静态类型：使用 `@cocos/creator-types@3.8.7`，该包是当前可获得的最新 3.8 官方声明，与 3.8.8 API 兼容；
- 设计分辨率：`1920×1080`，运行时采用固定高度横屏适配；
- 微信模板：`build-templates/wechatgame/game.json` 设置 `deviceOrientation=landscape`。

工程已使用 Cocos Creator 3.8.8 完成首次导入，Creator 已生成正式图片/字体 `.meta`，并成功产出 `build/web-desktop/` 与 `build/wechatgame/`。两者均使用 `debug: false` 的 release 配置；微信生成物的 `game.json` 已确认 `deviceOrientation: landscape`。

## 单一规则源码

原 `src/game/` 已抽为私有工作区包：

```text
packages/game-core/
├─ src/                 # 唯一规则源码
├─ test/                # 规则测试
├─ dist/                # 构建产物，不提交
└─ package.json
```

导出面：

- `@wizzard/game-core/contracts`：Card、Suit、MatchIntent、MatchEvent、PlayerMatchSnapshot 等契约；
- `@wizzard/game-core/authority`：创建比赛、应用意图、权威推进和查看者快照；
- `@wizzard/game-core`：本地 AI 与完整开发入口。

Cocos 通过 npm 工作区消费 `dist`，不在 `assets/` 内复制规则源码。打开 Creator 前必须先运行 `npm run build:core`。

## Cocos 分层

```text
Boot.scene / GameBootstrap
        │
        ├── AssetRegistry ── 语义键 → SpriteFrame / TTFFont
        │
        ├── FriendRoomView ── FriendRoomController
        │                         │
        │                         └── RoomSocketClient ── /ws
        │                                  │ 同一实例
        │                                  ▼
        ├── MatchSceneView ── NetworkMatchAdapter
        │
        └── MatchSceneView ── LocalMatchAdapter ── @wizzard/game-core/authority
```

- `GameBootstrap`：横屏适配、资源预载，以及首页/大厅/联网牌桌/本地练习的视图生命周期；
- `FriendRoomController`：创建、加入、恢复、准备和房主开始的无 `cc` 状态控制器；
- `FriendRoomView`：使用正式漆木、宣纸、头像和按钮资源渲染首页、表单、座位大厅与连接反馈；
- `RulesSettingsView`：复用正式规则插图、卡牌与九宫格面板渲染四章规则手册和本机体验设置；
- `RoomSocketClient`：协议校验、会话持久化、心跳、重连和未确认命令重发；
- `IMatchAdapter`：表现层唯一比赛入口，隐藏命令 ID、版本与行动者身份；
- `LocalMatchAdapter`：每次进入/重赛使用新的练习会话种子；若快速局的一张首手与上一局相同，则在 16 次上限内重发。可注入固定种子并默认关闭防重复以保留确定性重放，同时负责 AI、30 秒托管、赢墩展示和跨轮推进；
- `NetworkMatchAdapter`：消费同一房间 Socket 的私有比赛快照，只提交服务端 Intent；
- `MatchSceneView`：只持有选中牌、预测草稿和反馈文案等表现状态；
- `GamePreferences` / `PlatformServices`：独立保存合法牌提示与震动偏好；浏览器、微信与内存回退不泄漏到规则核心；
- `CardView` / `PlayerSeatView`：可在编辑器验证后保存为 Prefab 的组件边界；
- `UiFactory`：统一 Node、Sprite、Label、九宫格面板和按钮创建。

`GameBootstrap` 不在收到 `room.update` 的同步派发栈内直接交换监听者，而是在 microtask 中路由。比赛开始时 `NetworkMatchAdapter` 以“不拥有 Socket”的方式接入；重赛返回 `lobby + match:null` 后只销毁比赛适配器和牌桌视图，`FriendRoomController` 与原 `RoomSocketClient` 继续存活。因此不会重新建房、重复恢复或丢失开局快照。

## 已实现的好友房流程

1. 首页选择创建好友房、加入好友房或单人练习；
2. 创建时选择头像、昵称、3–6 人桌和快速/经典局；加入时输入昵称与 6 位房间码；
3. 控制器先执行昵称 trim 与 1–16 字符校验，并将房间码 trim、转大写后按安全字母表校验；
4. 进入大厅后显示房间码、相对座位、房主、在线/准备状态和 AI 待命席位；
5. 所有真人准备，房主决定是否 AI 补位并开始；同类 pending 命令在 ack 或 request error 前不能重复发送；
6. 服务端发布 `playing + match` 后自动切换 `MatchSceneView`，比赛期间大厅控制器继续订阅相同 Socket；
7. 房主在比赛结束请求重赛后，服务端发布 `lobby + match:null`，客户端回到原好友房大厅；
8. 浏览器和微信运行时分别使用 `WebSocket`/`wx.connectSocket`、对应持久存储和剪贴板适配器。

## 已跑通的离线流程

1. 六席快速局创建；
2. 翻出至高牌时由发牌者选择王牌；
3. 全员依次预测赢墩数；
4. 只高亮查看者合法牌，选中后确认出牌；
5. AI 只读取自己的查看者快照并通过同一 Intent 入口行动；
6. 一墩完成后展示胜者并由权威层推进；
7. 手牌耗尽后显示本轮预测、赢墩、轮分和总分；
8. 继续下一轮，完成全部 8 轮并显示总榜；
9. 重新开始使用新会话种子的本地练习局，并避免连续两局显示完全相同的首手；测试可注入固定种子重放同一牌序。

`cocos-client/test/LocalMatchAdapter.test.ts` 已从适配器公开接口驱动完整 8 轮，确认 Cocos seam 不需要读取完整权威状态。

## 资源同步

`tools/sync-cocos-assets.mjs` 读取 `art/asset-manifest.json`，校验资源数量、重复文件、SHA-256 和路径后生成：

- `cocos-client/assets/resources/game-art/`：首切片资源副本；
- `cocos-client/assets/scripts/assets/AssetAddresses.generated.ts`：语义键与 `resources.load` 地址；
- `cocos-client/assets/resources/game-art/_generated/asset-sync-report.md`：同步报告。

核心切片为 43 张 PNG + 2 套精简字体，包括：3 张背景、7 张卡牌、6 张 normal 头像、1 张规则提示插图，以及 26 张 UI/反馈资源。角色其他表情与教程手势仍保留在完整清单中，待 Creator Asset Bundle/微信分包阶段接入。

字体来自本机 Noto Sans SC / Noto Serif SC 变量字体，已转换为项目文案所需的静态子集，并保留 SIL OFL 许可证和来源说明。

## Creator 3.8.8 构建与人工测试

当前已完成首次资源导入、Web Desktop release 构建和微信小游戏 release 构建。每次同步代码和美术后，先在仓库根运行：

```powershell
npm install
npm run cocos:prepare
```

本地好友房人工测试需要两个并行步骤。终端 A 启动权威服务：

```powershell
npm run room:dev
```

终端 B 通过 Cocos Dashboard 使用 Creator 3.8.8 打开仓库中的 `cocos-client/` 工程。

在 Creator 中打开 `assets/scenes/Boot.scene`，使用“浏览器预览”。仓库默认应用配置会显示好友房首页并连接 `ws://127.0.0.1:8787/ws`；只有点击创建或加入后才真正建立 Socket。

最短冒烟路径是创建 3 人快速局，房主准备并保持“AI 补位：开”，然后开始游戏。双人联调时，把同一个预览 URL 分别放在普通窗口与无痕窗口（或两个不同浏览器）中，避免同源 `localStorage` 的恢复令牌互相覆盖：

1. A 创建 3 人快速局并复制房间码；
2. B 用房间码加入，A、B 都点击准备；
3. A 保持 AI 补位开启并开始；
4. 两端确认座位、当前玩家、倒计时和各自私有手牌不同，且都能完成自己的合法行动；
5. 临时断网后恢复，确认显示重连遮罩且回到同一局；
6. 完成快速局并由房主重赛，确认两端返回原房间大厅而不是创建新 Socket。

可复现构建配置位于 `build-config/web-desktop.json` 和 `build-config/wechatgame.json`。Web Desktop 当前产物位于 `cocos-client/build/web-desktop/`，也可在 Creator 的“项目 → 构建发布”中选择 `Web Desktop`、加入 `Boot.scene` 后执行。

微信小游戏模板与构建配置均已锁定横屏，可在仓库根重复执行：

```powershell
npm run cocos:build:wechat
```

真机构建必须把应用配置中的 endpoint 换成已在微信后台登记的 `wss://` 合法域名；本地 `ws://127.0.0.1` 只用于桌面联调。

本机 Creator CLI 在日志已出现 `build Task (wechatgame) Finished` 后仍可能返回退出码 `36`。因此命令行验收需同时确认完成日志、输出目录和生成的 `game.json`，不能只依据进程退出码。

当前微信 release 构建目录为 12,257,592 bytes（约 11.69 MiB）。这证明本地构建链路可用，但仍超过可直接上传的首包预算；最终数值要以微信开发者工具包体分析为准，纹理压缩、Auto Atlas、Asset Bundle/分包和重新测量仍是发布阻断项。

## 后续验证顺序

1. 按上述路径完成单客户端 AI 冒烟和两个隔离浏览器的好友房完整快速局；
2. 在 1920×1080 捕获首页、大厅和联网牌桌，与 `art/mockups/` 做 Cocos Design QA；
3. 将 `build/wechatgame/` 导入微信开发者工具，完成包体分析和横屏模拟器检查；
4. 为卡牌、头像、UI/FX 创建 Auto Atlas，并按 manifest 配置禁旋转、禁 trim、padding 与压缩；
5. 把表情和教程资源设为 Asset Bundle / 微信小游戏分包，并重新测量主包与总包；
6. 在真机检查横屏、安全区、触控、断线恢复和内存。

## 当前未实现

- 微信开发者工具导入、包体优化和真机联调；
- 微信登录、原生分享/邀请令牌、合法域名部署和云托管；
- 可见的冷启动恢复、主动离房和返回好友房入口；
- 音频、表情 Bundle、教程 Bundle；
- Prefab、Auto Atlas、纹理压缩与小游戏分包；
- Cocos 首页/大厅 1920×1080 视觉 QA，以及完整双客户端人工测试。
