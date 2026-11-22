# Central trick portrait knot: rank-only cleanup v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/source/web-v3/trick-faces-v1/portrait-knot-reference.png` (420 × 630 RGBA).

Raw output destination: `art/source/web-v3/trick-faces-v1/portrait-knot-rank-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: original selected central-trick red-knot card face, rank-free local cleanup candidate.
Input images: Image 1 is the sole exact edit target: an unwarped source-only 420 × 630 RGBA card face. This specific original central-trick art must remain, not a hand-card substitute or screenshot.
Primary request: completely remove ONLY the upper-left black numeral “3” and its small shadow/antialias fringe from the ivory paper. Visible black ink is approximately x=77..159,y=78..208 in this source. Reconstruct only its ink/shadow pixels with continuous original warm ivory paper grain sampled from immediately around the numeral. The former rank area must be unlettered paper with no dark 3, pale/embossed 3, translucent digit, indentation, number-shaped texture, shadow or outline. No flat patch or seam.
Composition/framing: exact original 420 × 630 canvas, complete 2:3 card, identical position, scale, angle, silhouette and bounds. Do not crop, resize, zoom, recenter or reframe.
Constraints: alter only numeral 3 and its shadow. Preserve the red upper-left corner motif, all colored corner patterns, the full red knot emblem including its upper tip and interwoven loops, original fine border, paper edge, paper texture/color/lighting and every other original pixel as closely as possible. The colored upper-left ornament near x18..98,y20..115 is protected. Do not touch it while removing black ink. Preserve exact original alpha: transparent original corners remain as they are, fully opaque paper remains fully opaque, with no new alpha holes, translucency, padding or silhouette changes. No redrawn or enlarged card.
Text (verbatim): remove “3”; add no rank, glyph, letter, symbol, text or decoration.
Avoid: dark/light/embossed numeral residue; ghost of either curve of 3; damage to corner motif or knot; changed symbol geometry or color; smooth/bleached paper patch; changed border or edge; newly translucent paper; new opaque background; watermark.

## Integration contract

Save raw generated result without post-processing. Main thread masks all candidate pixels outside a bounded numeral ROI and retains exact source art/alpha elsewhere. No code, browser, runtime or final resource edits.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-25a87bf5-5ce3-4dee-a551-ec01c488fc63.png`.
- Copied unchanged to requested candidate path. No post-processing.
- Actual output **1024 × 1536 RGBA**, exact 2:3, not requested 420 × 630. Alpha min 0 / max 251, 47 alpha-zero pixels and 1,572,817 partial-alpha pixels; opacity differs from original opaque paper, so exact no-new-alpha requirement was not fulfilled. Preserve original alpha during numeral-only integration.
- Single-result visual inspection: black 3 and small shadow completely gone, no obvious dark/light/embossed 3 ghost. Upper-left motif and upper knot tip remain structurally intact. Paper lighting is more mottled/shaded than source, and emblem/edge details have generative changes; only the bounded numeral-mask region is suitable.
- Original visible numeral area approximately (77,78)..(159,208) maps proportionally to generated (188,190)..(388,507). Main retains exact reference art and alpha elsewhere.
- Main-thread direct-composition review found a mottled square in the rank patch and rejected it as a source for the original rank ROI. Preserve this candidate as evidence; use the separately generated opaque paper-only patch after source-boundary registration instead.
