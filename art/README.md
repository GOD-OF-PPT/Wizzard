# 奇术茶馆美术资源包

本目录是正式编码实现使用的视觉真值。所有资源均延续用户选择的第二套“奇术茶馆 / Enchanted Teahouse”方向，界面不得退回通用仪表盘、纯色占位或与本目录不一致的视觉语言。

2026-10-21当前验收：`review/web-v3/50-index-20261021.html`包含25状态×双画幅共50组当前Chrome设计/实现对照，原缺失8组已补齐。逐页P2、144项当前原生命中及真实多标签边界见`docs/43-web-v3-chrome-current-calibration.md`。像素级一致仍未通过；下段旧数量与阻塞为2026-10-20历史。

当前内部浏览器载体以 `mockups/web-v3/` 逐页设计、`web-v3-manifest.json` 和 `docs/18-web-v3-design-and-interaction.md` 为准。最新竖屏牌桌使用 `05-gameplay-safe-v2.png`、无倒计时使用 `14-gameplay-notimer-safe-v3.png`，避免原稿动作牌匾压住末张手牌。大厅使用人数/准备文案一致的 `04-lobby-{waiting,ready}-v2.png` 两状态；旧稿另存，不修改服务端权限迁就旧稿。当前25状态×两画幅清单入口为 `review/web-v3/42-index-20261020.html`；已有48组Chrome截图中，6组因选牌位移修复降为历史、待重拍，42组保留当前对照。新增多标签保护2组实拍缺失，整体仍未通过，详见 `docs/42-web-v3-current-acceptance.md` 和根目录 `design-qa.md`。竖屏选择使用 `11-chooser-no-play-v4.png` / `18-chooser-pending-no-play-v4.png` 的语义修订，横屏恢复/终止使用network-v2/v3；旧稿保留。以下旧 `passed` 只适用于各自历史资源或小游戏范围，不代表Web v3通过。

## 目录

- `reference/`：选定的原始牌桌方向；
- `source/`：正式高分辨率母版；
- `runtime/`：Cocos Creator 3.8 直接导入的运行时资源；
- `mockups/`：首页、好友房、游戏牌桌和轮次结算视觉真值；
- `review/`：卡牌、头像、教程和界面的验收联系表；
- `prompts/`：生成提示、身份锚点与返修记录。

## 最终通过资源

| 类别 | 正式源文件 | 运行时文件 | 状态 |
| --- | --- | --- | --- |
| 首页背景 | `mockups/home-screen.png`，设计真值 | `runtime/backgrounds/home-screen-hd.png`，1920×1080 无损 PNG | passed |
| 网页竖屏首页 | ImageGen 依据首页真值重排的 9:16 网页母版 | `runtime/backgrounds/home-screen-portrait-v1.png`，941×1672 | selected for internal web |
| 网页 PC 首页 v2 | ImageGen v2 设计稿首页独立浏览器母版 | `runtime/backgrounds/home-screen-web-pc-v2.png`，1672×941 | selected for internal web |
| 首页小游戏超宽母版 | 单张连续茶馆场景；中央保留 16:9 核心信息，右上预留微信胶囊安全区 | `runtime/backgrounds/home-screen-wechat-ultrawide.png`，2560×1080 | passed |
| 牌桌背景 | — | `runtime/backgrounds/teahouse-table.png`，1920×1080 | passed |
| 网页 PC 好友房背景 v2 | ImageGen v2 独立好友房场景母版 | `runtime/backgrounds/friend-room-web-pc-v2.png`，1672×941 | selected for internal web |
| 网页 PC 牌桌背景 v2 | ImageGen v2 独立牌桌场景母版 | `runtime/backgrounds/gameplay-web-pc-v2.png`，1672×941 | selected for internal web |
| 巡游玩法选定稿 | `mockups/patrol-gameplay-screen-v1.png`，方案 1“漆环巡游”视觉真值 | — | selected |
| 巡游双环赛道 | `source/patrol/patrol-track-scene-v1-master.png` | `runtime/patrol/patrol-track-scene-v1.png`，1920×1080 | passed |
| 巡游旅者 | `source/patrol/travelers/*-v1-master.png`，3 个原创角色 | `runtime/patrol/travelers/*-v1.png`，384×384 RGBA | passed |
| 巡游茶灵、控制栏与拖尾 | `source/patrol/{collectibles,ui,fx}/` | `runtime/patrol/` 下 256×256 茶灵、1920×240 控制栏、512×128 拖尾 | passed |
| 七张卡牌 | `source/cards/*.png`，1024×1536 | `runtime/cards/*.png`，256×384 | passed |
| 六角色四表情 | `source/avatars/<character>/*.png`，1024×1024 | `runtime/avatars/<character>/*.png`，512×512 | passed |
| 规则提示插图 | `source/tutorial/rule-hint-illustration.png`，1536×1024 | `runtime/tutorial/rule-hint-illustration-hd.png`，1536×910，金框外透明 | passed |
| 三组教程手势 | `source/tutorial/{bid-tap,card-drag,play-confirm}-strip.png` | 每组 4 帧透明 PNG，单帧 256×256 | passed |
| UI 装饰与反馈 | — | `runtime/ui/*.png`，RGBA | passed |
| 规则/设置专用漆框 | `source/ui/rules-settings-panel-master.png` | `runtime/ui/rules-settings-panel.png`，1840×1000，整图显示 | passed |
| 规则正文/牌例专用卡 | `source/ui/rules-{text,visual}-panel-master.png` | `runtime/ui/rules-{text,visual}-panel.png`，680×333，整图显示 | passed |
| 设置项专用卷轴 | `source/ui/settings-row-master.png` | `runtime/ui/settings-row.png`，820×116，中央无装饰，整图显示 | passed |
| 牌桌预测/已赢状态牌 | `source/ui/gameplay-stat-{paper,green}-master.png` | `runtime/ui/gameplay-stat-{paper,green}.png`，600×168，最终比例 SIMPLE | passed |
| 轮次结算专用面板 | `source/ui/round-results-panel-master.png` | `runtime/ui/round-results-panel.png`，1710×920，标题/表头/六行/页脚固定分带，整图显示 | passed |
| 轮次结算操作按钮 | `source/ui/score-button-{paper,green}-master.png` | `runtime/ui/score-button-paper.png`、`runtime/ui/score-button-green-v2.png`，最终比例 SIMPLE；绿色按钮使用版本化路径防止小游戏旧纹理缓存 | passed |
| 好友房创建/加入弹窗 | `source/ui/friend-room-{create,join}-panel-master.png` | `runtime/ui/friend-room-{create,join}-panel-v2.png`，最终比例高清 SIMPLE；无烘焙文字与控件，版本化路径防止小游戏旧纹理缓存 | passed |
| 好友房输入与 AI 行 | `source/ui/friend-room-blue-row-master.png` | `runtime/ui/friend-room-{input,code,ai}-row-v2.png`，最终比例高清 SIMPLE；中央无花饰，不遮挡动态文字 | passed |
| 微信分享卡片 | `source/social/wechat-share-card-v1.png`，1400×1120 | `runtime/social/wechat-share-card-v1.jpg`，800×640、5:4；构建时复制到小游戏包根目录 | passed |
| 巡游评审分享卡片 | `source/social/patrol-share-card-v2.png`，1400×1120 | `runtime/social/patrol-share-card-v2.jpg`，800×640、5:4；仅由巡游评审构建复制为 `share-card-patrol-v2.jpg` | passed |
| 中文字体 | `source/fonts/` 字符集、来源与 OFL 许可证 | `runtime/fonts/NotoSerifSC-SemiBold-Subset.ttf`、`NotoSansSC-Medium-Subset.ttf` | passed |
| 核心界面 | — | `mockups/*.png` | passed |

卡牌中的数字牌继续由四张花色母版与界面层数字 1–13 组合，不为 52 张牌重复导出整张位图。

## 最终返修记录

- 首页运行时背景由低码率 JPEG 升级为 1920×1080 无损 PNG，并在保持原设计构图的前提下进行克制锐化，避免标题和人物边缘在高密度屏幕上发虚。
- 规则提示插图升级到 1536×910 的高密度运行时版本，继续沿用原有透明遮罩和金框外透明边界。
- 规则提示插图的运行时版本已裁去金框外暗色底板并改为透明边界，规则页直接显示正式插图，不再出现矩形底色或重复套框。
- 卡背、结牌和至高牌完成局部返修，清理不一致的装饰细节并保持卡框、留白与构图统一；返修结果已收敛到稳定的正式母版文件名。
- 六角色四表情母版已按独立象限裁切，所有中央分隔线均从源文件与运行时文件中清除。
- 头像在 160×160 显示尺寸下复验通过；允许思考表情使用轻微托腮或头部姿态，但身份、金框、暗蓝底和光照必须稳定。
- 三组教程手势均为 4 帧透明动画。`card-drag` 保持同一只手、同一姿态和同一光照，每帧内容固定平移 `(+33, -8)` 像素，形成匀速向右上拖动，不应再叠加不一致的逐帧缩放或旋转。
- 创建/加入好友房不再把 482×234 通用漆框九宫格放大为整张弹窗。两种高度分别使用最终比例高清底板，动态标题、头像、表单和按钮继续由运行时绘制。
- 昵称、房间码和 AI 自动补位改用三个最终比例蓝色长条，端部金饰保持清晰，中央 75% 只保留安静的靛蓝纹理。

## 视觉规则

- 基础画幅为横版 16:9，设计稿基准 1920×1080；
- 主材质为朱漆木、米白宣纸、旧金属、午夜蓝和灯笼暖光；
- 四花色为靛蓝山、朱红结、青绿叶、赭黄日，必须同时依赖颜色和形状识别；
- 标题与展示文字采用 `runtime/fonts/NotoSerifSC-SemiBold-Subset.ttf`（`font.display`），界面与辅助文字采用 `runtime/fonts/NotoSansSC-Medium-Subset.ttf`（`font.interface`）；字符范围、来源、SHA-256 与 SIL OFL 1.1 许可证见 [`source/fonts/README.md`](source/fonts/README.md)；
- 标题“奇术茶馆”仍是工作名，正式名称确认前不制作最终品牌 Logo；
- 角色、符号和装饰均为原创方向，不得混入 Wizard/巫师牌名称、W/J 字母、商标或既有卡面。

## Cocos Creator 3.8 接入原则

- 仅通过 [`asset-manifest.json`](asset-manifest.json) 中的语义资源键加载资源，不从文件名推导游戏规则；
- 卡牌、头像、教程插图和手势帧默认锚点均为 `(0.5, 0.5)`；手势动画保持相同锚点，避免逐帧跳动；
- 自动图集关闭旋转，建议 `2048×2048`、4 px padding、2 px extrude；
- 不透明卡牌与头像优先使用 ASTC 6×6，背景可使用 ASTC 8×8；透明 UI、FX 与手势优先使用 ASTC 4×4，低兼容设备回退 ETC2 或 RGBA8888；
- 2D 界面默认关闭 mipmap，使用 linear 过滤；透明资源关闭裁边，防止动画锚点和光效边缘漂移；
- 面板、卷轴、状态牌和计分带按清单中的 inset 建立九宫格；圆形按钮、头像框和特效不得九宫格拉伸；
- 头像保留暗蓝底，使用圆形或椭圆 Mask 显示，不执行自动 trim；
- `card-drag` 直接按四帧序列播放既有一致位移，不额外改变 SpriteFrame 锚点。

## 同步到 Cocos Creator

使用仓库脚本将 manifest 中的稳定语义资源复制到 Cocos 的 `resources/game-art` 目录，同时生成 `AssetKey`、`ASSET_KEYS`、`ASSET_ADDRESSES` 和同步报告：

```powershell
node tools/sync-cocos-assets.mjs cocos-client/assets/resources/game-art --dry-run
node tools/sync-cocos-assets.mjs cocos-client/assets/resources/game-art
node tools/sync-cocos-assets.mjs --target cocos-client/assets/resources/game-art --generated-ts cocos-client/assets/scripts/assets/AssetAddresses.generated.ts --core-only
```

完整模式固定同步 85 张非重复图片与 2 个字体。脚本会排除 6 张与各角色 `normal.png` 内容相同的顶层头像，以及 `ui-chrome-sheet.png`、`feedback-fx-sheet.png` 两张尚未切片的合成图。当前可玩切片使用 `--core-only`，同步 3 张背景、7 张巡游资源、7 张卡牌、6 张常态头像、1 张规则提示插图、31 张 UI/FX 和 2 个字体，共 55 张图片与 2 个字体；它不会删除目标目录中以前同步的文件。

目标目录通常为 `<cocos-project>/assets/resources/game-art`。同步报告位于目标目录的 `_generated/`；TypeScript 默认也写入该目录，可用 `--generated-ts` 指向 Cocos 的脚本目录。图片地址不含扩展名并以 `/texture` 结尾；`AssetRegistry` 将 Creator 默认导入的 `Texture2D` 包装为 `SpriteFrame`。字体地址同样不含扩展名，可直接交给 Cocos `resources.load`。

详细路径、语义键、尺寸、锚点、九宫格与压缩建议见 [asset-manifest.json](asset-manifest.json)。

## Web v3 复核证据归档（2026-10-24）

此次推送将原先未跟踪的 1,723 份截图、对比图与复核记录保存为 GitHub 草稿发布 `web-v3-evidence-20261024` 的分卷 tar 附件，避免把约 2.69 GB 的复核输出加入 Git 历史。正式源图、运行资源、页面设计稿和原有已跟踪证据仍随发布分支提交；本地原始文件完整保留。

[归档清单](review/web-v3/evidence-archive-20261024.json) 记录每个文件的原路径、字节数、SHA-256 和所属分卷，以及各分卷的校验值。恢复时下载全部分卷，校验 SHA-256 后在仓库根目录逐个解包，原相对路径即可恢复。草稿附件仅仓库协作者可访问。

此归档只证明证据已保存，不改变 `design-qa.md` 中的验收结论和剩余差异。
