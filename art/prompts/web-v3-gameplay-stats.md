# Web v3 gameplay statistics strip

Built-in ImageGen. Component/style references: `art/mockups/web-v3/05-gameplay-final.png`, `art/mockups/web-v3/portrait/05-gameplay.png`. Target is only the compact lower dark strip under each green nickname plaque, formerly showing 预测2 赢墩1.

## Prompt

One empty continuous horizontal strip, exact visible5.6:1 ratio (560×100). Long/slim, lightly rounded endcaps radius about20, mostly straight top/bottom. Single narrow warm aged-gold outline, no second border or shoulders. Matte dark black-brown lacquer, almost black quiet brushed center, softly hand-painted rim matching source. Not thick pill, not green, not two separate paper plaques.

Tight canvas with2% transparent safety margin. Keep actual body5.6:1 even if automatic canvas adds blank top/bottom. No text, letters, numbers, dividers, icons, leaves, tassels, flowers, patterns, avatars, exterior shadow or extra objects. Frontal orthographic, no perspective. Genuine alpha outside, opaque/near-opaque dark interior; preserve generated alpha.

## Targeted geometry iterations

First output had stepped shoulders and8.08:1 body, rejected. Second generation used no attached images, exact simple rounded rectangle1680×300 with corner radius55, single5px old-gold rim, conceptual1800×600 transparent canvas/body x60 y150. Output body1972×311,6.34:1, still too slim. Final built-in edit changes only height: measured1972×311 becomes1972×352,14% taller, width unchanged, visible5.6:1. Preserve matte near-black brown field, single thin rim, no shoulders/decorations/text, generated alpha.

## Delivery inspection

Selected source2103×748 RGBA, alpha≥50% body2019×349+42+196 (5.785:1; about3.3% wider than requested5.6). Only transparent-canvas crop2059×389+22+176, proportional resize width571 and transparent padding584×108. No painting, alpha repair or nonuniform stretching.

Runtime `art/runtime/web-v3/gameplay-stats-v1.png`:584×108 RGBA, visible body `560×97+12+6` (5.773:1). Interior sample `(82,24,420,60)` alpha252–254/255, center253/255 RGB28,18,8, exterior corner0. Single thin gold rim, plain lightly rounded rectangle, one dark field, no wording/ornament. Generated alpha preserved. Slight proportion deviation and minor edge speckles remain explicitly recorded.
