# Gameplay sleepy-cat fidelity correction

Built-in ImageGen; transparent background. Reference: `art/mockups/web-v3/05-gameplay-final.png`.

Actual prompt:

> Create a faithful independent transparent portrait asset of ONLY the sleepy cream cat in the upper-right player seat of this EXACT source (x1313..1460,y180..310). Match this character, not another cat: small sleepy closed crescent eyes, pale ivory face with rust-red short cheek strokes and three forehead marks, pink inner triangular ears, light gray-taupe outer fur, happy quiet smile, blue-gray wrapped scarf and brown-gray traveler robe, half-body. NO purple scarf, NO star accessory, NO huge pink blush, NO pointed hat. Circular midnight-teal portrait background with restrained thin old-gold circular rim, same source composition and relative face scale. Cat ears may rise above rim. Transparent outside complete rim. No name plaque, no numbers, no text, no UI or scene. Render square1024x1024 crisp painterly game artwork with modest transparent margin, suitable for small140px in-game portrait. Preserve original silhouette, clothing and expression.

Generated master1280×1280 saved `art/source/web-v3/gameplay-sleepy-cat-v1.png`; proportional512×512 runtime `art/runtime/web-v3/avatars/gameplay-sleepy-cat-v1.png`. Preserve alpha, no color edit, no CSS drawing or source-mock change.

Inspected result: correct blue-gray scarf and robe, pale cream fur/closed eyes. Gold rim/ears/face proportions still differ mildly from source. Gameplay only consumes this version; other screens retain existing avatar choices pending their own reference comparison.
