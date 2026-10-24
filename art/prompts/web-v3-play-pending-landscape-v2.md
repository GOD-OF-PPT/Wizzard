# Landscape play pending v2 — ImageGen raw candidate

Built-in ImageGen edit. Edit target: `art/mockups/web-v3/05-gameplay-final.png` (immutable). Raw output: `art/source/web-v3/play-pending-landscape-v2.png`, 1672 × 941.

## Exact prompt

Use case: text-localization. Input image 1 is the exact edit target, not a mood reference. Make one surgical text replacement in the lower-right green lacquer confirm button: replace the existing four Chinese characters 确认出牌 with exactly the three Chinese characters 出牌中. Three characters only, 出 牌 中, readable, centered as one horizontal line, same original ivory brush lettering size, weight, baseline and style. Keep the button size, position, green texture, gold border and cloud ornament identical. Preserve exact full canvas aspect ratio and intended 1672 by 941 source coordinates. The only edit region is the existing button lettering approximately x1320 through1558, y715 through785. Everything else must remain identical: all characters, names, scores, 28秒 timer, round scroll, sun trump plaque, center cards7/3/1/9, hand leaf5/mountain8/knot2/sun6, selected leaf original tilt/gold halo, warm lacquer teahouse, moon and lantern scene, every other text. No spinner, no ellipsis, no dimming, no new badge, no changed composition, no image redesign. Keep original source artwork unchanged outside the text ROI.

## Inspection

- Correct text: `出牌中`, three readable ivory characters, same visible baseline and approximately original character size, centered in the green button.
- Source and output are both 1672 × 941. No canvas rescale is required.
- Suggested replacement ROI: `{ "x": 1320, "y": 715, "width": 238, "height": 70 }`; includes all old and new lettering and quiet green background while excluding the gold frame and cloud ornament.
- Raw output is **not** pixel-identical outside the requested edit: 1,527,611 pixels differ outside that ROI; 16,567 differ inside. Whole-image RGB mean absolute channel difference is 3.6417879364, maximum channel difference 248. Visible composition is preserved, but minor regeneration texture/color differences remain throughout.
- Treat this as a raw generated candidate. To preserve the source outside the intended label, use only the inspected label ROI in an explicitly documented local composition. Do not use the whole raw output to overwrite the immutable design.

Generated source: `C:/Users/KSG/.codex/generated_images/01a156e3-52ca-7313-ac21-bb63fb0dc002/exec-80c5d128-d4aa-488a-bb4e-a5861b35a404.png`.
