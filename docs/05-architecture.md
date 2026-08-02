# 系统架构

## 不变原则

- 规则、牌序、回合、计分与比赛推进由平台无关的纯 TypeScript 核心持有；
- 渲染节点、动画对象、React 状态和微信 API 不得成为规则真值；
- 真人客户端与 AI 都只能提交意图，不能直接修改比赛状态；
- 每个查看者只获得公共状态、自己的私有手牌和自己的合法牌集合；
- 正式多人版本由服务端持有唯一权威状态。

## 当前进程内架构

```text
React 动态牌桌（验证工具）
        │ 发送 MatchIntent
        ▼
useLocalMatch 本地适配器
        │ 注入会话行动者、调用纯函数并调度 AI
        ▼
src/game/match.ts 权威比赛状态机
        │
        ├── 内部 AuthoritativeMatchState
        ├── MatchEvent[]
        └── createPlayerSnapshot(viewerId)
                    │
                    └── viewer 专属 PlayerMatchSnapshot
```

“权威”在这里描述状态所有权和接口约束：只有 `applyMatchIntent` 与带明确推进类型的 `advanceAuthoritativeMatch` 能推进状态。React 只获得事件和本地查看者快照，不再从 Hook 读取完整权威状态。当前核心仍运行在浏览器进程内，尚不是已部署的网络服务。

## 已实现模块

### 规则与比赛核心

平台无关实现位于 `src/game/`，统一从 `src/game/index.ts` 导出：

- `deck.ts`：牌组与唯一牌 ID；
- `deal.ts`：可注入随机源的洗牌与发牌；
- `rounds.ts`：经典局与 8 轮快速局轮数/手牌数；
- `trump.ts`：翻牌决定固定王牌、无王牌或发牌者选择；
- `scoring.ts`：叫墩校验、轮分和累计分；
- `trick.ts`：领出花色、合法牌和一墩胜者；
- `match.ts`：权威比赛状态、意图、事件、快照和跨墩/跨轮推进；
- `ai.ts`：只读取查看者快照并返回标准比赛意图的本地 AI。

随机源由调用方注入，便于当前本地适配器确定性重放，也允许未来服务端替换为安全随机源。

## 权威比赛状态机

当前 `MatchPhase` 为：

```text
trump-select? → bid → trick-play → trick-result
                                ├─ 未打完本轮 → trick-play
                                └─ 本轮结束 → round-score
                                                   ├─ 下一轮 → setupRound
                                                   └─ 最后一轮 → match-end
```

发牌与翻牌在 `createMatch`/`setupRound` 中作为原子状态转换完成；好友房的 `LOBBY / READY / START` 属于尚未实现的房间服务层，不混入比赛核心。

已实现的完整流程：

- 建立 3–6 人比赛并校验玩家 ID；
- 按模式生成手牌数序列并发牌；
- 翻出数字牌时固定王牌，翻出虚无牌时无王牌，翻出至高牌时由本轮发牌者选择王牌；
- 从发牌者下家开始依次叫墩；
- 按当前一墩计算合法牌，只允许当前行动者出牌；
- 收齐所有座位出牌后结算一墩，胜者成为下一墩领出者；
- 手牌耗尽后计算轮分与总分；
- 下一轮发牌者顺时针轮转；
- 8 轮快速局结束后产生并列友好的总榜与 `match-ended` 事件。

## Intent / Event 契约

### MatchIntent

当前意图类型：

- `choose-trump`；
- `submit-bid`；
- `play-card`。

每条意图都携带：

- `commandId`：幂等标识；
- `expectedVersion`：客户端基于的状态版本。

`playerId` 不属于客户端自报意图。`applyMatchIntent(state, actorPlayerId, intent)` 的 `actorPlayerId` 必须由本地适配器或正式服务端根据已认证会话注入。这样即使牌 ID 可枚举，请求体也不能冒充当前行动者。

首次成功命令的事件结果保存在权威状态的命令缓存中；同一 `commandId` 重试时重放首次结果而不再次推进状态。状态机同时稳定拒绝陈旧版本、错误阶段、非当前行动者、无效王牌、无效叫墩、找不到的牌和不合法出牌。

### MatchEvent

当前事件覆盖：

- `intent-rejected`；
- `trump-selected`；
- `bid-accepted`；
- `card-played`；
- `trick-resolved`、`trick-started`；
- `round-scored`、`round-started`；
- `match-ended`。

React 验证工具消费转换事件，并在每次权威状态变化后重新生成本地查看者快照。正式服务端必须把事件与最新查看者快照作为同一响应/广播边界，避免只靠事件恢复私有手牌或下一行动者。

## 查看者快照与隐私

`createPlayerSnapshot(state, viewerId)` 是客户端和 AI 的统一读取边界：

- 从公共状态中删除全部 `hands`、`processedCommandIds` 与命令结果缓存；
- 只公开每个座位的 `handCounts`；
- 私有状态只包含 `viewerId` 自己的 `hand`；
- 只有轮到查看者出牌时才返回自己的 `legalCardIds`；
- 玩家、卡牌、当前墩、已完成墩和计分条目均复制到查看者投影，UI/AI 不能通过共享引用污染权威状态；
- 其他玩家手牌和剩余牌库顺序不会进入查看者快照。

正式网络适配器必须在服务端调用该函数或等价过滤器，禁止把完整 `AuthoritativeMatchState` 序列化到客户端后再隐藏。

## AI 边界

- `chooseAiIntent(snapshot, commandId)` 接收与真人同结构的 `PlayerMatchSnapshot`；
- AI 选择王牌、估算叫墩和出牌后，返回标准 `MatchIntent`；
- AI 意图继续经过版本、回合、阶段和合法牌校验；
- AI 不读取其他玩家私有手牌，不绕过规则函数，不直接写状态。

当前 AI 是本地启发式验证实现，不代表最终难度或策略质量。

## 本地适配器

`src/hooks/useLocalMatch.ts` 是 Web 验证环境的临时适配器：

- 创建固定种子的六席 8 轮快速局；
- 为真人和 AI 生成命令 ID、附加当前版本，并从适配器上下文注入行动者身份；
- 在一墩展示结束后使用 `resolve-trick` 推进，在用户继续后使用 `continue-round` 推进，错误阶段不再静默跳转；
- 为每个 AI 座位生成独立查看者快照；
- 将人类查看者快照交给 React 牌桌渲染，不公开完整权威状态；
- 在 reducer 外计算带随机源的跨轮转换，并为三类玩家行动显示 30 秒倒计时与本地超时托管。

它不实现房间码、WebSocket、Redis、登录、重连或跨设备同步。正式联网阶段使用网络适配器替换该 Hook，而不是把网络逻辑写入比赛核心。

## 动态牌桌与 Cocos 迁移边界

`src/components/MatchScreen.tsx` 与 `CardView.tsx` 已经按状态动态渲染：

- 六个座位、发牌者、AI 标识和剩余牌数；
- 当前轮次、阶段、王牌与翻开牌；
- 查看者手牌扇形布局、选中状态及合法/非法反馈；
- 当前一墩、胜者反馈、叫墩面板、王牌面板；
- 轮结算、累计分和快速局总榜；
- 随当前行动、赢墩和负分切换的角色表情；
- 3–6 人查看者相对座位映射、30 秒倒计时、短横屏适配与羊皮卷结算面板。

这套 React UI 仍是验证工具，但已经避免将整屏 mockup 当作不可拆分背景。迁移到 Cocos Creator 3.8 时，可将座位、卡牌、状态条、选择面板和结算面板映射为 Prefab/Node/SpriteFrame，同时继续消费相同的快照字段和意图语义。

## 正式目标架构（尚未开始）

```text
微信小游戏 Cocos 客户端
        │ MatchIntent / 重连请求（不自报 playerId）
        ▼
Node.js + WebSocket 权威房间服务
        │
        ├── 调用 src/game 纯 TypeScript 核心
        ├── 为真人与 AI 创建查看者快照
        ├── 广播 MatchEvent / Snapshot
        └── Redis 保存活跃房间与断线恢复状态
```

WebSocket 连接在鉴权后绑定玩家身份；房间服务把该身份作为 `actorPlayerId` 注入规则核心，并在每次回复中附带该连接的最新查看者快照。

尚未开始的内容包括 Cocos 工程、WebSocket 服务、房间生命周期、Redis、微信登录/分享和线上部署。文档中的这些组件是目标边界，不是当前已交付能力。
