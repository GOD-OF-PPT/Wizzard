# Cocos Creator 客户端实施记录

状态：**好友房大厅与联网牌桌交接、AppID 直属微信云托管接入和微信上传包体门槛已完成；Creator 3.8.8 首次导入、Web Desktop 与横屏微信小游戏 release 构建均已完成，开发者工具与双真机人工验收仍待完成。**

## 工程选择

- 路径：`cocos-client/`
- 目标：Cocos Creator 3.8.x 2D，项目元数据固定为 3.8.8；
- 静态类型：使用 `@cocos/creator-types@3.8.7`，该包是当前可获得的最新 3.8 官方声明，与 3.8.8 API 兼容；
- 设计分辨率：`1920×1080`，运行时采用固定高度横屏适配；
- 微信模板：`build-templates/wechatgame/game.json` 设置 `deviceOrientation=landscape`；
- 微信工程：AppID 固定为 `wx4376a5b67a747d28`，基础库固定为 `2.23.0`；`connectContainer` 最低要求基础库 2.21.1。

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
2. 创建或加入弹窗每次打开时生成一个可编辑的随机昵称；创建时选择头像、3–6 人桌和快速/经典局，加入时输入 6 位纯数字房间码；
3. 控制器先执行昵称 trim 与 1–16 字符校验，并将房间码 trim 后按 6 位纯数字格式校验；房间码输入框使用数字键盘；
4. 进入大厅后显示房间码、相对座位、房主、在线/准备状态和 AI 待命席位；
5. 所有真人准备，房主决定是否 AI 补位并开始；同类 pending 命令在 ack 或 request error 前不能重复发送；
6. 服务端发布 `playing + match` 后自动切换 `MatchSceneView`，比赛期间大厅控制器继续订阅相同 Socket；
7. 房主在比赛结束请求重赛后，服务端发布 `lobby + match:null`，客户端回到原好友房大厅；
8. 浏览器使用 `WebSocket`；微信正式运行时使用当前 AppID 直属云托管的 `wx.cloud.connectContainer`，显式 WebSocket 只保留给本地诊断，正式配置不回退到公网 `wx.connectSocket`。持久存储和剪贴板继续收敛在平台层。

正式网络目标固定为环境 `prod-d9g3qr6rqdbba6605`、服务 `wizzard-room-server` 和路径 `/ws`。该私有路径不需要公网 IP、Cloudflare 域名或微信后台 Socket 合法域名。云托管私有 `GET /healthz` 已返回 200，服务最小/最大实例固定为 `1 / 1`；在分布式房间所有权和 pub/sub 完成前不得扩容。HTTP 健康检查不证明 WebSocket 升级、重连或双玩家牌局已经通过。

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

当前核心切片为 48 张 PNG + 2 套精简字体，覆盖背景、卡牌、6 张 normal 头像、规则提示插图和 UI/反馈资源。该切片已随 `resources` Asset Bundle 进入微信普通分包；角色其他表情与教程手势仍保留在完整清单中，待后续按页面接入。

字体来自本机 Noto Sans SC / Noto Serif SC 变量字体，已转换为项目文案所需的静态子集，并保留 SIL OFL 许可证和来源说明。

## Creator 3.8.8 构建与人工测试

当前已完成首次资源导入、Web Desktop release 构建和微信小游戏 release 构建。每次同步代码和美术后，先在仓库根运行：

```powershell
npm install
npm run cocos:prepare
```

以下浏览器流程只用于本地协议与布局诊断，不属于微信体验版发布验收。终端 A 启动权威服务：

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

真机构建固定注入 AppID `wx4376a5b67a747d28`、环境 `prod-d9g3qr6rqdbba6605`、服务 `wizzard-room-server` 和路径 `/ws`，由 `wx.cloud.connectContainer` 走免域名私有协议；本地 `ws://127.0.0.1` 只用于桌面联调。构建脚本还会规范并校验 `project.config.json` 中的 AppID 与基础库 `2.23.0`，以及生成模板中的云环境、服务名和 `wechat-cloud-container` 标记。

本机 Creator CLI 在日志已出现 `build Task (wechatgame) Finished` 后仍可能返回退出码 `36`。因此命令行验收需同时确认完成日志、输出目录和生成的 `game.json`，不能只依据进程退出码。

微信 release 构建已经在 `game.json` 与 `settings.json` 中声明 `resources` 普通分包。最大的 8 张 PNG 经无损重编码后逐像素比较均为 `AE=0`，其中 7 张产生体积缩减，`teahouse-table` 输出字节数不变；最新正式产物主包为 2,013,782 B（1.9205 MiB）、资源分包为 28,514,601 B（27.1936 MiB）、总包为 30,528,383 B（29.1141 MiB），已满足 4 MiB 主包和 30 MiB 总包限制。构建脚本会在缺少分包或任一包体门槛超限时失败；微信开发者工具中的人工包体分析仍是发布验收步骤。

## 后续验证顺序

1. 由人工将 `build/wechatgame/` 导入微信开发者工具，复核包体分析、`resources` 分包、横屏模拟器、系统胶囊安全区和上传前配置；
2. 在微信小游戏载体捕获首页、大厅、联网牌桌和弹窗，与 `art/mockups/` 做 Cocos Design QA；
3. 用至少两台真机完成创建/加入/准备/AI 补位/开始、整局、弱网重连、会话恢复和重赛；
4. 在微信后台人工确认类目/主体资质、隐私保护指引、正式名称、头像、120 字内介绍、体验成员、版本号和版本说明；
5. 在 iPhone/Android 检查横屏、安全区、触控、纹理清晰度、内存和帧率；
6. 浏览器单端或隔离双端流程可用于辅助诊断，但不能替代上述开发者工具/真机验收。

## 当前未实现

- 微信开发者工具导入与人工包体分析；
- 微信登录、原生分享/邀请令牌、`connectContainer` 双真机闭环和发布后云托管监控；
- 可见的冷启动恢复、联网牌局主动离房和返回好友房入口；好友房大厅已支持二次确认后主动离房并返回首页；
- 音频、表情 Bundle、教程 Bundle；
- Prefab、Auto Atlas 与平台纹理压缩等后续工程优化；
- 微信小游戏载体上的 Cocos 首页/大厅/牌桌视觉 QA，以及完整双真机人工测试。
