# Web v3 card v5 landscape leaf — clean rank candidate

Mode: built-in ImageGen edit (`precise-object-edit`), preserve transparent background.

Edit target: `art/source/web-v3/cards-v5/landscape-leaf-reference.png` (560 × 840 RGBA, 2:3).

Raw candidate destination: `art/source/web-v3/cards-v5/landscape-leaf-rank-clean-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: a single authored ivory-paper playing-card raster, extracted mechanically from the selected Enchanted Teahouse game screenshot.
Input image 1 is the edit target and strict source of truth. It is 560 × 840 with a 2:3 portrait composition and transparent background. Preserve that composition, all card geometry, placement, and existing alpha transparency. Do not crop, zoom, recenter, redesign, or change the angle.
Only change: completely remove the black numeral “5” at the upper-left of the card face, within approximately x=102, y=111, width=112, height=171 in the original 560 × 840 coordinate system. Fill only the old numeral's footprint with continuous matching ivory card-paper texture and subtle original paper shading from its immediate surroundings. The numeral must disappear entirely, leaving blank authentic paper with no dark fragments or replacement marking.
Strict invariants: preserve the teal leaf symbol and every leaf tip, the teal corner ornaments, all card-paper grain and color, paper edge, thin warm-gold exterior frame, shadow, and every other existing object and pixel outside the numeral footprint. Do not move, redraw, reshape, recolor, smooth, or sharpen the leaf, corners, card edge, or lighting. Do not add a new number, letter, ornament, symbol, glow, border, or background. Preserve the transparent cutout. This is surgical rank removal only, not regeneration of the card art.

## Handling

Keep the raw generated candidate unchanged. The root agent will composite only the numeral ROI into the original reference, preserving every other exact source pixel. Do not postprocess, change code/browser content, or replace a final resource.

## Result inspection

The numeral is completely removed, with continuous ivory paper where it was. The leaf tip and all four teal corner ornaments remain visually intact, without missing pieces. The output is 1024 × 1536, retaining the requested 2:3 ratio but not the source pixel dimensions. It is RGBA (`Format32bppArgb`) and has actual alpha transparency: alpha minimum 0, maximum 254, 115141 fully transparent pixels; all 1572864 output pixels have alpha below 255. The source was 560 × 840 RGBA with alpha min/max 0/255, 34537 fully transparent pixels, and 47003 pixels below alpha 255. Thus alpha and non-edit pixels are not preserved exactly. The generated card also subtly regenerates corners, paper texture, outer-frame light, and padding. Only use its clean paper rank region after registration; keep the reference's leaf, corner ornaments, border, shadow, color, geometry, and alpha exactly. This raw candidate is not a full-card replacement. It was saved unchanged without resizing, recoloring, or any postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-ee3de54d-bb71-4ffe-ba1c-b56e3511e446.png`.
