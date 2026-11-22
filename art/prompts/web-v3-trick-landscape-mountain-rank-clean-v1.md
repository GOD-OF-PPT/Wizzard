# Web v3 central trick landscape mountain — rank cleanup v1

Mode: built-in ImageGen edit (`precise-object-edit`). Source-only artwork, no implementation screenshot.

Edit target: `art/source/web-v3/trick-faces-v1/landscape-mountain-reference.png` (420×630 RGBA).
Raw candidate: `art/source/web-v3/trick-faces-v1/landscape-mountain-rank-clean-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: one exact source-art navy-mountain card face used for the central played trick in Enchanted Teahouse, distinct from the local hand artwork.
Input image1 is the only edit target and strict source of truth. Preserve exactly its420×630 canvas, full original geometry, composition, colors, corner alpha, and edge pixels. Do not crop, zoom, enlarge, recenter, extract a new cutout, redesign, or restyle.
Only edit: completely remove the upper-left black numeral “9” and its small shadow, approximately x=73–160,y=73–205 in original420×630 coordinates. Fill only the exact numeral/shadow footprint with continuous matching warm ivory paper texture and original local shading. The paper must be blank, with no dark fragments, pale9 ghost, embossed/indented9, numeral-shaped highlight/shadow, or new character. Remove the entire numeral shape rather than recoloring it.
Strict invariants: preserve the adjacent navy upper-left corner motif, all four original navy corner ornaments, the mountain emblem's summits and pale snow lines, its original fine details, paper hue and grain, frame, border, edge shadow, and every other pixel beyond the black rank. The highest summit starts below the numeral; do not remove or shift it. Do not redraw, reshape, move, recolor, smooth, or sharpen any emblem or edge. Preserve existing alpha where possible; do not create new transparent/semitransparent holes in paper or any new transparent margin. No additional digit, symbol, glow, frame, background, or decoration. This is surgical rank-and-shadow removal only.

## Handling

Keep raw generated output unchanged. No resizing, cropping, recolor, alpha cleanup, or other postprocessing. Root masks all candidate pixels outside the bounded numeralROI and retains original source elsewhere. Do not edit code, browser, runtime resources, canonical designs, or references.

## Result inspection

The9 and its shadow fully disappear. The rank area is continuous blank ivory paper with no obvious dark/pale9, embossed/indented numeral, or numeral-shaped highlight/shadow. Navy corner motif, mountain summit, and snow lines remain visually intact. Actual output is1024×1536 RGBA rather than420×630; alpha min/max1/248, zero fully transparent pixels, all1572864 pixels below255. Alpha is not preserved (reference0..255 with317 nonopaque,101 transparent pixels). Non-edit artwork also has subtle paper, contour, edge, and hue differences. This candidate is retained as raw generation provenance and a potential registered bounded numeralROI source only, not a whole-card replacement. No postprocessing occurred.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-068acdaa-3c16-4d42-8e3f-e55fbd0849c1.png`.
