# Portrait no-timer action safe area v2

Reason: the confirmation plaque in the original portrait no-timer design overlaps the fourth hand card. Reserve a real vertical gap instead of moving cards or shrinking the button.

Tool: built-in ImageGen precise local edit.
Input: `art/mockups/web-v3/portrait/14-gameplay-notimer.png`.
Output: `art/mockups/web-v3/portrait/14-gameplay-notimer-safe-v2.png`, 941×1672.

Precise local UI positioning fix ONLY. Keep exact image 941×1672. Move ONLY the entire bottom-right green `确认出牌` plaque together with its gold border and attached peach cloud DOWN by 90 source pixels. Preserve exactly its current size, label, horizontal coordinate, shape and ornaments. Target complete plaque approximately x675–923, y1496–1622 with 50px bottom margin. The original button overlaps the fourth bottom hand card: reconstruct the now-exposed lower-right card edge and continuous dark lacquer table rim / wood grain where button was removed. Do NOT move or resize any hand card; all four hand cards, numbers, icons and the selected gold halo stay exactly in place. At least 20 source pixels clear vertical space between lowest hand-card edge and button gold top edge.

Preserve all players, avatars, nicknames, statistics, central four cards, HUD, top plaque, home control, lanterns, scene illumination, decorations and all other background pixel layout unchanged. Do not restore a countdown, do not add text. Only button vertical relocation and local repair behind its previous position. No global redraw, reframing or art-style change.

Second built-in edit: move ONLY the complete bottom-right green 确认出牌 button and its gold frame/cloud 20 pixels farther DOWN, preserving exact size and x coordinate. Its current gold top is too close to the hand cards. New gold top y1501, bottom including cloud near y1630; minimum visible 20px empty vertical gap from lowest fourth hand card edge around y1478. Repair original location with matching dark wood. Keep ALL other image contents, cards, hand positions, avatars, text, lighting and background unchanged. No countdown. Do not resize or move the cards.

Observed final candidate: hand-card bottom around y1478, button top around y1510 (roughly 32px clear gap); cloud bottom around y1645 (roughly 27px canvas margin). Overlap fixed, but exact 90px translation / 50px bottom margin was not achieved by ImageGen. Candidate is not accepted against those stricter geometry requirements.

## v3: inherit approved shared button coordinates

Input: `art/mockups/web-v3/portrait/05-gameplay-safe-v2.png`.
Output: `art/mockups/web-v3/portrait/14-gameplay-notimer-safe-v3.png`, 941×1672.

The new shared contract is the button already positioned in 05-safe-v2, approximately x669–938,y1502–1633. Do not further adjust toward the superseded 50px bottom-margin target.

Precise object removal only, preserve exact 941×1672 canvas. Remove ONLY the lower-right `28秒` countdown ring: gold circular halo, hourglass, numbers/text, and small peach cloud ornament attached below that ring around x724–927,y1173–1380. Repair with continuous lacquer table rim and dark wooden panel grain consistent with surrounding scene. ABSOLUTELY keep the already relocated green `确认出牌` button and its OWN cloud ornament exactly at x669–938,y1502–1633. Do not move it by even one pixel, do not resize or redraw it. Keep all four hand cards including their lower edges, selected gold halo, all player portraits, names, stats, central four cards, trump plaque, title, return-home action, scenery and lighting unchanged. Do not restore timer text elsewhere. No new label, no layout change, no extra button shift or bottom-margin adjustment. The only changed region is the removed countdown ring and its attached cloud; everything else must match source placement exactly.
