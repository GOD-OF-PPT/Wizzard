# Web v3：原卡面v5与动态数字

日期2026-10-25。接续[58真人计时首帧](58-web-v3-countdown-first-frame.md)及57的语义修订。原全目标继续active；本轮有功能修复、八张原卡面资源和20组当前Chrome对照，**整体仍未通过**。

## 来源、ImageGen与保护范围

冻结原稿未修改：`art/mockups/web-v3/05-gameplay-final.png`及`portrait/05-gameplay-safe-v2.png`。当前各状态继续沿用其独立版本，未用实现截图反改设计。

`tools/extract-web-source-card-refs-v5.mjs`使用原稿独立测量的卡心/角度/凸包逆旋转提取四花色双画幅参考，逻辑框140×210，工作母版560×840。来源/参考SHA、原数字边界和清理ROI在`art/source/web-v3/cards-v5/reference-provenance.json`。

八条内置ImageGen完整提示为`art/prompts/web-v3-card-v5-{landscape,portrait}-{leaf,mountain,knot,sun}-rank-clean.md`；原始候选保存在`art/source/web-v3/cards-v5/`。候选整体细节及alpha有漂移，未整张替换。直接合数字区仍有浅字影，最终从候选上方经检查的安静纸区取纹，合入原字及外侧字影范围，保护邻近有色角纹/符号并匹配边界纸色。

`tools/compose-web-source-card-faces-v5.mjs`保存母版、原/清理并排proof、取纹位置、边界色差、清理范围及SHA。八张proof已由主代理小批打开。完整记录为`art/source/web-v3/cards-v5/face-provenance.json`：560×840母版的ROI外RGB、完整alpha及保护色区变化均0；该0不能扩展为浏览器全图AE=0。

| 产物 | 路径/范围 |
| --- | --- |
| 参考、原始候选、清理母版、proof | `art/source/web-v3/cards-v5/` |
| 当前运行图 | `art/runtime/web-v3/cards/{profile}-{suit}-v5-native.png`，八张140×210无损PNG |
| 4倍中间导出 | 同目录`*-v5.png`，560×840，未被当前代码导入 |
| 资源入口 | `src/web/card-assets.ts`，横竖独立map，路径与旧v4不同 |

原生运行图由母版最近邻回到原稿逻辑栅格，没有增加原画不存在的细节；原生和4倍导出都做过Chrome对照。额外高DPR/4K视口仍未据此验收。至高/虚无/背面维持原资源，不冒称也已重制。

## 接线与字体

`CardView`数字牌用picture选横/竖图，按钮框、ARIA名称和选择规则不变；新纹理已含源纸边/alpha，仅数字牌取消旧.955面层缩放。140×210逻辑框、中心支点及12/9/8、140ms/560ms合同未改。数字始终为实际DOM rank，未烘焙5/8/2/6。

对照Noto Serif、EB Garamond与Tinos后，后两款在8/6的形状或笔重偏差更大，拒用为牌面字体。Tinos原始候选、约3.6KB字集和OFL许可保留，当前CSS不导入它。最终保留真实加载的Noto Serif SC 700，墨色`#080705`，34cqw、字宽.94，2为32.8cqw；按四花色源数字位置校准左/上坐标。

捕获用CDP真实FontFaceSet、computed family/size记录，不能用隔离evaluate未枚举FontFace时返回的空数组认定字体缺失。75为旧v4；76为4倍纹理/Noto；77为原生/Noto；78为Garamond；79/80为拒用Tinos；81为最终数字首次接线。**只有82是本轮当前全组对照。**

## 二十组当前Chrome比较

[当前画廊](../art/review/web-v3/source-card-calibration-20261025/index.html)保存82原始PNG、全景联合JPEG、无损局部联合PNG、来源/捕获哈希、实际几何和字体/图片就绪记录。20张全景和20张局部均已逐组打开审视，左冻结设计、右当前Chrome。

| 状态组与双画幅来源 | 当前发现 |
| --- | --- |
| 未选25-idle-v2 / 选中26-complete-v2 | 原纸、角纹和符号恢复，数值/选择端点同态；小字形/采样差别仍在。中央出牌透视/比例、头像名牌、HUD/动作字仍P2 |
| 无计时14-selection-v4 / 出牌pending19-selection-v2 | 无钟/保持选择语义一致；同上P2，pending动作字距/基线仍不同 |
| 预测10 / pending17；竖屏为timer-v3 | 牌纸更接近，但横屏手牌偏高、竖屏牌组偏右；不能把出牌四牌pose套用当作预测源坐标已对齐。大数字2、范围行、面板/动作字和王牌带仍P2 |
| chooser11 / pending18，均inactive-hand-v5 | 底层禁用牌无选中光；弹层位置/标题/四王牌材料与字形、席位仍P2。未删除focus样式 |
| 重连横15-network-v2 / 竖15；终止横16-network-v3 / 竖16-v2 | 底层新卡可见；独立面板的纹样、字形、尺寸/基线及竖屏顶部返回牌匾仍与原稿不同，P2保留 |

请求整数1672×941 / 390×694、DPR1；横屏实际1672×942和舞台浮点边界逐图保存，竖屏宽390。等待字体loaded/图片decode，并断言四牌currentSrc均对应画幅v5-native。

五项保真面：字体字块/墨色/基线改善，HUD/动作/弹层字仍P2；逻辑框未改，预测pose/中央透视仍P2；原纸温/符号色恢复，局部清字纸纹和采样差别留作细节；原栅格/alpha替代整张v4生成面的漂移，头像/面板材料仍P2；rank与示例同值，源稿“藏日”与业务名“赭日”的字形/文案差异仍需局部补正，不能改业务名迁就误字。

本轮20组取代63/64/68中对应旧组，不是累计新增通过；已保存清单仍30状态×两画幅，其余40组保留各自原范围/P2。这个数量不代表所有必需状态已齐：密集手牌未选/选中等关键状态仍须补独立设计。差分指标仅定位，不自动判通过。

## 当前原生输入与真实功能

`84-card-input-sanity-20261025.json`保存12项当前露出点输入：横/竖×鼠标/触摸，四牌合法选择、非法提示且保持选择、八牌中间青叶11选择，失败0。11/12为动态DOM值，至高/虚无仍走原img回退；四张八牌诊断另存。每个finally关闭触摸仿真。

实际打开84的横/竖八牌图后发现：中间11置顶时会遮住相邻12的首位，视觉可能只剩2，属于P2。DOM里有12和输入命中通过不能证明牌值可读；当前二十组四牌比较也不覆盖这个问题。需补密集手牌未选/选中的独立ImageGen源稿与布局，保留12/9/8选择合同并确保双位数在选择前后均可辨，不能靠要求玩家先取消选择来宣布通过。

这是新picture/alpha图层的有限回归，**不是旧144项矩阵重跑**，不覆盖所有边缘、真手机、完整规则或网络。真人预测首帧另见[docs/58](58-web-v3-countdown-first-frame.md)：修改前2/3出现1→30，绘制前初始化/清理后6/6首帧30，明确长窗口30→29。该功能证据不替代静态样例或网络时钟验收。

## 工程与接续

TypeScript、正式web构建和diff检查通过，生产排除及SHA保存在build.json。源候选、完整试验字体、DEV proof/query及旧v4数字面不得以本轮资源名进入生产。Cocos/WeChat、共享规则/协议和房间服务未修改；未扩展测试套件。

browser-final.json记录首页/20图画廊可用、视口回默认1536×650及触摸仿真关闭。首页日志保留一次写入CardView中途的历史HMR reload错误；最终刷新后的新增error/warn为空。没有删除历史错误来声称整轮零错误。

下一项优先补密集手牌源稿和牌值可读性，再独立测量预测四牌pose、修复偏高/偏右，随后处理中央出牌比例、头像/HUD与连接面板。固定文字/装饰优先恢复原稿组件像素，避免独立重画继续产生纹样漂移。独立hover/focus/错误组合、有计时密集手牌/等待他人预测、真实延迟/丢失ACK、pending重连所有权、联网终局/重开仍缺，原目标未缩小。

final result: blocked
