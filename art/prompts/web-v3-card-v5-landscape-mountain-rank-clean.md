# Web v3 card v5 landscape mountain — clean rank candidate

Mode: built-in ImageGen edit (`precise-object-edit`), preserve transparent exterior.

Edit target: `art/source/web-v3/cards-v5/landscape-mountain-reference.png` (560 × 840 RGBA, 2:3).

Raw candidate destination: `art/source/web-v3/cards-v5/landscape-mountain-rank-clean-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: single authored ivory-paper mountain playing-card raster, mechanically extracted from the selected Enchanted Teahouse screenshot.
Input image 1 is the strict edit target. Preserve its 2:3 portrait composition and transparent exterior, all geometry, card position, angle, size, lighting, and source pixel character. Do not crop, zoom, recenter, restyle, or redesign.
Only change: completely erase the black numeral “8” in the card's upper-left face, approximately x=88, y=109, width=114, height=170 in the original 560 × 840 coordinate system. Fill the exact former numeral footprint with the same continuous ivory paper grain and subtle warm shading as its immediate surroundings. Leave plain authentic paper; no dark fragments, ghosting, letter, numeral, or replacement marking.
Strict invariants: keep the navy-blue mountain symbol, every summit and snow line, all blue corner ornaments, paper texture, paper color, card edge, fine exterior frame, shadows, and every other object outside the erased numeral exactly unchanged. Do not move or redraw the mountain, deform a peak, alter a snow line, damage a corner ornament, recolor the paper, alter the border, sharpen or smooth the artwork, add glow, or add a background. Preserve the alpha transparency around the card. This is surgical removal of the black rank numeral only, not regeneration of card art.

## Handling

Keep the raw generated candidate unchanged. The root agent will register the candidate and use only the clean numeral ROI; all other exact source geometry, artwork, and alpha stay in the reference. Do not postprocess or edit business code, browser, or final resources.

## Result inspection

The black 8 is completely removed without visible fragments or ghosting; matching continuous ivory paper occupies the former numeral area. The upper-left corner ornament, mountain summits, and pale snow lines remain visually intact. The raw output is 1024 × 1536, maintaining 2:3 but not the source's 560 × 840 size. It is actual RGBA (`Format32bppArgb`), with alpha minimum 0, maximum 254, 88140 fully transparent pixels, and all 1572864 output pixels below alpha 255. Alpha is not assumed identical to the reference. The generated image subtly regenerates paper grain, card edge, exterior padding, and symbol contours, so only use its registered clean numeral paper ROI; keep source artwork and alpha elsewhere. The candidate is saved unchanged, without resizing, recoloring, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-07d86b94-c546-4ba0-8399-d57956e82b76.png`.
