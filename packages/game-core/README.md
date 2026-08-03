# `@wizzard/game-core`

Wizzard 的唯一规则源码包。这里不依赖 React、Cocos Creator、微信 API、Canvas 或网络实现。

## 公开入口

- `@wizzard/game-core`：牌组、发牌、墩判定、计分、AI 决策等通用规则。
- `@wizzard/game-core/contracts`：客户端与权威层共享的稳定类型，以及 `SUITS` 常量。
- `@wizzard/game-core/authority`：创建对局、处理 Intent、生成玩家快照和推进权威状态。

## 构建

在仓库根目录运行 `npm run build:core`。产物写入 `packages/game-core/dist/`，包含标准 ESM、源码映射和完整 TypeScript 声明；Cocos Creator 客户端应消费包入口指向的 `dist`，而不是复制本目录源码。
