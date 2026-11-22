# Web v3 gameplay landscape seat — blank local name/stat strips candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`). Product Design image-to-code parallel raster asset production; source artwork only.

Edit target: `art/source/web-v3/gameplay-seats-v1/landscape-local-name-stats-reference.png` (198×86).
Raw candidate: `art/source/web-v3/gameplay-seats-v1/landscape-name-stats-blank-candidate-v1.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: an exact source-art crop containing two stacked Enchanted Teahouse player-seat name/stat lacquer strips, used only as a local text-removal workplate.
Input image1 is the sole strict edit target. It is198×86. Preserve its full original rectangular composition and aspect ratio, the two original stacked strips, position, proportions, outlines, all borders, spacing, and original backgroundRGB as faithfully as possible. Do not crop, recenter, redesign, change the angle, or move anything.
Only remove printed lettering and digits: completely erase the upper strip's “青竹客” and the lower strip's “预测1赢墩2”, including all spaces, character strokes, numeral strokes, tiny text shadows, glow, and antialiasing belonging to that lettering. Restore each exact former stroke footprint seamlessly using the surrounding same-color quiet lacquer texture: subtle dark ink-green on the upper strip and deep brown on the lower strip. Keep both interiors blank with continuous matching material and the existing soft warm-paper-colored reflections. No dark, pale, embossed, indented, highlighted, or shadow-shaped character ghost may remain. Do not merely recolor the text.
Strict invariants: preserve all gold rims, tiny gold dots, authored corners, outer silhouettes, two-strip arrangement, original widths/heights, surface shading, reflected warm highlights, background color, and every other source detail outside the text footprints. Do not redraw the plaques, change border thickness, widen or shrink them, soften or sharpen the edges, modify palette, add transparency, add a new texture patch with visible seams, or alter lighting. Do not create any new text, numeral, symbol, icon, ornament, line, frame, glow, backing panel, or extra margin. The result is only the same original two-strip crop with its existing lettering cleanly absent.
Output the same198×86 canvas if possible, otherwise a proportionally identical larger image that preserves the complete source crop. Keep the original opaque backgroundRGB; do not create a cutout or transparent background. This is a surgical local lettering removal, not a new UI design.

## Handling

Save the raw candidate unchanged, with no resampling, crop, recolor, alpha repair, or other postprocessing. Main will extract only bounded interior cleaned-textROIs and retain the exact source border, dots, dimensions, and background. The generated candidate is not a whole-asset replacement. Do not edit code, canonical design, browser, runtime assets, or reference artwork.

## Single-output inspection

All upper “青竹客” and lower “预测1赢墩2” lettering, numerals, and character shadows are visibly absent. No new text, symbol, icon, or frame appears in the blank strip interiors, and no apparent light/dark embossed character ghost remains. The two stacked lacquer strips, gold rims, small side dots, and overall crop layout remain recognizable.

The actual raw output is1903×826, opaque24-bitRGB, not198×86. Source-to-output scale is approximately9.611× horizontally and9.605× vertically; the aspect is close, not pixel-exact. There is generative drift in the gold rim highlights/thickness, top-panel green saturation/shading, lower-panel diagonal brown grain, tiny dot contours, and surrounding background details. The original exact border/backgroundRGB is not preserved. This is suitable only as a potential registered interior lettering-cleanup patch source, never a whole-asset replacement. The root must match local tone and use only bounded inner textROI pixels, retaining all original silhouettes, dots, rims, reflection geometry, and background. The raw result was copied unchanged: no resampling, cropping, recoloring, or other postprocessing occurred. No code, canonical design, browser, or runtime assets were modified.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-254dd745-fb00-44eb-9ffb-6c8c19a279b8.png`.
