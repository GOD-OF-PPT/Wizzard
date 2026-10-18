# Lobby bamboo cat v2

Built-in ImageGen. Reference crop `art/source/web-v3/lobby-bamboo-cat-reference-v2.png` is mechanically cropped at 166x160+377+178 from waiting lobby; used as reference only. Source output `art/source/web-v3/lobby-bamboo-cat-v2.png`; runtime `art/runtime/web-v3/avatars/lobby-bamboo-cat-v2.png` only alpha trim plus 12px transparent border, no painting or alpha threshold changes. Small preview saved at `art/source/web-v3/lobby-bamboo-cat-small-preview-v2.png`.

First prompt:

```text
Use case: background-extraction. Extract/reconstruct ONLY the blue-teal cat traveler circular GOLD-FRAMED portrait in supplied tight reference crop. The full lobby source is a secondary style/context reference. Faithfully duplicate this exact HALF-BODY composition, character scale and proportions: small modest dark eyes behind thin round gold glasses, cream muzzle, blue-teal fur, upright ears peeking above broad conical woven straw hat, vivid red-orange scarf, green-brown travel clothes and shoulder gear. Keep the face SMALL relative to the circle as in the crop, not a large-eyed close-up ranking avatar. Hat spans most circle width, ears at the top, torso and scarf clearly visible in lower half. Same friendly restrained expression and hand-painted warm teahouse illustration. Circular gold rim and dark navy-blue interior retained.
Remove the green ready check badge entirely, restoring portrait/rim behind it; remove all nameplates, text, status and outside scene. One single circular portrait centered with genuine transparent alpha outside circle. No text, no checkmark, no stats, no extra decorations. Output square high-resolution RGBA, subject nearly fills canvas with small transparent margin. Do not reinterpret costume or enlarge eyes.
```

Selected retry exact prompt:

```text
Use case: background-extraction. EXACT FAITHFUL UPSCALE of this tiny reference crop's circular blue-cat portrait. Preserve the exact reference character anatomy and relative feature proportions; do NOT make the face larger or cuter. The cat's face/muzzle must occupy only the middle 35% of the circle HEIGHT, with ears/hat occupying upper 40% and RED SCARF plus torso occupying lower 35%. Eyes are small flat dark dots in THIN GOLD ROUND SPECTACLES, NOT huge shiny golden eyes. Copy reference's zoom level: half-body traveler, small cream muzzle, teal fur, broad straw hat, red scarf, green clothes. Entire torso/shoulder is visible as in original. Circular old-gold frame, dark navy inside circle, transparent outside.
Reconstruct the original area hidden by green ready-check at lower right then remove check and nameplate completely. No text/no symbols/no ready status. Do not design a new cat portrait. Match the source crop's hat/eye/scarf/face sizes and proportions exactly.
```

Inspection: teal cat, straw hat, red scarf, half torso, gold circular rim and navy interior retained; no text, check or nameplate. Actual alpha 0..1. Generated reconstruction differs from source linework and has stronger round eye outlines; not pixel-identical source extraction. No ranking asset used.
