# Dense portrait hand v2: exact 2:3 idle and selected candidates

Mode: two sequential built-in ImageGen edits. Raw outputs are saved without post-processing.

First target: `art/source/web-v3/dense-hand-portrait-idle-v1-candidate.png` (941 × 1672).

Idle output: `art/source/web-v3/dense-hand-portrait-idle-v2-candidate.png`.

Second target: the saved raw idle-v2 output.

Selected output: `art/source/web-v3/dense-hand-portrait-selected-v2-candidate.png`.

## Idle complete prompt

Use case: precise-object-edit
Asset type: geometry revision of an existing portrait eight-card idle gameplay design.
Input images: Image 1 is the complete existing 941 × 1672 eight-card idle candidate and the sole source of truth for composition, art, content and all controls.
Primary request: correct ONLY the eight local hand cards at the bottom to an authored exact 2:3 width:height ratio, each 128 × 192 source pixels. Keep every other image element absolutely unchanged, including all upper scene elements, character identities, poses and names, central trick cards 7/3/1/9, round scroll, existing trump lettering including the current 藏日 spelling, local avatar and stats, turn-status plaque, timer, and green 选择手牌 action at its current approximately y1073..1169 position. Do not redesign or move any HUD or change the current typo.
Exact hand geometry: eight fully visible cards, zero rotation, two rows of four. Both rows share horizontal centers x=238,391,548,704. Every card is exactly 128px wide and 192px tall. First row center y=1288, paper bounds y=1192..1384. Second row center y=1504, paper bounds y=1408..1600. Maintain exactly 24px between the paper rows. Column paper bounds are x=174..302,327..455,484..612,640..768. Resize card contents proportionately within these full-card boxes; fill only vacated slivers with continuous original dark table material.
Card order/art: first row 青叶5,靛山8,朱结2,赭日6; second row 青叶11,靛山12,original gold-star-and-cloud 至高 special,original charcoal tea-bowl-and-steam 虚无 special. Preserve all existing supplied symbol artwork, corner ornaments, full two-digit values 11 and 12, and all paper/card face details. No selected card, selection halo, card lift, rotation, overlap or fanning. The eight cards must all retain the same 2:3 proportion and dimensions.
Composition/framing: preserve exactly 941 × 1672 full-page portrait composition. No crop, reframing, zoom, new scene design, changed lighting or shifted element outside the hand zone. All scenery and HUD retain current exact positions and dimensions.
Text (verbatim): all current text remains unchanged; retain 选择手牌 and the existing 藏日 spelling. Card values remain 5/8/2/6 and 11/12 plus two unnumbered original special faces.
Avoid: changes above the hand; fixing 藏日; moving the action or timer; changed animal pose; new controls; changed special art; truncated 11/12; tall or wide card distortion; extra halo; selected state; duplicate action/footer; watermark.

## Selected complete prompt

Use case: precise-object-edit
Asset type: selected-card interaction state derived from the revised portrait eight-card idle image.
Input images: Image 1 is the complete revised idle-v2 design, and is the sole target/source of truth. Preserve its upper composition, HUD and all eight original card faces.
Primary request: select ONLY the 青叶11 card, index 4: the first card in the bottom row. Lift that single card exactly 12 source pixels with zero rotation to center (238,1492), preserving its 128 × 192 paper face, so its paper bounds become x=174..302,y=1396..1588. Add the original warm-gold restrained selected halo centered at (238,1500), exactly 8px below the lifted card center, approximately 156 × 211 source pixels overall. Preserve readable full “11”, leaf symbol, corner art and paper. No other card receives a halo, lift or rotation.
Unselected geometry: preserve y=1288 for all four upper-row cards and y=1504 for the remaining three lower-row cards. Shift all unselected cards whose column centers are to the right of selected x238 exactly 9px outward/right; if any unselected card center is to the left of x238, shift it exactly 9px outward/left. Cards in the selected column x238 stay at that x. Therefore upper centers are (238,1288),(400,1288),(557,1288),(713,1288), with faces 5/8/2/6; lower centers are selected (238,1492),then (400,1504),(557,1504),(713,1504),with faces 11/12/highest/lowest. Every paper face remains 128 × 192. Only those six right-column cards move horizontally; unselected cards do not move vertically.
Action: change only the green action plaque's label from 选择手牌 to exactly “确认出牌”, keeping its current plaque position, geometry, material and ornament. Match its existing original handwritten label style and size. Do not move any HUD or invent another action.
Composition/framing: preserve exact 941 × 1672 image and all non-hand/non-action-label pixels as closely as possible. Upper scenery, opponents, specific animal identities and poses, central 7/3/1/9, local avatar/stats, round scroll, current trump text including 藏日, turn plaque and 28秒 timer stay unchanged.
Constraints: exactly one selected card, bottom-left leaf11; no selected leaf5, no duplicate halo, no vertical shift for any unselected card, no rotated or clipped cards. Preserve supplied highest and lowest special artwork, full 11/12 ranks and all card borders. Fill tiny vacated strips with continuous existing table material. Keep all eight cards visible and disjoint from other HUD.
Text (verbatim): action “确认出牌”; every other existing text unchanged, including the current 藏日 spelling.
Avoid: fixing 藏日; changing upper composition or HUD position; changing a card face; selected halo on leaf5; fanned/rotated cards; hidden digit; second action/footer; extra UI; watermark.

## Integration contract

These are raw raster design candidates, not runtime screenshots or final acceptance. Do not post-process or update canonical mockups/code/browser. Root thread will use exact source assets and measured canonical geometry and retain reported generation differences explicitly.

## Generated result: idle v2

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-665ba878-2684-4f99-ac64-86a4c4079423.png`.
- Saved unchanged to requested idle-v2 destination. Actual 941 × 1672 RGB.
- Visual inspection: eight card faces/order, readable 11/12, original upper composition and lower HUD remain structurally intact. No hand halo/selection. Existing 藏日 text retained.
- Exact 128 × 192 dimensions and 24px row gap were **not** realized: bright paper boxes are measured below. First-row paper is about y1194..1383; second row y1393..1589, leaving only around 10–12px gap. Widths remain about 137–141px.

| Card | Measured bright paper x,y,w,h |
| --- | --- |
| Upper leaf5 | 171,1195,137,188 |
| Upper mountain8 | 323,1194,140,189 |
| Upper knot2 | 478,1194,140,189 |
| Upper sun6 | 632,1194,138,189 |
| Lower leaf11 | 170,1393,137,196 |
| Lower mountain12 | 322,1394,141,195 |
| Lower highest | 478,1395,140,194 |
| Lower lowest | 633,1395,137,194 |

## Generated result: selected v2

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-40ee0988-8948-4409-885f-3af72903690b.png`.
- Saved unchanged to requested selected-v2 destination. Actual 941 × 1672 RGB.
- Independent visual inspection: only bottom-left leaf11 receives gold selected glow; action reads 确认出牌. Other faces/order, readable 11/12, upper composition/HUD and current 藏日 text are structurally retained.
- Required precise 12px lift, halo center/size and full-card 128 × 192 dimensions are not proven and visually do **not** match: leaf11 face appears enlarged rather than cleanly lifted, with its top still around y1394. Halo is asymmetric/too low, reaching roughly y1614; the prescribed halo should end about y1606. The source paper/halo threshold cannot reliably isolate its exact face contour, so its bright envelope is labeled explicitly below.
- Right-column cards moved about +6–7px from idle rather than exactly +9px. Upper same-column leaf5 also drifted +3px. Unselected y bands largely remain unchanged, but exact fixed positions are not achieved.

| Card | Measured bright paper x,y,w,h |
| --- | --- |
| Upper leaf5 | 174,1195,138,189 |
| Upper mountain8 | 329,1194,140,189 |
| Upper knot2 | 484,1194,140,189 |
| Upper sun6 | 638,1194,139,189 |
| Selected leaf11 paper plus halo envelope | 145,1390,166,224 |
| Lower mountain12 | 329,1394,141,195 |
| Lower highest | 484,1395,140,194 |
| Lower lowest | 639,1395,138,194 |

Measurement method for both: threshold R>185,G>150,B>90 in separate card windows. This estimates bright paper bounds, not exact authored geometry; selected envelope includes luminous halo/material. Neither candidate constitutes precise geometry acceptance. Main thread will mechanically use original card assets and prescribed layout.
