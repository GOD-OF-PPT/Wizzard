# 2026-10-19 顶部模式牌匾

修复前只有居中文字，缺少源稿人物图标，字体过大。新增独立ImageGen持茶人物透明位图；源与运行时文件及裁切记录见`art/prompts/web-v3-mode-player-v1.md`。未替换整幅设计或背景。

牌匾内容采用flex：2cqw人物图、0.55cqw间距、1.45cqw墨书中文、width10.2%，位于top2.3%/right2.1%。中文/数字仍用现有字体子集，不引入新字体。Chrome1672×941同状态截取`32-mode-landscape-20261019.jpg`，与不可变05稿生成全景/聚焦/叠图，已实际打开顶部聚焦比较，人物与文字都位于原牌匾内。图标杯身/轮廓笔触与源稿略不同，保留P3，不声称像素复制。

模式文案同时区分connected→好友对局、reconnecting→重连中、disconnected→连接中断。终止夹具使用真实disconnected语义，ChromeDOM已读到连接中断。竖屏仍按独立稿隐藏模式牌匾；390×694实测display:none、无横向溢出。

root TypeScript与diff检查通过。本批关闭缺失模式人物图标与终止状态误标重连；全局卡面/头像/交互稿/网络恢复等剩余项仍未关闭。目标active，整体QA blocked。
