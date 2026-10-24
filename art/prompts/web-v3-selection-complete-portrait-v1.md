# Portrait selected-card motion completed endpoint v1

- Tool: built-in ImageGen edit.
- Input: `art/mockups/web-v3/portrait/05-gameplay-safe-v2.png` (941 × 1672).
- Raw output: `art/source/web-v3/selection-complete-portrait-v1.png`.
- Intended edit ROI: bottom local hand and its halo only, approximately x = 125–725, y = 1240–1495. Do not replace the immutable input.

## Exact prompt

Use case: precise-object-edit, a pixel-registered UI motion endpoint.
The input image is the edit target: a 941 × 1672 portrait Enchanted Teahouse gameplay screenshot. Preserve its exact complete canvas, every existing label, scene, player, HUD, timer, center cards, table, confirm action, artwork and lighting. Edit ONLY the bottom local hand area around x125–725, y1240–1495. No change outside this hand ROI.
Create the selected-card animation COMPLETED frame with these exact coordinates and geometry:
1. The first local hand card, the teal leaf card with numeral “5”, must be strictly upright: rotation exactly zero degrees, parallel vertical left/right sides and horizontal top/bottom edges, with no perspective or skew. Its card bounds should be x139–279, y1255–1465, a 140 × 210 upright paper rectangle with the same original border, paper, teal symbol and numeral. Keep horizontal center x209. This is a 12px lift from the original y1267 top; do not exaggerate it.
2. Preserve a restrained gold selected halo around that card. The halo's optical center is 8px BELOW the selected card center: card center y1360, halo center y1368. It must not float above the card. Preserve the original warm gold style and narrow halo width; no enlarged bloom or new particles.
3. Shift each of the other three hand cards exactly 9 pixels to the right from its current position. Preserve their existing angle, size, vertical position, spacing relationship and exact contents: blue mountains “8”, red knot “2”, gold sun “6”. Keep all four hand cards, no duplicates and no new symbols. The first selected card is on top of other hand layers. Keep the far-right card separate from the right-side timer and bottom-right green confirm action.
4. Do not move, resize or restyle the green “确认出牌” action, the circular “28秒” timer, or any other control. No text edits, spinner, additional glow, extra cards, crop, margin or other changes. Preserve exact canvas 941 × 1672.
