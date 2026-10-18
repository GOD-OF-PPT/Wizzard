# Portrait terminal session state

Tool: built-in ImageGen edit, text-localization / precise text edit.
Edit target: `art/mockups/web-v3/portrait/15-reconnecting.png`.
Output: `art/mockups/web-v3/portrait/16-session-ended.png`, exact 941×1672.

Edit ONLY the center modal's Chinese text in this existing portrait image. Preserve the background gameplay, dimming level, every animal traveler, all cards, lacquer wood, lanterns, modal size and position, midnight-blue surface, gold frame, cloud decoration, parchment button and typography style unchanged.

Replace title `正在恢复连接` with exact title `当前座位已失效`. Replace first body paragraph with exact `茶馆未能恢复你的房间座位。` Replace second body paragraph with exact `返回首页后，可重新加入好友房。` Set button exact text `返回首页`.

Keep title one centered line at a readable size that fits; body may use balanced centered lines within the same safe area. This is terminal lost-seat state: no retry text, no progress, no countdown, no success indicator. Change only these four text fields; retain the original visual composition exactly.

## v2: general terminal connection state

Edit target: `art/mockups/web-v3/portrait/16-session-ended.png`.
Output: `art/mockups/web-v3/portrait/16-session-ended-v2.png`, 941×1672. Preserve v1.

Precise Chinese text edit only. Keep this portrait design exactly 941×1672 and preserve all background, scene, panel geometry, gold cloud frame, midnight-blue texture, typography style and parchment button. Change ONLY modal title `当前座位已失效` to `本次连接已结束`. Change ONLY first body sentence `茶馆未能恢复你的房间座位。` to `茶馆暂时无法继续当前连接。` Keep second sentence exactly `返回首页后，可重新加入好友房。` and button exactly `返回首页`. Keep all original spacing and original line breaks as closely as possible. No retry, countdown, progress, success text or seat-specific error anywhere. Preserve complete original composition outside those two text fields.

### v2 runtime panel extraction

From the v2 design, extract ONLY its complete central midnight-blue gold-frame modal, including top crest, projecting bottom-right gold cloud, all static title/body text and parchment `返回首页` button. Keep exact geometry, aspect ratio around 594:633, Chinese text, lettering sizes and layout. Output a near-square slightly portrait transparent PNG with a small transparent margin. Preserve opaque midnight-blue interior and parchment button. Exterior must have true alpha transparency, no gameplay scene, travelers, cards, dimming scrim, red table pixels or color fringes. No text reflow or redesign. Save `art/runtime/web-v3/session-ended-panel-portrait-v2.png`.
