# Card v5 portrait knot: remove rank numeral only

Mode: built-in ImageGen precise local edit; preserve alpha.

Edit target: `art/source/web-v3/cards-v5/portrait-knot-reference.png` (560 × 840 RGBA).

Candidate: `art/source/web-v3/cards-v5/portrait-knot-rank-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: original Enchanted Teahouse red-knot card, rank-free local cleanup candidate.
Input images: Image 1 is the sole edit target and exact source of truth: existing 560 × 840 RGBA 2:3 card extracted mechanically from the selected page.
Primary request: completely erase only the black numeral “2” in the upper-left. Its original-source ROI is approximately x=102,y=114,width=110,height=165. Rebuild the entire former numeral ink and antialias fringe with naturally continuous matching ivory paper grain. The restored area must be plain, unlettered paper: no dark 2, pale 2, embossed 2, translucent 2, indentation, numeral-shaped grain, shadow or residual outline. Keep natural local illumination and color, without leaving a patch seam.
Composition/framing: exact 2:3 composition; prefer original 560 × 840. Preserve card position, size, silhouette, angle and transparent outer background. Do not crop, zoom, move or recenter.
Constraints: change only numeral 2 and preserve all red knot symbol geometry, corners, paper edges, fine border, shadow, textures, original colors and all other pixels as closely as possible. Do not redraw, recolor, smooth, resize or move the knot or red corner ornaments. Preserve actual alpha transparency and the original edge treatment. No new text, rank, numeral, letter, symbol or decoration.
Avoid: any dark or light ghost of numeral 2; embossed numeral remnants; flat fill or smooth patch; changed paper warmth; shifted knot geometry; changed border/shadow/silhouette; damaged top-left corner pattern; opaque outer background; watermark.

## Integration contract

Save raw generated result without post-processing. Root-thread integration will copy only the cleaned numeral ROI onto the exact source, preserving all other reference pixels. Do not modify runtime/final resources, code or browser.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-b80932f3-9cef-4b04-ac6b-658c17bf3990.png`.
- Copied unchanged to the requested candidate destination.
- Actual size: 1024 × 1536, exact 2:3. RGBA (`Format32bppArgb`), alpha min 0 / max 254, 148,269 alpha-zero pixels, 1,424,595 partial-alpha pixels, all corners alpha 0. True transparency present; opacity distribution is not exact source preservation.
- Visual inspection: numeral 2 is absent, with no visible dark numeral, pale/embossed 2, outline or numeral-shaped texture in the cleared area. Red knot and top-left corner ornament remain structurally intact.
- Entire card paper/edge rendering changes outside the digit area remain generative differences. Root integration must keep the exact extracted source elsewhere and use only the cleaned numeric ROI.
- At 1024 × 1536 the original numeric ROI (102,114,110,165) maps proportionally to approximately (186,208,202,302).
