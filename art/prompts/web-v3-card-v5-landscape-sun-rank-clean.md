# Web v3 card v5 landscape sun — clean rank candidate

Mode: built-in ImageGen edit (`precise-object-edit`), preserve transparent exterior.

Edit target: `art/source/web-v3/cards-v5/landscape-sun-reference.png` (560 × 840 RGBA, 2:3).

Raw candidate destination: `art/source/web-v3/cards-v5/landscape-sun-rank-clean-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: single authored ivory-paper ochre-sun playing-card raster, mechanically extracted from the selected Enchanted Teahouse screenshot.
Input image 1 is the strict edit target. Preserve its 2:3 portrait composition, transparent exterior, exact card geometry, position, angle, original colors, textures, and lighting. Do not crop, zoom, recenter, restyle, or redesign.
Only change: completely erase the black numeral “6” in the upper-left card face, approximately x=97, y=111, width=113, height=170 in the source 560 × 840 coordinates. Fill the entire former numeral footprint with continuous seamless original ivory paper grain and warm shading matching the immediate surrounding paper. No dark numeral fragments, pale numeral ghost, embossed or indented 6, numeral-shaped highlight, or residual shadow may remain. Remove the numeral's form entirely rather than recoloring it.
Strict invariants: preserve the ochre sun symbol, every ray, the sun's central circle and surrounding ring, all ochre corner ornaments, paper color and grain, paper edge, thin frame, ordinary shadow, and all other content outside the former numeral exactly unchanged. Do not move, redraw, reshape, recolor, smooth, or sharpen the sun, its rays or rings, the corners, card edge, or illumination. Do not add another number, letter, symbol, glow, border, backing, or background. Preserve transparent alpha around the card. This is surgical rank removal only, not card-art regeneration.

## Handling

Preserve the raw generated candidate unchanged. The root agent will register and extract only the clean numeral ROI, keeping the reference's exact remaining artwork, geometry, color, and alpha. Do not postprocess, alter code/browser, or replace final resources.

## Result inspection

The black 6 is fully absent without an apparent dark, pale, embossed, or shadow-shaped 6 ghost; continuous ivory grain fills that region. The ochre sun rays, central circle/ring, and corner ornaments remain visually intact. The actual raw output is 1023 × 1537, close to but not exactly the requested 2:3 ratio, and not the source size. It is actual RGBA (`Format32bppArgb`), alpha min/max 0/255, with 72078 fully transparent pixels and 1572337 pixels below alpha 255. Geometry, paper grain, exterior padding, contours, and alpha are not guaranteed identical to the source, so use only the registered clean numeral ROI and preserve exact original artwork and alpha elsewhere. The candidate was copied unchanged with no resize, recolor, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-107e1be7-f3e6-4c6e-9a3b-43c38e88a722.png`.
