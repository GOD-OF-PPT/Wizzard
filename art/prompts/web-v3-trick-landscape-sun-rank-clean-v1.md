# Web v3 central trick landscape sun — rank cleanup v1

Mode: built-in ImageGen edit (`precise-object-edit`). Source-only card artwork, no implementation screenshot.

Edit target: `art/source/web-v3/trick-faces-v1/landscape-sun-reference.png` (420×630 RGBA).
Raw candidate: `art/source/web-v3/trick-faces-v1/landscape-sun-rank-clean-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: one exact source-art ochre-sun card face used for the central played trick in Enchanted Teahouse, distinct from the local hand's artwork.
Input image1 is the sole strict edit target. Preserve exactly its420×630 canvas, full original composition, geometry, corner alpha, edge pixels, paper colors, and lighting. Do not crop, zoom, enlarge, recenter, extract a new cutout, restyle, or redesign.
Only edit: fully remove the black upper-left numeral “1” and its little shadow, approximately x=68–127,y=72–202 in source420×630 coordinates. Replace only their exact footprint with seamless continuous warm ivory paper texture and the immediate original subtle shading. The cleaned patch must be ordinary blank paper without any dark numeral remnant, pale1 ghost, embossed or indented1, numeral-shaped shadow/highlight, or new character. Do not simply paint the numeral a lighter color; remove its shape entirely.
Strict invariants: preserve the nearby ochre upper-left corner ornament, all four ochre corners, the central sun's eight rays and concentric circle/ring geometry, paper grain, original hues, frame, card border, ordinary edge shadow, and every pixel beyond the former black numeral. The top ray of the sun begins below the numeral and must not be shortened, shifted, or modified. Do not redraw, recolor, reshape, sharpen, smooth, or move any emblem or corner. Preserve existing alpha where possible; no new transparent/semitransparent holes in the paper and no extra transparent margin. No new number, symbol, glow, border, or background. This is surgical rank-and-shadow removal only.

## Handling

Save raw generated candidate unchanged. No resize, crop, alpha correction, recolor, or other postprocessing. Root will retain original pixels and alpha outside a bounded numeralROI. Do not edit code, browser, runtime resources, canonical mockups, or reference art.

## Result inspection

The numeral1 and its shadow are completely removed, with continuous ivory paper and no apparent dark/pale1, embossed or indented numeral, or numeral-shaped highlight/shadow. The ochre upper-left motif, top sun ray, other rays, and concentric rings remain visually intact. Actual raw output is1024×1536 RGBA, not420×630. Alpha min/max0/249,9 fully transparent pixels, all1572864 pixels below255. It does not preserve source alpha (source0..255,317 nonopaque/101 transparent) or exact non-edit details; paper grain, edge, corner contours, and sun shading have small generative changes. Use only the registered bounded numeral paper patch, preserving reference pixels and alpha elsewhere. Candidate is saved without any postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-4de7bda9-903c-433b-aa2a-b64981aa4e69.png`.
