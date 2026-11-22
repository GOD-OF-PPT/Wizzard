# Central trick portrait mountain: rank-only cleanup v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/source/web-v3/trick-faces-v1/portrait-mountain-reference.png` (420 × 630 RGBA).

Raw output destination: `art/source/web-v3/trick-faces-v1/portrait-mountain-rank-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: original selected central-trick blue-mountain face, rank-free local cleanup candidate.
Input images: Image 1 is the sole exact edit target: an unwarped source-only 420 × 630 RGBA card. Preserve this exact central-trick art, not hand-card artwork or a screenshot.
Primary request: remove ONLY the upper-left black “9” and its small shadow/antialias fringe. Its visible black ink is approximately x=76..159,y=78..208 in source coordinates. Rebuild only those ink/shadow pixels with seamless matching original warm ivory paper texture from the immediately surrounding paper. The former numeral area must be plain unlettered paper with no dark/light/embossed 9, loop, tail, numeral-shaped texture, outline or numeric shadow. Preserve original paper warmth, grain and lighting without a patch seam.
Composition/framing: exact 420 × 630 original canvas, 2:3, identical full-card bounds, size, position, silhouette and angle. No crop, resize, zoom, recentering or reframing.
Constraints: change only numeral 9 and its shadow. Preserve the upper-left blue corner motif near x18..100,y20..115, every colored corner decoration, every blue mountain peak, white snow-line geometry, central emblem, paper border/edge, source colors and all original artwork elsewhere. The tallest peak around x216,y233 is protected. Do not redraw or move it. Preserve original exact alpha: paper remains fully opaque, original transparent corners unchanged, no new translucent areas, transparent holes, padding or silhouette changes. Do not introduce dark shading or alpha clouds anywhere in the paper.
Text (verbatim): remove “9”; no new numeral, rank, glyph, text, icon, symbol or ornament.
Avoid: any ghost of 9's loop or tail; numeral-shaped light/embossed marks; dark translucent clouds or alpha holes; damage to corner motifs or mountain/snow lines; bleached/smooth paper patch; changed border/edge/color; redraw/recolor; new opaque background; watermark.

## Integration contract

Save raw generated result without post-processing. Main masks all candidate pixels outside bounded numeral ROI and preserves exact original art/alpha elsewhere. No code, browser, runtime or final resource editing.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-c605de99-759e-4d41-af33-cb67dc230f56.png`.
- Copied unchanged to requested path. No post-processing.
- Actual output **1024 × 1536 RGBA**, exact2:3, not420 ×630. Alpha min1/max249; all1,572,864 pixels partial-alpha, none fully transparent. This does not preserve original opaque-paper alpha. Main must retain source alpha during any bounded patch composition.
- Visual inspection: numeral9 and its shadow gone with no recognizable dark/light/embossed 9 ghost; upper-left motif, mountain tip and snow lines structurally intact. Paper grain/lighting and overall art differ from exact source; never replace full card.
- Original visible numeral (76,78)..(159,208) maps proportionally to generated (185,190)..(388,507) at 1024 × 1536.
