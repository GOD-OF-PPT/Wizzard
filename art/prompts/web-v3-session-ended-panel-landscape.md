# Landscape session-ended modal component

Built-in ImageGen transparent extraction from `art/mockups/web-v3/16-session-ended.png`.

Output: `art/runtime/web-v3/session-ended-panel-landscape-v1.png`.

Measured canvas 1643 x 957, RGBA alpha 0..1. Visible bounds at alpha 10%: 1488 x 859 at +78+44, visible aspect 1.732:1 versus reference approximately 1.716:1. Outside is transparent; no scene, people or cards. Chinese title, both body lines and return-home button inspected. Generated reconstruction retains composition but is not a pixel-identical crop.

Exact prompt:

```text
Use case: background-extraction
Edit target: supplied session-ended gameplay design.
Extract ONLY the complete central midnight-blue gold-framed modal from source rectangle approximately x449–1223, y235–686. Standalone runtime bitmap, genuine RGBA transparency everywhere outside modal silhouette. Include top gold cloud crest, entire gold frame, navy textured interior, restrained floral/cloud ornament, static text and parchment return button. Remove ALL teahouse, characters, cards, dark overlay and scene pixels outside the modal.
Preserve EXACT original modal composition, geometry and width:height approximately 774:451 (1.716:1) INCLUDING crest. Do not rearrange, redesign or change proportions. Center asset with small transparent border, visible subject filling 96–98% canvas, target about 1548x902 visible pixels or equivalent.
Keep the exact original Chinese lettering and line placement:
Title: "当前座位已失效"
First body line: "茶馆未能恢复你的房间座位。"
Second body line: "返回首页后，可重新加入好友房。"
Button: "返回首页"
Faithfully retain warm gold title, cream body type, single cream parchment button with dark label. No new text, no retry, no countdown, no progress or success claim. No background rectangle, no baked checkerboard, no surrounding shadows containing scene colors. The OUTSIDE must be truly transparent while navy modal face stays opaque.
```


## V2 general terminal connection panel

Built-in ImageGen. Original v1 preserved. Measured output: 1643 x 957 RGBA; alpha 0..1; alpha 10% visible bounds 1476 x 866 at +84+20.

Exact v2 prompt:

```text
Use case: background-extraction. Extract ONLY the complete central midnight-blue gold-framed modal from this supplied image, including top cloud crest, blue face, gold border, floral decorations, static title, both body lines and parchment button. Keep source modal geometry approximately 774:451, original text layout and proportions. Small transparent margin; genuine RGBA alpha zero outside silhouette. No teahouse, people, cards, scene, dark backdrop or overlay pixels.
Retain exact Chinese:
Title "本次连接已结束"
First line "茶馆暂时无法继续当前连接。"
Second line "返回首页后，可重新加入好友房。"
Button "返回首页"
Do not rearrange or redesign. No extra text or controls. Single standalone transparent runtime panel faithfully matching supplied v2 design.
```

Chinese inspected: 本次连接已结束 / 茶馆暂时无法继续当前连接。 / 返回首页后，可重新加入好友房。 / 返回首页. Blue-gold composition retained. Design asset only.
