# Card v5 portrait mountain: remove rank numeral only

Mode: built-in ImageGen precise local edit; preserve alpha.

Edit target: `art/source/web-v3/cards-v5/portrait-mountain-reference.png` (560 × 840 RGBA).

Candidate: `art/source/web-v3/cards-v5/portrait-mountain-rank-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: original Enchanted Teahouse mountain card, rank-free local cleanup candidate.
Input images: Image 1 is the sole edit target and exact source of truth: an existing 560 × 840 RGBA 2:3 card crop mechanically extracted from the selected page.
Primary request: remove only the black numeral “8” in the upper-left. Its original-source ROI is approximately x=91,y=112,width=115,height=173. Replace only the black numeral ink and its antialiased fringe with a seamless continuation of the original ivory paper texture. Leave that former rank area empty and maintain the adjacent paper grain, warmth and illumination.
Composition/framing: preserve the exact 2:3 composition, card location, scale, full silhouette, angle, borders and original transparent exterior. Prefer 560 × 840 output; do not crop, move, recenter or zoom.
Constraints: leave all mountain peaks, white snow lines, blue symbol edges, all blue corner patterns, paper edge, fine outer border, original shadow, color and all other original contents unchanged. Change only the numeral 8. Do not redraw, rescale, simplify, shift or recolor the mountain or its nearby top peak. Preserve the original actual alpha background and antialiased silhouette. No new rank, letter, word, symbol, watermark or decoration.
Avoid: remnants of either loop of the 8; damage to the top-left corner ornament or highest mountain peak; patch seams; flat paper fill; bleaching or smoothing paper grain; changing original color or contrast; changed card geometry, shadow or border; opaque exterior; any additional edit.

## Integration contract

Save raw generated result without post-processing. Root-thread integration will copy only the cleaned numeral ROI onto the exact mechanically extracted reference. Do not edit final assets, runtime, code or browser.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-d7848554-cb95-4d05-8dfc-906a3c2f2888.png`.
- Copied unchanged to the requested candidate destination.
- Actual size: 1024 × 1536, exact 2:3 aspect ratio. Pixel format RGBA (`Format32bppArgb`); alpha min 0 / max 253, 187,909 alpha-zero pixels and 1,384,955 partial-alpha pixels. All four corners alpha 0. True transparency is present; source opacity distribution is not guaranteed preserved.
- Visual inspection: both loops of black 8 are fully gone with continuous warm ivory paper fill. Top-left ornament and highest mountain peak remain intact in shape; snow-line geometry remains recognizable. No new numeral or glyph.
- Candidate changes paper and outer-edge rendering outside the numeral ROI and cannot replace the exact extracted reference. Integrate only the numeral cleanup ROI.
- Original ROI (91,112,115,173) maps proportionally to approximately (166,205,211,317) at generated resolution 1024 × 1536; root integration should align by original source coordinates.
