# Chooser submitting state — landscape v1

Built-in ImageGen edit. Edit target: `art/mockups/web-v3/11-chooser.png`.
Output raw candidate: `art/source/web-v3/chooser-pending-landscape-v1.png`.

## Exact prompt

Use case: precise-object-edit
Asset type: full-screen game interaction-state design, landscape browser, exact 1672 × 941 pixel canvas.
Input image 1 is the EDIT TARGET. Preserve its complete composition and original pixels as faithfully as possible. This is a precise disabled/submitting-state edit, not a redesign.

Change only two things:
1. On the four central suit-selection card-and-label areas, apply a restrained uniform 18% black disabled overlay to each card together with its matching parchment label. Preserve every suit symbol, Chinese label, card border, size, position, sharpness, and internal detail. Approximate full-canvas rectangles are: mountain x445–615 y390–664, knot x649–818 y390–664, leaf x853–1022 y390–664, sun x1057–1226 y390–664. Keep the red panel and all spaces between choices unchanged.
2. Inside the existing small top-right dark lacquer mode plaque, remove ONLY its person icon and its original “单人练习” text. Keep the plaque border, dimensions, placement, background material and lighting unchanged. Replace that interior content with the exact Chinese text “正在提交选择…” centered on one line in small warm cream brush lettering, fitting comfortably within the current plaque. Plaque interior approximately x1468–1637 y21–56. No icon or spinner.

Text (verbatim): “正在提交选择…”
Constraints: retain the exact 1672 × 941 landscape canvas with no crop, padding, framing, or scaling. Preserve all other text exactly, including the large chooser title, subtitle, four option labels, timer, round sign, names, statistics and return-home control. Preserve all characters, avatars, cards, background scene, rich red lacquer panel, gold ornament, color grading, and illumination. Do not move or redraw any element outside those five local edit areas.
Avoid: new modal, new banner, spinner, progress icon, blur, rearranged controls, changed selection, added labels, changed typography elsewhere, new decoration, watermark, signature.

## Invalid-output correction attempt

The first output was 1671 × 941 instead of 1672 × 941 and excessively darkened the choices (sample RGB mean retained about 42–44%, not 82%). Raw original remains at `art/source/web-v3/chooser-pending-landscape-v1.png`. The following single retry is authorized only by that invalid output and uses the immutable original source again.

Exact retry prompt:

Precise local edit of input image 1, which is the immutable ORIGINAL 1672 × 941 browser game design. Output MUST remain exactly 1672 pixels wide by 941 pixels high, including its final rightmost pixel column. No resizing, no recrop, no canvas trim. Preserve all imagery and typography outside the edits.

Edit A: Four central suit choices need only a VERY FAINT disabled tint: composite BLACK at exactly 0.18 alpha so each original RGB value keeps 82% of its intensity. This is an 18% darkening, not an 18% brightness. The cream cards must remain pale cream and fully readable, not grey-brown or strongly dimmed. For example an original cream paper pixel RGB (242,214,168) should become approximately (198,175,138), never (103,91,72). Tint each card and its matching parchment label, preserving all edges and original geometry. Rectangles: x445–615 y390–664; x649–818 y390–664; x853–1022 y390–664; x1057–1226 y390–664. Do not darken the surrounding red panel, gaps, title, subtitle, scene, timer or hand cards.

Edit B: In the existing top-right mode plaque, remove just the person icon and “单人练习” lettering. Write exactly “正在提交选择…” on one centered line, small warm cream brush type. Preserve the existing plaque shape, frame, position and dark lacquer texture. Label interior x1468–1637 y21–56. No icon, spinner, modal or new decoration.

Preserve every other element exactly: title, subtitle, suit labels, characters, avatars, names, numbers, timer, hand cards, gold details, borders, original warm tea-house palette. Two local edits only; original canvas exactly 1672 × 941.

## Raw inspection outcome

- First raw: `art/source/web-v3/chooser-pending-landscape-v1.png`, 1671 × 941; invalid canvas and excessive dimming, not accepted.
- Correction raw: `art/source/web-v3/chooser-pending-landscape-v1-retry.png`, 1672 × 941; correct canvas, pending phrase and icon removal appear correct. The four paper sample RGB-mean retention ratios are 0.630, 0.641, 0.612, 0.625 versus target 0.820, so disabled treatment remains too dark. Not accepted as exact-opacity truth.
- Whole choice-edit union ROI: x445, y390, width781, height274. Individual rectangles are recorded above.
- Top-right plaque ROI: x1457, y13, width190, height52; text-safe interior x1468, y21, width169, height35.
- Built-in ImageGen used. No final mockup, runtime asset, code or acceptance status was changed by this asset task.
