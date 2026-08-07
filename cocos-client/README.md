# Wizzard Cocos Client

正式微信小游戏客户端，目标运行时为 Cocos Creator 3.8.8 2D，设计分辨率为横版 `1920×1080`。

## 边界

- `@wizzard/game-core` 是唯一规则与比赛状态机源码；Cocos 场景不持有权威状态。
- 默认启动页是好友房首页，可创建/加入房间或进入单人练习。
- `FriendRoomController` 只处理房间协议状态；`NetworkMatchAdapter` 只提交比赛 Intent；表现层消费按查看者过滤的快照与事件。
- 大厅、联网牌桌和重赛返回复用同一个 `RoomSocketClient`，不会在开局时重新建房或恢复会话。
- 浏览器 `WebSocket`、`wx.connectSocket`、存储与剪贴板 API 只存在于 `assets/scripts/platform/`，不会进入规则或表现层。
- 正式美术通过 `art/asset-manifest.json` 的语义键加载，不把文件名当作组件 API。

## 生成资源与静态检查

在仓库根依赖安装完成后运行：

```powershell
npm run cocos:prepare
```

该命令会构建 `@wizzard/game-core` 与 `@wizzard/room-protocol`、同步正式美术资源并执行 Cocos TypeScript 检查。核心切片固定为 43 张 PNG 和 2 套精简字体；资源同步生成 `assets/resources/game-art/`、`AssetAddresses.generated.ts` 与同步报告，不使用占位图。

首页“规则与设置”使用正式 `tutorial.ruleHint`、卡牌和九宫格面板渲染四章规则手册。体验设置以 `wizzard.client-preferences.v1` 独立保存在浏览器 `localStorage` 或微信同步存储中，当前真实控制合法牌高亮和轮到本人行动时的轻震提示，不提供尚未接入音频资源的假音效开关。

## 好友房网络接入

`assets/scripts/config/MatchRuntimeConfig.ts` 保存应用级公开配置。仓库默认打开好友房首页并连接本地 `ws://127.0.0.1:8787/ws`；只有玩家点击创建或加入后才建立 Socket，“单人练习”仍使用 `LocalMatchAdapter`。

`LocalMatchAdapter` 默认在每次进入练习或本地重赛时生成新的会话种子，因此牌序会变化。由于快速模式第一轮只向玩家展示一张手牌，若新牌序碰巧与上一局首手完全相同，正式练习入口会在 16 次上限内重新生成；测试与故障重放可注入固定种子源并默认关闭该保护，继续保持确定性。

生产构建可在 `Boot.scene` 启动前注入不含秘密的配置：

```ts
globalThis.__WIZZARD_APP_RUNTIME_CONFIG__ = {
  startup: "home",
  friendRoom: {
    endpoint: "wss://game.example.com/ws",
    // protocol: "optional-subprotocol",
    // initialBinding: { type: "resume" },
  },
};
```

- 真机发布必须使用微信后台已登记合法域名的 `wss://` 地址；
- `initialBinding` 可选，用于邀请令牌深链、预填创建/加入或已有会话恢复；
- endpoint、房间码和邀请定位不是秘密，但登录凭证与服务端密钥不能注入客户端配置。

`RoomSocketClient` 负责协议校验、会话恢复、心跳、指数退避、按 `streamId/updateId` 丢弃旧消息，以及按 `ackCommandId` 确认并在重连后原样重发未确认命令。`FriendRoomController` 持续订阅这个实例；开局时 `NetworkMatchAdapter` 以非拥有模式接入，比赛结束重赛后再由控制器收到 `lobby + match:null` 并切回大厅。

## 本地人工测试

终端 A 在仓库根启动权威好友房服务：

```powershell
npm run room:dev
```

终端 B 通过 Cocos Dashboard 使用 Creator 3.8.8 打开仓库中的 `cocos-client/` 工程。

在 Creator 中打开 `assets/scenes/Boot.scene` 并使用浏览器预览。

最短冒烟路径：创建 3 人快速局 → 房主准备 → 保持 AI 补位开启 → 开始游戏。双客户端测试时，把预览 URL 分别放入普通窗口和无痕窗口（或两个浏览器），避免同源 `localStorage` 覆盖双方恢复令牌：

1. A 创建房间并复制房间码，B 输入不同昵称加入；
2. A、B 都准备，A 开启 AI 补位并开始；
3. 确认两端自动进入联网牌桌、公开状态一致、私有手牌不同；
4. 完成自己的王牌/叫墩/出牌操作，并确认倒计时归零后只等待服务端推进；
5. 短暂离线再恢复，确认重连到同一局；
6. 完成快速局并由房主重赛，确认回到原大厅且房间码不变。

## Creator 打开与构建

当前机器已安装 Cocos Creator 3.8.8，工程已完成首次资源导入，并通过仓库内的可复现配置成功生成：

- `build/web-desktop/`：`1920×1080` Web Desktop release 构建；
- `build/wechatgame/`：微信小游戏 release 构建，生成的 `game.json` 已确认 `deviceOrientation: landscape`。

配置入口分别为 `build-config/web-desktop.json` 与 `build-config/wechatgame.json`。Web Desktop 也可在 Creator 的“项目 → 构建发布”中选择 `Web Desktop`、加入 `Boot.scene` 后重新构建。

微信小游戏模板 `build-templates/wechatgame/game.json` 与构建配置均已锁定横屏，可在仓库根重复执行：

```powershell
npm run cocos:build:wechat
```

`build-templates/wechatgame/game.js` 保留真机原生 2×/3× 设备像素比，并只在微信开发者工具横版模拟器错误报告 1× 时把帧缓冲提升到 2×。这用于消除模拟器中全页面同时出现的锯齿；正式背景为 1920×1080、头像为 512×512、卡牌为 256×384，Cocos 导入纹理均使用线性采样，因此不需要用重复生成美术资源来掩盖低分辨率帧缓冲问题。

Creator 在当前环境中可能在日志已经出现 `build Task (wechatgame) Finished` 后仍返回退出码 `36`；验收命令行构建时应同时检查完成日志、输出目录和生成的 `game.json`，不能只依据进程退出码。

当前微信 release 构建目录为 12,257,592 bytes（约 11.69 MiB）。它足以验证本地构建链路，但仍超过可直接上传的首包预算；微信开发者工具包体分析、纹理压缩、Auto Atlas、Asset Bundle/分包和重新测量是发布阻断项。

当前尚未完成微信开发者工具导入、双客户端完整人工闭环、原生登录/分享、合法 `wss://` 部署、冷启动恢复入口、真机联调，以及 Prefab/Auto Atlas/纹理压缩/分包和 Cocos 视觉 QA。
