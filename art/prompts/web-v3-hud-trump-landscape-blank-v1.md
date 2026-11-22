# Web v3 gameplay landscape trump HUD — blank interior candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`). Product Design image-to-code parallel source-raster asset production.

Edit target: `art/source/web-v3/hud-source-v1/landscape-trump-reference.png` (331×75).
Raw candidate: `art/source/web-v3/hud-source-v1/landscape-trump-blank-candidate-v1.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: one exact source-art horizontal parchment trump-status plaque from the selected Enchanted Teahouse design, used only as an interior text-and-icon cleanup workplate.
Input image1 is the sole strict edit target. It is331×75. Preserve the complete original crop, original width-to-height proportion, full authored silhouette, exact plaque position, old-gold double border, small flowers at both ends, paper tint, reflections, shadows, edge pixels, and existing background as faithfully as possible. Do not crop, zoom, recenter, redesign, change the angle, expand the layout, or move any ornament.
Only remove all RED content printed inside the plaque: erase the entire red sun-wheel icon, including its central filled disc, surrounding rays, outlines, and any red edge/shadow; erase every red character, centered dot, punctuation, and letter shadow in the full text “本轮王牌·藏日”. Restore only these former ink/shadow footprints to seamless continuous matching subtle warm ivory paper grain from their immediate surroundings. The entire inner field must be ordinary quiet blank paper, with no red numeral/character/icon fragments, pale sun or character ghosts, embossed/indented symbols, numeral-shaped highlight/shadow, or new markings. Remove the forms completely, not just their color.
Strict invariants: keep every part of the authored gold double border, both small end flowers, contour lobes, corners, edge thickness, width, height, original warm paper color, material softness, and ordinary external shadow unchanged. Do not erase the end flowers or mistake them for the red content. Do not alter the non-red ornament, make the plaque longer or taller, change its frame, add texture seams, sharpen or smooth edges, recolor the whole paper, or add a new object. No text, symbol, icon, pattern, frame, glow, backing panel, extra margins, or new light effect. Preserve the original backgroundRGB; do not create transparency or a cutout. This is surgical interior ink-and-shadow removal only, not a new UI design.
Return the same331×75 canvas if possible, otherwise a proportionally identical larger image containing the complete exact crop. Do not rescale or recompose the plaque within its crop.

## Handling

Save the raw generated candidate unchanged, with no resampling, cropping, color adjustment, alpha repair, or other postprocessing. Main will take only the interior cleaned inkROI and retain exact original border, flowers, silhouette, shadow, and background pixels. Generated image is not a whole-asset replacement. Do not edit code, whole-page designs, browser state, runtime resources, or reference artwork.

## Single-output inspection

The entire red sun wheel, rays, red text “本轮王牌·藏日”, center separator, and text/icon shadows are visibly absent. The paper interior is continuous and contains no apparent red fragment, pale sun, character ghost, new icon, or wording. Both end flowers and the long double-edged silhouette remain recognizable.

Actual raw output is2170×725 opaque24-bitRGB, not331×75 or the source4.413:1 canvas proportion. ImageGen added broad white strips above and below the source-like red-background band, which measures y111–603 atx5. The plaque itself occupies roughly x23–2136,y138–571; its general visible proportion is preserved, but the border/flower contours, shadow, paper contrast, and background texture are subtly regenerated. The new paper is somewhat brighter with a more visible diagonal grain, and border highlights look thicker. Therefore exact source edge, color, flower, or background preservation is not claimed. Main must register only the cleaned interior paperROI and retain all exact original authored exterior pixels; no whole-image replacement. The raw candidate is saved unchanged, with no resampling, crop, recolor, or other postprocessing. No code, canonical design, browser, or runtime resources were modified.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-f95325cc-2ea6-444a-acdc-6e7efc36945a.png`.
