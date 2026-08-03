# Wizzard Cocos Client

正式微信小游戏客户端，目标运行时为 Cocos Creator 3.8.x 2D，设计分辨率为横版 `1920×1080`。

## 边界

- `@wizzard/game-core` 是唯一规则与比赛状态机源码；Cocos 场景不持有权威状态。
- `LocalMatchAdapter` 仅用于当前离线开发切片，后续由 `NetworkMatchAdapter` 替换。
- 表现层只提交 Intent Draft，并消费按查看者过滤的快照与事件。
- 正式美术通过 `art/asset-manifest.json` 的语义键加载，不把文件名当作组件 API。

## 生成资源

在仓库根依赖安装完成后运行：

```powershell
npm --workspace @wizzard/cocos-client run build:core
npm --workspace @wizzard/cocos-client run sync:assets
npm --workspace @wizzard/cocos-client run typecheck
```

资源同步会生成 `assets/resources/game-art/` 和 `AssetAddresses.generated.ts`。这些文件来自仓库内正式运行时资源，不使用占位图。

## Creator 打开与构建

本项目按 Cocos Creator 3.8.8 工程格式创建。安装 Creator 后直接打开本目录，等待首次资源导入完成，再打开 `assets/scenes/Boot.scene` 预览。

微信小游戏构建模板已锁定横屏。建议先在 Creator Build 面板保存配置到 `build-config/wechatgame.json`，再使用：

```powershell
& "<CocosCreator.exe>" --project "E:\githome\Wizzard\cocos-client" --build "configPath=E:/githome/Wizzard/cocos-client/build-config/wechatgame.json"
```

当前机器未安装 Cocos Creator，因此首次编辑器导入、浏览器预览和微信构建需要在安装后完成。
