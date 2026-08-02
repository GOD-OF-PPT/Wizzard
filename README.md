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
npm test
npm run typecheck
npm run build
```

## 当前阶段

项目基线、第一版美术资源包、四屏交互验证原型与规则引擎核心纯函数已经完成：

- Web 原型已跑通“首页 → 好友房 → 选牌出牌 → 轮次结算 → 下一轮”；
- 已实现规则设置、邀请反馈、横屏锁定与无障碍交互状态；
- 纯 TypeScript 规则模块位于 `src/game/`，覆盖牌组、发牌、轮数、王牌、预测、合法出牌、墩胜负与计分；
- 自动测试包含全部人数与两种模式各 1,000 局的确定性发牌完整性模拟；
- 视觉验收记录见 [design-qa.md](design-qa.md)。

当前 React/Vite 版本是可丢弃的交互验证工具：页面跳转只用于确认布局、热点与反馈，不代表客户端可以自行确认出牌、赢墩或计分。正式 Cocos 客户端必须提交意图并等待权威服务端事件。

下一阶段按“动态预测/王牌面板 → 完整比赛状态机 → 好友房与 AI → Cocos 微信小游戏体验版”推进。
