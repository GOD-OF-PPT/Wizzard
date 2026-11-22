# Web v3 central trick landscape knot — rank cleanup v1

Mode: built-in ImageGen edit (`precise-object-edit`). Source-only artwork, no implementation screenshot.

Edit target: `art/source/web-v3/trick-faces-v1/landscape-knot-reference.png` (420 ×630 RGBA).
Raw candidate: `art/source/web-v3/trick-faces-v1/landscape-knot-rank-clean-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: one exact source-art red-knot card face used for the central played trick in Enchanted Teahouse, distinct from the local hand's artwork.
Input image1 is the sole edit target and strict source of truth. Preserve its exact420×630 canvas, full geometry, composition, existing corner alpha, original colors, and edge pixels. Do not crop, zoom, enlarge, recenter, extract a new cutout, restyle, or redesign.
Only change: erase completely the black upper-left numeral “3” and its small shadow, approximately x=74–159,y=72–204 in the original420×630 bitmap. Fill only the numeral/shadow's exact footprint with continuous uninterrupted matching ivory paper grain and subtle original shading. Leave ordinary blank paper, with no dark numeral fragments, pale3 ghost, embossed or indented3, numeral-shaped highlight/shadow, or new marking. Remove the numeral's form entirely; do not merely recolor it.
Strict invariants: preserve the adjacent red upper-left corner motif, all its fine colored edges, and all four original red corner ornaments. Preserve the central red knot, every loop, pointed top, hanging end, ordinary shadow, original paper hue, grain, thin frame, border, edge pixels, and all content outside the erased black rank. Do not redraw, move, reshape, smooth, sharpen, or recolor any emblem, corner, or edge. Preserve the existing alpha where possible; do not create any new transparent/semitransparent holes in the paper or new transparent margins. No new numeral, symbol, glow, border, background, or ornament. This is surgical black-rank-and-shadow removal only.

## Handling

Save raw ImageGen output unchanged, with no crop, resize, color correction, alpha repair, or other postprocessing. Root will retain all original pixels outside the bounded numeralROI. Do not edit code, browser, runtime assets, canonical designs, or source reference.

## Result inspection

The 3 and its shadow are completely absent. The cleaned area appears as continuous blank ivory paper with no obvious dark/pale3, embossed numeral, or numeral-shaped highlight/shadow. Nearby corner motif and central knot loops/pointed top remain visually intact. Actual output is1024×1536 RGBA, not420×630. Alpha min/max0/249,2 completely transparent pixels, all1572864 pixels below255. Original source was alpha0..255 with317 nonopaque and101 transparent pixels. Alpha and non-edit artwork are not exact: grain, borders, red contour edges, and corners show generative differences. Only use the registered bounded numeral paper ROI, retaining original exact artwork/alpha elsewhere. Raw candidate is saved without postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-8638eabe-1edb-4f21-8db2-25e1884894c5.png`.
