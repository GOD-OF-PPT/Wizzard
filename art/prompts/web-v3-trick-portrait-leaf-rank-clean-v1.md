# Central trick portrait leaf: rank-only cleanup v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/source/web-v3/trick-faces-v1/portrait-leaf-reference.png` (420 × 630 RGBA).

Raw output destination: `art/source/web-v3/trick-faces-v1/portrait-leaf-rank-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: original selected central-trick leaf-card face, rank-free local cleanup candidate.
Input images: Image 1 is the sole exact edit target: an unwarped source-only 420 × 630 RGBA card face, not a hand-card design or screenshot. Preserve this specific existing art.
Primary request: remove ONLY the upper-left black numeral “7” and its very small shadow/antialias fringe from the ivory paper. The visible black ink lies approximately x=86..170,y=78..208 in this 420 × 630 reference. Rebuild those ink/shadow pixels with a continuous matching sample of the immediately adjacent warm ivory paper texture. Leave blank unlettered paper, with no dark 7, pale/embossed 7, numeral-shaped shadow or outline, and no patch seam.
Composition/framing: preserve the exact original 420 × 630 canvas, same 2:3 ratio, complete original card position, scale, shape, angle and bounds. Do not crop, resize, zoom, recenter or reframe.
Constraints: change only numeral ink and its shadow. Preserve the teal upper-left corner motif, all other colored corner decorations, the complete teal leaf emblem, fine paper border, paper edge, original paper color/grain/lighting, and all original pixels elsewhere as closely as possible. The upper-left colored motif near x20..100,y20..115 is protected and must not be erased, shifted or recolored. The leaf tip and veins are protected. Preserve the exact source alpha behavior: no new transparent holes or changed opacity within the paper, no added transparent padding, no modified silhouette or opaque replacement background. This is rank removal only, not a redraw.
Text (verbatim): remove “7”; add no letter, numeral, symbol, text or decoration.
Avoid: any dark/light/embossed numeral residue; touching the colored corner motif or leaf; regenerated emblem; bleached or flat paper patch; changed edge/border/color; new alpha holes or padding; altered composition; watermark.

## Integration contract

Save the raw generated result without any post-processing. Main thread will mask all candidate pixels outside a bounded numeral ROI, preserving the exact extracted reference elsewhere. Do not modify code, browser, runtime or final resources.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-d683695c-1c1d-49af-9c84-78e95f05c36e.png`.
- Copied unchanged to requested candidate path. Actual **1024 × 1536 RGBA**, exact 2:3, not requested 420 × 630. No post-processing.
- Alpha min 1 / max 250; all 1,572,864 pixels are partial-alpha; no alpha-zero pixels. This changes opacity from the original and does not satisfy exact no-new-alpha preservation. Root must retain source alpha when integrating numeral-only pixels.
- Visual inspection: numeral 7 and its shadow fully gone, with no apparent dark/light/embossed 7 ghost. Adjacent colored upper-left motif and leaf tip remain structurally present. Paper grain/lighting and corner/edge rendering have generative differences, so only bounded numeral-mask material is suitable for integration.
- Original visible numeral area approximately (86,78)..(170,208) maps proportionally to generated (210,190)..(415,507). Keep the colored motif protected; root uses its exact original rank mask/ROI.
