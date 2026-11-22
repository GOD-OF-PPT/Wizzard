# Portrait HUD trump parchment: single-character correction v1

Mode: built-in ImageGen precise local edit, `transparent_background:false`.

Sole edit target: `art/source/web-v3/hud-source-v1/portrait-trump-reference.png` (359 ×80 RGB).

Raw candidate destination: `art/source/web-v3/hud-source-v1/portrait-trump-corrected-candidate-v1.png`.

## Complete prompt

Use case: text-localization
Asset type: single-character correction candidate of an existing Enchanted Teahouse parchment trump-status plaque.
Input images: Image1 is the sole exact edit target: original359 ×80 RGB parchment plaque. No other image or newly generated plaque is a source of truth.
Primary request: correct ONLY the one incorrect red Chinese character “藏” near the right end of the existing label to the correct character “赭”. The complete corrected label must read exactly “本轮王牌·赭日”. Replace only the ink/shadow of 藏 with 赭 in the same source character slot, approximately x252..284,y24..55, preserving the original handwritten brush style, red pigment color, font size, optical baseline, spacing, stroke texture, lighting and subtle text shadow. Restore matching original paper only in the small pixels vacated by old strokes. The new character must be the actual Chinese character 赭, composed of 赤 on its left and 者 on its right; not 藏, 褚, 猪, or another lookalike.
Critical preservation: all other characters 本轮王牌, the separator dot, and final 日 remain absolutely unchanged in shape, color, position and spacing. Preserve the complete left red sun disk and every ray, entire original warm paper texture, exact authored plaque silhouette, aged-gold double border, small flower ornament on both ends, original cast shadow, reddish background crop, original size and relative composition. No other text correction, graphic change or new element. Do not repaint the whole label or redesign the plaque.
Composition/framing: exact original359 ×80 complete crop with same very wide359:80 aspect. Prefer359 ×80 output; if larger, preserve all source relative geometry. Do not crop, add white/black padding, create a background canvas, zoom, recenter, resize individual objects or reframe. The complete canvas remains the original RGB crop, opaque with no alpha or checkerboard.
Text (verbatim): “本轮王牌·赭日”. Change only 藏→赭; no other glyph, letter, numeral, symbol or decoration may be added or changed.
Avoid: incorrect 赭 glyph; replacing 赭 with a similar character; misspelling any other word; changing the final 日 or red sun; shifted label; new line; new borders/flowers; background recoloring; brighter/darker global art; redesigned plaque; white/black padding; transparency; watermark.

## Integration contract

Save raw generated candidate unchanged without resizing, cropping, resampling, recoloring, alpha changes or any post-processing. Main thread will locally compose the corrected glyph only and retain exact source pixels everywhere else. This candidate cannot be a whole-plaque replacement. No edits to code, full-page canonical design or runtime resources.

## Generated result and inspection

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-8862209b-133e-4f85-a34b-963b5ab22bf3.png`.
- Copied unchanged to candidate destination. Actual **2169 ×725 RGB (`Format24bppRgb`)**, not359 ×80. No post-processing.
- Effective nonwhite original-content band approximately **x0,y119,width2169,height482** (nonwhite threshold235, sampled at x5/center/right-6). Tool added white upper/lower padding, violating original full-canvas aspect/crop. Inside this band, proportional source mapping scales are2169/359 horizontally and482/80 vertically. Account for y119 offset before local glyph extraction.
- Single-output visual check: label is readable as 本轮王牌·赭日, with red 赭 in the former 藏 slot; the handwritten character has left赤/right者 structure. Original neighboring wording, separator, final日 and left sun remain structurally present. The generated writing/stroke rendering, paper color and edge/border softness are not exact original pixels, and white padding is additional drift.
- This is a glyph source candidate only. Preserve the complete original plaque, all untouched letters, sun, flowers, border, shadow and background. Main should isolate corrected red ink/antialias pixels and perform local registration, rather than copy the full character rectangle or whole generated plaque.
- Red corrected-glyph bright ink box approximately **x1534,y275,width160,height159**, measured in a protected right-label search window with R>80,G<100,B<80,R>G*1.5. This excludes faint antialias/shadow fringe; use padded ink segmentation for composition and preserve neighboring separator/final日 from source.

## Rejected by main-thread glyph review

The main thread inspected the actual glyph and found it is still 藏 (艹 top and 臧 body), not 赭 (赤+者). The earlier visual statement above was incorrect. **Reject this v1 candidate and do not compose it.** A separate v2 retries from the sole original reference, with explicit radical constraints. Preserve this rejected raw output and record for traceability.
