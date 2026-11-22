# Web v3 dense-hand landscape — no-timer local table candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`). Sole input is selected source art, not an implementation screenshot.

Edit target: `art/mockups/web-v3/27-dense-hand-idle-v4-copy-v1.png` (1672×941).
Raw candidate: `art/source/web-v3/hud-clock-v1/landscape-dense-notimer-candidate-v1.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: the selected Enchanted Teahouse dense-eight-card idle landscape design, one bounded no-timer table/background cleanup.
Input image1 is the only edit target and strict source of truth. Preserve the complete1672×941 canvas, original aspect ratio, camera, scene, lighting, colors, materials, layout, all cards, all text, portraits, animals, name/stat plates, trump status, and all frame geometry as faithfully as possible. Do not crop, zoom, recenter, restyle, redraw, move, resize, reword, or change anything except the timer specified below.
Only edit the right-side timer and its effects within approximately x1320,y450,width270,height225, ending at y675 in source pixels. Completely remove that entire timer: golden circular frame and tick marks, hourglass, the complete28秒 label, every timer sparkle/light dot, warm circular glow, lower-left cloud ornament, cast shadow, and reflected timer light. Restore the same continuous authentic lacquer-wood tabletop and its quiet adjacent background from the immediate original surroundings, naturally carrying the existing wood grain, curves, darkness, and original local material through the removed timer footprint. The cleaned area must be continuous scene with no circle, hourglass, numeral, character, cloud, glow, ring edge, ornament, shadow ghost, blurred rectangle, texture seam, or replacement object.
Strict bounds: do not let any edit go below y675. The existing green action plaque begins around y688 and must remain completely untouched, including its text选择手牌, top gold border, corner ornaments, size, position, and all adjacent original pixels. Do not change the table's silhouette or redraw an artificial panel. Keep the highest possible source fidelity outside the timer removal footprint; no alterations to any of the eight local cards, central played cards, round scroll, seats, avatars, flowers, text labels, status strips, or scene. No new text, icon, decoration, glow, frame, fill, button, margin, or new light effect. The result is one local no-timer cleanup candidate, not a whole-page redesign.
Output the full1672×941 source frame without crop or layout change.

## Handling

Preserve the raw full-frame generated candidate unchanged. Main will composite only the bounded timer-removalROI into the source and the same clock region of the already frozen selected design. Do not resample, crop, recolor, postprocess, or edit code, complete canonical designs, runtime assets, browser, or source artwork. Do not adopt the full generated page as a replacement.

## Single-output inspection

The entire right timer is visually absent: no ring, hourglass,28秒, bright sparkle, circular glow, cloud ornament, or obvious timer-shaped shadow remains. The removed region is filled with continuous warm lacquer tabletop/floral inlay and dark curved rim/nearby background, not a blank rectangular panel. The top edge and label of the green选择手牌 action remain recognizable below the permitted cleanup band; no obvious timer element is carried into the button. The eight local cards, central7/3/1/9, characters, and overall composition remain visually in place.

The generated page is not pixel-exact outside the timerROI. It alters small paper/card-art details and appears to regress the corrected trump-label赭 glyph toward a藏-like character, among other texture and edge differences. These are outside task scope and must be rejected by retaining all original source pixels outside the bounded x1320,y450,w270,h225 cleanupROI. The reconstructed invisible table decoration/curve is a generated continuation and requires main's boundary/seam inspection before local adoption. Do not use any generated button, card, label, or scene pixels outside that bounded rectangle. Full-page replacement is explicitly invalid.

Actual raw output dimensions are1672×941, opaque24-bitRGB. Candidate saved unchanged with no resizing, cropping, recoloring, alpha change, or other postprocessing. No code, canonical complete design, browser, or runtime resources were modified.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-eea51e4a-e739-4ee3-ba4a-c185fdbbdeba.png`.
