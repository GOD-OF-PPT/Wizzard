# Cocos Creator 客户端实施记录

状态：**离线动态牌桌首切片已实现，Creator 编辑器验证待执行。**

## 工程选择

- 路径：`cocos-client/`
- 目标：Cocos Creator 3.8.x 2D，项目元数据固定为 3.8.8；
- 静态类型：使用 `@cocos/creator-types@3.8.7`，该包是当前可获得的最新 3.8 官方声明，与 3.8.8 API 兼容；
- 设计分辨率：`1920×1080`，运行时采用固定高度横屏适配；
- 微信模板：`build-templates/wechatgame/game.json` 设置 `deviceOrientation=landscape`。

当前机器没有安装 Cocos Dashboard/Creator。官方不提供受支持的命令行空项目创建参数，因此本工程依据官方 3.8 工程格式和公开 3.8 项目样例初始化；真实资源导入、浏览器预览和微信小游戏构建必须在安装 Creator 后补验。

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
        └── MatchSceneView
                 │ MatchIntentDraft
                 ▼
           IMatchAdapter
                 │
                 └── LocalMatchAdapter（当前）
                           │
                           └── @wizzard/game-core/authority
```

- `GameBootstrap`：横屏适配、资源预载、适配器和视图生命周期；
- `IMatchAdapter`：表现层唯一比赛入口，隐藏命令 ID、版本与行动者身份；
- `LocalMatchAdapter`：固定种子、AI、30 秒托管、赢墩展示和跨轮推进；
- `MatchSceneView`：只持有选中牌、预测草稿和反馈文案等表现状态；
- `CardView` / `PlayerSeatView`：可在编辑器验证后保存为 Prefab 的组件边界；
- `UiFactory`：统一 Node、Sprite、Label、九宫格面板和按钮创建。

## 已跑通的离线流程

1. 六席快速局创建；
2. 翻出至高牌时由发牌者选择王牌；
3. 全员依次预测赢墩数；
4. 只高亮查看者合法牌，选中后确认出牌；
5. AI 只读取自己的查看者快照并通过同一 Intent 入口行动；
6. 一墩完成后展示胜者并由权威层推进；
7. 手牌耗尽后显示本轮预测、赢墩、轮分和总分；
8. 继续下一轮，完成全部 8 轮并显示总榜；
9. 重新开始固定种子的本地练习局。

`cocos-client/test/LocalMatchAdapter.test.ts` 已从适配器公开接口驱动完整 8 轮，确认 Cocos seam 不需要读取完整权威状态。

## 资源同步

`tools/sync-cocos-assets.mjs` 读取 `art/asset-manifest.json`，校验资源数量、重复文件、SHA-256 和路径后生成：

- `cocos-client/assets/resources/game-art/`：首切片资源副本；
- `cocos-client/assets/scripts/assets/AssetAddresses.generated.ts`：语义键与 `resources.load` 地址；
- `cocos-client/assets/resources/game-art/_generated/asset-sync-report.md`：同步报告。

首切片为 31 张 PNG + 2 套精简字体，包括：背景、7 张卡牌、6 张 normal 头像、11 个 UI、6 个反馈 FX 和字体。角色其他表情、教程插图与手势仍保留在完整清单中，待 Creator Asset Bundle/微信分包阶段接入。

字体来自本机 Noto Sans SC / Noto Serif SC 变量字体，已转换为项目文案所需的静态子集，并保留 SIL OFL 许可证和来源说明。

## 安装 Creator 后的验证顺序

1. 安装 Cocos Creator 3.8.8；
2. 在仓库根运行 `npm run cocos:prepare`；
3. 用 Creator 打开 `cocos-client/`，等待首次资源导入并提交生成的图片/字体 `.meta`；
4. 打开 `assets/scenes/Boot.scene`，设为启动场景；
5. 浏览器预览完整 8 轮；
6. 为卡牌、头像、UI/FX 创建 Auto Atlas，并按 manifest 配置禁旋转、禁 trim、padding 与压缩；
7. 把表情和教程资源设为 Asset Bundle / 微信小游戏分包；
8. 从 Build 面板保存微信构建 JSON，再执行命令行构建；
9. 在微信开发者工具与真机检查横屏、安全区、触控和内存。

## 当前未实现

- `NetworkMatchAdapter` 与 WebSocket；
- 好友房创建/加入/准备/AI 补位；
- Redis、断线恢复和服务端计时；
- 微信登录、分享令牌与云托管；
- 音频、表情 Bundle、教程 Bundle；
- Creator 编辑器视觉 QA、微信开发者工具和真机测试。
