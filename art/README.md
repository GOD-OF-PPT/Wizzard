# 奇术茶馆美术资源包

本目录是编码实现前的视觉真值。所有资源均基于用户选择的第二套“奇术茶馆”方向生成，最终界面不得退回通用仪表盘、纯色占位或与本目录不一致的视觉语言。

## 目录

- `reference/`：用户选定的原始游戏牌桌方向；
- `generated/`：高分辨率源图与设计母版；
- `runtime/`：已经拆分、可直接接入客户端的第一版资源；
- `mockups/`：首页、好友房、游戏牌桌和轮次结算界面；
- `prompts/`：生成提示和关键约束，便于一致性迭代。

## 已完成资源

| 类别 | 文件 | 状态 |
| --- | --- | --- |
| 牌桌背景 | `runtime/backgrounds/teahouse-table.png` | 1920×1080，可直接使用 |
| 卡背 | `runtime/cards/card-back.png` | 已拆分 |
| 四花色卡面 | `runtime/cards/*-face.png` | 已拆分，运行时叠加数字 |
| 两张特殊牌 | `runtime/cards/highest-special.png`、`lowest-special.png` | 已拆分 |
| 六位头像 | `runtime/avatars/*.png` | 已拆分，统一椭圆金框 |
| UI 装饰 | `runtime/ui/ui-chrome-sheet.png` | RGBA 透明图集母版 |
| 反馈特效 | `runtime/ui/feedback-fx-sheet.png` | 6 组 RGBA 透明反馈效果 |
| 核心界面 | `mockups/*.png` | 首页、好友房、游戏、结算齐全 |

## 视觉规则

- 基础画幅为横版 16:9，设计稿基准 1920×1080；
- 主材质为朱漆木、米白宣纸、旧金属、午夜蓝和灯笼暖光；
- 四花色为靛蓝山、朱红结、青绿叶、赭黄日，必须同时依赖颜色和形状识别；
- UI 文字采用 `Noto Serif SC`，辅助文字采用 `Noto Sans SC`；两者均需使用允许商业/项目使用的 OFL 字体包；
- 标题“奇术茶馆”仍是工作名，正式名称确认前不制作最终品牌 Logo；
- 角色、符号和装饰均为原创方向，不得混入 Wizard/巫师牌的名称、W/J 字母、商标或既有卡面。

## 接入原则

- Cocos 中通过语义资源键加载，不从源图文件名推导游戏规则；
- 数字牌使用四张花色母版并在运行时叠加 1–13，避免重复 52 张大图；
- 头像由圆形/椭圆 Mask 裁切，暗蓝底色保留；
- UI 图集进入正式客户端前使用 TexturePacker/Cocos 自动图集生成九宫格与 SpriteFrame 元数据；
- 反馈图集依次包含合法牌光圈、选中光圈、赢墩爆发、预测命中、预测失败和重连云环；
- `generated/ui/ui-chrome-source.png` 是洋红抠图源，正式资源使用透明的 `ui-chrome-sheet.png`。

详细尺寸和资源键见 [asset-manifest.json](asset-manifest.json)。
