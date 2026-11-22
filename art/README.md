# 奇术茶馆美术资源包

2026-10-29游戏封面：内置ImageGen生成的宣传母版保存在`source/covers/teahouse-game-cover-v1-master.png`，精确1920×1080交付图为`runtime/covers/teahouse-game-cover-1920x1080-v1.png`。提示词在`prompts/game-cover-teahouse-v1.txt`，尺寸/哈希/导出方式在同目录来源记录。主题诠释及核心玩法简介见`docs/86-game-introduction.md`。此封面独立交付，不替换游戏运行背景。

2026-10-29背景音乐：用户提供的两首大厅和一首对局原曲保存在`source/audio/teahouse-bgm-v1/`；128kbps双声道运行版在`runtime/audio/teahouse-bgm-v1/`。主页/好友房共用随机无连续重复歌单，对局使用专用循环曲。来源哈希、响度和导出参数在`art/music-manifest.json`，详见`docs/85-web-background-music.md`。

2026-10-29无王牌标签：`runtime/web-v3/hud-source-v1/{landscape,portrait}-trump-text-panel-v1.png`从已有ImageGen空白纸面母版导出，仅清理当前牌匾的固定前缀文字区，边框、两侧装饰和alpha保持。无花色状态改为整行实时文字居中；有花色状态继续使用原资产。来源、Chrome前后证据与构建验证见`docs/84-web-no-trump-centering.md`。

2026-10-27名签纸纹v3：`source/web-v3/name-list-parchment-v3/`保存内置ImageGen候选、保护掩膜、来源哈希与两面板前后对照。50/52/53列表双画幅源稿当前v3，`runtime/web-v3/results-name-access-v1/*-panel-v3.png`替换v2，布局/前景和完整alpha保留；边缘短线没有声称删除。当前九组源/旧Chrome/新Chrome在 `review/web-v3/name-list-parchment-v3-20261027/`，详见docs81。目录57逻辑状态×双画幅不变，整页字体/采样等P2仍未通过。

2026-10-27结算触控：48–53双画幅入口/列表稿（列表当前v2），原生成面板的清纸纹供体仅按线/菱形墨迹羽化；完整alpha/框及角落入口外源像素保护见 `source/web-v3/results-name-access-v1/provenance-v2.json`。运行四PNG与layout在 `runtime/web-v3/results-name-access-v1/`。218/219十八组对照及220真实正常练习见 `review/web-v3/results-name-access-20261027/`；字体/纹理/采样P2仍在，57逻辑状态×两画幅仅为目录，详见docs80。

2026-10-27宽字符结算：46/47双画幅（47当前v2）由内置ImageGen字形作准确复制组合，候选/提示/来源在 `source/web-v3/results-wide-names-v1/`；原面板保持，真实姓名按DOM字宽适配，运行资产新增0。213六组当前源/Chrome证据在 `review/web-v3/results-wide-names-20261027/`，详见docs79。51逻辑状态×双画幅是目录，字体/采样等P2仍未通过。

2026-10-27结算长昵称：42/43/44及45名签双画幅源稿、内置ImageGen候选/提示/组件来源保存在 `source/web-v3/results-long-name-v1/`；两个透明面板供运行时使用，姓名保持动态。203八组当前对照在 `review/web-v3/results-long-name-20261027/`，206真实房间证据另存；完整字形与采样P2仍在，49逻辑状态×两画幅仅为目录。详见docs/78。

2026-10-27结算墨色与完整负数：docs/76/77保存192原墨中位/本轮符号（20当前收据，10新全景+10有RGB依据的宏观沿用，20新局部）及198负总分八组新全景/局部。六人全负分并列41双画幅由内置ImageGen生成，`source/web-v3/results-negative-six-v1/`保留候选与数字局部合成，原07八ROI外RGB变化0。运行新JSON只供给墨色/符号几何，74PNG与两数字字库不变；完整负数aria-label已从拆分空格回归修复，194/199真实正常练习证据分层。目录44→45逻辑状态×双画幅，不是90通过。字体/覆盖/纹理/AA与其他缺稿继续未完成。

2026-10-27结算字形：docs/75与`review/web-v3/results-type-calibration-20261027/`保存186二十组全景/局部，181四组前态、被拒探针及188真实练习回首页、189真实可操作总榜。只校准名次Regular40/48与轻描边、姓名字距、横屏结算分数字号；总分保留原Bold48/54，轮次混排保留normal字距。新`runtime/web-v3/results-typography-layout-v1.json`集中登记，无新位图或字库；74结果PNG与两数字字库保持原载荷。20全景/20局部已审视，完整字形/颜色/负号/采样与缺稿仍P2，44×双画幅只是目录，整体active。

2026-10-27结算返回与焦点：docs/74与`review/web-v3/results-return-home-20261027/`保存178八组横竖全景/局部对照、177真实正常练习返回及179真实双访客离房ACK。内置ImageGen四候选均保留，06偏位候选未采用，33紧凑入口统一局部复用到06/33/34/36双画幅v2；ROI外RGB变化0。新返回在结算dialog内参与键盘循环，最终总榜沿用页脚动作；44px目标与原比例裁片由生成登记接入。原70结果PNG加四裁片为74源文件，生产内联/去重见runtimeProof。95项工程核对不代表全页通过；44设计状态×双画幅不变，字形/采样/focus/缺稿及docs66仍在。

2026-10-27结算头像下缘：docs/73与`review/web-v3/results-avatar-matte-20261027/`保存173/174七组前后原生收据。十张横屏v3仅修下缘alpha邻人弧线，原RGB与上方75%alpha变化0，共2346alpha变化；十四v2保持。五横屏全景/局部已审视、两竖屏整图RGB不变，光标/首行捕获差异显式分层。70结果PNG数量不变，十旧污染载荷不入生产，470工程核对与175正常预览保留。44设计状态×双画幅不是88通过，动态字形/源上缘/采样/其他缺稿和docs66仍未完成。

2026-10-26原稿HUD/动作：`source/web-v3/hud-source-v1/`保存26组件参考、内置ImageGen清纸/纠字候选（v1拒用、v2赤+者）、源/运行局部ROI合成和完整SHA依据。当前运行`runtime/web-v3/hud-source-v1/`为26张活动PNG，14张动作由`source-action-assets.generated.ts`登记，其中竖屏预测两张为v2，旧v1不导入。原固定字/金框/云饰/王牌前缀及dense状态牌保留源像素，花色/数据/语义动作仍实时。18个可见源状态另存`*-copy-v1.png`，34保存状态数不变。当前28全景/28局部在`review/web-v3/hud-source-calibration-20261026/`，docs/65说明132/133/135实际批次、真实手动出牌与未解整页P2/缺稿/网络。生产按字节核对为21独立PNG文件和4内联PNG（一对动作去重），不把26源文件误作26发包文件。

2026-10-26原稿座位：`source/web-v3/gameplay-seats-v1/`保存25双画幅人物/框体提取、两次内置ImageGen清字候选、内部ROI合成v2与预测阶段独立位移依据。运行`runtime/web-v3/gameplay-seats-v1/`的40裁片由`layout-v2.json`及生成的TypeScript登记接入；v1清字牌/原始候选保留历史不导入。姓名与统计仍动态，座位专用Regular文楷/Tinos字体子集和来源/许可/SHA在`source/fonts/web-v3/seat-subsets-v1.json`。当前124/126共28组对照、原生字体与真实随机练习见`review/web-v3/gameplay-seats-calibration-20261026/`及docs/64；34保存状态数不变，整体P2/缺稿/网络边界未完成。

2026-10-25恢复面板：`source/web-v3/recovery-source-v1/`保存原稿组件提取v3、四个ImageGen焦点候选/亮环v2来源、竖屏禁用首牌halo局部修订及SHA/proof。运行`runtime/web-v3/recovery-source-v1/`仅四个v3面板、四个v2环和280×95竖屏顶部原场景裁片（去空牌匾）。原动作/环外RGB、去halo的四张纸面/ROI外均受保护；独立重画/旧遮罩保留历史不入生产。新增29/30双画幅焦点源，竖29修订v3；34是保存状态数，不是68通过视图。当前117八组全景/局部、114/115真实临时大厅恢复/清会话、118图片失败焦点回退见`review/web-v3/recovery-source-calibration-20261025/`与docs/63，其他字体/头像/HUD/卡面P2和网络/缺稿仍在。

2026-10-25中央牌：`source/web-v3/trick-faces-v1/`保留中央纸面/边线/逆投影参考、8次整牌清字候选（alpha/暗斑偏差拒用）、2次不透明纸纹补片、仅数字ROI合成及proof/SHA。运行使用`runtime/web-v3/trick-cards-v1/{profile}-{suit}.png`原生140×210和`trick-layout-v1.json`；hi导出试验没有明显提升，未导入生产。手牌v5和特殊牌不变。109批16组当前对照在`review/web-v3/trick-calibration-20261025/`（取消重复圆角裁剪后复拍，105历史），见docs/62；四角贴合只关闭几何问题，字体/采样/其他家具和网络缺口仍在，设计数32不变。

2026-10-25预测四牌源坐标：10/17双画幅冻结稿直接测量为`source/web-v3/bid-hand-v1/measurements.json`，运行消费`runtime/web-v3/bid-hand-layout-v1.json`，normal/pending四牌同位，不再复用出牌pose。当前98四组联合对照在`review/web-v3/bid-hand-calibration-20261025/`，替代82对应四组；卡面采样/字体/头像/HUD/面板P2仍在，见docs/61。没有新增设计状态，仍32。

2026-10-25密集手牌：`mockups/web-v3/[portrait/]{27-dense-hand-idle-v4,28-dense-hand-selected-v4}.png`为新增双画幅设计，内置ImageGen候选/完整提示/归一化配方保存在`source/web-v3/dense-hand-v1/`及`prompts/web-v3-dense-*`。新128×192/12抬升/9让位/8偏置只服务5–8牌出牌/墩结算，四牌和modal合同不变。数字11/12源稿墨迹与原稿卡面组合，运行仍为真实rank DOM；生成特殊牌近似没有替换原资产。竖屏仅新增下部scene局部图和保留原边框的空按钮。当前四组Chrome（横90、竖93）及24原生输入证据在`review/web-v3/dense-hand-calibration-20261025/`，真实正常练习到六牌另存95。详见docs/60：32是已保存状态数，整页/其他密集状态/9–20牌/真实网络仍未通过。以下30状态与旧批次为历史。

本目录是正式编码实现使用的视觉真值。所有资源均延续用户选择的第二套“奇术茶馆 / Enchanted Teahouse”方向，界面不得退回通用仪表盘、纯色占位或与本目录不一致的视觉语言。

2026-10-25原卡面v5：`source/web-v3/cards-v5/`保存原稿逆旋转参考、八次内置ImageGen候选、仅数字/字影ROI纸纹合成及proof/SHA。源母版ROI外RGB、完整alpha和保护色区变化0；`runtime/web-v3/cards/*-v5-native.png`按横/竖分别供CardView使用，数字仍为Noto Serif动态值。v4整张生成面、4倍导出及Garamond/Tinos字体试验均留为历史/拒用，未导入当前卡牌。最新20组Chrome为 `review/web-v3/source-card-calibration-20261025/`（82），详见docs/59；docs/58另记录真实预测首帧修复。其他pose、中央透视、头像/HUD/面板P2仍未通过，设计总范围30状态×双画幅不变。

2026-10-25语义修订：竖屏10/17补齐真人计时v3，11/18双画幅去掉禁用手牌旧光圈v5。内置ImageGen提示/候选和严格局部合成哈希保存；独立强光/菱形空表盘候选拒用，未接线。当前八组Chrome对照在 `review/web-v3/semantic-state-calibration-20261025/index.html`，docs/57记录真实30→29与无计时分支的范围。八组更新取代上一批对应组；总清单仍30状态×两画幅，整页字体/卡面/头像/HUD等仍P2，计时切换首帧待定向复核。

2026-10-25选牌更新：新增25未选和26选中完成、14无计时v4与19pending v2的独立双画幅源稿。来源是ImageGen局部修补+原稿卡面合同几何合成，配方在 `prompts/web-v3-selection-geometry-v2-recipe.md`，完整哈希/测量在 `source/web-v3/selection-geometry-v2*`。当前八组Chrome全景/无损聚焦见 `review/web-v3/selection-calibration-20261025/index.html`，docs/55记录144项输入和真实练习动效边界；同目录affected/的64批次十二组补齐其他共用手牌页的当前证据，docs/56记录未解的源稿语义/面板/牌面P2。清单30状态×双画幅；四牌几何对齐不等于卡面/字体/头像/HUD通过，整页仍有P2。以下旧数量/源稿是历史检查点。

2026-10-25：新增加入短码、空昵称、键盘焦点三种独立双画幅ImageGen稿22/23/24，新增外围/提示裁片及字段合同。当前十组Chrome对照在 `review/web-v3/join-states-20261025/index.html`，详见docs/54。数字遮罩缩到字形范围，保留原纸纹；空码和正常六位码均已复拍。清单现29状态×双画幅，整体仍未通过；下文6组/26状态为前一检查点。当前开关接线使用 `switches/` 下原稿裁片，manifest已纠正旧opaque-v3接线说明，设置页视觉未在本轮重新验收。

2026-10-24 接续：创建、加入和新空昵称校验的六组Chrome同态证据在 `review/web-v3/entry-calibration-20261024/index.html`，详情 `docs/53-web-v3-entry-calibration.md`。原稿框/勾/光晕仅文字ROI清理，原稿清除图标裁片、独立21校验稿、数字字集及许可已保存并接入。该精选证据目录通过明确gitignore例外保留；不依赖下文历史大归档。现为26状态×双画幅，其中6组本轮更新，其他46组沿用10-21及其P2；整体仍未通过。下面50组描述为上一批次。

2026-10-21当前验收：`review/web-v3/50-index-20261021.html`包含25状态×双画幅共50组当前Chrome设计/实现对照，原缺失8组已补齐。逐页P2、144项当前原生命中及真实多标签边界见`docs/43-web-v3-chrome-current-calibration.md`。像素级一致仍未通过；下段旧数量与阻塞为2026-10-20历史。

当前内部浏览器载体以 `mockups/web-v3/` 逐页设计、`web-v3-manifest.json` 和 `docs/18-web-v3-design-and-interaction.md` 为准。最新竖屏牌桌使用 `05-gameplay-safe-v2.png`、无倒计时使用 `14-gameplay-notimer-safe-v3.png`，避免原稿动作牌匾压住末张手牌。大厅使用人数/准备文案一致的 `04-lobby-{waiting,ready}-v2.png` 两状态；旧稿另存，不修改服务端权限迁就旧稿。当前25状态×两画幅清单入口为 `review/web-v3/42-index-20261020.html`；已有48组Chrome截图中，6组因选牌位移修复降为历史、待重拍，42组保留当前对照。新增多标签保护2组实拍缺失，整体仍未通过，详见 `docs/42-web-v3-current-acceptance.md` 和根目录 `design-qa.md`。竖屏选择使用 `11-chooser-no-play-v4.png` / `18-chooser-pending-no-play-v4.png` 的语义修订，横屏恢复/终止使用network-v2/v3；旧稿保留。以下旧 `passed` 只适用于各自历史资源或小游戏范围，不代表Web v3通过。

## 目录

2026-10-28 音效设计：新增 ElevenLabs SFX v2 原创音效 16 类、64 个原始候选。`audio-manifest.json` 保存提示词、来源、SHA-256、技术测量和触发合同；`source/audio/teahouse-v1/` 保存原始候选，`selection-v1.json` 保存用户委托 Codex 选定的16个版本；`runtime/audio/teahouse-v1/` 保存选定成品与候选，`review/audio/teahouse-sfx-v1.html` 是独立试听页。选定基于波形、频谱与用途匹配，不冒充人工听感验收；16类已接入网页，支持设置页/M静音、权威状态触发与恢复静默；Chrome证据在 `review/audio/integration-20261028/`，Cocos/微信未接入。详见 `docs/83-teahouse-sound-design.md`。

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

此次推送将原先未跟踪的 1,723 份截图、对比图与复核记录保存为 [GitHub 草稿发布 `web-v3-evidence-20261024`](https://github.com/GOD-OF-PPT/Wizzard/releases/tag/untagged-302f2751fa75a896551d) 的分卷 tar 附件，避免把约 2.69 GB 的复核输出加入 Git 历史。正式源图、运行资源、页面设计稿和原有已跟踪证据仍随发布分支提交；本地原始文件完整保留。

[归档清单](review/web-v3/evidence-archive-20261024.json) 记录每个文件的原路径、字节数、SHA-256 和所属分卷，以及各分卷的校验值。恢复时下载全部分卷，校验 SHA-256 后在仓库根目录逐个解包，原相对路径即可恢复。草稿附件仅仓库协作者可访问。

此归档只证明证据已保存，不改变 `design-qa.md` 中的验收结论和剩余差异。
