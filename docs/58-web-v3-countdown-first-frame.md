# Web v3：真人预测首帧计时修复

日期2026-10-25。接续docs/57的1→30疑点。本轮首先关闭该功能边界，完整逐页设计/视觉目标仍active，整体未通过。

## 真实复现与判据

在正常Chrome首页进入真实单人练习，按需实际选择王牌。用requestAnimationFrame逐帧读取localPhase=bid时的计时文字、aria-label、预测标题和可见性；预期第一帧为30秒，不能继承AI余下的1秒。

已运行的同一CUA观察函数为`runClockProbe(label)`。修改前3次中2次失败：预测标题已经出现、计时可见且aria-label为“青竹客剩余1秒”，下一帧变30。第三次直接30，说明是绘制时序问题，而不是每次必现的错误配置。[before.json](../art/review/web-v3/countdown-first-frame-20261025/before.json)与[after.json](../art/review/web-v3/countdown-first-frame-20261025/after.json)保存实际runner、短/长观察表达式及全部帧；未注入规则状态或强制计时值。

先列的假设：被动effect晚于绘制、旧interval回调残留、共享调度器短暂计划了错误期限。只改变一个变量：当前计时初始化及清理从`useEffect`提前到`useLayoutEffect`。同一共享`planNextMatchAction`、dueAt、30秒配置、AI延迟和执行路径均未改变。

## 修复和验证

`src/hooks/useLocalMatch.ts`的当前动作effect现在在绘制前发布新计时并清理旧interval，避免UI已切到真人而数字仍属于上一AI动作。

同一真实Chrome观察环修改后连续6次首帧均30。第6次明确观察1256ms、77帧，序列30→29，没有1回写。第5次原标签叫long但实际仍约220ms，记录按实际短窗口保留，不能用它证明跨间隔；第6次才是有效长窗口。所有练习均通过实际返回首页结束。

没有增加浅层单元测试来假冒React绘制时序的复现；正确边界是实际hook→DOM→requestAnimationFrame链，已有可重复、能捕获错误的浏览器回归环。此验证覆盖本地AI→真人预测首帧，不能扩展为网络时钟、全部阶段切换、后台标签或所有浏览器验收。

该改动没有改变DEV静态比较样例或画面几何，docs/57的68批次仍保留其原同态比较范围/P2。原71的真实30→29证据与本次首帧证据分开。

## 仍需继续

卡纸/符号/动态数字、头像/HUD、面板字形/位置仍P2；独立hover/focus与错误组合、有计时密集手牌和等待他人预测、真实异常ACK/重连所有权、联网终局/重开均不能据此通过。下一步继续源卡面局部修复及同视口比较。

final result: blocked
