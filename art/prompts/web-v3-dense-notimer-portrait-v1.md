# Portrait dense hand: remove complete timer v1

Mode: built-in ImageGen precise local edit, `transparent_background:false`.

Sole edit target: `art/mockups/web-v3/portrait/27-dense-hand-idle-v4-copy-v1.png`, actual941 ×1672 RGBA.

Raw full-page candidate destination: `art/source/web-v3/hud-clock-v1/portrait-dense-notimer-candidate-v1.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: local no-timer scene repair candidate derived from the exact selected portrait dense-hand idle source.
Input images: Image1 is the sole exact edit target:941 ×1672 selected full-page portrait game artwork. It is the source of truth for every layout coordinate, card face, character, text and scene material.
Primary request: remove ONLY the complete round countdown timer from the lower-right control pocket. Remove its entire golden circular outer/inner ring, tick marks, hourglass,28秒 numerals/unit, all gold light points/sparkles/glow, lower-left cloud ornament and cast shadow. Rebuild only the vacated clock/glow/shadow areas as a seamless continuous continuation of the same surrounding authentic red lacquered wooden tabletop, floral decoration, curved table rim and adjacent quiet dark scene background. No timer fragment, ring-shaped seam, hourglass ghost, numeral/unit residue, cloud outline, gold glow or residual clock shadow may remain.
Exact bounded edit zone: approximately x688,y940,width253,height249 in original941 ×1672 coordinates, extending to the right canvas edge941 and bottom y1189. Alter no pixel outside this bounded zone. The original left action plaque ends at x669 and must not be touched. The first row of hand cards starts at y1192 and must not be touched. Maintain the quiet safety gaps between the repaired zone, left button and lower cards. Reconstruct scene material according to the actual source boundary; do not create a flat patch, new panel or new decoration. Do not remove pre-existing painted flowers that are ordinary table material outside the timer; restore plausible source-continuous floral lacquer only where the timer had covered it.
Absolute preservation: all eight hand cards with original ranks5/8/2/6/11/12 and both special faces, their paper bounds, zero-rotation poses, corners and symbols remain completely unchanged. Preserve every central trick card7/3/1/9, local 青竹客 portrait/name/stats, other animal travelers and their identities/poses, nameplates/stats, original trump-status plaque and all of its current lettering, turn-status plaque, green 选择手牌 action plaque and its label/cloud/border, all frames and every original text. Do not fix, reword, replace, move, resize, rotate, brighten or recolor any of those elements. All upper and lower scene pixels, teahouse architecture, lanterns, moon, props and original illumination stay intact outside the clock zone.
Composition/framing: exact941 ×1672 full-page portrait canvas, no crop, zoom, padding, recentering, reframing, resized component, new camera or new scene. Opaque full-scene appearance, no transparency/checkerboard or background replacement.
Text (verbatim): remove only timer28秒; every other original glyph and wording remains unchanged. No new text, icon, symbol or object.
Avoid: remaining clock glow/ring/hourglass/cloud/number/unit/shadow; touching button at x669 or cards beginning y1192; changed hand geometry; altered character identity or text; new HUD/action/footer; dark rectangular patch; ring-shaped material artifact; changed full-page color/lighting; watermark.

## Integration contract

Save raw generated candidate without resampling, resizing, cropping, color adjustment, alpha editing or other post-processing. Main thread uses bounded timer-region composition only and applies the same scene repair to the frozen selected-state source; never replace the whole page. No code, formal canonical design, runtime asset or browser changes.

## Generated result and inspection

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-648f9d04-5c67-4e04-8c4e-38df892e6908.png`.
- Copied unchanged to requested candidate path. Actual **941 ×1672 RGB (`Format24bppRgb`)**, same pixel dimensions as source; no padding or post-processing.
- Single-result visual inspection: complete lower-right clock is absent, including ring/ticks, hourglass,28秒, gold light points/glow, cloud and shadow. Repaired region has source-style continuous red floral lacquer top, curved rim and dark quiet adjacent material. No obvious timer fragment, circle seam, numeric ghost or flat rectangle remains.
- Left green action and its cloud, eight hand card faces/order/values/poses, local/opponent identities, central trick, trump/turn plaques, copy and overall composition remain structurally recognizable. However exact nonlocal pixel preservation failed, as expected for the generative candidate.
- Read-only8px-grid protected-region comparisons prove nonlocal RGB drift: green action x278,y1073,w391,h96 has585/588 changed samples, mean absolute RGB-channel delta7.365; first hand row x174,y1192,w600,h195 has1866/1875 changed samples, mean4.447; upper scene x0,y0,w941,h900 has13171/13334 changed samples, mean4.223 (0..255 channel scale). Thus candidate button, cards and upper scene must never replace original pixels, even though positions/art appear similar.
- Main may extract only the approved bounded clock-repair region **x688,y940,width253,height249**, protecting original action right edge x669 and original first-row card top y1192. The3px lower margin and19px left safety gap belong to source layout. Keep any blending/registration inside the clock ROI and use exact frozen source outside it; same bounded patch can be composed into frozen selected source.
- Original source, complete formal design, code, browser and runtime assets remain unmodified.
