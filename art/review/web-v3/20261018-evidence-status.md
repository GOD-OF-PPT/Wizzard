# 2026-10-18 当前批次证据

整体尚未通过。比较图左侧是不可变设计，右侧是Chrome实现；使用相同状态/数据及归一化画幅。JPEG差异统计不作为验收阈值。

## 当前有效

- `audit-20261018-index.html`：当前21页/状态的42组横竖source/Chrome全景、聚焦和尺寸记录，新增大厅可开始、规则其余三章及设置。04使用语义一致的waiting/ready-v2，08使用字体加载后的wenkai-final。05竖屏改用独立安全区v2设计，14竖屏采用safe-v3；旧稿自己覆盖最后手牌，不继续把该缺陷当保真要求。图像数量不等于通过。
- `20261018-current-capture-geometry-audit.json`：42组均为正确完整画幅，无错误裁图或读图失败。该审计不是视觉自动通过。
- `20261018-rule-ink-calibration.json`与`20261018-lobby-rules-geometry.json`：指定字块暗字边界及Chrome正文/步骤/页脚安全区；当前规则标题/正文/步骤采用61KB WenKai字集，不把字块对齐扩展为字形AE=0。
- `04-lobby-{readiness,full-ready}-{landscape,portrait}-network-20261018.jpg`：本批次真实六席房498262，双真人准备/取消、AI增减、禁用原因、满席可开始。双方确认离开后停止临时代理。它们早于最后大厅头像替换，不能代表新头像最终像素。
- `20261018-hand-safety.json`、`05-eight-hand-{landscape,portrait}-20261018.jpg`：实际DOM键盘选择1–8张，两个画幅均无舞台溢出或动作矩形交集。八张截图在正确新建的目标画幅标签重拍；早期把390×694命名landscape的临时帧已被正确1672×941覆盖，未用于验收。
- `15-reconnecting-*-20261018.jpg`、`16-session-ended-*-20261018.jpg`：冻结同内容排版；真实网络图必须带network。后者来自独立真实8791房间服务和5174回环transport代理，不是页面状态注入。
- `15-reconnecting-*-network-20261018.jpg`、`15-recovered-landscape-network-20261018.jpg`、`16-session-ended-*-network-20261018.jpg`：实际房874422断线、保留原牌桌、同身份恢复、QA服务重启导致真实失效、显式返回后刷新仍在首页。状态与第4轮稿件不同，只证明交互/服务行为。

- `08-{quick,trump,play,scoring,settings}-{landscape,portrait}-wenkai-final-20261018.jpg`：五种规则/设置状态的最新UI。状态切换真实，DEV偏好回调不持久化，真实偏好操作见此前记录。设置标签和说明字体遗漏已单独修正并复拍；非首章时没有旧绿色首章高亮，设置没有任何章节高亮。
- `02-create-masked-{landscape,portrait}-final-20261018.jpg`与`03-join-masked-{landscape,portrait}-final-20261018.jpg`：当前静态原像素+动态字段合成后的最终表单。相应comparison/focus为当前对照。
- `02-create-empty-masked-portrait-20261018.jpg`、`03-join-empty-masked-portrait-20261018.jpg`：只证明空值未透出设计样例，未把它们当成源稿同内容比较。
- `02-create-3seat-masked-portrait-20261018.jpg`：只选3人，6人没有残留勾；仍为真实DOM控件。设置恢复默认和昵称校验均已实际操作。
- `12-connection-error-{portrait,landscape}-live-20261018.jpg`：真实不存在房间错误；对应comparison/focus为独立12号设计对照。返回修改、重试和修改后加入是真实流程，字段没有丢失。
- `13-connecting-{portrait,landscape}-live-20261018.jpg`：最终复拍是真实WebSocket握手等待，使用界面“减少动效”排除过渡帧，opacity=1。临时延迟器随后关闭，正式8787房间服务已恢复，偏好已恢复默认。
- `04-lobby-fixture-{portrait,landscape}-refined-20261018.jpg`：当前组件同内容排版样例，已包含动物AI头像、云瓣昵称牌、状态胶囊、上移且不被名字牌遮住的准备勾。它不是联机运行证据。竖屏头像最后按源稿放大并重新叠放名字牌，末席底439.25、管理区顶520.25。
- `04-lobby-3seat-portrait-network-20261018.jpg`：双真人准备+AI后可开始，且均通过确认正常退出。4/5/6席network截图只覆盖单真人容量和碰撞检查。上述联机图在最后的头像美术细化之前，不是当前像素最终图。

## 历史或修复前，不能代替当前验收

- `08-rules-*-proof-20261018*`为四种字体光学试字；KaiTi未复制/分发，ZhenKai未采纳；WenKai最初加载/缺少布局功能帧不能作为最终页。当前必须用wenkai-final及重新生成的audit08比较。
- 早期`04-lobby-components-*`和`04-lobby-fixture-*`保留当时图；最新大厅头像或家具变化后，必须使用重拍的audit04，不能沿用这些旧图。

- 所有不带`final`的规则截图：固定分带/正文换行/关闭标签重复等修复之前。
- `02-create-{landscape,portrait}-final-20261018.jpg`和`03-join-{landscape,portrait}-final-20261018.jpg`：整幅清理层作底图的旧版本；后续改成局部遮罩。当前必须采用带`masked`的文件。
- 历史comparison对应其自己的JPG；原文件被修复后复拍时，需要重新运行比较工具，不沿用旧比较。
- `04-lobby-*-before-20261018.jpg`是昵称板/头像/安全区修复之前。最初断开端口时，连接中画面很快进入失败，不能拿初次截图当等待态；当前同名13号文件已在受控握手延迟下重新复拍，并重新生成对照。

## 被拒用的候选

- `cards/*-v1.png`：连续双边框、角标过大，消费v2；`trump-status-v1.png`纸芯5.59:1不符，改内在4.92:1的v2，不拉伸。
- `16-session-ended.png`及其v1面板：座位失效文案不能泛指所有协议终止，正式用通用结束连接的v2。
- `portrait/14-gameplay-notimer-safe-v2.png`：按钮下移后底边余量/位置漂移，正式源稿使用从05-safe-v2只去计时器的safe-v3。
- `05-active-native-debug.jpg`：1672×744物理裁图；`05-active-full-debug.jpg`仅调试。旧`05-gameplay-*-refined`早于最终纸签和竖屏动作分带；当前以audit05为准。

- `switch-on-v2.png`：绿色内部透明孔洞。
- `seat-selected-{portrait,landscape}.png`：首版高光/边框与可见比例跑偏。采用精确源图控件参考生成的`*-v2.png`，其部分alpha由真实状态色作为底层合成。
- 所有源图小裁区位于`art/reference/web-v3/`，只用于给ImageGen准确参考，不作为手工制作的运行时图标。

当前总体结论以根目录`design-qa.md`顶部为准。该结论仍为blocked；全局目标仍在推进，不是遇到无法继续的外部阻塞。
