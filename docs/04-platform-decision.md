# 小程序与小游戏技术选择

状态：**Accepted — 正式客户端采用微信小游戏 + Cocos Creator 3.8 2D。**

## 结论摘要

判断标准同时包含“开发维护轻便”和“完整实现全部功能”。如果目标只是房间表单和静态牌面，小程序的 WXML/WXSS 更容易上手；但当前选定方案是全屏横版牌桌，包含六个座位、扇形手牌、翻牌、拖放、回合动效和持续状态同步。小程序最终仍要引入 Canvas 并维护“页面组件 + 画布”两套布局与输入体系，早期省下的工程量会在牌桌阶段重新付出。

小游戏前期需要建立 Cocos 场景，但布局、Sprite、触控、Tween、Animation、图集、音频和横屏发布都在同一体系内。对于当前项目，小游戏是完整生命周期内更轻便、实现风险更低的选择。

## 对比

| 维度 | 微信小程序 | 微信小游戏 |
| --- | --- | --- |
| 普通页面与表单 | 最简单 | 需要自行构建游戏 UI |
| 横版全屏牌桌 | 可以实现，但页面与 Canvas 协调较多 | 原生面向全屏 Canvas/WebGL |
| 扇形手牌与连续动画 | 需要额外 Canvas 体系 | 游戏引擎或 Canvas 场景更自然 |
| Cocos Creator | 没有等价的原生小程序发布目标 | 有正式微信小游戏构建目标 |
| 游戏循环、音频、触控 | 需要自行组织 | 运行时与游戏 API 更匹配 |
| 分享、登录、WebSocket | 支持 | 支持 |
| 规则页和普通控件 | WXML/WXSS 更方便 | 需在游戏 UI 中实现 |
| 将来扩展动效与特效 | 容易遇到双渲染体系 | 风险较低 |

## 推荐实现

- 客户端：微信小游戏，横版锁定；Cocos Creator 3.8 LTS + TypeScript；
- 引擎只启用 2D UI、Sprite、Tween、Animation、图集和音频等必要模块，不引入 3D、物理或粒子重模块；
- 规则：独立纯 TypeScript 包，可同时在浏览器、小游戏客户端和 Node.js 服务端运行；
- 服务端：Node.js WebSocket 权威房间服务，腾讯云托管；
- Redis：保存活跃房间、序号和断线快照；
- 当前 Vite/React 工程：仅用于快速视觉与规则交互验证，不作为最终微信运行时。

## 为什么不选择小程序作为正式客户端

小程序仍适合制作管理页、活动页或极轻量规则演示，但这些都不是本项目的核心交付物。跨小程序与小游戏迁移时，只能稳定复用规则、协议、服务端和美术，WXML/WXSS 页面与 Cocos 节点无法直接复用，因此不先做小程序正式版再迁移。

## 发布前置风险

- 体验版只对后台添加的体验成员开放，不能作为任意好友可直接转发进入的长期私有分发方式；
- 小游戏一级类目注册后通常不能修改，注册时必须选择正确类目；
- 微信当前规则提示个人主体暂不支持牌类小游戏。如果本项目会被平台归入“牌类”，必须在投入正式发布前确认主体资质；
- 分享参数只携带短期 `inviteToken`，不得包含房间秘密或完整状态；
- 小程序与小游戏的 WebSocket 约束基本一致，平台选择不会消除权威服务、心跳、重连、状态重同步和幂等要求。

发布前必须重新核对当时微信官方文档中的包体、基础库、横屏、域名、隐私与体验成员规则。

## 主要资料

- [小程序目录结构](https://developers.weixin.qq.com/miniprogram/dev/framework/structure.html)
- [小程序 Canvas](https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html)
- [小游戏项目结构与引擎建议](https://developers.weixin.qq.com/minigame/dev/guide/develop/start)
- [小游戏屏幕与离屏 Canvas](https://developers.weixin.qq.com/minigame/dev/api/render/canvas/wx.createCanvas.html)
- [小游戏分享](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/share/share.html)
- [小游戏类目限制](https://developers.weixin.qq.com/minigame/introduction/guide/type.html)
- [Cocos Creator 3.8 发布微信小游戏](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-wechatgame.html)
