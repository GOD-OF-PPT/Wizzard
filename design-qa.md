# Design QA — 页面设计稿对照与高清资源返修

## 当前有效结论：Web v3 新会话／触摸命中与选牌完成帧 — 2026-10-18

final result: blocked

此段替代以下历史检查点。目标仍 active，以下是局部关闭的缺陷，不是全页面像素一致声明。

- 默认练习固定种子1已修复：新进入/重赛使用新种子和最多16候选的可见首手防重复，显式测试源保留精确重放。React commit后才记住首手。Chrome无fast参数连续八次首手相邻不重复；不是每种牌序或每种特殊牌分支都已操作。
- 竖屏八张牌选中中间牌后右邻近乎夹住：修复两侧叠放顺序，保留尺寸、12px抬升、9px外移；前后图为`24-hand8-{blocked-portrait-before,unblocked-portrait-after}-20261018.jpg`。
- 竖屏7张原生触摸落在青叶11却由Chrome调整给赭日6：事件链实测确认；按pointerdown真实可见落点选择，鼠标/键盘保持原路径。修复后横/竖×鼠标/触摸×1–8张逐张共144项全部通过，四张`24-hand8-{mouse,touch}-{landscape,portrait}-20261018.jpg`留证。不是所有边缘点、真手机或规则引擎回放通过。
- 选中halo向下光学偏移补到8px；一次Chrome完成帧实测矩阵Y=-12/零旋转、z30、halo中心差8.006px。05/14两画幅在修复后复拍并重新组成同内容全景、聚焦、叠图。PC1672×942/舞台1672×941，竖屏390×694；来源分别为05原稿及safe-v2、14原稿及safe-v3。已打开05两幅和14全景/聚焦联合输入审视。
- 发现验收HTML写入会令Vite整页刷新、丢失本地练习；只忽略review产物目录，运行时代码/素材仍监听。修复后在活动练习中再生成42组对照，仍保留同局并推进第二轮。先前第九次普通练习因此中断，不能称为完整重赛。

### 当前仍未通过的P2

1. 独立12px选牌完成帧：内置ImageGen PC两候选、竖屏一候选已保存，因横向中心/邻牌位移不精确未采用，原视觉真值未被修改。提示词`art/prompts/web-v3-selected-finish-*-v1.md`；候选不构成通过来源。
2. 05/14当前联合比较仍可见卡面角饰、动态文字笔触/名牌等差距。原稿选中倾角与零度合同也不是同一完成帧；不能以修复交互、数量或构建通过掩盖视觉差异。
3. pending发送/ACK边界恢复、联机终局与跨画幅组合仍需当前证据；多合法牌换选的连续时间采样尚未补齐。

补充流程：Chrome仅加速AI的`?fast=2`实际观察第1–8轮、最终总榜、再来一局；首手赭日1→靛山8，预测清空/赢墩0，随后正常返回首页。截图`24-{round8,final,rematch}-fresh-practice-landscape-20261018.jpg`。正常30秒超时曾介入，不称全部手动或正式AI节奏通过。当前真实选牌采到Y=-4.88879过渡→Y=-12完成、halo+8、0.14s transition、一次0.56s确认动画；同回合取消再选无脉冲。该项是实际计算样式/阶段，不是连续帧精密时钟，见docs24。

五项表面：中文/数字分层未更改，但牌桌文字笔触仍待定向；手牌叠放及动作安全带保留；旧金/朱漆/纸纹不改；新候选未替代原稿，生成角饰/头像笔触差距可见；牌面/姓名/分数/状态仍动态，无法出牌不会伪造成功。详细重现、输入范围和边界见`docs/24-web-v3-practice-and-touch-calibration.md`。

当前工程：既有App/useLocalMatch2文件14项、root TypeScript、Web构建通过；没有扩展广泛测试工程。它们不是像素验收。临时触摸诊断日志已移除。

结束前追加触摸取消→键盘检查时Chrome控制超时，读取其他验收标签亦超时；此追加项未完成，不计通过，也未强制重启用户浏览器。已完成的144项及八轮/重赛截图在此前保存；开发服务仍运行，下一批需先恢复Chrome控制后补查。

## 当前有效结论：Web v3 名牌／结算／总榜与八轮真实流程 — 2026-10-18

final result: blocked

本段替代以下历史检查点。已完成本批次实际修改、Chrome复拍及比较；全局目标仍active，不以局部通过或42组文件数替代全范围验收。

### 比较输入与修复后证据

- 视觉真值：`art/mockups/web-v3/[portrait/]04-lobby-{waiting,ready}-v2.png`、`06-results.png`、`07-ranking.png`。实现：同目录review的`04-lobby[-ready]-ink-*`、`06-results-ink-*`、`07-ranking-ink-*`。PC1672×942、舞台1672×941；竖屏390×694。
- 当前42组入口 `art/review/web-v3/audit-20261018-index.html` 已指向最新ink截图，以上8组最终全景及结果/总榜聚焦均已直接打开与来源同屏比较。没有声称本批次又重新跑了其余所有页的全部真实路径。
- 诊断数据：`20261018-lobby-furniture-*`、`20261018-lobby-ink-layout.json`、`20261018-results-resilience.json`、`20261018-ranking-title-*`、`20261018-ranking-clean-patch.json`。阈值、矩形与总图差异不是自动通过标准。

### 关闭的P2与比较历史

1. 名牌v1可见框过扁、状态胶囊多余空隙：内置ImageGen生成3.59:1可见比例的独立空白v2牌；保持完整画布比例而非拉伸。按各席位分别校准名牌/胶囊，PC云游鹤下移约12px、墨隐熊采用原稿更宽牌身；竖屏消除多余胶囊间隙。新名牌3–6席×双画幅共8样例无舞台溢出，与准备/开始/管理带交集0；见最终`audit-04-*`全景与聚焦。
2. 中文与数字统一换字体导致层级不符：先作DEV字体试样，正式仅中文标签用常用字集；数字列、轮次、房间码及AI前缀仍保留Noto Serif。PC总榜标题由约298px宽校准到325px，来源327px；竖屏标题由低4px修正到约1px差，名字和按钮也按当前稿复拍。该项关闭的是中等字号/宽度/节奏偏差，不宣称原稿手绘字形就是该字体。
3. 总榜双圈与首名颜色失效：PC底图烘焙空头像金圈已只在指定竖条合成ImageGen清理，条外像素变更0；竖屏没有该缺陷，未重生。首行颜色改用真实`is-leading`类，避免隐藏表头令`:first-of-type`失效。结果四位真人改为同稿半身形象，独立轮廓不再额外圆裁。
4. 第8轮动作误称继续下一轮：已改为查看最终总榜，仍调用原推进逻辑。真实练习观察1–8轮结算、当前总榜往返、最后结算进最终总榜、竖屏同局重排、再来一局清零回首轮及返回首页；记录`20261018-practice-flow.json`。部分阶段有正常超时托管，不等同每张牌均人工操作或随机牌序全部通过。

### 五项保真表面

- 字体：中文/衬线数字分层、主要标题边界和按钮字号完成指定区域校准；通用字集7,544码点，生僻字回退，长昵称省略但DOM/title留全文。字形笔触/抗锯齿仍有细微差异，列P3。
- 间距/层级：大厅8组与结算/总榜16组均无舞台溢出；六个默认昵称及操作按钮不截断。竖屏名字列微调到33.25%，保留AI全名；相邻数值列光学位移约1px，不以缩小文字解决。
- 色彩：仍为原朱漆、旧金、宣纸、午夜蓝；得失分颜色不变，首名数字与金高亮带对齐。材质轻微色温/纸纹差异列P3。
- 图像：独立ImageGen名牌与局部清理，未使用CSS/SVG/emoji代画。头像小尺度笔触、金边厚度、中心253/255 alpha与极细边缘残色仍为P3；截图中的鼠标指示覆盖不属于界面艺术，不用它判断单像素相等。
- 内容：数字/昵称/排名/分数均动态。并列4与负分-10在真实最终总榜可见；最后一轮动作语义修正。不把冻结样例的180等分数当成真实局数据。

### 明确剩余P2与下一步

1. 新发现：Web练习/重赛仍固定种子1，已实际观察再次朱结2；与迁移计划同业务语义和新会话要求不符。先修复默认新会话与有界首手防重复，同时保留显式测试重放。
2. 选牌12px完成帧还缺独立交互视觉参考；全部可见牌的鼠标/触摸命中覆盖未完成。
3. pending发送/ACK边界恢复、联机终局及跨画幅组合路径仍需当前版本证据。局部固定种子练习不能替代它们。

工程：最终代码root TypeScript、Web构建、既有App/useLocalMatch的2文件9项通过；生产JS无DEV夹具/试字/FAST_EVIDENCE入口，未发出全文TTF，仅61KB规则字体和1.67MB中文UI字集。当前测试标签保留日志查询无error/warn，不推为所有标签全程零错误。详细记录与配方见`docs/23-web-v3-lobby-results-ink-calibration.md`。

## 当前有效结论：Web v3 大厅状态、专用头像与规则字体 — 2026-10-18

final result: blocked

本段替代以下所有历史检查点。全局目标仍active；仍有可执行P2项，不是等待外部授权。此处不把42组比较、构建或真实联机单独当作像素通过。

### 本批次来源与证据

- 新的不可变大厅状态稿：`art/mockups/web-v3/[portrait/]04-lobby-{waiting,ready}-v2.png`。等待稿准确表示真人4/6、已准备3人、未准备墨隐熊、AI一位和空位一席；可开始稿为四位真人均准备且开启开局补位。原稿人数/准备数/开始条件矛盾已修正，服务端权限未放宽。
- 当前比较入口：`art/review/web-v3/audit-20261018-index.html`，21种页面/状态×两画幅，42组。04等待/可开始在最后四张专用头像接入后重拍；08四章/设置采用字体加载后的`wenkai-final`。尺寸审计42组均完整、无错误裁图；诊断指标不是通过阈值。
- 已打开本批次大厅两种源稿、四张新头像、对应全景并排、规则/设置十个聚焦比较。旧32组检查点保留历史，不虚称本次又重新操作过全部真实用户路径。
- 详细记录、实测和许可：`docs/22-web-v3-lobby-and-typography-calibration.md`、`20261018-lobby-rules-geometry.json`、`20261018-rule-ink-calibration.json`、`art/source/fonts/web-v3/README.md`。

### 关闭或缩小的缺陷

1. 邀请牌、空位金环、真人图标、WiFi、机器人和移除图标改为独立内置ImageGen位图。PC管理区只叠图标，竖屏使用完整框，消除双重金框；竖屏不凭空增加源稿没有的连接徽标，可访问状态仍存在。
2. 大厅误用总榜近脸形象：四位真人使用独立半身大厅头像，AI继续使用大厅动物旅者；其他页面未替换。去掉额外圆形CSS裁切，保留伸出的斗笠与真实alpha轮廓。新图金框粗细、眼周线条仍有小差异，不是原图无损提取。
3. 规则动态文字与手绘稿字形方向偏离：对照Noto/KaiTi/WenKai/ZhenKai后只在规则正文/标题/步骤及设置标签采用61,440字节OFL WenKai字集。PC快速上手标题暗字边界现与来源同为(506,339)–(790,408)；竖屏标题差约1px、两行正文边界差约1px。数字圈不换字体。指定字块对齐不证明整页AE=0。
4. 最初竖屏四行溢出：保留完整布局功能并显式使用字体实际存在的`halt`比例标点，恢复源稿两行。规则五状态两画幅均scrollHeight=clientHeight，正文/步骤/页脚分离；设置说明和标签遗漏旧字体的问题已再修正并复拍。
5. 真实房498262双端Chrome完成准备/取消、AI增减、邀请复制、手动AI后补齐座位阻止开局、满席后允许开局、取消离开保留座位、确认离开ACK后回首页。双方已正常退出，再停止临时代理，常规8787服务未重启。network截图早于最后头像替换，只证明操作与权限。

### 五项保真与剩余

- 字体：规则指定字块/断行已校准，手绘字形笔触差异列P3；大厅姓名/大按钮、结算和总榜的动态字体仍是P2，不能以规则字体成果覆盖其他页面。
- 间距/层级：大厅单真人3–6席与六席更换头像后均无舞台溢出；规则五状态无正文内溢出。大厅名牌/准备胶囊的厚度和光学基线仍与源稿有可见中等差距，需下一批定向测量。
- 色彩：继续旧金、午夜蓝、朱漆与宣纸；独立空位光晕、图标及头像金框细微色温/笔触差异列P3，不反复整幅重生成。
- 图像：没有CSS/SVG/emoji代画。大厅误用近脸头像已纠正；牌桌状态家具和选中完成帧的当前同状态参考仍需收口。
- 内容：大厅状态稿与真实计数/权限一致；规则是单份语义文字，动态值未烘焙回底图。21状态不是所有人数、断线边界或完整终局组合均已实测。

下一步明确P2：大厅姓名/状态家具和动作文字；结算/总榜文字层级与头像同状态比较；12px选牌完成帧独立视觉参考及可见牌鼠标/触摸命中巡查；pending发送/ACK边界恢复与当前版本完整终局组合路径。关闭这些和缺失证据前不得改为passed。

工程：最后四头像及设置字体修改后的root TypeScript、Web构建、diff检查通过；生产JS无DEV样例入口/字体选择器，未发出实验全文TTF，规则WOFF2为61,440字节，原OFL随包分发。它们不取代上述Chrome对照。没有新增广泛测试工程，也没有全量测试通过声明。

## 当前有效结论：Web v3 逐页、牌桌与恢复态 — 2026-10-18 后续批次

final result: blocked

本段为最新结论，以下全部旧检查点均不代表当前整体通过。目标仍 active；本批次有真实设计/实现/对照进展，不是等待用户确认。

### 对照来源与当前证据

- 16页/关键状态、横竖32组：`art/review/web-v3/audit-20261018-index.html`。每组均有不可变ImageGen来源、Chrome实现、全景并排、聚焦及尺寸记录；不是仅列截图路径后宣称看过。
- PC视口1672×942、实际16:9舞台1672×941；竖屏390×694。比较工具拒绝将物理可见的1672×744裁图拉伸为完整页面。全景联系表为`audit-{landscape,portrait}-overview-20261018.jpg`。
- 最新竖屏牌桌来源`portrait/05-gameplay-safe-v2.png`、无倒计时来源`portrait/14-gameplay-notimer-safe-v3.png`，原稿保留。修订仅为纠正原稿自己把确认按钮压到最后手牌的安全区问题，不是反向修改稿件迁就实现。
- 01–03是真实首页/表单，12/13为真实连接请求。04–11、14–16的统一同内容样例是DEV视觉夹具，不连接服务，不构成合法规则回放。真实双人牌局、恢复/终止另存network证据，不能互换。
- 全部32组全景以及各页聚焦均已打开审视；规则四章/设置另有`08-*-final-20261018-{comparison,focus}.png`历史本批次对应证据。修改后的05/06/10/11/14/15/16竖屏已复拍，不能用修复前统一截图验收新布局。

### 已修复与验证的P1/P2

1. 牌桌数字牌仍用旧复杂母版、角标/双框偏离：四种独立ImageGen v2面已接入，数字为DOM黑字，只有顶部一次。新增云瓣纸签、四透明花色、预测赢墩共享条、沙漏和正确鸟喙面具旅者。全景及聚焦以`audit-05-*`为当前证据；独立生成仍非原稿字节复制。
2. 牌与动作区域冲突：修复前PC八张交叠87.98×117.56px、竖屏八张17.40×31.22px。PC收紧大手牌扇形，四张基准不改；竖屏按安全区修订稿将确认操作单独放到下方，并使用空白独立位图而非保留旧烘焙按钮。修复后两个画幅1–8张均无舞台溢出/动作矩形交集，恰好一张选中。数字见`20261018-hand-safety.json`，八张截图见`05-eight-hand-*`。尚非所有牌所有触摸点通过。
3. 结算AI旅人被截为AI…：名字列32→32.5%，预测列仅减少0.5%，不缩小字体或头像。Chrome实测clientWidth=scrollWidth=49；修复后`audit-06-results-portrait-20261018`包含全名。
4. 无倒计时房仍显示装饰时钟：14号两画幅独立设计、静默桌面局部合成已接入；无真人deadline和恢复中不显示假秒数，AI动作延迟不显示成人类倒计时。真实房322927完成双真人准备/补AI/两轮操作，双方最终经ACK离开。
5. 断线仍可操作、网络缺快照退成新练习：增加15/16v2独立两画幅设计和透明模态；practice/network分开。真实房874422在专用8791服务和5174回环代理断开transport后保留手牌/玩家、底层inert；重试期间无假成功，恢复后同身份/第1轮/朱结10仍在好友对局。只重启该QA服务导致真实旧会话终止后，双方返回首页并刷新仍在首页。证据`15-reconnecting-*-network-20261018.jpg`、`15-recovered-landscape-network-20261018.jpg`、`16-session-ended-*-network-20261018.jpg`。常规8787服务未为此重启。
6. 确认退出焦点丢失：在inert前保存触发按钮，实际Escape取消后返回首页按钮仍聚焦且仍在原对局；确认后才ACK清理。非房主最终榜“等待房主再开”实测disabled。
7. 重绘/旧缓存误证据：CSS固定在main按基础→v3顺序加载，Windows观察改轮询。静态样例使用减少动效；捕获前核对预测2、选中true及完整尺寸。首次选择560ms、换牌不重放、矩阵Y=-12/z30的真实前台证据保留；后台节流帧不计入。
8. PC叠层状态仍透出空绿色动作牌：使用独立ImageGen木纹局部补丁，只在王牌选择或恢复时去掉原底图牌匾；预测态保留它承载真实确认动作。11/15/16横屏已在补丁后复拍，选择和预测组件恢复中隐藏但不卸载，不丢本地输入。

### 五项保真表面

- 字体/排版：表单/规则已做指定字块测量，AI短名截断关闭；规则标题、正文、分数/按钮的手绘笔触与Noto光学宽度仍有可见差异，尚未整体通过。
- 间距/层级：32组同状态对照和1–8手牌边界已取得；新模态、独立竖屏动作带无主要碰撞。个别玩家状态家具、手牌投影/选中终帧与静态稿仍待定向校准。
- 色彩/令牌：继续朱漆、午夜蓝、宣纸、旧金，表单静态原像素保护；新生成组件存在轻微色温/边沿差异，不以MAE阈值判通过。
- 图像/素材：只用正式和内置ImageGen位图，无SVG/CSS/emoji替代。四数字牌及玩法旅者身份已纠正；独立头像笔触、部分云端比例和小图标缺失仍未全部关闭。
- 文案/内容：真人计数、预测/赢墩、分数及权限为真实状态。源稿“藏日”错字不能替代正式“赭日”；大厅人数/准备数与其画中人物矛盾，尚待正确的状态稿收口，不能伪造数据或放宽开始条件。

### 当前剩余与下一步

- [P2] 大厅邀请/连接/管理的小图标、云端形状与新稿有差异，源稿人数/准备和开始条件又互相矛盾。需正确状态设计及独立素材闭环。
- [P2] 规则/榜单动态字体、头像和牌桌状态家具仍有可见中等差异；需要逐区域校准后重新比较，不能因已收集32组图而通过。
- [P2] 选中完成帧与静态稿未完整表示12px上提；保留耐久交互合同，但需补齐一致的交互视觉参考。大手牌已测矩形/键盘，所有可见牌的鼠标/触摸区域仍需巡查。
- [P2] pending命令恰好在发送/ACK边界时的恢复、3–6席各阶段及终局的当前版组合路径仍需补充；已有两个真实房与冻结样例不能代替完整覆盖。
- [P3] 恢复透明面板外缘极细红色杂边、生成纸签/牌匾小幅比例与笔触偏差；不误称为像素无损提取。

工程：最新Web构建、root TypeScript和diff检查通过，生产JS无design-review/冻结样例/FAST_EVIDENCE入口。既有4文件23项通过；其中Cocos网络用例不覆盖Web新增重试方法，新增Web恢复的证据主要为上述真实Chrome流程。没有全量测试通过/全程零控制台错误声明。当前QA保持blocked；全局目标active。

## 当前有效结论：Web v3 状态稿与局部合成 — 2026-10-18

final result: blocked

目标仍为所有页面和关键状态的完整实现与Chrome同视口对照。本批次关闭规则选中冲突、表单缺少清除/勾选以及整图清理改绘场景的问题；不是整体通过。

### 来源、实现与比较输入

- 新增横/竖屏设计：`art/mockups/web-v3/[portrait/]08-rules-{trump,play,scoring}.png`、`08-settings.png`。对应运行时底图清除了动态正文、数字和状态，保留每个状态准确的选中家具。
- 规则实现截图：`art/review/web-v3/08-{quick,trump,play,scoring,settings}-{landscape,portrait}-final-20261018.jpg`；规则全景对照与聚焦文件使用同前缀`-comparison.png`/`-focus.png`。横屏归一化1672×941，竖屏390×694。JPEG/系统缩放会产生重采样，不用于宣称AE=0。
- 表单当前最终截图：`02-create-masked-{landscape,portrait}-final-20261018.jpg`、`03-join-masked-{landscape,portrait}-final-20261018.jpg`，对应`-comparison.png`及`-focus.png`。昵称茶客听雨、加入码628315，与设计一致；没有提交不存在的房间。
- 表单静态层四个`*-static-v1.png`与选定设计SHA-256逐对相同。`FormArtMasks`只在可变字段合成ImageGen清理层，所有遮罩不接收指针。空值证据：`02-create-empty-masked-portrait-20261018.jpg`、`03-join-empty-masked-portrait-20261018.jpg`，均已直接打开核验，无样例昵称/数字残留。

### 修复与复拍闭环

- 已关闭原P1：规则三章和设置缺稿、首章烘焙高亮错误。新底图使每章只高亮当前项；设置时两标签正确切换且四章均中立。Chrome已逐章操作并保存同状态图。
- 已关闭原P2：设置重复关闭文字、步骤字块过小/挤压/溢出。正文换行跟随两个画幅的设计，不改变规则内容；计分横屏分值另起一行、竖屏保持同行。出牌页正文底430.80、步骤顶435.52；计分页正文底430.80、步骤顶446.06，末标签608.08、页脚顶613.90，两个内容区均无内部溢出。
- 已关闭原P2：整图清理导致静态场景变色/改绘。早期`02-create-portrait-final-20261018.jpg`仅为修复前证据；当前有效文件必须带`masked`。静态场景与框架不再取自整幅清理图，可变内容仍由真实DOM渲染，不是图片表单替代业务。
- 已关闭原P2：昵称清除、人数勾缺失。清除后值为空且焦点在昵称；空昵称提交出现校验，重新输入后消失；人数3→6、两个开关往返均保留输入。三席截图为`02-create-3seat-masked-portrait-20261018.jpg`，其余三个人数按钮无勾；六席原稿没有透出旧勾。
- 开关透明候选误删绿色内部，未接入。最终采用不透明ImageGen原比例素材，普通圆角只裁掉外缘，不以CSS绘制开关。两次真实设置切换后恢复默认值，未更改规则/协议。
- 横屏设置标题的暗字边界从修复前(504,349)–(746,405)校准至(506,338)–(784,402)；源稿(506,339)–(784,404)。说明字块源稿(510,430)–(1062,457)，实现(510,429)–(1065,458)。仅覆盖这两个字块，不扩展为全部文字通过。
- 数字二次复拍：快速上手竖屏数字1源稿边界(92,450)–(101,471)，实现(93,450)–(101,471)；计分源稿(92,462)–(101,483)，实现(93,462)–(102,482)。横屏快速上手源稿(576,593)–(591,630)，实现(575,592)–(593,629)。快速上手改用保留空白圆圈/纸签的专用清理底图，数字和标签仍为DOM。横屏计分正文区无内部溢出，步骤底754.21、页脚顶790.56；竖屏计分正文底428.06、步骤顶446.06。八张章节最终截图及对照已在该次调整后重新生成。

### 五项保真表面

- 字体：指定字块位置/大小已校准；各页动态字形笔触与手绘稿仍有差异，牌桌/榜单尚须当前版本细节对照。
- 间距与布局：规则三章和设置、表单当前两画幅已有复拍；剩余大厅和牌桌人数/手牌极限状态未完成。
- 色彩：表单静态原像素已保护；动态开关与字段局部仍需结合最终对照做小幅细化，不用总差异百分比冒充通过。
- 素材：所有装饰/图标继续为正式或ImageGen位图；拒用透明失败候选。卡面、HUD和头像与新稿的细节仍需巡查。
- 文案：规则只维护一份语义文字，以CSS布局显示不同换行；表单值/校验/设置均为真实状态。空值和更换人数没有残留源稿样例数据。

### 当前剩余P2与实施清单

1. 完成大厅3–6席、牌桌1–8张手牌及阶段切换的当前版横/竖屏对照；校准卡面、HUD、头像及动作家具。
2. 请求中与进入房间失败已补齐独立稿及真实握手/重试证据；大厅/牌桌断线重连仍需独立状态与当前版验收。
3. 复查首页、结算、总榜、离开确认与上述变更组成的完整用户路径，不能沿用旧版本passed或截图数量。
4. 将全页面来源、同状态实现、全景/聚焦对照逐项核对；P0/P1/P2尚未全部关闭前保持blocked。

工程检查：本批次`typecheck`、Web构建、既有App/useLocalMatch的2文件9项用例通过。最新Chrome目标中error/warn为空；不把开发热更新的历史错误抹去。全局目标仍active，未作完成声明。

### 后续批次：连接状态与大厅

来源和交互合同：`docs/19-web-v3-connection-and-lobby-calibration.md`。12/13各两画幅的独立ImageGen稿已接入真实表单请求，Chrome已完成不存在房间失败、保留字段重试、返回修改、Escape、Tab和真实修改后加入。等待态用本地握手延迟，不注入页面状态；已恢复正式房间服务。等待态最终静态复拍通过真实“减少动效”开关排除淡入帧，之后恢复默认。

大厅修复昵称板、状态胶囊、准备勾、AI末端占位与3–6席映射。横屏右下席位底809.63→772.51，开始按钮顶790.56，消除原有19.07px重叠。当前复拍为`04-lobby-fixture-{portrait,landscape}-refined-20261018.jpg`，对应全景及聚焦比较；三席真实双人准备/AI流程与四至六席创建/布局证据另存，不能混用。

仍未通过的明确差异：源稿真人计数/准备文案与所画玩家矛盾、人物头像与AI旅者形象、邀请/管理/连接小图标缺失、正文笔触与角色细节。五项保真中，指定组件间距/控制行为已有证据，整体字体、色彩、素材与内容一致性仍须继续校准。缺少完整当前版牌桌与全部页状态证据；保持`final result: blocked`。

## 此前有效结论（历史）— 2026-10-17

final result: blocked

本段替代下面全部历史检查点；没有将局部改进或工程检查当作整体验收。当前Chrome对照仍存在可执行的P1/P2项，目标未达成。

### 本次来源、视口和状态

- 不可变视觉真值：`art/mockups/web-v3/portrait/{01-home,02-create,03-join,07-ranking,08-rules,09-confirm,10-bid}.png`；其余页面继续沿用同目录及横屏既定稿。新补齐07/09/10独立竖屏页，六个头像和步骤纸签通过内置ImageGen生成，提示保存在`art/prompts/web-v3-*.md`。
- Chrome目标390×694；系统缩放下DOM可能为390.4×694.4，比较工具只作同尺寸归一化，不把重采样/JPEG差异当成设计缺陷或通过阈值。
- 总榜为同玩家、同分数的开发冻结排版样例：`07-ranking-portrait-refined-20261017.jpg`。真实第8轮到终局的历史流程证据另见`07-ranking-live-v2.jpg`，两者不能互相代替。
- 创建/加入为真实表单，同昵称茶客听雨、加入码628315为输入样例，不提交不存在的房间。
- 确认页为真实房间658275的离开确认：`09-confirm-portrait-network-final-20261017.jpg`；点击确认后真实返回首页。此前635236房间也完成取消保留房间、再次确认退出。
- 预测为真实第1轮：`10-bid-portrait-final-20261017.jpg`。它不是源稿的第4轮，故仅证明新叠层、坐标及交互，不宣称整页同内容像素通过。

### 对照与修复历史

1. 总榜：`07-ranking-portrait-20261017-comparison.png`发现标题/按钮过大和旧头像不一致；修复字号与独立v3头像后，复拍`07-ranking-portrait-refined-20261017-comparison.png`。同数据细节裁区为`07-ranking-portrait-refined-20261017-focus.png`。角色姿态、字形和小幅对齐仍有差异，未关闭P2。
2. 创建：`02-create-portrait-20261017-comparison.png`发现开启/关闭换行；扩大开关行并固定nowrap，复拍`02-create-portrait-final-20261017-comparison.png`及`-focus.png`。文字已单行，缺少输入清除/座位勾和开关几何偏差仍是P2。
3. 规则：`08-rules-portrait-20261017-comparison.png`发现重复导航底板覆盖原有图标、标题及步骤过小。移除重复底板、校正标题/段落/步骤位置并接入纸签，复拍`08-rules-portrait-final-20261017-comparison.png`及`-focus.png`。快速上手正文scrollHeight=clientHeight=286，正文底605.56、页脚顶613.90，间隔8.34px，不再把步骤截掉。其他章节仍缺独立状态稿及正确选中底板，保留P1/P2。
4. 退出确认：新稿按钮上下排列，实时命中区分别为约(70.65,331.23,249.46,51.38)和(70.65,388.86,249.46,51.38)。全景/细节对照为`09-confirm-portrait-network-final-20261017-comparison.png`和`-focus.png`，未发现遮挡、重复文字或错误退出行为。图像接口JPEG影响清晰度，不承诺AE=0。
5. 牌桌：六人上方座位顺序已与稿件一致；预测使用独立无空按钮底图，本地席下移，取消多余王牌条。真实两张合法手牌切换证据为`05-selection-switch-portrait-20261017.jpg`：青叶1→朱结7，后者矩阵Y=-12、zIndex=30；切换前、切换后、1100ms倒计时重绘后脉冲类均为空，选中数为1。只证明该状态，不扩充为4–8张手牌全覆盖。

### 当前待修复项

- [P1] 规则其他章节/体验设置缺少匹配独立状态稿；竖屏底图的首章绿色选中仍烘焙，切换其他章节后会与动态当前章节争抢选中语义。需要按真实交互状态重新生成并接入，不以边框强调宣布修好。
- [P2] 输入清除图标、6席选中勾、开关尺寸、总榜动态字体和头像细节尚未与源稿一致。
- [P2] 预测稿为第4轮，而当前复拍是第1轮；稿件缺失时限展示但实际保留倒计时，须完成同状态设计补正与对照。
- [P2] 3–5席大厅、4–8张手牌、全部错误/重连/请求中状态和本批次变更后的横屏全量对照尚未完成。
- [P2] 未完成所有页面的同数据全景及聚焦证据，不存在整体像素级通过结论。

### 五项视觉标准

- 字体与排版：未通过。Noto动态字形与生成稿笔触不同，创建/总榜/规则尚有光学对齐差距。
- 间距与布局：局部修复已复拍；退出双按钮、开关单行及规则内容安全带已实测，其他状态未全部通过。
- 色彩令牌：保留对应朱漆/午夜蓝/宣纸/旧金资源；新头像及开关局部色差仍待逐页校准。
- 图像与素材：新独立竖屏稿/底板已入库，没有CSS/SVG/emoji替代；ImageGen清理与重绘并非像素无损复制，差异明确保留。
- 文案与内容：真实昵称/房间码/分数/预测值仍为DOM；样例与真实对局分开标注。静态确认文字与源稿相同。

### 工程与交互核验

- `npm run typecheck`通过；`npm run web:build`通过；`git diff --check`通过。
- 定向既有用例：`src/App.test.tsx`和`src/hooks/useLocalMatch.test.ts`，2文件9项通过。未把旧447项报告冒充本批次完整重跑。
- 预测ArrowUp将0增到1，最大值禁用增加；第一轮焦点验证Tab从确认至减少、Shift+Tab返回确认。随后把返回首页放入同一模态焦点范围，补充实测Tab从确认循环至返回首页、可见返回按钮仅一个，Enter实际退出练习。提交预测也已实际进入牌局。
- 规则章节内容确实变化；减少动效开启/关闭后恢复原设置；关闭后焦点返回首页规则入口。
- 新匿名创建/离开会话没有捕获error/warn。早期HMR存在一次新资产尚未落盘引发的模块重载错误；最新构建通过，但不声称整个历史控制台零错误。
- `fast=1/2`仅在DEV生效；2仅加快AI/结算，仍保留30秒真人操作。生产JS不含设计验收入口或快速证据标记。

### 实施清单

1. 先补规则四章/设置和失败/等待状态稿，拆除烘焙首章选中语义。
2. 补齐输入清除/人数选中资产与动态交互；校准开关和文字。
3. 完成横屏/竖屏全部页面、3–6席和1–8手牌的同状态复拍与细节对照。
4. 所有P0/P1/P2关闭前保持blocked。历史空白/误命名帧见`art/review/web-v3/20261017-evidence-status.md`，不得引用为通过证据。

## 此前检查点（历史，不代表当前通过）— 2026-10-16

final result: blocked

新一轮逐页设计与实现已启动，清单见 `docs/18-web-v3-design-and-interaction.md`。以下历史passed仅描述各自历史范围，不能代表本轮完成。上轮截图中大厅为未连接空房间，results文件实际含出牌画面；没有同状态并排比较或成功选牌动效证据，因此撤回上轮“逐像素校准完成”的总体结论。当前须完成每页新设计稿、动态实现及Chrome同状态对照后再给出新结论。

### Web v3 当前检查点 — 2026-10-17

- 视觉真值：`art/mockups/web-v3/01-home.png`至`11-chooser.png`，牌桌使用返修后的`05-gameplay-final.png`。
- 实现证据：`art/review/web-v3/`；横屏主窗口1672×941附近，独立加入窗口1536×683，后者仅为流程证据，不能直接当同尺寸像素对照。
- 同内容对照：`06-results-comparison.png`包含第4轮设计和冻结相同玩家/分数的Chrome无损截屏；冻结样例明确标识为设计验收，不连接服务、不证明游戏流程。
- 真实操作：Chrome两个独立origin匿名会话创建/加入房间659456，双方准备，添加4名AI补齐6席，开始按钮由等待好友/等待准备/补齐座位转为可用；离开确认的取消保留原房间。
- 真实练习链：选择朱结→预测0→选中朱结2→确认出牌→第1轮结算，分别保存`11-chooser-live.jpg`、`10-bid-live.jpg`、`05-selected-live.jpg`、`06-results-live.jpg`。此集合经打开检查确实为文件名描述状态。
- 动效实测：选中牌transform矩阵Y=-12、zIndex=30、transition=0.14s；确认按钮enabled=true且animation=0.56s cubic-bezier(0.22,0.8,0.3,1) both turn-action-pulse。
- 已修复：创建/加入入口不再直接进入空大厅；恢复真实表单、等待服务器确认；大厅移除表单；顶部标题行高；规则各章内容；设置实际接线；牌桌阶段专用面板；结算动态表格；快速切牌导致确认动画清理计时被取消的问题。

#### 尚未关闭的差异

- P1：创建/加入已切换到独立941×1672竖屏底板；规则竖屏稿已生成但动态值清理未完成，仍需独立清理底板与同状态复拍。横屏底板不可直接裁切当竖屏验收。
- P2：原始运行时头像与ImageGen重绘头像的笔触、裁剪、比例有差异，不能称像素一致。字体也有手绘字形与Noto字形的差异；需逐页放大对照。
- P2：规则标签及章节选中形状、步骤字号、输入焦点态、开关尺寸待最终同尺寸比较；最新导航资产已替换，但尚未全部复拍。
- P2：牌桌缩小头像/调节席位后、替换新选中光效后的证据尚须刷新。现有首轮截图不能代表4–8张手牌的重叠、邻牌让位和切换选择全部通过。
- P2：总榜真实结束状态、离开服务端应答、重连/错误反馈、3–5人布局及各模态键盘焦点仍需覆盖。
- P2：现有对照图只完整覆盖结算样例；其余页面须补齐同状态并排和细节裁区，不以截图数量替代比较。
- 竖屏证据：`art/review/web-v3/02-create-portrait-before.jpg`、`02-create-portrait-after.jpg`、`03-join-portrait-after.jpg`；390×694 Chrome实测创建表单已使用独立清理底板，输入、座位和底部按钮命中区均在视口内。
- 最新竖屏坐标复拍：`art/review/web-v3/02-create-portrait-after-v2.jpg`；输入框、座位组、返回和创建命中区均在独立941×1672底板的可见内容中。
- 新增竖屏设计稿：`art/mockups/web-v3/portrait/01-home.png`、`04-lobby.png`、`05-gameplay.png`、`06-results.png`。这些稿件已入库但对应动态清理底板和Chrome同状态实现复拍尚未完成，不能计入通过页数。
- 竖屏后续复拍：`04-lobby-portrait-after.jpg`、`05-gameplay-portrait-chooser-after.jpg`、`06-results-portrait-after.jpg`、`08-rules-portrait-v2.jpg`。大厅/牌桌/结算已接入独立竖屏底板并在390×694 Chrome运行；规则清理底板已更新但正文仍需继续压缩校准，整体保持blocked。
- 规则最终竖屏复拍：`08-rules-portrait-final.jpg`。在390×694 Chrome中，标签、章节、正文标题、四步和狐狸插画已落入独立内容带，正文不再发生步骤重叠；页脚仍需最终同稿裁区比对。
- 规则字体/页脚复拍：`08-rules-portrait-final-v2.jpg`。四步字号和页脚已提高并上移，内容仍保持在390×694视口内；与稿件仍有字形、狐狸比例和装饰差异，保持P2。
- 最新同视口对照：`08-rules-portrait-comparison-v2.png`；实现已接近稿件的内容带和底部节奏，字体与插画差异仍明确记录。
- 竖屏选王牌复拍：`05-gameplay-portrait-chooser-final-v2.jpg`；四个按钮已重排为2×2，390×693下点击区与卡面一致，仍需对手牌层级和底部操作区做多状态复核。
- 最终总榜真实Chrome证据：`07-ranking-live-v2.jpg`；使用同一真实练习规则经过8轮并点击继续后进入 `快速局总榜`，不是冻结设计样例。并排比较：`07-ranking-comparison-v2.png`。结构、行数、按钮和层级一致；动态玩家/分数与稿件样例不同属于真实状态，头像/字体仍为P2。
- 为缩短证据采集，`?fast=1`仅在本地练习使用1.2秒人类超时、0.1秒AI动作和0.18秒墩结算延迟；规则、状态机、合法性和结算逻辑未改变，生产默认仍为30秒/既有节奏。
- 规则同视口并排：`08-rules-portrait-comparison.png`。结构和主要边界对齐；实现的正文/步骤字号较稿件小，底部页脚在390×694中压到边缘，保留为P2差异，不宣称通过。

#### 五项视觉标准

- 字体：待校准，未通过。
- 间距/布局：横屏基础已接入并处理碰撞；全页面全状态和竖屏未通过。
- 色彩：场景来自对应生成底板；动态控件还需采样对比。
- 素材：17项独立运行时素材已入库；头像/选中光效仍有差异或待复拍。
- 内容：真实表单、状态、分数和规则已接线；错误态文案与最终交互覆盖待完成。

#### 工程检查

2026-10-17检查：`npm test`通过51文件/447项；`npm run web:build`退出0；`npx tsc --noEmit`退出0；`git diff --check`通过。开发样例入口未出现在生产JS中。后续仅素材和CSS的小调整仍须视觉复拍；这些检查不替代视觉通过。

final result: blocked

- QA 日期：2026-08-04
- 设计真值：`art/mockups/home-screen.png`、`art/mockups/friend-room-screen.png`、`art/mockups/gameplay-screen.png`、`art/mockups/round-results-screen.png`
- 实现截图：`art/qa/design-fidelity-pass-2026-08-04/30-home-after.png`、`38-lobby-after.png`、`40-gameplay-after.png`、`48-round-results-after.png`、`45-round-results-after.png`
- 视口：1280×720，横版 16:9
- 状态：首页、创建房间、加入房间、规则 1–4、设置、6 人好友房大厅、牌局、6 行轮次结算、6 行最终总榜

## Full-view comparison evidence

- 总览：`art/qa/design-fidelity-pass-2026-08-04/59-after-comparison-overview.png`
- 首页：`50-home-after-comparison.png`
- 好友房大厅：`51-lobby-after-comparison.png`
- 牌局：`52-gameplay-after-comparison.png`
- 轮次结算：`53-score-after-comparison.png`
- 规则页修复前后：`54-rules-after-comparison.png`

## Focused comparison evidence

- 绿色修复标注总览：`art/qa/design-fidelity-pass-2026-08-04/60-marked-after-overview.png`
- 首页高清背景：`55-marked-after-home.png`
- 规则标题卷轴与高清插图：`56-marked-after-rules.png`
- 空座剪影：`57-marked-after-lobby.png`
- 结算行密度与头像：`58-marked-after-score.png`

## Findings and fixes

- P2-01 已修复：首页由低码率 JPEG 改为 1920×1080 无损 PNG，标题、人物和装饰边缘不再因二次放大而发虚。
- P1-02 已修复：规则页标题卷轴由 520×138 调整为 480×190，实际高度大于九宫格 144px 的上下边距总和，不再被纵向压扁。
- P2-03 已修复：规则提示插图由 768 级运行时图升级为 1536×910 RGBA，并保留原透明遮罩。
- P2-04 已修复：空座剪影改为中性浅色乘色和 112 透明度；角色可辨认，但仍明显弱于已入座头像。
- P2-05 已修复：轮次结算、当前总榜和最终总榜统一使用 72px 头像、84px 行距和 27–29px 主体字号；6 行极限状态仍有稳定留白。

## Required fidelity surfaces

- 字体与排版：通过。展示字体继续使用 Noto Serif SC，界面字体继续使用 Noto Sans SC；标题、列头、玩家名和分数层级清晰。
- 间距与布局节奏：通过。1280×720 下核心控件无裁切；规则卷轴、6 个大厅席位和 6 行结算均保持稳定。
- 颜色与视觉令牌：通过。朱漆、宣纸、午夜蓝、旧金和绿漆按钮与设计稿一致；空座使用同体系中的弱化中性色。
- 图片质量与资源忠实度：通过。首页和规则插图已升级高清；可见背景、头像、卡牌、面板、卷轴与按钮均来自正式位图资源，无 CSS/SVG/emoji 占位替代。
- 文案与内容：通过。首页入口、房间表单、规则、设置、房间状态、回合提示和结算文案均完整可读。

## Comparison history

### Iteration 1 — blocked

证据：`24-before-comparison-overview.png`、`25-marked-before-overview.png`。

- 首页背景软化。
- 规则标题卷轴纵向塌缩、规则插图分辨率不足。
- 空座剪影像暗洞。
- 结算头像、字号和行距偏小。

### Iteration 2 — passed

修复：替换两张高清运行时资源；校正规则卷轴；提升空座可读性；统一三套结算表的头像、行距与字号。

修复后证据：`59-after-comparison-overview.png`、`60-marked-after-overview.png`，以及 `30-home-after.png` 至 `49-current-ranking-after.png` 的逐页复拍集。

## Interaction and runtime checks

- 已操作：首页 → 创建房间 → 6 人好友房 → 准备 → 开始游戏 → 预测 → 出牌 → 轮次结算 → 最终总榜 → 再来一局。
- 已打开并复拍：创建、加入、规则 1–4、设置。
- 浏览器控制台 error / warning：0。
- `npm run cocos:typecheck`：通过。
- `CocosBuildCompatibility.test.ts`、`FriendRoomController.test.ts`：6 项通过。
- `npm run build`：通过。
- Cocos Web Desktop release：清理旧资源后于 2026-08-04 02:50 重建完成。
- Cocos 微信小游戏 release：清理旧资源后于 2026-08-04 02:51 重建完成；`game.json.deviceOrientation` 为 `landscape`。

## Mobile safe-area comparison — 2026-08-04

- 设计真值：`art/mockups/gameplay-screen.png`、`art/mockups/round-results-screen.png`。
- 手机模拟器原始截图：`art/qa/user-screenshot-pass-2026-08-04-2/07-mobile-gameplay-user.png`、`08-mobile-score-user.png`。
- 修复后浏览器截图：`27-mobile-selected-card-confirm-after.png`（855×389，已选牌并等待确认）、`r2-result-frame-20.png`（855×389，第 2 轮结算）。
- 结算同宽归一化：`30a-mobile-score-after-841x389.png`（由浏览器原始截图居中裁为 841×389，仅移除两侧各 7px 的额外背景）。
- 全景并排证据：`32-mobile-gameplay-safe-comparison-after.png`、`33-mobile-score-safe-comparison-after.png`。
- 聚焦标注证据：`30-mobile-gameplay-marked-after.png`、`31-mobile-score-marked-after.png`、`34-mobile-marked-after-overview.png`。

### Mobile findings and fixes

- P1-M01 已修复：本地玩家不再占用第六个头像席位；左下角恢复独立“预测 / 已赢”状态牌。
- P1-M02 已修复：1–2 张手牌锚点上移，选中抬升后仍完整避开底部 Home Indicator 安全区。
- P1-M03 已修复：“你的回合 / 确认出牌”操作区上移，与手牌一起保持可点击和无遮挡。
- P2-M04 已修复：倒计时向左避让微信右上角胶囊，牌局信息不再与系统控件争抢空间。
- P2-M05 已修复：对手头像、名字、状态、卡背，以及三种结算表的标题、列头、头像、姓名和数值统一放大。
- P3-M06 可继续优化：正式设计稿的结算标题牌纵向更厚；当前实现已可读，但后续可把标题牌高度再提高约 10–15%。

### Mobile required fidelity surfaces

- 字体与排版：通过。手机结算页标题、列头、姓名和分数已从偏小状态提升到可稳定扫读的层级。
- 间距与布局：通过。超宽屏按等高 16:9 安全区居中，额外宽度只展示桌面背景；底部手牌、按钮及右上倒计时均无系统控件遮挡。
- 颜色与视觉令牌：通过。修复仅改变布局与尺寸，未偏离既有朱漆、宣纸、旧金和绿漆状态色。
- 图片质量与资源忠实度：通过。所有可见背景、头像、卡牌、卷轴和按钮继续使用正式位图资源；本轮未引入占位图或代码绘图。
- 文案与内容：通过。“预测”“已赢”“你的回合”“确认出牌”和结算列头均与玩法状态一致。

### Mobile comparison history

#### Iteration M1 — blocked

证据：`15-mobile-marked-before-overview.png`、`18-mobile-gameplay-safe-comparison-before.png`、`19-mobile-score-safe-comparison-before.png`。

发现：本地玩家重复头像席位；手牌和确认按钮过低；倒计时贴近微信胶囊；结算头像、列头、姓名和数值偏小。

#### Iteration M2 — passed

修复：恢复左下角本地状态牌；按手牌数量设置底部锚点；上移回合按钮；左移倒计时；统一放大对手 HUD 和结算表信息。

修复后证据：`32-mobile-gameplay-safe-comparison-after.png`、`33-mobile-score-safe-comparison-after.png`、`34-mobile-marked-after-overview.png`。已实际操作好友房准备、开始游戏、预测、两张手牌选择、确认出牌和第 2 轮结算；浏览器控制台 error / warning 为 0。

## Mobile bid and render-resolution comparison — 2026-08-04

- 用户截图：`art/qa/user-screenshot-pass-2026-08-04-3/01-mobile-bid-user-before.png`（847×402，第三轮预测）。
- 设计真值：`art/mockups/gameplay-screen.png`，并以已验收预测面板组件生成同状态对照 `02-mobile-bid-design-safe-area.png`。
- 修复后浏览器截图：`13-mobile-bid-round3-after.png`（847×402，同为第三轮、3 张手牌、预测值 0）。
- 全景对照：`19-mobile-bid-comparison-after.png`。
- 修复前后标注：`20-mobile-bid-before-after-overview.png`。
- 渲染分辨率诊断：`12-render-resolution-comparison.png`。

### Findings and fixes

- P1-B01 已修复：预测 / 王牌选择期间改用 220×146 的紧凑手牌、112 间距和 -330 锚点；3 张手牌完整停在 Home Indicator 上方，并与预测面板保持间隔。
- P1-B02 已确认并消除陈旧构建：用户截图仍显示旧版本地头像席位和旧倒计时位置；11:37 Web Desktop 与 11:39 微信小游戏重建后，修复后截图已显示左下角状态牌和避让胶囊的倒计时。
- P1-B03 已修复：微信开发者工具在横版模拟器报告 1× DPR 时，微信模板把帧缓冲提升到 2×；真机继续使用系统原生 2×/3× DPR。
- P2-B04 已排除资源根因：桌面背景为 1920×1080、头像为 512×512、卡牌为 256×384，纹理导入为 linear；全页面同时锯齿来自 1× 帧缓冲，不需要重做美术资源。

### Required fidelity surfaces

- 字体与排版：通过。预测标题、数值、范围和操作按钮保持原有层级；2× 帧缓冲同时改善 TTF 边缘。
- 间距与布局：通过。预测面板比例未改；第三轮 3 张手牌、左下角状态牌和右上倒计时全部落入手机安全区。
- 颜色与视觉令牌：通过。仅调整手牌尺寸、位置和渲染像素比，既有色彩不变。
- 图片质量与资源忠实度：通过。正式位图源文件尺寸充足，纹理使用线性采样；未生成替代资源。
- 文案与内容：通过。“预测本轮赢墩数”“可选 0–3”“少一墩”“多一墩”“确认预测”均完整准确。

### Comparison history

#### Iteration B1 — blocked

证据：`06-mobile-bid-comparison-before.png`。问题为旧版本地头像、旧倒计时位置、3 张手牌进入 Home Indicator，以及 DevTools 1× 帧缓冲导致的全屏锯齿。

#### Iteration B2 — passed

证据：`13-mobile-bid-round3-after.png`、`19-mobile-bid-comparison-after.png`、`20-mobile-bid-before-after-overview.png`。微信模板 1×→2× 行为由 `CocosBuildCompatibility.test.ts` 的 DevTools / 真机两条回归用例覆盖。

## Mobile rules and settings comparison — 2026-08-04

- 用户截图：`art/qa/user-screenshot-pass-2026-08-04-4/01-mobile-settings-user-before.png`（847×402）。
- 设计真值：`art/qa/user-screenshot-pass-2026-08-04-4/02-mobile-settings-design-safe-area.png`，来源为已验收的 `art/qa/design-fidelity-pass-2026-08-04/32-settings-after.png`。
- 修复前并排标注：`art/qa/user-screenshot-pass-2026-08-04-4/06-mobile-settings-comparison-before.png`。
- 修复后并排标注：`art/qa/user-screenshot-pass-2026-08-04-4/12-mobile-settings-comparison-after.png`。
- 修复前后总览：`art/qa/user-screenshot-pass-2026-08-04-4/13-mobile-settings-before-after-overview.png`。

### Findings and fixes

- P1-S01 已修复：设置页正文、三条设置项说明、页签和按钮边缘在 DevTools 1× 帧缓冲下出现明显锯齿；沿用微信模板 2× DevTools 超采样修复。
- P2-S02 已确认：面板宽度、页签、返回首页、设置项纵向节奏和底部恢复默认按钮与 16:9 安全区基本一致，无需改动 `RulesSettingsView.ts` 的布局。
- P2-S03 已确认：用户截图中的系统胶囊与 Home Indicator 没有遮挡设置页核心操作；修复重点是清晰度而不是安全区重排。

### Required fidelity surfaces

- 字体与排版：通过。2× 复拍后标题、页签、设置项标题和说明的边缘更稳定。
- 间距与布局：通过。面板和三条设置项与设计安全区保持相同位置和密度。
- 颜色与视觉令牌：通过。朱漆面板、宣纸按钮、蓝色行动时限条和金色描边保持一致。
- 图片质量与资源忠实度：通过。该页继续使用正式面板、卷轴、按钮和背景位图，不替换美术资源。
- 文案与内容：通过。合法牌提示、轮到我时震动、行动时限和恢复默认均完整可读。

### Comparison history

#### Iteration S1 — blocked

证据：`06-mobile-settings-comparison-before.png`。页面布局已接近设计稿，但 1× 渲染让小字号与高对比纹理边缘显得粗糙。

#### Iteration S2 — passed

证据：`12-mobile-settings-comparison-after.png`、`13-mobile-settings-before-after-overview.png`。2× 下采样复拍后，内容层级和边缘清晰度改善；Cocos 构建回归测试保持通过。

## Evidence limits

截图可以证明可见布局、清晰度、层级和状态变化，但不能单独证明真机读屏、色觉模拟、震动反馈、不同 GPU 的纹理压缩结果或微信真机安全区；这些仍需在微信开发者工具和真机上复核。

final result: passed

## Internal PC Web 微信视觉重设计巡查 — 2026-10-16

- Audit scope: React/Vite internal web home, anonymous friend-room shell, local practice table, trump chooser, bid panel, round results, and rules/settings dialog.
- Design source: `art/mockups/web-pc-experience-v1.png` plus the approved WeChat runtime masters under `art/runtime/`.
- Viewports: 1280×720 landscape and 390×844 portrait.
- Live capture: clean Wizzard Vite instance at `http://localhost:5173/`; the earlier port-conflict page from another app was discarded and never used as evidence.
- Accepted evidence contact sheet: `art/review/web-patrol-contact-sheet.jpg`.
- Individual evidence: `art/review/web-patrol-{home,room,match,play,results,rules}-{landscape,portrait}.jpg`.

### Findings and fixes

- P1 fixed — room controls and footer labels were hidden by the home-only transparent hit-target rule. Room action buttons now retain readable labels and distinct lacquer-blue / lacquer-brown states.
- P1 fixed — the room shell had an implicit fifth grid row, producing a scrollbar and clipping the footer. The shell now has explicit rows, a bounded player region, and no desktop overflow.
- P1 fixed — raw `SOCKET_TRANSPORT_ERROR` was shown to users. The room surface now maps transport failure to `房间服务暂不可用，可先进行单人练习。`.
- P1 fixed — the full-width PC utility bar covered the gameplay round scroll. Match screens now use a compact top-right utility rail that clears the round HUD and timer.
- P1 fixed — portrait home previously cropped the 16:9 master, cutting off the create plaque and producing a false landscape layout. ImageGen produced and the web runtime now selects `art/runtime/backgrounds/home-screen-portrait-v1.png` for 9:16, with portrait-aligned hit targets.
- P1 fixed — portrait match and room layouts produced horizontal overflow. Portrait stage overflow is clipped, room bands reflow, seat cards shrink to fit, and the footer remains visible.
- P1 fixed — portrait rules dialog reused a short landscape height and pushed copy/actions outside the panel. It now uses a dedicated responsive vertical band with contained copy and actions.
- P2 fixed — local practice could retain a stale room adapter when leaving. Local practice exit now disposes the preview surface and returns to the home screen directly; network matches keep the acknowledged leave path.

### Required fidelity surfaces

- Visual language: passed. Warm lacquer, parchment, midnight-blue, old-gold, lantern, and animal-traveler assets remain the visible system across every captured surface.
- Layout hierarchy: passed. Desktop uses the compact PC utility rail, lacquered room shell, central table, bottom action band, and parchment results hierarchy; portrait uses independent vertical reflow.
- Interaction clarity: passed. Home entry hit targets, room controls, practice exit, rules close, trump selection, prediction controls, and round continuation were all present and reachable in the captured states.
- Asset fidelity: passed. No CSS art, inline SVG, emoji, or generic icon replacements were introduced. The only new bitmap is the versioned portrait home master generated from the approved home reference.
- Responsive containment: passed. The final evidence set has no document-level horizontal overflow, no clipped room footer, no hidden room labels, and no rules-dialog action outside the authored frame.

### Evidence limits

These captures verify browser layout, visible hierarchy, interaction state, and responsive containment. They do not replace WeChat DevTools/device acceptance, real GPU texture checks, screen-reader verification, or a live room-server connection. The friend-room evidence intentionally records the disconnected internal-preview state.

final result: passed (internal web visual patrol)

### Web patrol iteration 2 — friend-room composition

- Previous evidence: `art/review/web-patrol-room-landscape.jpg` and `art/review/web-patrol-room-portrait.jpg`.
- New evidence: `art/review/web-patrol-room-landscape-v2.jpg` and `art/review/web-patrol-room-portrait-v2.jpg`.
- Finding fixed: the first web room pass used a full dark shell with grid cards, which hid the lacquer table and diverged from the friend-room design. The revised composition exposes the table as the visual field, places waiting plaques around the oval, moves room controls to the lower-left safe column, keeps actions in the lower-right lane, and separates the utility rail from room information.
- Responsive result: desktop and portrait both keep all six seat targets, room inputs, status copy, and footer actions inside the viewport with no document overflow.

final result: passed (friend-room iteration 2)

## ImageGen PC design implementation coverage — 2026-10-16

The ImageGen composite `art/mockups/web-pc-experience-v1.png` is implemented as four runtime surfaces rather than shipped as a flattened background:

| Design region | Runtime implementation | Current evidence |
| --- | --- | --- |
| Home entry | `HomeScreen` uses the authored landscape master and dedicated portrait master with transparent semantic hit targets | `web-patrol-home-landscape.jpg`, `web-patrol-home-portrait.jpg` |
| Friend-room table | `FriendRoomScreen` uses the clean teahouse table, oval seat positions, real avatar/green-status assets, room info plaque, lower-left controls, and lower-right actions | `web-patrol-room-landscape-v2.jpg`, `web-patrol-room-portrait-v2.jpg`, `web-patrol-room-comparison-v2.jpg` |
| Gameplay | `MatchScreen` composes the table, round scroll, six seats, hand, turn HUD, chooser, bid panel, and compact PC utility rail from runtime assets | `web-patrol-match-landscape.jpg`, `web-patrol-match-portrait.jpg`, `web-patrol-play-landscape.jpg`, `web-patrol-play-portrait.jpg` |
| Results | `ResultsPanel` uses the parchment score ribbon, authored footer actions, dynamic player rows, and responsive portrait reflow | `web-patrol-results-landscape.jpg`, `web-patrol-results-portrait.jpg` |
| Rules/settings | `RulesDialog` uses the authored lacquer panel, runtime text/actions, and a portrait-specific contained layout | `web-patrol-rules-landscape.jpg`, `web-patrol-rules-portrait.jpg` |

Coverage verdict: passed for the internal browser carrier. The composite reference is fully represented by live components and formal raster assets; no flattened composite image is used as a runtime screen.

final result: passed (ImageGen PC implementation coverage)

## ImageGen v2 browser design implementation — 2026-10-16

- New design board: `art/mockups/web-pc-experience-v2.png`.
- Combined evidence sheet: `art/review/web-imagegen-v2-contact-sheet.jpg`.
- Dedicated PC home master: `art/runtime/backgrounds/home-screen-web-pc-v2.png`.
- Fresh browser evidence: `art/review/web-imagegen-v2-home-landscape.jpg` and `art/review/web-imagegen-v2-room-landscape.jpg`.
- Home implementation now uses the v2 master at landscape breakpoints, with authored left action plaques, visible runtime labels, centered brand title, and the baked top-right utility rail. Portrait keeps the independent v1 portrait master and reflow contract.
- Friend-room implementation now keeps the same v2 scene language: transparent table field, oval seats, waiting plaques, room info, lower-left controls, and lower-right actions.
- Friend-room and gameplay now consume dedicated ImageGen v2 scene masters (`friend-room-web-pc-v2.png` and `gameplay-web-pc-v2.png`) at the landscape breakpoint; dynamic UI remains layered from React and formal assets.
- The v2 board is a design source only; runtime remains composed from page components and versioned raster assets so room/player/score state stays dynamic.

Current v2 implementation status: home and friend-room PC surfaces have been migrated and visually rechecked. Gameplay, results, and rules continue to use the existing runtime asset composition while the remaining v2 state-specific overlays are being brought into the same visual contract.

### V2 implementation evidence update

- Home: `art/review/web-imagegen-v2-home-landscape.jpg` — dedicated ImageGen v2 master with authored action plaques, visible runtime labels, brand title, and top utility rail.
- Friend room: `art/review/web-imagegen-v2-room-landscape.jpg` — table-first lobby with oval waiting seats, room info, control panel, and action lane.
- Gameplay: `art/review/web-imagegen-v2-gameplay-landscape.jpg` — live local practice state with round scroll, seats, central trick, prediction panel, timer, and compact browser utility rail.
- Results: `art/review/web-imagegen-v2-results-landscape.jpg` — parchment score sheet with six rows and contained footer actions.
- Rules/settings: `art/review/web-imagegen-v2-rules-landscape.jpg` — redesigned tabbed rules modal with chapter navigation, content card, sound toggle, and close action.

The v2 browser carrier now has live evidence for every named design state. Remaining platform limits are the existing internal disconnected-room preview and the separate WeChat carrier acceptance boundary.

### ImageGen v2 pixel and motion calibration — Chrome — 2026-10-16

- Chrome viewport: `2048×971`, device scale factor `1.25`; the authored landscape canvas is now held at `16:9` (`1726.6×971.2`) with quiet side letterboxing so percentage coordinates stay on the source master.
- Chrome evidence captured after the fixes: `art/review/chrome-calibration-2026-10-16/home.png`, `room.png`, `gameplay-chooser.png`, `results.png`, and `rules.png`.
- Refreshed review derivatives: `art/review/web-imagegen-v2-home-landscape.jpg`, `web-imagegen-v2-room-landscape.jpg`, `web-imagegen-v2-gameplay-landscape.jpg`, `web-imagegen-v2-results-landscape.jpg`, `web-imagegen-v2-rules-landscape.jpg`, and `web-imagegen-v2-contact-sheet.jpg`.
- Home action centers now map to the authored plaque bands without the prior ultra-wide vertical drift. Friend-room room information is centered on a parchment plaque, the return action is in the left safe column, the connection rail is compact in the upper-right pocket, and the lower-left control panel no longer crowds the table edge.
- Runtime motion is calibrated to the design rhythm: screen enter `240ms` cubic-out, modal fade `220ms` cubic-out, control hover `180ms`, selected hand lift `140ms` with a `12px` lift and zero-degree rotation, and a one-shot `560ms` confirmation pulse only when the confirm action first appears after selection.
- Chrome interaction checks: home → rules/settings tabs and close; home → friend-room entry and return; home → local practice → trump chooser → bid → trick play → round results. No layout clipping or stale scene asset was observed in the final captures.
- Static gates after calibration: `npm test` (51 files / 447 tests), `npm run typecheck`, and `git diff --check` passed.

final result: passed

## 漆环巡游独立微信评审切片 — 2026-08-23

- Source visual truth: `art/mockups/patrol-gameplay-screen-v1.png`.
- Rendered implementation: `art/review/patrol-active-wechat-devtools-final-847x392.png` and `art/review/patrol-home-wechat-devtools-final-847x392.png`.
- Viewport: WeChat DevTools iPhone 12/13 landscape simulator, captured at `847×392`; normalized comparison content is `694×390`.
- State: independent review home → 5-second observe → target 4 changed to 5 → 60-second simultaneous patrol → queued/cancelled bridge switch → results → return to the independent review home.
- Full-view comparison evidence: `art/review/patrol-active-wechat-comparison-final.png`, containing the selected visual source and the WeChat implementation in one image.
- Flow evidence: `art/review/patrol-review-video-contact-sheet-v2.png` and the uncut `art/review/patrol-wechat-devtools-review-flow-v2.mp4`.
- Focused evidence: `art/review/patrol-active-wechat-content-final-694x390.png`, plus the individually inspected home, observe, target, active-control, results, and returned-home captures. No smaller focused crop was needed because the normalized implementation crop keeps the required HUD, labels, traveler sprites, tea spirits, bridge geometry, and controls readable at native evidence scale.

### Findings

- No actionable P0, P1, P2, or P3 findings remain.
- The final independent audit confirmed that the visible interaction grammar is real-time movement, same-kind tea-spirit collection, speed control, and bridge switching. No hand, deck, suit, rank, trump, trick, dealt-card, or turn-by-turn play surface is visible.
- Intentional runtime differences from the concept image are accepted: the playable slice uses one same-value green tea-spirit type, dynamic traveler positions, target `5`, live counts, a persistent return-home action, and larger bottom touch controls. These changes support truthful behavior and Mini Game usability without changing the selected art direction or layout hierarchy.

### Required fidelity surfaces

- Fonts and typography: passed. The display/interface font split is retained; home, phase, timer, target, control, and result text is readable at `847×392`, with no clipping or unintended wrapping.
- Spacing and layout rhythm: passed. Round, return, timer, target, traveler progress, route, and control bands remain disjoint. The right target HUD clears the WeChat capsule, and the bottom controls clear the system home indicator.
- Colors and visual tokens: passed. Warm lacquer, parchment, old-gold trim, midnight-blue panels, green secondary action, and red/green speed controls match the selected Enchanted Teahouse language.
- Image quality and asset fidelity: passed. The implementation uses synchronized raster masters and the two shipped CJK fonts; no CSS drawing, inline SVG, emoji, placeholder, or unrelated icon asset is present.
- Copy and content: passed. `漆环巡游`, observe, target adjustment, `减速 / 预备换轨 / 取消换轨 / 加速`, target/actual/difference, results, replay, and return-home labels describe the behavior actually demonstrated.

### Comparison history

#### Iteration P1 — blocked

The first WeChat comparison exposed three review-facing problems: no complete return-home path, core copy too small at phone scale, and a right HUD placement that competed with the WeChat capsule. The inherited card-themed share image was also still packaged at the root.

Fixes: added a standalone patrol-native home; added return-home actions during observe, target, patrol, and results; enlarged review-critical typography; moved the target HUD left under an explicit capsule exclusion contract; and replaced the share image with the original non-card `share-card-patrol-v2.jpg`.

#### Iteration P2 — passed after evidence correction

Post-fix evidence: `patrol-home-wechat-devtools-final-847x392.png`, `patrol-target-edited-wechat-devtools-final-847x392.png`, `patrol-active-controls-wechat-devtools-final-847x392.png`, `patrol-results-wechat-devtools-final-847x392.png`, and `patrol-active-wechat-comparison-final.png`.

An independent evidence review found that `patrol-returned-home-wechat-devtools-final-847x392.png` had been overwritten with a results frame even though the video proved the route. The file was recaptured from the final `22:20` WeChat build and now shows the actual independent home. The return action also owns a `152×132` touch rect around its `144×60` paper visual while preserving a 24px design gap from the round scroll. A second independent review found no remaining P0/P1/P2/P3 issue.

### Interactions and console check

- Tested in WeChat DevTools: start, automatic observe transition, target `4→5`, confirm, continuous traveler movement, prepare/cancel switch, accelerate, decelerate, results, replay, and return home.
- The 82-second H.264/yuv420p recording demonstrates the full flow without edits and holds results long enough to read before returning home.
- The Windows simulator emitted one DevTools-side `WAService` device-orientation bridge diagnostic while the flow remained fully rendered and operable; no application blank state, crash, or interrupted transition was observed. Real-device GPU, safe-area, and touch behavior remains a required release check.

### Build evidence and limits

- Latest isolated review build: `cocos-client/build/wechatgame-patrol-review/`.
- Exact package sizes: main `2,271,498` bytes, resources `8,126,228` bytes, total `10,397,726` bytes.
- The package contains exactly 19 whitelisted runtime assets and the original patrol share image; its compiled home/start/return markers are gated.
- Final static captures were taken only after the DevTools touch-feedback circle faded; the uncut video intentionally retains touch feedback as interaction evidence.
- Final repository gates: `npm test` passed 50 files / 445 tests; `npm run typecheck`, `npm run build`, `npm run cocos:build:web`, and `npm run cocos:build:wechat:patrol-review` passed.
- This is intentionally a category-investigation artifact. `legacyCodePathsIncluded: true` and `submissionReady: false` remain accurate; blind testing, platform manual category feedback, a clean final submission carrier without old compiled paths, and iPhone/Android real-device acceptance are still pending.

final result: passed

## Latest authoritative verdict — patrol review slice — 2026-08-23

The current `wechatgame-patrol-review` evidence set supersedes earlier patrol captures. The selected source and refreshed Mini Game implementation were compared at the same normalized `694×390` content size; the 82-second uncut recording and its eight-frame contact sheet cover home, observe, target editing, live controls, results, and the confirmed return-home state. No actionable visual issue remains in this investigation slice. Release acceptance still requires blind testing, platform category feedback, a clean final carrier without compiled legacy paths, and iPhone/Android device checks.

final result: passed

## Mobile rules and settings comparison — latest user screenshot (2026-08-04)

- Evidence: `art/qa/user-screenshot-pass-2026-08-04-5/04-design-vs-user.png` and `03-latest-marked-before.png`.
- P1-S03 marked: the supplied simulator screenshot is byte-identical to the previous 1× pre-fix capture, so the DevTools cache/build has not picked up the 2× canvas template yet.
- P2-S04: panel geometry, tabs, setting rows, timer strip, and restore action remain within the 16:9 safe-area contract.
- Fix: `cocos-client/build-templates/wechatgame/game.js` now preserves logical canvas dimensions and prevents repeated DevTools reloads from compounding the supersample factor.
- Verification limit: clear DevTools cache, rebuild the WeChat target, and recapture before accepting runtime clarity.

final result: source fixed; simulator recheck pending cache clear and rebuild

## Mobile rules page comparison — latest user screenshot (2026-08-04)

- Evidence: `art/qa/user-screenshot-pass-2026-08-04-6/03-rules-design-vs-user.png` and `04-rules-marked-before.png`.
- P1-R01: the supplied rules-page screenshot still shows 1× DevTools raster stair-stepping on TTF copy and gold borders.
- P2-R02: page geometry, tabs, instruction panel, illustration, footer, pagination, and safe-area placement match the 16:9 reference.
- Fix status: the WeChat template already provides 2× DevTools supersampling, idempotent canvas scaling, and the rules illustration is already 1536×910 with linear filtering.
- Verification limit: clear DevTools cache, rebuild the WeChat target, and capture this exact page again.

final result: layout passed; runtime clarity recheck pending cache clear and rebuild

## Mobile selected-card comparison — latest user screenshot (2026-08-04)

- Evidence: `art/qa/user-screenshot-pass-2026-08-04-7/03-selected-design-vs-user.png` and `04-selected-marked-before.png`.
- P1-M07: the supplied screenshot still shows 1× raster stair-stepping on HUD copy, card edges, and the confirm CTA; its timestamp predates the latest 2× build.
- P2-M08: selected hand, local status badge, confirm CTA, six-seat HUD, and countdown remain inside the mobile safe area.
- Fix status: WeChat template supersampling and idempotent scaling are in place; `MatchSceneView.renderHand()` retains compact choice-hand anchoring.
- Verification limit: clear DevTools cache, rebuild, and recapture the same selected-card state.

final result: safe-area layout passed; runtime clarity recheck pending cache clear and rebuild

## Round-results footer actions — latest user screenshot (2026-08-07)

- Source visual truth: `art/mockups/round-results-screen.png` and the dedicated footer band in `art/runtime/ui/round-results-panel.png`.
- Implementation screenshot before the fix: `art/qa/round-results-actions-followup-2026-08-07/01-round-results-actions-marked.png`.
- Viewport: 637×331 landscape Mini Game capture.
- State: round 1 results, local player may continue the round.
- Full-view comparison evidence: `01-round-results-actions-marked.png` and `02-selected-reference.png` were inspected together.
- Focused comparison evidence: `02-actions-crop.png`, `03-current-assets-90.png`, and `04-proposed-assets-100.png`.

### Finding and implementation

- P2 fixed in code: the paper action rendered at `240×100`, while the green primary action rendered at `270×90`; the primary action was therefore 10% shorter and had cramped label-safe margins.
- Fix: the green action now renders at `300×100`, preserving its authored 3:1 proportion and sharing the paper action's 100px visual height. Font size, optical baseline, 120px touch height, footer position, and existing SIMPLE bitmap assets remain unchanged.
- Fonts and copy: unchanged; both actions continue to use the 32px display font and the existing labels.
- Spacing and layout: layout tests confirm both actions and expanded touch targets remain inside the dedicated footer-safe band with at least 20px between actions.
- Colors and image quality: unchanged; source and runtime button assets are byte-consistent and do not require regeneration.

### Verification limit

- The user requested that WeChat DevTools verification remain manual. A post-fix Mini Game screenshot is therefore not available in this run, so the visible result cannot be compared at the same viewport and state yet.

### Iteration 2 — footer border containment

- New evidence: `art/qa/round-results-actions-followup-2026-08-07/06-buttons-overflow-before.png` showed that the enlarged primary action entered the baked footer's rounded right cap.
- Root cause: the previous `1060×120 @ (0,-292)` safe rectangle described an abstract layout band rather than the actual `round-results-panel.png` footer frame, which measures approximately `1016×103 @ (-10,-306)` at runtime.
- Fix: separate the `1020×104` visual frame from the `1020×120` invisible touch band, move all footer visuals to `y=-306`, and redistribute the row to `hint x=-305`, `secondary x=40`, `primary x=335`.
- Post-fix rendered Mini Game evidence is still pending manual recapture.

final result: blocked

## 好友房弹窗高清素材与布局 — 2026-08-08

- Source visual truth: `art/qa/audits/2026-08-08-room-dialog-blur/01-join-room-blur.png` and `02-create-room-blur.png`.
- Implementation screenshots: `07-create-room-v2-web-diagnostic.png` and `08-join-room-v2-web-diagnostic.png`.
- Viewport: 847×402 landscape, matching the project's ultra-wide Mini Game diagnostic viewport.
- State: create-room entry with AI auto-fill enabled; join-room entry with empty room-code field.
- Full-view comparison evidence: `07-create-room-v2-web-diagnostic.png` and `08-join-room-v2-web-diagnostic.png`.
- Focused side-by-side comparison evidence: `09-create-before-after-comparison.png` and `10-join-before-after-comparison.png`.

### Findings and fixes

- P1 fixed — stretched panel texture: the old 482×234 general lacquer panel was nine-sliced to 1060×760 / 1060×650, visibly magnifying its quiet center and ornaments. Create and join now use dedicated final-ratio `v2` panel bitmaps rendered as SIMPLE sprites.
- P2 fixed — text rows and decorative interference: nickname, room-code, and AI-fill controls now use three final-ratio `v2` SIMPLE assets with ornament-free content-safe centers. Runtime text remains centered and readable in both empty and filled states.
- P2 fixed — footer containment: back and primary actions sit fully inside each authored modal frame. The create dialog's AI-fill row occupies its own layout band, and the seat, mode, and footer bands do not overlap.
- P1 fixed — authored safe-area containment: the create panel now renders at its original 1200×860 ratio and every title/content/action band stays inside the decoration-free safe rectangle with at least 8 design pixels between adjacent bands. Join actions were raised into the same contract.
- P1 fixed — compressed selected controls: create-room seat and mode controls now render at 88px, above the 84px combined top/bottom cap height of `ui.panel.secondary`; selected blue controls no longer flatten their nine-slice corners.
- P2 fixed — AI switch affordance: the row now says “开启 · 至少 2 真人后补位” or “关闭 · 不添加机器人”, so state is not conveyed by opacity alone.
- P2 fixed — Mini Game texture caching: all five materially replaced bitmaps use new semantic keys and unique UUID paths instead of reusing the old panel texture identity.

### Required fidelity surfaces

- Fonts and typography: passed. The display/interface font split, font weights, line heights, centered input copy, and action labels remain consistent; no label wraps or clips.
- Spacing and layout rhythm: passed. Title, avatar, input, seat, AI, mode, and action bands remain distinct. Both action rows stay inside the lacquer border.
- Colors and visual tokens: passed. Warm lacquer, old gold, parchment, and midnight-blue controls remain in the selected Enchanted Teahouse direction.
- Image quality and asset fidelity: passed. Five dedicated high-resolution PNGs are rendered without nine-slice stretching. The rebuilt `wechatgame` package contains all five native PNGs at their source dimensions with byte-identical SHA-256 hashes.
- Copy and content: passed. Create/join titles, nickname and room-code prompts, player counts, modes, action labels, and “开启 · 至少 2 真人后补位” are coherent and fit their safe areas.
- Icons and imagery: passed. Existing authored avatar portraits remain unchanged, correctly cropped, and evenly spaced; no CSS/SVG/emoji placeholders were introduced.
- States and interactions: passed. Create/join entry, nickname editing, six-digit room-code editing, AI-fill on/off, and back navigation were exercised. Browser diagnostic logs contained zero errors or warnings.

### Comparison history

#### Iteration FR1 — blocked

Evidence: `01-join-room-blur.png` and `02-create-room-blur.png`. The general panel texture was visibly enlarged, the repeated center decoration competed with input text, and the modal had no dedicated AI-fill band.

#### Iteration FR2 — blocked

Evidence: `05-join-room-fixed-web-diagnostic.png` and `06-create-room-fixed-web-diagnostic.png`. Dedicated final-ratio panels and rows removed the stretched texture, but the create title/footer and join footer still entered the authored ornament-safe insets; the 76/82px selected blue controls also compressed 84px of vertical nine-slice caps.

#### Iteration FR3 — passed

Evidence: `09-create-before-after-comparison.png` and `10-join-before-after-comparison.png`. The enlarged proportional create panel, explicit safe rectangles, 8px minimum band gaps, raised footer actions, 88px selected controls, and explicit AI state copy remove the remaining P1/P2 layout findings.

### Verification

- `npm test`: 26 files, 148 tests passed.
- `npm run typecheck`: passed across game core, protocol, room server, React diagnostic client, and Cocos client.
- `npm run cocos:build:wechat`: passed; `game.json.deviceOrientation` remains `landscape`.
- The rebuilt Mini Game resource config contains all five versioned `/texture` paths. Their native output dimensions are 1482×1062, 1601×982, 1400×152, 1400×164, and 1080×152, with hashes matching the synchronized sources.

### Acceptance limit

The browser captures are layout diagnostics only. Per project policy and the user's instruction, WeChat DevTools/device visual acceptance is intentionally left to manual QA; this run did not connect to or operate WeChat DevTools.

final result: passed
