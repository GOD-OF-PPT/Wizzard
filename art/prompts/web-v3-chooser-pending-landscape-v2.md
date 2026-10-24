# Chooser submitting state — landscape v2

Built-in ImageGen local edit. Immutable edit target: `art/mockups/web-v3/11-chooser.png`.
Raw output destination: `art/source/web-v3/chooser-pending-landscape-v2.png`.
This version avoids the strong dark veil in both rejected v1 outputs. The paper should remain pale cream at approximately the original luminance, while a small reduction in colored-ink saturation and contrast supplies a restrained disabled cue.

## Exact prompt

Use case: precise-object-edit
Asset type: existing browser game interaction-state mockup, landscape 1672 × 941 pixels.
Input image 1 is the EDIT TARGET and the immutable source for every unchanged element. Make a tiny local state edit of this exact image. Preserve its full canvas and composition.

Change A: the four central suit choices are now waiting for a submitted choice. Give each card plus its matching label ONLY a barely perceptible disabled treatment: keep the pale cream paper at the same lightness and warmth as the input; gently soften the saturation and contrast of its colored suit emblem, colored corner ink, and label lettering by about ten percent. The choices should still look like bright pale cream cards, with fully legible labels and crisp borders. Do not add a dark overlay, gray wash, shadow layer, blur, mask, translucent veil, or strong dimming. Do not alter the surrounding red panel. Treat all four choices equally, with no selected choice. Preserve positions, proportions, symbols and exact Chinese labels.
Choice edit rectangles in full-canvas pixels: mountain x445–615 y390–664; knot x649–818 y390–664; leaf x853–1022 y390–664; sun x1057–1226 y390–664. Changes must remain inside those rectangles.

Change B: edit only the content inside the existing small dark lacquer mode plaque at the top right. Remove its person icon and the original “单人练习” text. Replace them with the exact one-line text “正在提交选择…” centered inside the existing plaque, in warm cream brush lettering. Use small lettering that comfortably fits with space on both sides. Do not change the plaque border, dimensions, position, material, or illumination. Plaque ROI x1457 y13 width190 height52; text-safe interior x1468 y21 width169 height35. No icon or spinner.

Text (verbatim): “正在提交选择…”
Invariants: exactly 1672 pixels wide by 941 pixels high, no trim, no crop, no padding, no scaling. Preserve every other pixel as faithfully as possible: all avatars, traveler names, stats, timer, return control, round sign, hand cards, scenery, lanterns, lacquer, flowers, main title and subtitle. In particular keep the existing cream cards BRIGHT, not brown or gray. Preserve original overall exposure and rich warm tea-house colors. No new layout, label, decoration, watermark, or signature.

## Intended edit regions

- Mountain choice: x445, y390, width170, height274.
- Knot choice: x649, y390, width169, height274.
- Leaf choice: x853, y390, width169, height274.
- Sun choice: x1057, y390, width169, height274.
- Mode plaque: x1457, y13, width190, height52.

Raw output is a candidate only. This asset task does not change a final mockup, implementation, manifest, or acceptance result.

## Raw inspection

- Output dimensions: 1672 × 941, matching the immutable source canvas.
- The top-right person icon and original mode label were replaced by the visible exact phrase `正在提交选择…`.
- All four central choices have paler colored ink and remain bright cream rather than the dark gray-brown treatment of the rejected v1 candidates. Their original positions, recognizable symbols and labels remain visible.
- Four 25 × 20 paper patches at x500/705/910/1114, y410 retain mean RGB ratios 1.0223 / 1.0233 / 1.0230 / 1.0216 relative to the source, so paper did not suffer the earlier excessive dimming.
- Raw full-frame generation still changes 1,334,683 pixels outside the five intended ROIs (exact RGB comparison). It must not replace the immutable source wholesale or be described as an accepted pixel-preserving edit. A separate integration decision is required before using any local ROI.
- No final mockup, runtime asset, code, manifest, browser evidence or acceptance status was changed.
