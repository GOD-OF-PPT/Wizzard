# Web v3 rules step label

Mode: built-in image_gen with transparent_background=true.
Reference: `art/mockups/web-v3/portrait/08-rules.png`, first step paper label.
Output: `art/runtime/web-v3/step-label.png`.

```text
Use case: background-extraction
Asset type: standalone horizontal parchment game step-label plaque with alpha transparency.
Reference: supplied portrait rules screen, ONLY the small pale paper label under step 1 at source coordinates x95–385,y1163–1238. Extract/reproduce that label without its text: a long compact softly rounded parchment rectangle, quiet ivory warm paper center, fine double soft-gold outline and restrained soft-gold curling cloud ornaments extending from both short ends. Match source proportions/material/soft gold line weight exactly. Final overall artwork aspect approximately 3.5:1, target420x120 or closest horizontal size. Center plaque fills 92–96% of width with enough transparent edge padding. Broad quiet readable blank center must fit dynamic short Chinese labels; no decorations inside middle 70%. Genuine transparent alpha outside the paper and gold end ornaments. No text, no numerals, no circle/step badge, no background scene, no extra symbols, no watermark. Preserve compact authored height; do not make a tall ornate panel.
```

## v2 geometry correction

Built-in transparent edit; final `art/runtime/web-v3/step-label-v2.png` is2048×768. Measured alpha≥128 bounds(13,89)–(2035,640),2023×552, ratio3.665. Visible ratio passes3.2–3.8; output retains an exterior softglow and vertical transparent padding above3%, so tightpadding requirement remains unmet.

First prompt (discarded4.45ratio):
```text
Use case: precise-object-edit
Edit target: supplied blank parchment cloud-ended plaque.
Targeted geometry correction: make the ACTUAL VISIBLE PLAQUE including cloud tips aspect ratio3.5:1, with a substantially TALLER central parchment body. The visible central paper must be broad and tall enough for a short large Chinese UI label. Preserve the warm ivory paper texture, restrained double softgold border, stepped rounded corners and small curling cloud ends. Cloud ends vertically centered on the tall paper. The square-ish flattened previous5.7:1 visible silhouette must become3.5:1; do not achieve ratio through transparent padding. Output landscape canvas tightly enclosing plaque, with at most3% transparent padding on each side; visible alpha-bound width/height must be between3.2 and3.8. Genuine transparent alpha outside paper and ornaments. No text, numeral, badge, shadow rectangle, scene or watermark. Keep central70% quiet and empty. Aim canvas1400x420 with visible plaque ratio3.5:1.
```

Corrective prompt:
```text
Use case: precise-object-edit. Edit this plaque into a visibly MUCH TALLER compact label. Current visible shape1986x446 ratio4.45 is WRONG. Required visible shape approximately1800x520, ratio3.46. Increase parchment body height by30%, leaving width unchanged. Top/bottom edges farther apart; cloud ornaments stay modest and vertically centered. Canvas should tightly enclose this taller plaque at approximately1850x550, with less than3% transparent padding. Remove ALL exterior glow/shadow, background must genuine alpha0 immediately outside crisp paper/cloud silhouette. Maintain ivory paper, double restrainedgoldoutline, cloud ends and blank quiet center. NO TEXT. Must actual visible opaque alpha-bound ratio3.2–3.8, not padding. Do not output old longthin plaque. Make taller centralpaper.
```


