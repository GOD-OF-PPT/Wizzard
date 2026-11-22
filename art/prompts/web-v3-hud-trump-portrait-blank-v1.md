# Portrait HUD trump parchment: blank interior candidate v1

Mode: built-in ImageGen precise local edit, `transparent_background:false`.

Edit target: `art/source/web-v3/hud-source-v1/portrait-trump-reference.png`, actual359 ×80 RGB.

Raw candidate destination: `art/source/web-v3/hud-source-v1/portrait-trump-blank-candidate-v1.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: blank interior raster furniture of the original Enchanted Teahouse portrait trump-status parchment plaque.
Input images: Image1 is the sole exact edit target: the original359 ×80 RGB very wide paper plaque, including original tiny side flowers, aged-gold double border, cast shadow and cropped reddish table background. Preserve this specific crop and authored geometry.
Primary request: remove ONLY the complete red sun icon on the left, every red handwritten character and separator in “本轮王牌·藏日”, and all corresponding red ink/antialias fringe/text/icon shadows. Remove the full red disk, its thin rays, complete label, middle dot, all glyph fragments and shadow remnants. Reconstruct only the removed ink/shadow areas as a seamless continuation of the surrounding subtly textured warm parchment. The resulting interior must be completely blank unlettered same-tone paper with no red shapes, dark/light/embossed character residue, faint sun silhouette, digit, symbol or patch seam. Keep the original restrained paper grain and illumination rather than a flat/smooth fill.
Composition/framing: preserve the complete exact359 ×80 crop and its original very wide aspect ratio. Prefer359 ×80 output; if tool output is larger, keep the full source composition and all relative coordinates. Do not crop, zoom, recenter, add padding, change plaque height/width, move or reframe the plaque.
Critical preservation: do not change any part of the authored outer silhouette, aged-gold double border, upper/lower paper edge, full left/right rounded scalloped ends, small flower ornament at EACH end, original warm paper/gold reflections, cast shadow, original color balance or background RGB. Preserve the original flowers at the far-left/far-right ends, not the red sun icon inside. Preserve all source border/ornament pixels as closely as possible. Change only interior red content and corresponding shadows. Keep an opaque RGB-looking complete crop; no transparency, checkerboard or replacement background.
Text (verbatim): remove “本轮王牌·藏日” and complete red sun icon; add absolutely no text, letter, digit, glyph, icon, flower, symbol, graphic, frame or decoration.
Avoid: residual sun disk/rays; dark/light/embossed text ghosts; damaged border or end flowers; shifted/resized plaque; changed height/width or aspect; flattened end caps; redrawn outer shape; extra ornament; new graphic; bleached or flat paper patch; globally brighter/darker/recolored art; transparent pixels; watermark.

## Integration contract

Save raw output unchanged without resampling, resizing, cropping, recoloring or other post-processing. Main thread extracts only interior cleaning ROIs and retains exact original border, flowers, shadow and background. Never use the generated whole plaque as a replacement. Do not change code, canonical full-page design, browser or runtime resources.

## Generated result and inspection

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-6884b564-00cd-4331-908c-f78c985ce605.png`.
- Copied unchanged to candidate destination. Actual **2168 ×725 RGB (`Format24bppRgb`)**, not359 ×80. No candidate resampling or other post-processing.
- The tool added white upper/lower padding, violating the requested original crop/aspect. Approximate nonwhite source-content band is **x0,y120,width2168,height483** (first/last nonwhite sampled rows, threshold235 on RGB, tested at x5/center/right-6). Top-left full-canvas RGB is(253,253,253). The original359 ×80 composition is approximately preserved only inside that central band, at scale6.038997 horizontally/6.0375 vertically. Main must account for y120 offset before extracting any inside-paper ROI; no cropping has been applied here.
- Single-result inspection: complete red sun disk/rays, all red characters/separator and recognizable character/icon shadows are absent. Interior is continuous warm paper without new text/graphic. Both end flowers, scalloped silhouette and double-gold border remain structurally recognizable, but paper grain, edge sharpness and color/lighting are generated rather than exact original pixels.
- Read-only mapped point checks (no resampled artifact) confirm color drift: original quiet paper at(180,17),RGB(244,208,156),candidate(1090,225),RGB(251,218,168); top gold edge original(180,5),RGB(229,188,129),candidate(1090,153),RGB(249,224,173); left flower original(16,39),RGB(185,115,41),candidate(99,358),RGB(181,109,31). The brighter paper/gold must not replace protected original border/ornaments.
- Use only the former red-content/shadow ROI inside the paper, retaining exact source flowers/borders/shadow/background. Approximate source content envelope x34..314,y9..69 is a guide; its top/bottom touch the protected fine edge, so use the original ink/shadow mask or tighter interior ROIs rather than a full rectangle. Never paste whole generated plaque or its white padding.
