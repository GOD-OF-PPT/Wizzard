# Portrait reconnecting: inactive hand exterior glow cleanup v1

Mode: built-in ImageGen precise local edit with `transparent_background:false`.

Edit target: `art/mockups/web-v3/portrait/15-reconnecting.png` (941 ×1672).

Raw candidate: `art/source/web-v3/recovery-source-v1/portrait-reconnecting-inactive-hand-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: bounded local visual/semantic correction of the existing portrait reconnecting source, removing an unintended disabled-hand selected cue.
Input images: Image1 is the complete original941 ×1672 selected portrait reconnecting page. It is the sole edit target and exact source of truth for scene, card faces, layout, text, lighting and all other pixels.
Primary request: remove ONLY the unintended warm orange-golden selected halo/glow on the exterior of the first bottom-left hand card, the paper card with black5 and teal leaf. The four underlying hand cards are disabled and unselected under this reconnecting modal. Restore only the halo-spill pixels outside that card's authored paper silhouette using continuous matching already-dim teahouse/table material immediately surrounding it. Keep ordinary subtle card shadow/normal paper edge, but eliminate every bright selected outline and luminous gold spill. Match the unselected exterior treatment of neighboring cards. Approximate first-card cleanup envelope x122..292,y1250..1490 in source coordinates; do not treat the whole rectangle as editable, only the glow outside the paper.
Absolute paper preservation: ALL four cards' paper faces, number ranks5/8/2/6, suit symbols, corner ornaments, ordinary paper edges, original angles, positions, width/height, spacing and brightness remain exactly unchanged. Do not redraw, dim further, recolor, move, resize, rotate or replace any card face, particularly the first teal-leaf5 card. Protect its paper interior and edge; only outside selected glow is removed.
Other preservation: keep every other source element as closely unchanged as possible: the reconnecting modal, title正在恢复连接, all body copy, normal 立即重试 parchment button and border, dark-blue panel texture, gold frame/cloud ornaments, all avatars/nameplates/stats, original teahouse scene, central table, moon/lanterns, foreground props and existing dimmed lighting. No other object or illumination changes. This source has no action keyboard-focus ring: do not add a ring, create focus state, or alter the button. Do not touch any existing original frame or gold decoration elsewhere.
Composition/framing: exact941 ×1672 full portrait canvas. No crop, zoom, recenter, resize, rotation, camera movement, reframing or new scene composition. Save an opaque RGB-looking full image, no alpha transparency or checkerboard.
Text (verbatim): every original word, rank and glyph stays unchanged; no new text.
Avoid: remaining selected gold halo around leaf5; card-face changes; erasing normal paper border or ordinary shadow; opaque dark rectangular cleanup patch; new focus ring/state; changed panel/body/button; global color/brightness changes; altered card geometry; new objects; watermark.

## Integration contract

Save raw generated output unchanged, without post-processing. Main thread masks outside first-card paper only and derives a new canonical source version while preserving old source. No edits to focus assets, canonical mockups, code, browser or runtime.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-4a66dc22-aceb-4faa-bc04-d350da880031.png`.
- Copied unchanged to requested candidate destination. Actual **941 ×1672 RGB (`Format24bppRgb`)**. No post-processing.
- Single-result inspection: external orange-gold selected halo around bottom-left leaf5 is gone, with adjacent dim table material continuing to the card. All four faces/ranks/symbols/corners remain structurally intact and in the same apparent poses, no new focus ring or state. Modal, text, button and scene composition remain structurally recognizable.
- Exact preservation is **not achieved**: sampled RGB comparisons show changes inside protected paper and remote regions. On an8px grid: leaf5 paper interior x150,y1280,w110,h170 has307/308 changed samples, mean absolute per-channel delta3.568; modal body x260,y600,w420,h360 has2342/2385 changed samples, mean4.166; upper scene x10,y10,w920,h480 has6791/6900 changed samples, mean3.348 (0..255 channel scale). These measurements prove nonlocal/paper drift despite structural similarity.
- Only take needed exterior glow-removal pixels around first card using the exact source paper silhouette and protected source pixels everywhere else. Approximate envelope x122..292,y1250..1490; do not paste the full rectangle or use generated card paper, panel or scene as replacements. The source remains unmodified and this candidate is not whole-page acceptance.
