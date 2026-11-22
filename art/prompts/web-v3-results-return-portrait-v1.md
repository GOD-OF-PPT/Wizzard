# Portrait ranking secondary action: return to results label v1

Mode: built-in ImageGen precise local edit, `transparent_background:false`.

Sole edit target: `art/source/web-v3/results-source-v1/portrait-ranking-secondary-reference-v1.png`, actual585 ×122 RGB.

Raw candidate destination: `art/source/web-v3/results-source-v1/portrait-ranking-return-results-candidate-v1.png`.

## Complete prompt

Use case: text-localization
Asset type: text-only local-edit candidate of an existing Enchanted Teahouse portrait final-ranking paper secondary action.
Input images: Image1 is the sole exact edit target: the original585 ×122 RGB wide warm-paper button whose existing label is返回首页, with fine gold double border, original paper pattern and dark gold diamond flower ornaments at both ends.
Primary request: change ONLY the central handwritten dark-ink label from “返回首页” to exactly **“返回结算”**. Keep the existing first two characters返回 in their exact positions/appearance as closely as possible; replace only the last two characters首页 with结算 in the same original label slot. The full corrected four-character label must remain optically centered at the identical baseline, with the original handwritten brush style, source font size, ink weight, dark-brown/black pigment, letter spacing, stroke roughness, subtle edge antialiasing and illumination. Restore original paper grain only where old strokes disappear. Clear readable Chinese “结算”, no lookalike or incorrect glyph.
Critical preservation: complete original warm-paper color and subtle embossed interlocking pattern, both side dark-gold diamond flower ornaments, gold border/inner line, authored silhouette and stepped/scalloped corner shape, cast shadow, background RGB crop, paper reflectance and all original non-text pixels should remain unchanged as closely as possible. Do not move, redraw, rotate, resize, stretch or recolor the button or ornaments. No extra label, icon, panel, symbol or ornament.
Composition/framing: preserve complete original585 ×122 canvas and wide585:122 aspect ratio; prefer same native size. Larger output acceptable only with identical relative full-crop composition. No crop, zoom, padding, background margins, recentering or new framing. Output remains opaque RGB-looking original crop without alpha/checkerboard.
Text (verbatim): “返回结算”. Exactly four characters, same size/weight/center/baseline as original返回首页.
Avoid: 返回首页 remaining; incorrect结 or算; changed first返回; shifted text; smaller/larger/lighter/bolder lettering; altered side ornaments or border; new graphics; changed paper pattern/color; white/black padding; transparency; watermark.

## Integration contract

Save raw generated result unchanged without resampling, resizing, cropping, recoloring or other post-processing. Main will extract corrected text locally and preserve exact original button/non-text pixels; never use the whole drifting generated button. No code, formal design, runtime resource or browser edits.

## Generated result and inspection

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-c97aa823-0ab1-4362-8a88-ccb68013f4a6.png`.
- Copied unchanged to requested candidate path. No post-processing.
- Actual **2170 ×725 RGB (`Format24bppRgb`)**, not585 ×122. Approximate effective nonwhite original-content band **x0,y137,width2170,height451** (threshold235 sampled at x5/center/right-6). Full-canvas ratio/crop differs from source due to white padding; content-band relative scale is2170/585 horizontally and451/122 vertically. Account for y137 before local glyph extraction.
- Single-result visual inspection: four-character label reads 返回结算, with recognizable结 and算, dark brush ink and original overall centered horizontal composition. Original paper pattern, two side diamond flower ornaments and authored border silhouette remain structurally recognizable. Original首页 no longer present.
- Tool added white top/bottom padding and regenerated paper/edge/ornament details. Letter stroke shape/spacing/ink weight are similar in style but not proven identical to original. Use only corrected text pixels after source registration; never replace whole button or copy the white padded canvas.
- Full corrected-label dark-ink bounding box approximately **x671,y258,width839,height199**, measured R<100,G<80,B<60 within central protected search windowx600..1549,y230..474. Faint antialias/shadow fringe is not included. Root may isolate only结算 if preserving original返回 precisely.
- Only candidate and this record changed; original source, code, formal design, runtime resources and browser remain untouched.
