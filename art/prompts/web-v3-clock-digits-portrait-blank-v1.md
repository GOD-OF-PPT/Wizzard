# Portrait ordinary clock: dynamic digits blank candidate v1

Mode: built-in ImageGen precise local edit, `transparent_background:false`.

Sole edit target: `art/source/web-v3/hud-source-v1/portrait-timer-reference-v1.png`, actual211 ×193 RGB.

Raw candidate destination: `art/source/web-v3/hud-clock-v1/portrait-clock-digits-blank-candidate-v1.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: numeral-only cleanup candidate of the existing Enchanted Teahouse portrait ordinary turn timer.
Input images: Image1 is the sole exact edit target: original211 ×193 RGB source crop of the thin golden circular clock with dark-brown dial, gold hourglass, 28秒 label, lower-left cloud ornament, glow and original outer table background.
Primary request: remove ONLY the two gold numerals “28” in the lower central dial, approximately x76,y96,width48,height39 in source coordinates. Completely erase the ink and tiny digit antialias/shadow fringe of “2” and “8”. Restore only those removed numeral pixels with naturally continuous matching nearby deep dark-brown dial texture and existing gentle lighting. Leave that former numeral slot blank with no dark/light/embossed 2 or8 residue, outlines, numeral-shaped shadow, patch seam or new content. Do NOT treat the whole approximate rectangle as editable: preserve any nearby “秒” pixels and all original decorative/dial pixels.
Absolute preservation: keep the gold Chinese unit **“秒”** to the right of the removed28 completely unchanged, at the same location, size, style, hue and brightness. Keep the original upper hourglass icon completely unchanged. Preserve all original circular rim and inner ring, fine tick marks, small gold accents, warm edge glow and sparkles, lower-left sculpted cloud, ordinary clock shadow, dark-brown face material elsewhere, complete outside teahouse/table pixels and every original spatial relation. Do not move, resize, rotate, brighten, recolor or redraw the clock or any ornament. Do not remove the unit or hourglass and do not add any new numeral, icon, text or decoration.
Composition/framing: preserve the complete original211 ×193 crop and aspect ratio, full clock/background composition, exact relative positions and bounds. Prefer211 ×193; larger same-aspect output acceptable only if exact relative geometry is kept. No crop, zoom, padding, reframing or new background. Keep opaque RGB-looking image with no alpha or checkerboard.
Text (verbatim): remove only “28”; keep “秒” exactly. No other text changes.
Avoid: removing/damaging/rewriting秒; erasing or redrawing hourglass; changed ring geometry/ticks/glow/cloud; a flat brown rectangle; numeral ghosts; dark/light halo patch; new timer design; shifted unit; global brightness/color change; transparent holes; watermark.

## Integration contract

Save raw generated output unchanged without resampling, cropping, resizing, recoloring, alpha changes or other post-processing. Main thread will take only internal numeral-mask dial material, protecting original seconds unit, hourglass and every non-digit pixel. No code, full-page design, runtime resource or browser changes.

## Generated result and inspection

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-2cd4631e-aa3c-4c73-bb47-a89ebc8c5410.png`.
- Copied unchanged to candidate destination. Actual **1312 ×1199 RGB (`Format24bppRgb`)**, not211 ×193. Horizontal/vertical scale relative to source6.218009/6.212435, so original aspect is close but not exact. No padding observed. No post-processing.
- Single-result visual inspection: both28 numerals and recognizable digit shadows are gone; former numeral area is continuous deep-brown dial with no dark/light/embossed2/8 residue or flat rectangular patch. Gold秒 remains readable on the right and original hourglass, circular rim/ticks, glow, cloud and surrounding table remain structurally present. No new numeral or element.
- Exact non-digit pixel preservation is not achieved. The rendered秒/hourglass/rim stroke details and material illumination drift slightly. Read-only nearest-coordinate probes (no resampled file): quiet dial source(70,90) RGB(35,20,7),candidate(438,562) RGB(33,19,5); outside-top-left source(0,0) RGB(128,20,0),candidate(3,3) RGB(133,26,3); hourglass-center source(114,64) RGB(137,106,36),candidate(711,400) RGB(149,130,61); mapped秒-region source(133,115) RGB(118,95,43),candidate(830,717) RGB(254,252,186), indicating local stroke/lighting registration differs. Preserve original秒/hourglass/decorations/background, never import those generated pixels.
- Approximate requested source numeral envelope(76,96,48,39) maps to candidate approximately **x473,y596,width298,height243**. Its right edge approaches protected秒; main must use exact numeral-ink/shadow mask rather than the entire broad rectangle and retain every source秒 pixel. Only clean internal dial pixels are supplied by this candidate.
- Original source, canonical full-page design, code, browser and runtime resources remain untouched.
