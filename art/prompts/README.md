# 美术生成提示记录

所有正式位图均使用内置 Image Gen 生成或扩展，并以 `art/reference/gameplay-selected.png` 与已通过的角色/卡牌母版作为视觉锚点。本文件保存后续重做或扩展时必须延续的核心约束；最终交付状态为 **passed**。

## 牌桌背景

```text
Create a clean 16:9 Enchanted Teahouse game-table background: a large warm reddish-brown lacquered round table on an open nighttime terrace, with distant pagodas, ink-wash mountains and clouds, warm paper lanterns, dark timber, ceramic and plant details at the perimeter. Keep a large uninterrupted central play area and safe zones for six seats. Premium polished 2D hand-painted game environment. No players, avatars, cards, text, UI, logos or gameplay markers.
```

## 正式卡牌体系

```text
Create one portrait 2:3 formal game-card master at 1024x1536. Preserve the exact Enchanted Teahouse parchment, antique-gold frame, corner ornament, palette, lighting and empty numeral zones established by the approved card family. Keep the symbol centered and readable at 256x384 runtime size. Original East Asian folk-print / woodblock ornament. No text, numerals, letters, people, Wizard branding, logos, copied symbols or extra card mockups.
```

正式卡牌共七张：卡背、山、结、叶、日、至高牌、虚无牌。数字牌在运行时叠加 1–13。

### 卡牌局部返修

- `card-back-master.png`：修正装饰一致性与旋转安全性；
- `knot-face-master.png`：修正中心绳结、边框和数字留白；
- `highest-special-master.png`：修正主体层次、边框与上下留白。

返修只改变指定局部，不重绘卡框、比例、纸张、光照或其他已通过区域。正式源尺寸统一为 1024×1536，运行时统一为 256×384。

## 六位角色四表情

```text
Use the approved runtime avatar as the exact identity anchor. Create a square 2x2 expression sheet with four equal independent medallion portraits: top-left normal, top-right thinking, bottom-left proud, bottom-right mistake. Preserve the exact character, species or mask, costume, antique-gold medallion frame, midnight-navy backing, palette, camera, scale and warm storybook lighting. Expressions must remain readable at 160x160. Light chin, ear or head movement and a subtle thinking hand pose are allowed, but do not redesign the identity. No text, labels, watermark, extra characters, cropped frames or existing IP.
```

角色为竹笠猫、云游鹤、花面狐、墨熊猫、瞌睡星猫和面具旅人。每张最终独立源文件为 1024×1024，运行时文件为 512×512。

### 头像裁切返修

首次四象限裁切在共享边缘残留了中央分隔线。最终导出已从所有独立象限四周清除分隔线，再生成 512×512 运行时版本。后续重导出必须复查四边，不得只检查联系表。

## 规则提示插图

```text
Create a 3:2 Enchanted Teahouse tutorial illustration showing the essential friend-game action in one readable tabletop scene. Use the approved lacquer table, parchment cards, antique-gold accents and warm midnight-blue lighting. Keep the center action clear for an overlay caption added by the UI. No embedded text, labels, logos, watermark, copied card-game branding or unrelated characters.
```

正式源尺寸为 1536×1024，运行时尺寸为 768×512。

## 三组教程手势

```text
Create one four-frame tutorial gesture strip, four equal 256x256 cells, with the same gloved hand, costume, gold ornament, camera, scale and lighting in every frame. The hand must be isolated on a clean transparent background with stable edges and no shadow plate. No text, labels, card art, UI panel, watermark, extra hands or identity drift.
```

- `bid-tap`：指尖完成一次清楚的点击准备动作；
- `play-confirm`：指尖完成一次确认点击动作；
- `card-drag`：保持同一手势造型和比例，仅做一致位移。四帧透明内容偏移依次为 `(10,32)`、`(43,24)`、`(76,16)`、`(109,8)`，即每帧固定 `(+33,-8)`，形成匀速向右上拖动；不得加入逐帧缩放、旋转或忽快忽慢的位移。

三组最终运行时资源均为 4 帧透明 PNG，单帧 256×256。

## UI 装饰图集

```text
Create a 2048-square UI atlas containing separate opaque objects: hanging parchment title scroll, glowing circular turn button, wide lacquer primary button, dark-blue secondary button, bid plaque, green won-trick plaque, trump tile, countdown ring, disconnected badge, AI-control badge and long paper score ribbon. Straight-on, evenly spaced, no overlap, no text or numerals, consistent lacquer/parchment/antique-gold styling.
```

## 反馈特效

```text
Create a 2048-square 3x2 FX atlas with exactly six isolated effects: soft jade legal-card halo, antique-gold selected-card rim, golden paper-petal trick-win burst, vermilion prediction-success seal without text, charcoal ink-splash prediction-miss effect, and midnight-blue reconnecting cloud spinner. Match the teahouse paper-cut, ink-wash and lantern-glow style. No text, cards, panels, sci-fi particles or watermark.
```

## 首页

```text
Create a 1920x1080 landscape home screen extending the Enchanted Teahouse reference. Use the nighttime table and three welcoming animal travelers. Show title "奇术茶馆", primary "创建房间", secondary "加入房间" and "单人练习", small "规则与设置", footer "好友体验版". Preserve generous negative space and a game-world feeling. No dashboard, store, currency, ads, events or Wizard branding.
```

## 好友房

```text
Create a 1920x1080 friend-room screen on the lacquer table with six natural seat positions: four occupied, one "等待好友", one "AI 待命". Show "好友房 628315", "快速局 · 8 轮", "6 人桌", "AI 补位：开", "4/6 已准备", "邀请好友" and primary "开始游戏". Keep the center clear and avoid profile-card dashboard layouts.
```

## 轮次结算

```text
Create a 1920x1080 round-results screen with the dimmed table behind one large centered parchment scroll. Title "第 4 轮结算"; columns "玩家 / 预测 / 赢墩 / 本轮 / 总分"; six aligned player rows; hint "预测准确获得 20 分基础分"; secondary "查看总榜" and primary "继续". Handmade paper, restrained floral corners and highly readable Chinese type; no rewards, currency, confetti or dashboard cards.
```

## 输出约束

- 正式清单只引用最终源文件和运行时文件；
- 生成中间图、抠图底稿与编辑辅助画布只用于过程追溯，不进入运行时清单；
- 每轮导出后使用联系表检查风格，再逐张检查透明边缘、裁切边缘、尺寸和身份一致性。
