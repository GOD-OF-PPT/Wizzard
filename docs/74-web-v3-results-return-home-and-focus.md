# 结算返回首页与键盘焦点

2026-10-27。结果页功能优先修复，仍沿用已选奇术茶馆。整体目标active。

## 已复现问题

176真实正常随机练习第一轮结束后，原生Tab四次只在“查看总榜”“继续下一轮”间循环。左上“返回首页”虽然能鼠标点击，却是 `.v3-match > .v3-match-back` 外层节点，不在结算dialog和其Tab约束中。原生状态与矩形收据保存为 `176-results-exit-before-20261027.json`；该次玩家期限自动推进，没有固定seed、fast或状态注入。

## 设计与行为约定

轮次结算和中途总榜拥有自己的左上返回控件，放进各自dialog，参与Tab/Shift+Tab循环。初始焦点仍是继续动作；Tab从最后的主动作返回左上退出，再到纸动作。Escape从中途总榜回到轮次结算，轮次结算Escape不直接弃局。

本地控件调用既有onExit，卸载练习并回首页；网络控件调用同一既有离房确认流程，取消保留房间，确认后等待room.leave ACK再清session回首页。最终总榜继续使用现有页脚返回首页/离开房间，去掉外层重复控件，避免视觉与modal焦点分离。

新入口保留紧凑纸牌视觉，触摸目标至少44CSSpx，可在夜景安静区扩展而不进入标题/表格/页脚。固定字来自内置ImageGen原比例裁片，语义和回调为实时button。

源稿修订先保存再实施：`06-results-home-v2.png`、`33-current-ranking-home-v2.png`（各双画幅）只在左上新入口ROI接受新候选；同控件局部复用到 `34-results-final-round-home-v2.png` 和 `36-current-ranking-final-home-v2.png`。原稿保留，标题/人物/比分/家具/其余RGB保护。提示见 `art/prompts/web-v3-results-home-control-v2.txt`，候选与来源在 `art/source/web-v3/results-home-v2/`。这是既有页面的视觉修订，设计状态数仍44×双画幅。

## 本轮完成

已接线到 `WebResults` 的dialog内，初始焦点仍在主动作；`MatchScreen` 在round-score和match-end不再挂载外层重复入口。最终总榜保留已有页脚返回/离房动作。新控件采用自己的class，避免旧match-back样式影响竖屏。

四次内置ImageGen候选保存在 `art/source/web-v3/results-home-v2/`。06候选横屏偏到x100、竖屏高度超出请求位置，未采用其牌匾；选用33候选的完整紧凑控件，在06/33/34/36八张源稿统一复用。最终ROI为横 `[26,16,202,76]`、竖 `[20,24,250,90]`，先生成八张版本稿再实施。运行四张带源场景边缘的裁片在 `art/runtime/web-v3/results-home-v2/`，生成登记在 `results-home-art.generated.ts`。`source-pixel-proof.json`独立逐像素核对八对源稿，ROI外RGB变化均为0，原设计仍保留。

178批[八组对照](../art/review/web-v3/results-return-home-20261027/index.html)的全景与入口/标题/页脚局部均已按两张一组打开审视。新入口未裁字/切边，文字、金框、背景比例贴合源稿，hit target至少44CSSpx，未碰表格或页脚。横屏请求1672×941，Chrome报告CSS1672×942，原始截图取1672×941；竖屏为390×694。此1px边界及canvas位置保存在原生收据，不宣称全页逐像素相同。画面中部的小箭头是语义点击后的捕获指针，不是游戏内容，未从原图抹除。

本次五项保真：返回文字留在原位图；原题签/表头/页脚字不变，姓名/数字/轮数字形P2保留；布局按源矩形缩放，触摸目标向安静夜景扩展；颜色采用原生成纸面与漆金框，GPU采样细差不冒称闭合；头像继续上一轮十v3/十四v2，身份和动态排序不变；本轮/当前总榜/末轮的真实行为和标签保持。

## 真实行为证据

177是新的正常随机练习第一轮，由正常真人期限自动推进，没有fast、固定seed或权威状态注入。原生键盘经当前已聚焦节点的 `Locator.press` 输入：Tab顺序“继续下一轮→返回首页→查看总榜→继续下一轮”，Shift+Tab反向；各步焦点都在dialog内。Escape本轮不退出，中途总榜Escape返回结算。最后Tab到返回、Enter后home=1、match=0、results=0。`177-results-exit-local-20261027.json`及聚焦原生分片保存完整状态。这不是手动完整打完一轮的证明。

179为独立真实服务8794、前端5176，localhost与127.0.0.1两位访客加一AI。通过实际创建、加入、准备、开始到round-score；UI与底层规则/协议/服务均为现有代码。真人阶段加速到1200ms、AI50ms、墩结果100ms，结算暂停600000ms，不能替代正式时长或完整联机比赛验收。REPL在视觉捕获中重置过，发生在开局前；创建/加入/准备以可见DOM为据，新的事件cursor从原生开始操作之前起，不把旧丢失变量当作连续传输收据。

房主Tab到新返回并Enter，打开阻挡确认，底层screen-layer inert，默认聚焦“继续等待”。Escape取消后回到原round-score，焦点回新返回，session/lease两键保留，观察时没有room.leave。再次Enter打开确认，Tab到确认并Enter后，只出现一个room.leave；服务器room.update.ackCommandId与该requestId一致，随后home=1、match/results=0、session/lease均空。另一位访客也经实际确认离开并取得自己的匹配ACK、回首页和清理。只保存消息类型、命令ID、ACK及白名单状态，不保存令牌。分批事件均未截断；重复游标读数按who/sequence/direction去重，不能把它们累加成多次请求。

两位访客离开后已关闭隔离服务，5176/8794无监听，见 `carrier-cleanup.json`。主开发服务继续保留。

180正常窗口[当前预览](../art/review/web-v3/results-return-home-20261027/180-results-exit-preview-20261027.jpg)已打开并留在Chrome。临时metrics已清除，实际CSS1536×650、原生DPR1.25；分片按实际物理像素拼接1920×813，未缩放伪造截图，原CSS clip坐标另存。图片/字体就绪，控制台error/warn为空，鼠标指示留在左侧安静留白。该页为DEV冻结排版样例，返回/继续回调无动作，真实交互请看177/179收据；不把该预览当作真实比赛。

## 工程与剩余边界

TypeScript、Web正式构建和diff检查通过。95项源/矩形/原生行为/生产载荷核对通过，见 `verification.json`；原70结果PNG加四返回裁片为74源文件，是否内联/去重以runtimeProof逐字节对应为准。候选图和DEV对照路由未进入生产。规则、协议、常驻服务、Cocos均未修改，没有提交、推送或部署。

此轮关闭返回入口的焦点可达性和局部图像接线问题。完整focus/hover艺术、动态姓名/数字字形、纸纹/alpha/GPU采样、其他人数/长名/断线及计时分支源稿、docs66时钟仍未完成。八张为既有06/33/34/36的双画幅修订，清单仍44状态×双画幅，不是88个已通过页面。最终总榜去重复的条件已实施；本轮没有重新跑完整终局，页脚行为沿用docs71历史证据，不能视为新的终局验收。整体目标继续active。

final result: blocked
