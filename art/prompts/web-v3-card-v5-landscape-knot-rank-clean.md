# Web v3 card v5 landscape knot — clean rank candidate

Mode: built-in ImageGen edit (`precise-object-edit`), preserve transparent exterior.

Edit target: `art/source/web-v3/cards-v5/landscape-knot-reference.png` (560 × 840 RGBA, 2:3).

Raw candidate destination: `art/source/web-v3/cards-v5/landscape-knot-rank-clean-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: single authored ivory-paper red-knot playing-card raster, mechanically extracted from the selected Enchanted Teahouse screenshot.
Input image 1 is the strict edit target. Preserve its 2:3 portrait composition, transparent exterior, exact card geometry, position, angle, colors, and lighting. Do not crop, zoom, recenter, restyle, or redesign.
Only change: completely erase the black numeral “2” from the upper-left card face, approximately x=96, y=110, width=108, height=162 in the original 560 × 840 coordinates. Replace every part of the numeral's footprint with seamless uninterrupted ivory paper grain, matching the immediate original surroundings. The resulting patch must be ordinary blank paper with no black numeral residue and no pale, embossed, indented, translucent, highlighted, or shadowed “2” ghost. Do not merely recolor the numeral; remove its shape entirely, including any numeral shadow or highlight.
Strict invariants: preserve the red knot symbol and all of its loops and hanging ends, the red corner ornaments, original paper texture and hue, card edge, fine frame, shadow, and all other contents outside the former numeral. Do not move, redraw, reshape, recolor, smooth, or sharpen the knot, corners, paper edge, or lighting. Do not add any new numeral, letter, symbol, ornament, glow, backing, or background. Keep transparent alpha outside the card. This is surgical rank removal only, not regeneration of card art.

## Handling

Save the raw generated candidate unchanged. The root agent will register it and composite only the clean numeral ROI, retaining all other exact reference pixels and alpha. Do not postprocess or change code, browser, or final resources.

## Result inspection

The black 2 is completely absent. The former numeral area appears as continuous ivory paper without a dark numeral fragment, pale 2, embossed 2, or shape-shaped shadow/highlight. The red knot loops and ends and the corner ornaments remain visually intact. The raw output is 1024 × 1536, retaining 2:3. It is actual RGBA (`Format32bppArgb`) with alpha min 0, max 253, 76884 fully transparent pixels, and all 1572864 output pixels below alpha 255. It does not preserve the reference alpha or all non-edit pixels exactly; paper shading, padding, and contours show subtle generative differences. Register and use only the cleaned numeral patch, retaining original geometry, colors, artwork, and alpha elsewhere. The candidate was copied unchanged with no resizing, recoloring, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-9e15854b-590d-4ba2-ba5f-69205f4298c7.png`.
