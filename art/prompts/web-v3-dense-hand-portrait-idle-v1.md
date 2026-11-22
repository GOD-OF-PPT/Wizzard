# Dense hand: portrait eight-card idle layout v1

Mode: built-in ImageGen edit with existing card-art reference inputs.

Edit target: `art/mockups/web-v3/portrait/25-gameplay-selection-idle-v2.png` (941 × 1672).

Supporting references:

- `art/runtime/cards/highest-special.png` (Image 2, exact established 至高 special-card art).
- `art/runtime/cards/lowest-special.png` (Image 3, exact established 虚无 special-card art).

Raw candidate: `art/source/web-v3/dense-hand-portrait-idle-v1-candidate.png`.

## Complete prompt

Use case: ui-mockup
Asset type: one production-style portrait gameplay mockup of eight-card idle hand state in the original Enchanted Teahouse visual style.
Input images: Image 1 is the full selected 941 × 1672 gameplay page and is the edit target/source of truth for every scene element and style. Image 2 is the exact established gold star-and-cloud “至高” special-card art. Image 3 is the exact established charcoal tea-bowl-and-steam “虚无” special-card art. Images 2 and 3 are supporting card-face references only, not entire-page references.
Primary request: create a genuine eight-card portrait idle layout by editing only the lower zone y=900..1672 of Image 1, plus updating the existing upper-left round scroll from 第4轮/每人4张 to “第8轮” and “每人8张”. Keep the entire upper teahouse scene, all opponents and their specific animal identities, avatar/name/stat geometry, return-home control and central tabletop cards 7/3/1/9 exactly as in Image 1. Reflow the local lower controls and hand only, following the exact source-pixel geometry below.
Hand geometry: exactly eight complete upright portrait cards in two rows of four, each logical card 140 × 210 pixels with zero rotation, no fan overlap, no card lift and no selected halo. Upper row centers x=230,390,550,710 at y=1290; upper-row paper spans y=1185..1395, card left edges x=160,320,480,640 and right edges x=300,460,620,780. Lower row same x centers at y=1524; lower-row paper spans y=1419..1629. Cards are evenly spaced with 20px horizontal gaps and 24px gap between the two complete rows. Every card face and border must be fully visible.
Hand contents: upper row left to right original-style 青叶5, 靛山8, 朱结2, 赭日6; lower row left to right 青叶11, 靛山12, exact gold-star 至高 special from Image 2, exact charcoal tea-bowl 虚无 special from Image 3. The two-digit values “11” and “12” must be complete and easily readable inside their upper-left rank-safe areas. Preserve original suit symbols, fine corner decorations and parchment style. The two specials have the supplied full-card artwork with no invented rank numeral. Do not substitute a joker, letter, animal or unrelated symbol for either supplied special.
Local player band: compact the original 青竹客 teal cat wearing its straw hat and red scarf, original name plaque and prediction/won stats into x=20..210,y=920..1135. Preserve that specific original character identity and name; do not create a second avatar. Keep the complete local portrait and text fully above the hand and disjoint from all other lower controls.
Trump band: preserve the existing original single parchment “本轮王牌·赭日” status and red sun icon in a compact centered band approximately x=300..640,y=930..988. Use the original typography, parchment and ornament style. No duplicate trump status.
Turn status: a compact readable original-style gold label “轮到你出牌” centered within y=1008..1030. Keep it separate from both trump band and green action.
Action band: one original-style green lacquer action plaque labeled exactly “选择手牌”, centered within x=270..690,y=1045..1145. This is idle before card selection, so its label is subdued readable warm grey-gold and the green material is restrained. Preserve authored fine border and cloud style. No confirm-play action, no second action/footer below the hand.
Timer band: move the original circular gold-rim/dark-brown “28秒” hourglass timer, preserving its ring, lower-left cloud and warm gold glow, into the upper-right lower-control pocket x=740..935,y=975..1160. It remains a true circle with complete ornament, no cropping and no overlap with action, text or cards.
Spacing/safety: preserve at least 12px visible separation between adjacent bands. Central tabletop cards remain at the original position ending around y=905; no lower UI may overlap them. Local-player band ends above y=1135; timer ends by y=1160; first hand row starts y=1185. Keep lower row fully inside page with its paper edge ending by y=1629. Scene/table texture should continue naturally behind the lower reflow. Do not add any visible action or footer outside the specified bands.
Composition/framing: output exactly 941 × 1672, complete portrait page, no cropping, zoom, recentering or reframing. Outside the lower reflow and round-scroll text update preserve every original scene coordinate and component.
Style/material: retain Image 1's warm lacquer, ivory parchment, original hand-painted animal travelers, fine gold scroll frames, lantern light, dark blue night, original symbol/card art and density. This is a precise layout edit of the selected page, not a new scene design.
Text (verbatim): round “第8轮” and “每人8张”; local name “青竹客”; trump “本轮王牌·赭日”; turn “轮到你出牌”; action “选择手牌”; timer “28秒”; card ranks 5,8,2,6,11,12. Existing upper opponent text unchanged.
Avoid: rotated/fanned/overlapping hand cards; missing digits in 11 or 12; selected/lifted cards or selection halo; altered central 7/3/1/9 trick; changed animal identity; duplicate local avatar; duplicate action or footer; confirmation button below hand; new UI style; card clipping; different special artwork; changed upper scene; watermarks.

## Integration contract

Keep the raw generated output without cropping, resizing, recoloring, alpha changes or other post-processing. Do not edit code, browser state or canonical mockup. Root thread will compose the lower region and exact source poses mechanically, using this candidate as the layout design reference and documenting its actual differences.

## Generated result and observed differences

- Raw ImageGen output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-72e75072-4370-4754-9db9-3c9266be749c.png`.
- Copied unchanged to the candidate destination. Actual size **941 × 1672**, RGB. No post-processing.
- One-result inspection: eight complete upright hand cards in two rows of four; upper 5/8/2/6 and lower 11/12/highest/lowest all readable. Gold-star highest and charcoal-tea-bowl lowest references are recognizable. No hand selection halo/lift; only one lower action; no extra footer action. Round scroll reads 第8轮/每人8张. Original upper animal identities, central 7/3/1/9 and teahouse composition remain structurally recognizable, not verified pixel-identical.

### Measured hand-paper boxes

Paper-color threshold R>185,G>150,B>90 within separate local card windows, in source image pixels. These are bright-paper bounds, not exact edge/alpha geometry:

| Card | x | y | width | height |
| --- | ---: | ---: | ---: | ---: |
| Upper leaf 5 | 169 | 1192 | 137 | 192 |
| Upper mountain 8 | 321 | 1192 | 141 | 192 |
| Upper knot 2 | 478 | 1192 | 140 | 192 |
| Upper sun 6 | 632 | 1192 | 140 | 193 |
| Lower leaf 11 | 169 | 1396 | 137 | 193 |
| Lower mountain 12 | 321 | 1396 | 142 | 193 |
| Lower highest | 478 | 1396 | 140 | 194 |
| Lower lowest | 632 | 1396 | 139 | 193 |

The generated cards are about 17–18 px shorter than requested 210 px. Upper paper begins around y1192 instead of y1185; lower begins y1396 instead of y1419. Row gap is about 11–12 px rather than requested 24 px. Lower row ends about y1590 instead of y1629. Approximate card centers x237.5/391.5/548/702 differ from the exact requested 230/390/550/710.

### Other observed bands (visual estimates)

- Local 青竹客 avatar/name/stats: approximately x18..214,y908..1145, retaining the original pose but not fully inside requested y920..1135. No duplicate local avatar.
- Trump status: approximately x301..646,y928..998, close to requested position; original icon/parchment semantics retained.
- Turn plaque: approximately x341..604,y1012..1058, taller/lower than requested y1008..1030.
- Green idle action: approximately x278..661,y1073..1169, lower than requested y1045..1145 and narrower than requested x270..690. Label appears brighter/more gold than the requested subdued idle label.
- Timer including cloud/glow: approximately x710..925,y982..1175, extends farther left and lower than requested x740..935,y975..1160.

These deviations require exact canonical composition; this candidate is a design input, not final layout acceptance. Keep the upper exact source and recompose the lower controls/cards to the instructed geometry.
