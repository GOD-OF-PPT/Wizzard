# 网页平台迁移方案（竖屏 9:16 / 横屏 16:9）

> 状态：Draft，供迁移决策审核
> 日期：2026-10-16
> 适用范围：现有好友房、单人练习、规则页、结算和好友邀请流程
> 当前载体：Cocos Creator 3.8.8 微信小游戏
> 建议目标载体：脱离微信的内部浏览器网页，兼容移动端竖屏与横屏、桌面横屏

## 1. 结论先行

建议把 `src/` 下的 React/Vite 工程改造成正式内部网页宿主，复用 `@wizzard/game-core`、`@wizzard/room-protocol`、房间服务和语义资源；Cocos Web 保留为可选的视觉对照和备用运行时，不再把它作为网页迁移的必选依赖。

这个方案的理由是：目标是内部使用，不需要微信登录、微信分享、正式域名或微信专属渲染载体；React DOM/CSS 更适合直接处理 9:16、16:9、安全区、键盘和浏览器输入。规则、协议、权威服务和资源继续复用，Cocos 视图只作为参考实现，不阻塞网页交付。竖屏支持仍需要真实的布局重排，不能把横屏画布简单缩小或旋转。

迁移后的长期结构如下：

```text
React Web Runtime
  ├─ WebRuntimeConfig / 内部环境配置
  ├─ WebPlatformServices
  │    ├─ localStorage / sessionStorage / BroadcastChannel
  │    ├─ Clipboard / 内部邀请链接回退
  │    ├─ BrowserSocketFactory → 同源 ws /ws
  │    ├─ ViewportService → 竖屏、横屏、安全区、DPR
  │    └─ WebFrameScheduler → requestAnimationFrame / 可见性恢复
  ├─ Home / FriendRoom / Rules / Match / Results DOM 视图
  └─ MatchSession / RoomSocketClient
       ├─ @wizzard/game-core（唯一规则源码）
       └─ @wizzard/room-protocol（唯一房间协议）
            └─ 同源 WebSocket /ws
                 └─ Node.js 权威房间服务
```

迁移目标完全脱离微信平台。现有微信客户端和 Cocos 构建只作为回归基线保留，网页正式入口不加载 `wx`、不依赖 `connectContainer`，也不要求正式域名或微信登录。

### 当前实施状态（2026-10-16）

- P0：完成。已创建 `codex/web-platform-migration` 分支，冻结 React Web、匿名内网、同源 `/ws` 和 Cocos 可选的迁移方向。
- P1：完成首版骨架。已加入 `BrowserViewportService`、`FrameScheduler` 接入、匿名浏览器会话存储、浏览器 WebSocket 适配、Vite `/ws` 代理和 React 状态驱动首页/好友房入口；刷新恢复、标签页租约和完整离房确认仍在补齐。
- P2：进行中。横屏 React 牌桌继续复用现有 `MatchScreen`，好友房可连接真实房间服务；竖屏页面和房间 DOM 已具备独立重排基础，仍需逐状态视觉验收。
- 尚未完成：完整双浏览器好友房人工流程、所有 3–6 人竖屏牌桌细节、内网设备矩阵验收、标签页租约和 Cocos 可选载体的最终回归。

## 2. 迁移目标与明确边界

### 目标

1. 一个内部网页入口支持 9:16 竖屏和 16:9 横屏，并且横屏桌面浏览器可用。
2. 单人练习、创建房间、加入房间、大厅、准备、AI 管理、开始、联网牌桌、重连、重赛和返回入口保持同一套业务语义。
3. 网页继续共用 `@wizzard/game-core`、`@wizzard/room-protocol`、服务端投影和视觉资源语义键；微信和 Cocos 仅作为兼容回归面。
4. 浏览器刷新、后台恢复、网络短暂中断和重复打开标签页不会产生隐性的双重房间或错误恢复。
5. 网页构建可以在本机、局域网或内部 VPN 中独立运行和回滚，不暴露为公开互联网服务。

### 不在第一阶段做的事情

- 不把规则复制到 React、网页组件或服务器以外的新目录；
- 不为了网页重写 Node.js 权威规则服务；
- 不把微信 API、微信登录、微信分享或微信云托管地址带入网页运行时；
- 不通过缩放横版画布来冒充竖屏布局；
- 不在迁移期间改动牌局规则、房间协议语义、计分方式或好友房业务边界；
- 不把独立“漆环巡游”类目调查制品混入正式好友房网页入口。若要在网页保留它，应作为明确的隔离调查路由和独立构建配置。

## 3. 现状评估

### 可直接复用的模块

| 模块 | 当前实现 | 网页迁移处理 |
| --- | --- | --- |
| 规则 | `packages/game-core` | 原样复用，禁止平台依赖 |
| 房间协议 | `packages/room-protocol` | v1 原样复用，新增能力时版本化 |
| 权威服务 | `packages/room-server` | 保留 Node.js 权威模型，增加同源 HTTP/WS 内部入口 |
| 比赛适配器 | `IMatchAdapter`、`LocalMatchAdapter`、`NetworkMatchAdapter` | 保留接口；网页用 `requestAnimationFrame` 驱动 `update` |
| 网络客户端 | `RoomSocketClient` | 原样复用，目标为同源或局域网 `ws` |
| 浏览器 Socket | `BrowserSocketFactory` | 从诊断实现提升为生产实现 |
| 浏览器存储 | `BrowserRoomSessionStore`、`BrowserGamePreferencesStore` | 增加版本迁移、标签页租约和冲突提示 |
| Cocos 视图 | `FriendRoomView`、`MatchSceneView`、`RulesSettingsView`、`PatrolPrototypeView` | 作为视觉参考和可选 Web 构建，不阻塞网页 |
| React/Vite | `src/` 下的静态/诊断实现 | 提升为正式内部网页渲染实现 |

### 当前缺口

1. `src/` 当前主要使用图片热点和旧的诊断牌桌，需要改为状态驱动的正式网页视图。
2. `web-desktop.json` 仍是 Cocos 的单一 `1920×1080` 横版配置，应该降为可选视觉对照构建。
3. `PlatformServices` 同时承载运行时判定、存储、分享、震动和 Socket，需要拆出网页能力接口，删除网页对微信能力的依赖。
4. `RoomSocketClient` 已能使用浏览器 Socket，但内部网页需要同源 `ws://host:port/ws`；当前微信云托管私有入口不应继续作为网页入口。
5. `GameplayLayout`、`FriendRoomDialogLayout`、`RulesSettingsLayout` 等主要按横版设计坐标组织，需要增加竖屏布局族和安全区计算。
6. 浏览器会后台节流 `requestAnimationFrame`，不能把客户端帧率当作权威计时；网页必须在恢复可见时重新以服务端 `serverTime` 和快照校准。
7. 当前浏览器房间会话使用固定 localStorage 键，多标签页同时打开同一房间时可能互相覆盖，需要加入标签页租约或显式冲突提示。
8. 分享、剪贴板、震动和安装能力在普通浏览器、iOS Safari、Android Chrome 和桌面浏览器上能力不同，需要统一回退行为。

## 4. 方案比较

| 方案 | 复用程度 | 竖屏成本 | 视觉一致性 | 可访问性 | 迁移风险 | 结论 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| A. React Web 正式化 | 中 | 中 | 中，需按真值重做 | 高 | 中 | 推荐 |
| B. Cocos Web 正式化 | 高 | 中 | 高 | 中 | 中 | 可选备用 |
| C. React 外壳 + Cocos 牌桌 | 中 | 高 | 中 | 中 | 高 | 暂不采用 |

### A. React Web 正式化（推荐）

将当前 `src/` 由诊断热点实现改造成状态驱动网页应用。React 只消费 `PlayerMatchSnapshot`、`MatchUpdate`、`FriendRoomState` 和公开的布局模型；规则和网络细节由适配器隐藏。网页以 DOM/CSS 为主，直接处理竖屏、横屏、键盘、触控、滚动和安全区。

优点是无需 Cocos 和微信运行时，内网启动简单，响应式布局和可访问性更自然。代价是要把当前 React 诊断实现升级为正式牌桌，需要复用已有布局契约和资源，而不能继续使用整屏图片热点。

### B. Cocos Web 正式化（备用）

保留当前 Cocos Web Desktop 构建，增加内部 `ws` 配置后即可作为视觉对照或备用网页载体。它能最大程度复用微信视觉，但竖屏和网页交互调试成本更高，因此不作为网页主实现。

### C. React 外壳 + Cocos 牌桌

React 处理 URL、表单、规则页和大厅，Cocos 只处理牌桌。这个方案的两个状态树和两套路由同步成本最高，触控焦点、弹窗层级、返回行为和移动端安全区最容易出现跨引擎问题。除非未来明确需要网页内容站和游戏画布的独立发布周期，否则不采用。

## 5. 接口层设计

### 5.1 规则与协议接口保持不变

`@wizzard/game-core` 继续只接收规则输入并返回状态、事件和查看者快照。网页调用链与微信完全一致：表现层提交 `MatchIntentDraft`，适配器注入行动者和版本，服务端或本地权威实现执行规则。

`@wizzard/room-protocol` 的 v1 消息仍通过文本 WebSocket传输。网页迁移不把 `playerId`、完整权威状态、房间密钥或私有手牌放进 URL 或前端配置。

### 5.2 将当前平台服务拆成稳定接口

当前 `PlatformServices` 可以保留为迁移过渡层，但网页正式实现应拆成以下深模块。每个接口只描述调用者必须知道的行为、错误和生命周期。

```ts
export type WebRuntime = "web";

export type ViewportMode = "portrait" | "landscape";

export type ViewportSnapshot = Readonly<{
  cssWidth: number;
  cssHeight: number;
  devicePixelRatio: number;
  mode: ViewportMode;
  safeInsets: { top: number; right: number; bottom: number; left: number };
  reducedMotion: boolean;
  visible: boolean;
  revision: number;
}>;

export interface ViewportService {
  getSnapshot(): ViewportSnapshot;
  subscribe(listener: (snapshot: ViewportSnapshot) => void): () => void;
}

export interface FrameScheduler {
  start(callback: (timestampMs: number) => void): () => void;
  now(): number;
}

export interface PlatformCapabilities {
  clipboard: { writeText(text: string): Promise<void> };
  preferences: GamePreferencesStore;
  runtime: WebRuntime;
  sessionStore: RoomSessionStore;
  sharing: PlatformSharing;
  socketFactory: TextSocketFactory;
  viewport: ViewportService;
  frameScheduler: FrameScheduler;
  vibrateShort(): Promise<void>;
}
```

网页实现只负责浏览器能力：`window.innerWidth/innerHeight`、`visualViewport`、`ResizeObserver`、`matchMedia`、`localStorage`、`BroadcastChannel`、`navigator.clipboard`、`navigator.share`、`navigator.vibrate` 和 `WebSocket`。迁移后的正式网页模块不检测 `wx`；微信适配器只保留在旧 Cocos 回归构建中。

### 5.3 比赛适配器的迁移方式

第一阶段不改 `IMatchAdapter` 的行为契约，避免同时修改本地与联网客户端。网页宿主把它接入统一帧调度器：

```ts
const stop = platform.frameScheduler.start((timestampMs) => {
  const deltaSeconds = Math.min(
    (timestampMs - previousTimestampMs) / 1000,
    0.25,
  );
  previousTimestampMs = timestampMs;
  adapter.update(deltaSeconds);
});
```

`deltaSeconds` 只用于客户端动画、AI 演示节奏和本地适配器的调度；网络比赛的回合期限、AI 行动和重连宽限仍由服务端决定。页面从后台恢复时，网页适配器先消费最新快照，再重新建立动画时钟，不能用一段长 delta 补跑整局。

第二阶段如果需要 React 或其他网页宿主直接订阅比赛，可在 `IMatchAdapter` 上增加一个内部 `MatchSession` 包装器：

```ts
export interface MatchSession {
  getLatest(): MatchUpdate | null;
  subscribe(listener: MatchUpdateListener): () => void;
  submitIntent(intent: MatchIntentDraft): void;
  requestContinueRound(): void;
  requestRematch(): void;
  dispose(): void;
}
```

该包装器只做观察和生命周期适配，不复制规则状态，也不允许调用者直接取得 `AuthoritativeMatchState`。

### 5.4 网络传输接口

`TextSocketFactory` 已经是合适的外部接缝。网页目标新增为：

```ts
type WebSocketTarget = {
  kind: "websocket";
  url: "/ws" | "ws://127.0.0.1:8787/ws" | "ws://192.168.1.20:8787/ws";
  protocol?: "wizzard.v1";
};
```

内部网页优先使用同源 `/ws`，由同一个 Node.js HTTP 服务或本地反向代理提供静态文件和 WebSocket 升级。开发时允许 `localhost` 和局域网 IP 的 `ws://`，不要求 TLS、正式域名或公开 WSS。若以后通过 VPN 或安全隧道访问，只新增环境配置，不改变业务协议。

现有 `room.create`、`room.join` 和 `session.resume` 仍是首条业务消息。网页不把 `inviteToken` 或 `resumeToken` 放进 WebSocket URL；所有令牌只进入已校验的文本消息和本地会话存储。

网页第一阶段采用匿名访客会话，不依赖微信登录或账号系统。服务端保留 Origin、IP、连接数、房间创建速率和命令速率限制，范围只针对内部网段；以后若增加账号登录，在连接层增加 `AuthProvider`，规则 `MatchIntent` 与房间业务消息不变。

### 5.5 网页房间会话接口

浏览器 session storage 需要比当前固定 localStorage 键更严格的标签页策略：

- `localStorage` 持久化恢复令牌，支持刷新和重新打开网页；
- `BroadcastChannel("wizzard-room")` 广播房间占用和离开事件；
- 每个标签页生成 `tabId`，对同一 `roomId` 申请短租约；
- 已有标签页持有租约时，新标签页显示“房间已在其他标签页打开”，不静默抢占；
- 租约丢失、页面崩溃或浏览器关闭后，经过 TTL 才允许接管；
- 页面只保存必要的 `roomId / roomCode / playerId / resumeToken / inviteToken`，不保存完整比赛状态。

## 6. 竖屏与横屏布局方案

### 6.1 布局选择依据

布局模式由可见 CSS 视口计算，而不是由设备型号计算：

```text
aspect >= 1.20  → landscape
aspect <  1.20  → portrait
```

设计尺寸保留两套：

- 横屏：`1920×1080`，对应当前 Cocos 牌桌和好友房视觉基线；
- 竖屏：`1080×1920`，作为新的结构设计基线，不是横屏画布的旋转结果。

每套布局再根据 CSS 宽度分为 compact、regular、wide 三个密度档。布局函数只接收 `ViewportSnapshot`、玩家数、当前流程状态和语义资源键，返回可测试的矩形、顺序、可见性和触控区域。

### 6.2 横屏 16:9

横屏保留当前视觉优先级：

1. 牌桌/茶馆背景与中心比赛区域；
2. 顶部轮次、计时、王牌/预测状态；
3. 左右玩家座位和公共状态；
4. 底部本地手牌与确认操作；
5. 系统安全区和浏览器全屏提示。

当前 `GameplayLayout`、`FriendRoomDialogLayout` 和好友房大厅布局作为横屏基线，迁移时把固定坐标转为 `LayoutMetrics` 输出，保留已验收的座位、手牌、右侧动作栏和底部操作带安全间距。

### 6.3 竖屏 9:16

竖屏必须重新分配信息带：

1. 顶部安全区：返回、房间/连接状态和小型轮次信息；
2. 中上部：计时、王牌/预测状态和当前阶段提示；
3. 中央：缩放后的桌面、公共出牌区和座位核心；
4. 中下部：公共结果或当前行动提示；
5. 底部：本地手牌、主要操作和确认按钮，避开 `safe-area-inset-bottom`。

竖屏下不显示完整横向六人椭圆的所有次要装饰；保留当前行动者、公共出牌、当前回合、本人手牌和必要分数。其他玩家的次要状态可折叠为紧凑条带或可展开面板。三到六人布局必须逐一验证，不能只验证三人。

好友房竖屏采用纵向席位列表和固定底部操作区；创建/加入弹窗采用可滚动内容区和底部操作带，标题、昵称、房间码、AI/倒计时选项和动作之间保持最小 8 CSS px 间距。规则页使用单列章节导航，内容卡片与底部页码分离。

### 6.4 安全区、输入和缩放

- 根容器使用 `env(safe-area-inset-*)`，再与 `ViewportService.safeInsets` 合并；
- 视觉元素按设计坐标缩放，触控区域单独计算，移动端目标不低于 44×44 CSS px；
- 不用 CSS 拉伸小牌匾、头像或九宫格边角；需要改变比例时新增版本化资源键；
- 支持 pointer、touch、mouse 三种输入，统一转成视图内部的 pointer intent；
- 浏览器缩放、系统字体放大和横竖屏切换只触发一次布局重算，重算过程不重建 Socket 或比赛适配器；
- `prefers-reduced-motion` 开启时减少过渡和粒子，但不删除必要状态反馈；
- 低 DPR 设备以可读性和触控区域为优先，不能依赖截图尺寸判断清晰度。

## 7. 网页网络与部署方案

### 7.1 推荐拓扑

```text
http://localhost:5173                 本机开发
http://192.168.x.x:5173                局域网测试
        ├─ /assets/*                   React 静态资源
        ├─ /                          React Web 入口
        └─ /ws                        同源 WebSocket 升级
                         └─ Node.js room-server
                              ├─ @wizzard/room-protocol
                              ├─ @wizzard/game-core/authority
                              └─ Redis（需要持久化时再接入）
```

网页运行完全脱离微信云托管私有入口。内部开发和验收使用同一 Node.js 进程或本地反向代理，同时提供静态网页与 `/ws`；多设备验收使用局域网 IP，跨网络内部使用 VPN 或临时安全隧道。没有正式域名、TLS 或公网 WSS 的前置要求。

### 7.2 服务端必要改动

- `allowedOrigins` 改为 localhost、局域网测试地址和内部 VPN 地址的白名单；
- 处理反向代理的 `X-Forwarded-Proto`、真实客户端 IP 和 WebSocket upgrade；
- 健康检查保留 `GET /healthz`，增加代理层 WebSocket upgrade 冒烟检查；
- 保持现有文本帧、16 KiB 限制、心跳、幂等、`streamId/updateId` 去重和查看者快照过滤；
- 网页访客连接增加 IP/Origin/房间创建限流，日志继续禁止令牌、完整权威状态和私有手牌；
- 内部网页服务先保持单实例，Redis 只在需要跨进程保留房间时接入；
- 不将该服务暴露到公网，内网访问控制由运行主机、防火墙或 VPN 负责。

### 7.3 网页配置

网页构建不写入任何秘密，只写入公开的运行时配置：

```ts
globalThis.__WIZZARD_APP_RUNTIME_CONFIG__ = {
  startup: "home",
  friendRoom: {
    transport: "websocket",
    target: { kind: "websocket", url: "/ws", protocol: "wizzard.v1" },
  },
};
```

本机和局域网只替换这段配置及静态资源基址，不重新编译规则包。若以后接入内部 CDN，资源文件名仍由语义资源同步和内容哈希控制。

## 8. 构建、发布与回滚

### 构建产物

- `dist/` 作为 React 正式网页产物，Cocos 的 `build/web-desktop/` 作为可选视觉对照产物；
- 增加 `web-internal.json` 或同等运行时配置，保留微信构建配置但不让网页引用它；
- 构建脚本检查：入口存在、横竖屏 CSS/布局资源存在、WebSocket 目标为 `/ws` 或内网 `ws://`、不存在微信专属调用路径、资源哈希一致；
- 保留独立的 `build:wechat` 和 `build:wechat:patrol-review`，网页构建不能覆盖微信输出目录；
- 在 CI 生成 `web-build-report.json`，包含 Git SHA、协议版本、资源清单、产物大小、运行时目标和配置哈希。

### 内部发布策略

1. 先在本机启动静态网页和房间服务；
2. 再绑定局域网地址，使用第二台设备做横竖屏和双会话验收；
3. 先开放单人练习，再开放创建/加入好友房；
4. 通过内部 VPN 或临时安全隧道做跨网络验收，不把端口暴露到公网；
5. 观察连接成功率、重连成功率、房间创建失败率、异常断线率和客户端错误；
6. 回滚只切换本地/内网静态资源版本和 `/ws` 进程版本，不回滚规则协议结构。

## 9. 测试与验收门禁

### 9.1 纯函数和接口测试

- `ViewportService`：尺寸变化、DPR、safe area、`visualViewport` 缺失和 reduced motion；
- 横屏/竖屏布局：3、4、5、6 人席位，所有关键矩形无交叠，操作区不进入安全区；
- `MatchSession`/`IMatchAdapter`：订阅、释放、重赛、后台恢复和异常更新；
- `BrowserSocketFactory`：打开、关闭、错误、非文本帧、重复连接和发送失败；
- 浏览器会话存储：刷新恢复、坏数据、隐私模式、双标签页租约和租约过期；
- 房间协议：网页与现有微信回归客户端都能消费同一 v1 消息，不能出现平台分支字段。

### 9.2 浏览器集成测试

覆盖以下完整流程：

1. 网页首页 → 创建房间 → 复制/分享邀请；
2. 第二个浏览器会话加入 → 改昵称 → 准备 → AI 管理 → 房主开始；
3. 两端收到不同私有手牌、相同公共状态；
4. 王牌、叫墩、出牌、结算、重赛；
5. 刷新、切后台、恢复网络、重连、重复点击和重复 requestId；
6. 房主离房二次确认、服务端确认后返回首页；
7. 竖屏和横屏切换不重建房间、不丢失当前页面和输入。

### 9.3 设备矩阵

至少覆盖：

| 类别 | 视口/设备 | 重点 |
| --- | --- | --- |
| 竖屏窄 | 390×844、360×800 | 安全区、底部手牌、弹窗滚动 |
| 竖屏宽 | 412×915、430×932 | 信息密度和空白分配 |
| 横屏手机 | 844×390、915×412 | 横屏安全区、系统手势条 |
| 桌面 | 1366×768、1920×1080 | 16:9、缩放、鼠标输入 |
| 低端/兼容 | Safari、Chrome、Firefox | WebGL、字体、Socket、后台恢复 |

视觉验收必须把当前选定视觉稿和同一状态的网页截图放在同一个对照输入中；浏览器截图只能作为网页验收证据，不能替代服务端、弱网和跨设备流程验证。

### 9.4 性能门禁

- 首屏静态资源按页面分包，首页不预载完整牌桌资源；
- 首屏关键路径在移动网络下可测量，游戏画面稳定 30 FPS 以上，桌面目标 60 FPS；
- 单次布局重算不触发全场景销毁；
- WebSocket 心跳、重连和后台恢复不产生重复订阅或重复房间绑定；
- 内存、纹理和字体加载在 iOS Safari 长局后不持续增长；
- 构建报告记录 JS、资源、字体和总下载大小，超阈值直接失败。

## 10. 分阶段实施顺序

### P0：迁移决策与基线冻结

交付：本方案审核结论、内部运行地址策略、匿名会话策略、浏览器支持矩阵、是否保留巡游调查路由的决定。

退出条件：确认 React Web 为正式网页宿主，Cocos Web 仅为可选备用。

### P1：网页宿主和平台接口

交付：`WebRuntimeConfig`、`WebPlatformServices`、`ViewportService`、`FrameScheduler`、内部配置、同源 `/ws` 本地代理、标签页会话租约。

退出条件：网页可以启动首页、读取偏好、建立本地单人适配器、刷新后保留页面状态；匿名会话可创建和清理；旧 Cocos 构建保持可回归。

### P2：横屏网页对齐

交付：横屏 React 正式网页入口、首页、好友房、牌桌和结算的状态驱动路由；迁移现有横屏 layout contract，不再使用 React 图片热点作为正式流程。

退出条件：横屏 16:9 桌面和手机完成功能与视觉对照，单人练习完整跑通。

### P3：竖屏布局族

交付：`portrait` 版首页、弹窗、大厅、牌桌、结算和规则页；竖屏单列信息带、底部操作区、可滚动内容和安全区计算；3–6 人布局测试。

退出条件：设备矩阵中的竖屏视口无裁剪、重叠、不可点击或系统手势遮挡，横屏布局不被竖屏改动破坏。

### P4：网页好友房网络

交付：同源 `ws://` 内部代理、内网 Origin 白名单、匿名访客限流、刷新/重连/后台恢复、双标签页保护和好友房完整流程。

退出条件：两个浏览器会话在本机或局域网完成创建、加入、准备、开始、对局、重赛和离房；服务端无完整状态泄露；网页完全不依赖微信路径。

### P5：内部发布和回滚

交付：内部构建、基础安全响应头、Sourcemap 私有保存、错误监控、构建报告、回滚版本和运行手册。

退出条件：网页版本可独立回滚；网页单人练习、网页联网房和共享协议均通过回归门禁。

## 11. 主要风险和处理

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| 竖屏只做缩放 | 牌桌、手牌和操作不可读 | 建立独立 `1080×1920` 布局族，按状态验收 |
| React Web 与 Cocos 资源路径差异 | 网页白屏或资源缺失 | 构建报告检查语义键、资源基址和哈希 |
| 内网网页无法访问房间服务 | 好友房不可用 | 同源 `ws://` 代理、局域网 IP 验证和主机防火墙检查 |
| 多标签页覆盖 resume token | 错误恢复到另一房间 | BroadcastChannel + tab lease + 可见提示 |
| 后台帧率被浏览器节流 | 客户端倒计时或动画漂移 | 服务端权威时间；恢复时重新拉快照和校准 |
| iOS Safari WebGL/音频限制 | 牌桌或反馈异常 | 首屏单人流程先测，音频/震动全部有无能力回退 |
| Web 端与微信端协议分叉 | 双端状态不一致 | v1 协议保持共用，新增能力先写 schema/decoder 测试 |
| 旧 React 诊断路径被误当正式产品 | 维护两套行为 | 明确网页正式入口只指向 Cocos Web，React 只保留诊断脚本 |
| 内部端口被误暴露到公网 | 房间和匿名会话被外部访问 | 绑定内网接口、防火墙/VPN、Origin 白名单和连接限流 |
| 迁移中同时改动玩法 | 回归范围失控 | 先迁移载体和布局，再单独立项修改规则 |

## 12. 审核时需要确认的决策

1. 是否接受“React Web 正式化、Cocos Web 可选”的推荐方案？
2. 是否确认首版使用匿名访客会话，不接入微信登录或账号系统？
3. 是否确认只在本机、局域网或内部 VPN 使用，不申请正式域名、不做公网部署？
4. 是否确认网页房间服务与微信云托管脱钩，使用同源本地/内网 `ws://`？
5. 是否将“漆环巡游”作为独立调查页面保留，还是从网页正式产品中完全排除？
6. 最低浏览器范围是否为 iOS Safari、Android Chrome、桌面 Chrome/Edge/Firefox 的近两年版本？
7. 是否要求网页支持可访问性增强（键盘完整操作、屏幕阅读器语义、字体放大）作为首版门禁？

## 13. 审核通过后的第一批任务

审核通过后，第一批只做 P0/P1，不进入完整牌桌重排：

1. 冻结 `WebRuntimeConfig` 和同源 `/ws` 环境配置契约；
2. 把 `PlatformServices` 拆为网页能力模块，并把微信能力移出网页正式入口；
3. 增加 `ViewportService`、`FrameScheduler` 和横竖屏 profile 的纯接口及测试；
4. 把 React/Vite 入口改为正式网页构建，Cocos Web Desktop 保留为可选对照构建；
5. 建立本地/局域网同源 `/ws` 代理和两个浏览器会话的房间冒烟脚本；
6. 只在横屏完成首页、好友房和单人牌桌入口的正式 DOM 路由验证；
7. P1 通过后再开始竖屏布局，不在同一批次混入服务器扩容、登录和规则改动。

正式实现前，先以本文件中的推荐方案、决策项和退出条件作为评审基线。未审核通过前不迁移完整房间协议、不暴露内网服务，也不把当前 React 诊断界面直接标记为正式网页客户端。
