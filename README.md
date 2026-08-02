# Wizzard / 奇术茶馆（工作名）

面向微信好友的小范围、非商业化预测型墩牌游戏。仓库名称沿用 `Wizzard`，正式产品名尚未确定。

当前基线已经确认：

- 横版 16:9，3–6 个玩家座位；
- 好友房为主，空位可由不作弊的 AI 补足；
- 经典规则与移动端快速模式并存；
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
- [关键决策记录](docs/decisions/README.md)
- [美术资源包与界面稿](art/README.md)

选定视觉基准位于 [public/assets/selected-art-direction.png](public/assets/selected-art-direction.png)。原始规则照片保存在 `docs/reference/source-rulebook/`，仅用于规则研究与内部追溯。

## 本地运行

```bash
npm install
npm run dev
```

验证命令：

```bash
npm run typecheck
npm run build
```

## 当前阶段

项目基线与第一版美术资源包已经完成。下一阶段按“交互牌桌 → 规则引擎 → 好友房与 AI → 微信体验版”推进。
