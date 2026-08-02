# 系统架构

## 分层原则

```text
规则引擎（纯 TypeScript）
        ↑
权威房间服务（Node.js / WebSocket / AI）
        ↑
客户端状态适配器
        ↑
微信小游戏 UI / 本地 Web 原型
```

规则状态不能由渲染节点、动画对象或微信 API 持有。服务端是多人对局的唯一权威来源。

## 当前规则模块接口

首版平台无关实现位于 `src/game/`，统一从 `src/game/index.ts` 导出。当前接口包括：

- `createDeck`、`shuffleCards`、`dealCards`；
- `getRoundHandCounts`、`resolveTrump`；
- `validateBid`、`getLegalCards`；
- `getLeadSuit`、`resolveTrickWinner`；
- `scoreBid`、`scoreRound`。

随机源由调用方注入，便于服务端使用安全随机数，也便于测试做确定性重放。渲染层不持有牌力或计分规则。

`src/App.tsx` 仅是可丢弃的视觉交互验证工具，其中的本地页面跳转不是正式游戏状态。Cocos 客户端实现必须通过客户端状态适配器提交意图，并且只根据服务端接受事件推进牌局。

## 游戏状态机

`LOBBY → DEAL → TRUMP_SELECT? → BID → TRICK_PLAY → ROUND_SCORE → MATCH_END`

每个阶段只接受明确允许的命令，非法阶段命令必须返回稳定错误码，不静默忽略。

当前已经完成各阶段依赖的核心纯函数；完整命令状态机、发牌者轮转、快照过滤与幂等命令处理仍属于下一实现切片。

## 共享领域类型

- `GameMode`：`classic | quick`；
- `Suit`：四种原创花色；
- `Card`：唯一 ID、花色、数字或特殊类型；
- `Phase`：当前状态机阶段；
- `PlayerPublicState`：昵称、座位、预测、赢墩、连接和托管状态；
- `PlayerPrivateState`：只包含当前玩家手牌；
- `TrickState`：领出者、已出牌、领出花色与胜者；
- `GameSnapshot`：按接收玩家过滤后的可恢复快照；
- `ScoreEntry`：预测、实际赢墩、本轮分数与累计分数。

## 命令与事件

客户端命令包括创建/加入房间、准备、开始、选择王牌、预测、出牌、重连和收回托管。每条命令携带 `matchId`、`playerId`、`sequence` 与唯一 `commandId`，服务端执行幂等检查。

服务端事件包括房间更新、私有发牌、阶段变化、行动接受/拒绝、墩结算、轮结算、比赛结束与快照恢复。

## AI 边界

- AI 与真人使用同一合法行动接口；
- 只能读取自己的手牌和公共事件；
- 通过未知牌随机抽样估算预测与出牌目标；
- 测试必须证明更换为 AI 座位不会得到额外私有状态。

## 数据与生命周期

- 活跃房间与断线快照保存于 Redis；
- 无操作两小时自动释放房间；
- 首版只保留必要的匿名错误日志与短期对局摘要；
- 不建立永久用户画像、商品账本、好友图谱或聊天记录。
