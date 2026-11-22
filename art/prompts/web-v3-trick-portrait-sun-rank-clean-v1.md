# Central trick portrait sun: rank-only cleanup v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/source/web-v3/trick-faces-v1/portrait-sun-reference.png` (420 × 630 RGBA).

Raw output destination: `art/source/web-v3/trick-faces-v1/portrait-sun-rank-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: original selected central-trick ochre-sun card face, rank-free local cleanup candidate.
Input images: Image 1 is the sole exact edit target: an unwarped source-only 420 × 630 RGBA card. Preserve this specific selected central-trick art, not a substituted hand-card design or screenshot.
Primary request: remove ONLY the upper-left black numeral “1” and its small shadow/antialias fringe. The visible numeral lies approximately x=75..132,y=78..209 in original source coordinates. Replace only its black ink and shadow with seamless matching warm ivory paper texture sampled from immediately adjacent source paper. Former numeral area must be empty unlettered paper, with no dark/light/embossed 1, vertical mark, numeric shadow or outline, and no patch seam.
Composition/framing: exact original 420 × 630 canvas, 2:3, identical full card bounds, position, size, angle and silhouette. Do not crop, resize, zoom, recenter or reframe.
Constraints: change only numeral 1 and its shadow. Preserve the ochre upper-left motif near x18..100,y20..115, every colored corner, complete ochre sun including each ray and central ring, fine border, paper edge, all source texture/color/lighting and all other pixels as closely as possible. Do not redraw or move the sun's upper ray near x191..244,y209..260. Keep original alpha exact: fully opaque paper remains fully opaque, original transparent corners unchanged, no new transparent holes, translucency, padding or silhouette change. This is numeral cleanup only.
Text (verbatim): remove “1”; add no numeral, rank, word, glyph, icon, symbol or ornament.
Avoid: ghost of 1 or its serifs; pale/embossed vertical numeral mark; damage to corner motif or sun; redrawn sun rays/ring; bleached/flat paper patch; altered border/edge/color; new alpha or translucent paper; new opaque background; watermark.

## Integration contract

Save raw generated candidate without post-processing. Main masks every candidate pixel outside bounded numeral ROI and preserves original source art/alpha elsewhere. Do not edit code, browser, runtime or final resources.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-7613eae1-92ec-429c-aafa-e63c26014c33.png`.
- Copied unchanged to requested path. Actual **1024 × 1536 RGBA**, exact 2:3; not requested 420 × 630. No post-processing.
- Alpha min 0 / max 251; 3 alpha-zero pixels, 1,572,861 partial-alpha pixels. Original opaque paper alpha is not preserved. Former rank area sample at generated (244,293), source approximately (100,120), is RGBA (97,77,48,10), showing a severe low-opacity/dark material artifact.
- Numeral 1 itself is gone with no recognizable dark/light/embossed 1 shape, and sun/corner motifs remain structurally present. However a broad dark/translucent cloud appears across the upper paper, including the numeral-cleanup region. This is not acceptable continuous matching paper, even for direct numeral-ROI composition. Candidate is preserved as raw evidence and requires a fresh cleanup candidate; do not silently treat it as passing or fix by replacing the whole card.
- Original visible numeral (75,78)..(132,209) maps proportionally to generated (183,190)..(322,510). The alpha/material defect affects that bounded region too.
