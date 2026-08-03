# Wizzard Cocos Client

正式微信小游戏客户端，目标运行时为 Cocos Creator 3.8.x 2D，设计分辨率为横版 `1920×1080`。

## 边界

- `@wizzard/game-core` 是唯一规则与比赛状态机源码；Cocos 场景不持有权威状态。
- `LocalMatchAdapter` 是默认离线开发入口；`NetworkMatchAdapter` 已提供好友房比赛接入边界，但大厅视图尚未接入 `Boot.scene`。
- 表现层只提交 Intent Draft，并消费按查看者过滤的快照与事件。
- 浏览器 `WebSocket`、`wx.connectSocket` 与各自存储 API 只存在于 `assets/scripts/platform/`，不会进入规则或表现层。
- 正式美术通过 `art/asset-manifest.json` 的语义键加载，不把文件名当作组件 API。

## 生成资源

在仓库根依赖安装完成后运行：

```powershell
npm --workspace @wizzard/cocos-client run build:core
npm --workspace @wizzard/cocos-client run sync:assets
npm --workspace @wizzard/cocos-client run typecheck
```

资源同步会生成 `assets/resources/game-art/` 和 `AssetAddresses.generated.ts`。这些文件来自仓库内正式运行时资源，不使用占位图。

## 好友房网络接入

`assets/scripts/config/MatchRuntimeConfig.ts` 明确保存当前运行模式，仓库默认值为 `local`，所以现有离线牌局不会因网络服务不可用而改变。网络构建需在 `Boot.scene` 启动前注入公开且不含秘密的 `globalThis.__WIZZARD_MATCH_RUNTIME_CONFIG__`，并显式提供：

- `ws://`/`wss://` 服务地址；真机发布必须使用后台已配置合法域名的 `wss://`；
- 创建、加入或恢复好友房的 `RoomBinding`；
- 可选 WebSocket 子协议名。

`RoomSocketClient` 负责协议校验、会话恢复、心跳、指数退避、按 `streamId/updateId` 丢弃旧消息，以及按 `ackCommandId` 确认并在重连后原样重发未确认命令。`NetworkMatchAdapter` 只把 Intent、继续下一轮和重赛请求发给服务端；`turnDeadlineAt` 仅用于显示倒计时，到零时不会在客户端代打或推进状态。

当前 `GameBootstrap` 通过 `MatchAdapterFactory` 创建默认本地适配器。正式启用好友房前还需新增大厅视图，将创建、加入、准备和房主开始流程接到同一个 `RoomSocketClient`，比赛开始后再显示 `MatchSceneView`。

## Creator 打开与构建

本项目按 Cocos Creator 3.8.8 工程格式创建。安装 Creator 后直接打开本目录，等待首次资源导入完成，再打开 `assets/scenes/Boot.scene` 预览。

微信小游戏构建模板已锁定横屏。建议先在 Creator Build 面板保存配置到 `build-config/wechatgame.json`，再使用：

```powershell
& "<CocosCreator.exe>" --project "E:\githome\Wizzard\cocos-client" --build "configPath=E:/githome/Wizzard/cocos-client/build-config/wechatgame.json"
```

当前机器未安装 Cocos Creator，因此首次编辑器导入、浏览器预览和微信构建需要在安装后完成。
