# Portrait gameplay local name/stat strips: blank interior candidate v1

Mode: built-in ImageGen precise local edit, `transparent_background:false`.

Edit target: `art/source/web-v3/gameplay-seats-v1/portrait-local-name-stats-reference.png`, actual202 ×89 RGB.

Raw candidate destination: `art/source/web-v3/gameplay-seats-v1/portrait-name-stats-blank-candidate-v1.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: blank interior raster furniture for an existing Enchanted Teahouse portrait gameplay nameplate and stats strip.
Input images: Image1 is the sole exact edit target:202 ×89 RGB crop containing one green nameplate above one dark-brown stats strip. Preserve this specific source crop and its authored geometry.
Primary request: remove ONLY all pale handwritten text and digits from the two existing strips, including tiny text antialias fringes and text shadows. Erase “青竹客” from the upper green nameplate and erase the complete lower line “预测 1 赢墩 2”. Fill only the former letter/digit/shadow pixels with continuous matching surrounding material: subtly textured deep ink-green lacquer in the upper strip and deep brown-black lacquer in the lower strip. The result is these same two original strips with completely blank, unlettered interiors. Preserve natural local color, subtle grain and restrained source illumination; no smooth/bleached patch or residual character-shaped shading.
Composition/framing: preserve the entire exact202 ×89 rectangular RGB crop, approximately202:89 aspect ratio. Prefer same native dimensions; if tool output is larger, retain the exact source composition and relative positions. Do not crop, resize individual bars, recenter, move, zoom, add padding or reframe anything.
Critical preservation: keep the upper/lower two-strip arrangement, separation, full authored width/height, scalloped outer contours, every fine gold border, corner geometry, small gold dots, original warm pale-paper/gold reflections, existing shadows and outside background RGB as unchanged as possible. Do not remove either gold dot in the upper nameplate. Do not change any border, fill palette, outside background or object silhouette. There is no transparent background: retain an opaque RGB-looking crop including every original corner pixel.
Text (verbatim): remove upper “青竹客” and lower “预测 1 赢墩 2”; add absolutely no text, number, glyph, letter, icon, symbol, frame or decoration.
Avoid: dark/light/embossed ghosts of any removed character or digit; residual text shadow; new text or icon; altered gold dots/borders; shifted or resized strips; flattened geometry; recolored/brightened/darkened entire crop; mismatched patches; transparent or checkerboard pixels; new panel; watermark.

## Integration contract

Save raw generated output unchanged, without resampling, resizing, cropping, recoloring, alpha edits or other post-processing. Main thread will extract only inner text-cleanup ROIs and retain exact reference borders/background/geometry. This candidate is never a whole-strip replacement. No code, canonical-design, browser or runtime-asset edits.

## Generated result and inspection

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-ef039ef9-386e-45f2-afc2-154e36885dbb.png`.
- Copied unchanged to candidate destination. Actual **1889 ×832 RGB (`Format24bppRgb`)**, not202 ×89. Scale relative to source is9.351485 horizontally and9.348315 vertically, so aspect preservation is close but not exact. No candidate resampling or other post-processing was performed.
- Single-result visual inspection: upper 青竹客 and lower 预测1赢墩2 are fully absent, including recognizable character/digit shadows; both interiors are blank green/dark-brown lacquer without new writing, icon or frame. Upper/lower strip arrangement, scalloped silhouettes, gold borders/dots and surrounding cropped background remain structurally recognizable.
- Exact pixel preservation is not achieved: grain/illumination, border softness and background RGB drift. For read-only nearest-coordinate probes (no resampled file): original upper-left gold-dot pixel at(14,27),RGB(147,104,44), maps to candidate(135,257),RGB(172,125,41); original outer top-left pixel(0,0),RGB(70,26,6), maps to candidate(4,4),RGB(75,14,1). Protected border/background must remain original source pixels.
- Lower faint gold dots are source features, not new controls: probes original(15,68),RGB(70,42,11),candidate(144,640),RGB(69,40,5); original(187,68),RGB(63,40,11),candidate(1753,640),RGB(62,33,5). Keep the original dots from source rather than importing generated dot pixels.
- Suggested extraction applies only to original character-ink/shadow masks: approximate upper text-safe envelope source x55..149,y10..44; lower text-safe envelope source x19..183,y55..83. Avoid the fine gold edge and side dots, and retain exact source dimensions/silhouettes. These are ROI guides, not permission to replace full rectangles or the whole pair of strips.
