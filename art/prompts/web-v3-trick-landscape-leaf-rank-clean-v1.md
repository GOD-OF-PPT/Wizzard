# Web v3 central trick landscape leaf — rank cleanup v1

Mode: built-in ImageGen edit (`precise-object-edit`). Source-only artwork; no screenshot of implementation or runtime is used.

Edit target: `art/source/web-v3/trick-faces-v1/landscape-leaf-reference.png` (420 × 630 RGBA).
Raw candidate: `art/source/web-v3/trick-faces-v1/landscape-leaf-rank-clean-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: one exact source-art card face used for the central played trick in Enchanted Teahouse, distinct from the local hand's artwork.
Input image 1 is the sole edit target and strict source of truth. Preserve exactly its 420 × 630 canvas, composition, geometry, original edge pixels, and existing tiny corner alpha. Do not crop, zoom, recenter, enlarge, restyle, extract a new cutout, or redesign.
Only change: completely erase the upper-left black numeral “7” and its small shadow. The actual black numeral and shadow are approximately x=88–172, y=75–208 in the original 420 × 630 bitmap. Restore only their exact former footprint to continuous matching warm ivory paper texture and subtle source shading. The result must be blank authentic paper, without dark fragments, a pale 7, embossed or indented 7, numeral-shaped shadow/highlight, or any new character. Do not merely recolor the numeral: remove its shape entirely.
Strict invariants: preserve every part of the adjacent teal upper-left corner motif; it extends into the nearby area and must not be removed or modified. Preserve all four teal corner ornaments, central leaf emblem and its tip and veins, paper grain, original colors, thin frame, card border, ordinary edge shadow, and every other pixel outside the former black numeral. Do not redraw, move, reshape, smooth, sharpen, or recolor any emblem or edge. Preserve the existing alpha exactly where possible; do not create any new transparent or semitransparent holes in paper, or a new transparent margin. This is surgical rank-and-shadow removal only, not a new card or a whole-card cleanup.

## Handling

Save the raw generated output unchanged, with no resize, crop, alpha repair, recolor, or other postprocessing. Root will mask every candidate pixel outside the bounded numeral ROI and retain exact source artwork elsewhere. Do not edit code, browser, runtime assets, canonical designs, or reference art.

## Result inspection

The 7 and its shadow disappear completely. The numeral area looks like continuous blank ivory paper, with no apparent dark, pale, embossed, or shadow-shaped 7 ghost. Adjacent teal corner motif and leaf tip/veins remain visually intact. Actual raw output is1024×1536 RGBA, not420×630. Alpha min/max1/248, zero fully transparent pixels, and all1572864 pixels are below255. Thus the existing near-opaque source alpha was not preserved (source min/max0/255;317 nonopaque pixels,101 fully transparent). Paper grain, colored corners, card edges, and emblem contours show subtle generation changes. This candidate is only a clean-paper ROI source after registration, not a whole-card replacement or exact-alpha result. Raw pixels are unchanged after saving.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-653f95ce-f998-4ceb-a497-a8b5c8937452.png`.
