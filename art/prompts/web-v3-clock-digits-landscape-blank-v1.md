# Web v3 landscape clock — dynamic digits cleanup candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`). The only input is selected original source artwork, never an implementation screenshot.

Edit target: `art/source/web-v3/hud-source-v1/landscape-timer-reference-v1.png` (224×195).
Raw candidate: `art/source/web-v3/hud-clock-v1/landscape-clock-digits-blank-candidate-v1.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: one exact source-art landscape Enchanted Teahouse timer crop, used solely as a dark-dial numeral-cleanup workplate.
Input image1 is the only strict edit target. It is224×195. Preserve its entire original crop and exact aspect ratio, complete timer position, geometry, scale, materials, colors, light, and all relationships to the surrounding table. Do not crop, zoom, recenter, rotate, restyle, redesign, or shift any component.
Only remove the two golden digits “28” near the lower center of the dark circular dial, approximately x87,y96,width47,height38 in the original224×195 coordinates. Erase every stroke, antialias edge, and small shadow/highlight belonging to just those two numerals. Restore only their exact former footprint with seamless continuous matching original deep-brown dial texture and subtle existing shading from the immediate surroundings. There must be no dark or pale28 ghost, embossed or indented numeral, numeral-shaped highlight/shadow, or new marking. Do not merely recolor the numerals.
Strict invariants: DO NOT REMOVE OR ALTER THE GOLD CHINESE “秒” IMMEDIATELY TO THE RIGHT. Keep its exact strokes, position, size, and brightness. DO NOT REMOVE OR ALTER THE ORIGINAL HOURGLASS ABOVE THE DIGITS. Preserve the hourglass, complete gold circular frame, tick marks, gold rim, bright ring glow, tiny sparkles, lower-left cloud ornament, cast shadow, and all surrounding tabletop pixels as faithfully as possible. No new element, symbol, digit, text, icon, frame, fill, glow, lighting effect, or background. Keep the existing original backgroundRGB and its opacity; no transparent cutout or extra margin. This is surgical removal of28 only, not a blank timer or a redesign.
Return the same224×195 canvas if possible; a larger output may preserve the exact same full-crop aspect ratio and layout. Do not recompose or change the timer's proportions within that crop.

## Handling

Save the raw generated image unchanged, with no resampling, crop, recolor, alpha correction, or other postprocessing. Main will take only the interior former-digit textureROI, register its tone, and retain exact source pixels for秒, hourglass, rings, light, cloud, table, and all other content. Candidate is not a whole-clock replacement. Do not edit code, whole-page designs, runtime resources, browser, or original source artwork.

## Single-output inspection

The two digits28 are visibly absent. Their former region is continuous dark-brown dial material, with no obvious dark/pale numeral, embossed numeral, or numeral-shaped glow/shadow. The Chinese秒 and hourglass remain present and legible. The ring, tick lines, warm glow, cloud ornament, and table remain recognizable, without a new letter or object in the cleared number region.

Actual raw dimensions are1344×1170, exactly6× the source224×195 canvas in both axes, and the image is opaque24-bitRGB. The generation is not pixel-preserving: the visible ring/arc thickness, tick and hourglass contour sharpness, cloud geometry, dial shading, tabletop detail, and glow have generative drift. The surrounding original pixels must therefore never be replaced. Main should take only a small registered dark-paper patch from the former28 footprint (source approximate x87,y96,w47,h38 maps nominally to x522,y576,w282,h228 before fine registration), avoid the retained秒, and retain original exact dial, ornament, light, and table. Raw candidate was copied unchanged, with no resampling, crop, alpha repair, recolor, or other postprocessing. No code, whole-page design, browser, or runtime resources were modified.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-2c8cad2c-aead-4305-8f88-fad8b6e91575.png`.
