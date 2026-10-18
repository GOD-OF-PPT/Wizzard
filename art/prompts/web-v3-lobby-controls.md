# Lobby controls — built-in ImageGen

The source is the selected lobby and exact reference-only crops in `art/reference/web-v3/lobby-*-reference.png`. Initial full-scene candidates were rejected for excessive capsule aspect and exterior/gap noise. V2 masters are under `art/source/web-v3/`; runtime files preserve their RGBA artwork and trim excess transparent canvas only. No code-native icon replacements.

## add — exact v2 prompt

Use case: background-extraction. This cropped reference is the EXACT button component to extract. Preserve its complete outer gold border geometry and visible approximately4:1 width/height ratio, including ACTUAL BLACK FILL HEIGHT, not transparent padding. Standalone transparent PNG of this very same rounded nearly-black midnight-blue button, with source pale-gold robot head icon at the left. Remove ONLY the Chinese text 添加机器人 leaving the right two-thirds of the interior completely blank black-blue. No redrawing as a long thin capsule; do not flatten the button. Gold stroke and robot proportions match the supplied crop. Interior and icon solid, exterior genuinely alpha0 with clean antialiasing, no colored debris, no glow. Exact authored visible ratio4:1, intendedscreen210x53px.

## remove — exact v2 prompt

Use case: background-extraction. Cropped reference is the EXACT button component to extract. Preserve complete gold border geometry and visible approximately3.8:1 width/height ratio, including ACTUAL BLACK FILL HEIGHT, not transparent padding. Standalone transparent PNG of this same rounded nearly-black midnight-blue button, retaining source pale-gold disc with black minus at left. Remove ONLY Chinese text 移除机器人 leaving right two-thirds interior completely blank black-blue. Do not make a long thin capsule or flatten the frame. Preserve the original corner radius and icon scale. All interior and icon fill solid; exterior truealpha0, clean antialias, no coloreddebris/noglow. Target visible ratio3.8:1, intendedscreen202x53px.

## group — exact v2 prompt

Use case: background-extraction. Extract/recreate the EXACT solid pale-gold two-person bust glyph from this tiny source crop. Keep only heads and shoulders; remove the dark blue rectangle background. Preserve ORIGINAL human silhouette shape and proportion, including one slightly foreground larger person and second person behind to the right. Flat solid parchment gold #ffe5a0; NO gradient, no texture/noise, no white outline, no shadow, no glow, no border or panel. Clean opaque glyph fill, true transparent background and gaps; no floating alpha specks. Output high resolution squareRGBA with tightly fitted small clear border.

## wifi — exact v2 prompt

Use case: background-extraction. Extract/recreate the EXACT flat solid GREEN WIFI SIGNAL GLYPH from tiny source crop. Preserve the three broad arcs above one small diamond-like dot and the source roundedcaps/proportions. Remove ALL dark chip background and any stray partial Chinese character at right. Solid green #8acb74 NO gradient/texture, NO yellow, NO noise, no white outlines/shadow/glow. Each arc fully opaque, all gaps and exterior fully alpha0; no colored debris or low-alpha speckles between arcs. Tightly frame standalone icon with small transparent border. No panel or text.

## robot — PC standalone glyph

Use case: background-extraction. Extract ONLY the friendly pale-gold robot head glyph from this tiny crop, retaining short antenna ball, rounded head, two dark eyes, smile and side ears. Remove ALL dark background. Standalone transparentRGBA gold silhouette, solid pale parchment gold #ffe5a0, no gradient, no texture, no shadow/glow, no frame, no text. Preserve original source shape, clean opaque gold fill and clean alpha0 exterior/internal eye gaps; do not add a full robot body. Tight square canvas, visible glyph80% of canvas, intendeddisplay32x32px.

## minus — PC standalone glyph

Use case: background-extraction. Extract ONLY the pale-gold circular disc with dark short horizontal minus from this tiny crop. Remove dark rectangle background. Match source gold #ffe5a0 flat filled disc, not a 3D coin, no embossing/bevel/rim, no texture or shadow/glow, no text or surroundingbutton. Exact simpleicon. Clean opaque gold anddarkminus, alpha0 outsidecircle, smalltransparentmargin, squarecanvas. Intendeddisplay28x28px.
