# 2026-10-18 当前批次证据

整体尚未通过。比较图左侧是不可变设计，右侧是Chrome实现；使用相同状态/数据及归一化画幅。JPEG差异统计不作为验收阈值。

## 当前有效

- `08-{quick,trump,play,scoring,settings}-{landscape,portrait}-final-20261018.jpg`：五种规则/设置状态的真实UI。新状态设计位于`art/mockups/web-v3/`及`portrait/`；非首章时没有旧绿色首章高亮，设置没有任何章节高亮。
- `02-create-masked-{landscape,portrait}-final-20261018.jpg`与`03-join-masked-{landscape,portrait}-final-20261018.jpg`：当前静态原像素+动态字段合成后的最终表单。相应comparison/focus为当前对照。
- `02-create-empty-masked-portrait-20261018.jpg`、`03-join-empty-masked-portrait-20261018.jpg`：只证明空值未透出设计样例，未把它们当成源稿同内容比较。
- `02-create-3seat-masked-portrait-20261018.jpg`：只选3人，6人没有残留勾；仍为真实DOM控件。设置恢复默认和昵称校验均已实际操作。
- `12-connection-error-{portrait,landscape}-live-20261018.jpg`：真实不存在房间错误；对应comparison/focus为独立12号设计对照。返回修改、重试和修改后加入是真实流程，字段没有丢失。
- `13-connecting-{portrait,landscape}-live-20261018.jpg`：最终复拍是真实WebSocket握手等待，使用界面“减少动效”排除过渡帧，opacity=1。临时延迟器随后关闭，正式8787房间服务已恢复，偏好已恢复默认。
- `04-lobby-fixture-{portrait,landscape}-refined-20261018.jpg`：当前组件同内容排版样例，已包含动物AI头像、云瓣昵称牌、状态胶囊、上移且不被名字牌遮住的准备勾。它不是联机运行证据。竖屏头像最后按源稿放大并重新叠放名字牌，末席底439.25、管理区顶520.25。
- `04-lobby-3seat-portrait-network-20261018.jpg`：双真人准备+AI后可开始，且均通过确认正常退出。4/5/6席network截图只覆盖单真人容量和碰撞检查。上述联机图在最后的头像美术细化之前，不是当前像素最终图。

## 历史或修复前，不能代替当前验收

- 所有不带`final`的规则截图：固定分带/正文换行/关闭标签重复等修复之前。
- `02-create-{landscape,portrait}-final-20261018.jpg`和`03-join-{landscape,portrait}-final-20261018.jpg`：整幅清理层作底图的旧版本；后续改成局部遮罩。当前必须采用带`masked`的文件。
- 历史comparison对应其自己的JPG；原文件被修复后复拍时，需要重新运行比较工具，不沿用旧比较。
- `04-lobby-*-before-20261018.jpg`是昵称板/头像/安全区修复之前。最初断开端口时，连接中画面很快进入失败，不能拿初次截图当等待态；当前同名13号文件已在受控握手延迟下重新复拍，并重新生成对照。

## 被拒用的候选

- `switch-on-v2.png`：绿色内部透明孔洞。
- `seat-selected-{portrait,landscape}.png`：首版高光/边框与可见比例跑偏。采用精确源图控件参考生成的`*-v2.png`，其部分alpha由真实状态色作为底层合成。
- 所有源图小裁区位于`art/reference/web-v3/`，只用于给ImageGen准确参考，不作为手工制作的运行时图标。

当前总体结论以根目录`design-qa.md`顶部为准。该结论仍为blocked；全局目标仍在推进，不是遇到无法继续的外部阻塞。
