# Central trick portrait rank: opaque paper-only cleanup patch v1

Mode: built-in ImageGen edit with `transparent_background:false` explicitly.

Edit target: `art/source/web-v3/trick-faces-v1/portrait-rank-paper-reference.png` (115 × 175 RGB).

Raw output destination: `art/source/web-v3/trick-faces-v1/portrait-rank-paper-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: opaque, quiet warm ivory card-paper patch used only inside a bounded black-rank removal mask.
Input images: Image1 is the sole exact edit target: a115 ×175 RGB crop of original warm ivory card paper containing only a black7 and its small shadow. It contains no card corner ornament, emblem, border, scene, alpha or other object. Treat the entire rectangular crop as paper.
Primary request: completely remove the black7 and its shadow/antialias fringe. Rebuild the former ink area with a continuous natural continuation of the immediately adjacent original warm ivory paper texture. The resulting ENTIRE canvas must be plain, unlettered, softly textured original paper with consistent warm color and gentle original illumination. No residual numeral in any dark, pale, embossed, indented, translucent, shadowed or outlined form. No new letter, number, icon, symbol, ornament, edge or border. Preserve source paper texture/color in all remaining pixels as closely as possible.
Composition/framing: retain exact original115:175 aspect ratio and full rectangular crop; prefer115 ×175 output but larger same-aspect output is acceptable. Do not introduce perspective, camera framing, zoomed object, margins, crop, rounded corners or surrounding surface. Every pixel of the image is the same continuous paper material.
Opacity/background constraints: every internal AND external pixel must look fully opaque RGB paper. Absolutely NO alpha transparency, transparent background, translucent paper, alpha hole, checkerboard, black cloud, vignette, dark blemish, shadow patch, cutout, solid-white blank patch, border or external padding. This is an opaque rectangular texture patch, not an isolated asset. The full rectangle including all four corners must contain the original matching warm ivory paper.
Text (verbatim): remove7; no text or symbol anywhere.
Avoid: any7 ghost or number-shaped grain; mottled square; cloudy dark shading; fake transparency; alpha effects; embossed lettering; flat bleached fill; changed paper warmth; seams; object/card outline; watermark.

## Integration contract

Keep raw result unchanged. This patch supplies bounded rank-region paper only, with source-boundary tone registration performed by main thread. Do not alter code, browser, runtime, source references or final assets; no post-processing in this task.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-a8b060aa-6f5c-4fe3-b79f-c1dc81e584dd.png`.
- Copied unchanged to requested candidate path. No post-processing.
- Actual **1017 ×1546 RGB (`Format24bppRgb`)**. RGB format has no alpha channel, so the entire patch is opaque. Center RGBA sample is (248,222,179,255); all four corners alpha255. Actual ratio differs from115:175 by about0.1%; do not claim exact source dimensions/aspect.
- Visual inspection: entire canvas is continuous warm ivory paper, no recognizable7, light/embossed numeral, number-shaped shadow, dark cloud, translucent hole, border, emblem or corner motif. Texture is more detailed/grainy and paper appears lighter than the small reference; source-boundary tone registration remains necessary for precise integration.
