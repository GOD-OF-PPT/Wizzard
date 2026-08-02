# 资料来源与研究记录

## 用户提供资料

原始照片保存在 `docs/reference/source-rulebook/`：

- `01-cover.jpg`：产品封面、人数和年龄信息；
- `02-rules.jpg`：发牌、王牌、预测和出牌规则；
- `03-overview.jpg`：组件、目标、四色数字牌及特殊牌说明。

照片显示原版支持 3–6 人、60 张牌、约 45 分钟，并确认每种颜色数字 1–13、4 张最高特殊牌与 4 张最低特殊牌。

## 公开规则补充

- UltraBoardGames：<https://www.ultraboardgames.com/wizard/game-rules.php>
- U.S. Games Systems 2025 规则 PDF：<https://www.usgamesinc.com/files/attachments/850/2025_Wizard%20rules.pdf>

用于补足的关键边界：

- 第一张至高牌赢得该墩；
- 虚无牌领出后，下一张普通牌决定领出花色；
- 整墩均为虚无牌时第一张获胜；
- 命中预测得 20 分基础分并按赢墩追加 10 分；
- 偏差每墩扣 10 分；
- 3/4/5/6 人经典局分别为 20/15/12/10 轮。

## 平台资料状态

已补充核对微信小程序、小游戏与 Cocos Creator 公开文档。可确认：两端都支持横屏、WebSocket 与分享；小程序以页面、WXML/WXSS 和组件为主，小游戏以 Canvas/游戏引擎为主；Cocos Creator 3.8 有正式微信小游戏构建目标。仍不固化可能变化的包体上限、基础库版本或审核字段，这些数值必须在制作体验版和正式发布前重新确认。

平台资料：

- <https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html>
- <https://developers.weixin.qq.com/minigame/dev/reference/configuration/app.html>
- <https://developers.weixin.qq.com/miniprogram/dev/framework/structure.html>
- <https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html>
- <https://developers.weixin.qq.com/minigame/dev/guide/develop/start>
- <https://developers.weixin.qq.com/minigame/dev/guide/base-ability/network.html>
- <https://developers.weixin.qq.com/minigame/dev/guide/open-ability/share/share.html>
- <https://developers.weixin.qq.com/minigame/introduction/guide/type.html>
- <https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-wechatgame.html>

## 知识产权判断

规则机制本身与具体表达应分开处理。本项目只借鉴预测墩数、逐轮加牌和特殊牌优先级等机制；产品名称、世界观、花色符号、特殊牌名称、卡面、角色、文案、音效与营销素材全部原创。正式外发前仍需由项目所有者确认美术生成记录、字体许可和最终名称可用性。
