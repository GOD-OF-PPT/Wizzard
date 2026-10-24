# Landscape prediction pending frame v1

Mode: built-in ImageGen edit; one call; raw candidate for three-ROI composition.
Edit target: `art/mockups/web-v3/10-bid.png`.
Disabled-control style support: `art/mockups/web-v3/portrait/17-bid-pending-v2.png`.
Output: `art/source/web-v3/bid-pending-landscape-v1.png`.

## Actual prompt

Use case: precise-object-edit. Image 1 is the EXACT edit target, a 1672x941 landscape Chinese enchanted-teahouse game screen. Image 2 is supporting reference ONLY for the darkened minus/plus controls during submission. Do not use its portrait layout.
Make a narrowly localized pending-submit variant of image 1. Keep its exact 1672x941 canvas and ALL original layout, artwork, scene, positions, typography, borders, avatars, cards, timer, names and numbers unchanged except these THREE changes:
1. In the existing bottom-right green button, replace 确认预测 with exactly 提交中, same cream brush lettering height and baseline, centered. Preserve green lacquer and gold border/cloud decoration.
2. Darken the existing minus/减少 control near x593..713,y446..541 to disabled, matching the muted dark beige visible in image 2. Keep its geometry, label and symbol unchanged.
3. Apply the identical disabled treatment to the plus/增加 control near x954..1075,y446..541. Keep its geometry, label and symbol unchanged.
Central prediction must remain exactly 2, title remains 预计赢几墩？, range remains 本轮可预测 0-4 墩, hand stays 5/8/2/6. No spinner, loading bar, new text, extra modal, rearrangement, global color grading, or new ornament. Preserve everything outside the three edit areas.
