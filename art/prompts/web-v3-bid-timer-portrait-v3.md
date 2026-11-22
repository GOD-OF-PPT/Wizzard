# 竖屏预测 · 真人计时语义修订候选

Mode: built-in image_gen edit. Output 941×1672 PNG.

Edit target: `art/mockups/web-v3/portrait/10-bid.png`.
Supporting timer reference only: `art/mockups/web-v3/portrait/25-gameplay-selection-idle-v2.png`.

Preserve the edit target exactly: same Enchanted Teahouse lacquer table, characters, scroll, bid panel, value 2, labels, confirm action, four lower hand cards 5/8/2/6 and all current positions. Add only one small readable 28-second human-action countdown at the right edge of the empty red table gap between the bid action and lower hand, matching the gold circular ring/hourglass/dark face/cloud anatomy of the supporting reference.

Place its complete visible outer glow/cloud inside x=740..936, y=1100..1305. Aim ring center (844,1190), circle about160px diameter. Keep the bottom of all timer decoration at least12px above the highest lower-hand paper corner (approximately y1318); keep it away from the bid confirm plaque whose ornament ends around y1095. Text is exactly `28秒`, one warm cream-gold number/unit line below the hourglass. One thin warm-gold circular ring, one hourglass and restrained cloud at lower-left. No new timer elsewhere; do not alter the card fan, local avatar, background, bid panel, 2, labels or existing interface. Do not add a play button or selection halo. The new countdown is part of the normal human prediction phase and will remain independently dynamic in implementation.

Only this local timer ROI may contribute to the final versioned design. The main agent will preserve all pixels outside it; no full-page regeneration will replace the selected source.

## Exact tool prompt

Edit target is the FIRST attached image (portrait bid screen); the SECOND image is a timer anatomy reference only. Return 941x1672. Preserve the first image exactly. Add ONLY one small readable 28-second countdown in the empty lower-right red-table gap between the central bid confirm action and lower hand. Complete decoration/glow/cloud must fit x740..936,y1100..1305; ring center about(844,1190), circle about160px diameter. Match second image's warm gold thin circular ring, hourglass, dark face and cloud lower-left. Exact text 28秒 below hourglass. Keep ALL timer pixels at least12px above the four lower cards' highest edge y1318 and below the existing confirm ornament ending y1095. Do not change the current bid panel/value2/buttons, table, animals, text, local avatar, lower card fan5/8/2/6, any geometry or colors elsewhere. No extra button or selected halo. Local addition only. Keep the target's original Enchanted Teahouse style.

## Candidate review

The generated timer moved left of the requested box; the page is retained only as a local layout/icon reference. It does not replace the final full-page design. A separate blank transparent timer is generated from this visual, then fitted into an explicit non-overlapping source rectangle before implementation. The full candidate remains unmodified; none of its unrelated page pixels enter the canonical design.
