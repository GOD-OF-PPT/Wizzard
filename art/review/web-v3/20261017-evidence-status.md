# 2026-10-17 证据有效性

本批次不是整体验收通过。`*-comparison.png`均为左侧不可变设计、右侧Chrome截图；`*-overlay.png`为50%叠加。390×694对照含重采样/JPEG，不用于声称像素零差异。

## 有效但只覆盖指定范围

- `07-ranking-portrait-refined-20261017.jpg`及comparison：与设计相同六名玩家/分数的开发排版样例，不证明真实对局到最终榜单。
- `09-confirm-portrait-20261017.jpg`及comparison：无焦点静态确认样例，按钮中心命中真实DOM，两个51px高热区不相交。
- `01-home-portrait-20261017.jpg`、`02-create-portrait-20261017.jpg`、`03-join-portrait-20261017.jpg`及comparison：真实表单，创建/加入的昵称为茶客听雨，加入码628315仅作输入样例，未向服务端提交不存在的房间。
- `08-rules-portrait-20261017.jpg`：修复前；`08-rules-portrait-refined-20261017.jpg`：去除重复导航底板并放大标题/步骤之后的中间帧，尚未包括最终步骤纸签素材，不作为最终复拍。
- `05-selection-switch-portrait-20261017.jpg`：真实第4轮，切换合法手牌，卡牌/分数与设计样例不同，只证明交互、动态布局和选中动效。
- `08-rules-portrait-final-20261017.jpg`及comparison/focus：包括最终纸签与安全带修复，快速上手正文286px完整显示，距页脚8.34px；不代表其他章节/设置状态通过。
- `02-create-portrait-final-20261017.jpg`及comparison/focus：开启/关闭文字单行后的复拍。
- `09-confirm-portrait-network-final-20261017.jpg`及comparison/focus：真实房间658275，静止帧已打开检查并对照，后续确认退出成功。
- `10-bid-portrait-final-20261017.jpg`：真实首轮、动态预测1，专用背景无多余绿色空按钮，键盘与焦点已操作；不是源稿第4轮内容。

## 排除，禁止当成通过证据

- `05-multi-selected-live.jpg`：没有成功选中；`05-multi-selected-live-v2.jpg`：旧错误牌仍在。
- `07-ranking-live.jpg`与`07-ranking-comparison.png`：旧第8轮结算被误命名为最终榜单，非同一状态。
- `05-multicard-selected-20261017.jpg`：浏览器保存到了选择过渡帧，不能用于静态视觉比较；错误清除由该次DOM交互与后续稳定选择证明。
- `09-confirm-portrait-network-20261017.jpg`：早期工具内联预览出现空白，曾被误判为落盘文件也为空白；直接打开文件复核后确认它实际包含完整确认页。为避免历史采集状态混淆，当前仅采用`09-confirm-portrait-network-final-20261017.jpg`及其对照为有效最终证据。
- `10-bid-portrait-live-20261017.jpg`：移除重复绿色空按钮、下移本地席之前的修复前证据。

不删除这些历史文件，不覆盖不可变设计，也不沿用历史passed结论。当前有效总报告位于仓库根`design-qa.md`顶部。
