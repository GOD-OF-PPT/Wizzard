# Selected-card completion frame — landscape

Built-in ImageGen precise-object-edit. Reference/edit target: `art/mockups/web-v3/05-gameplay-final.png`, 1672×941. This adds a missing interaction endpoint from the pre-existing 12px/140ms contract, not a redesign to excuse implementation drift. Original source remains immutable. Raw generation: `art/source/web-v3/selected-finish-landscape-v1.png`. Main agent will inspect and composite only the hand region (515,650,650,250), preserving all other original pixels.

```text
Use case: precise-object-edit. Same EXACT 1672x941 canvas. Edit target is the supplied original Enchanted Teahouse gameplay design. Produce ONLY its selected-card finished-interaction frame at t=140ms. Do not redesign any scene, text, character, HUD, table or button.
Only the bottom local hand changes. Preserve exactly four faces in order: green LEAF 5 selected, blue MOUNTAIN 8, red KNOT 2, gold SUN 6. The central played cards 7/3/1/9, all players, copy, timer28, and confirm action stay unchanged.
For the FIRST green LEAF5 selected card, preserve its size, artwork, numeral5 and horizontal center. Straighten it to ZERO rotation, then lift it EXACTLY 12 pixels above its original center, not 12 percent, not a dramatic jump. Its original approximate visible box is x541..688,y672..875; the finished box should be upright around x542..687,y658..863. Preserve the warm selected gold halo, optically centered 8 pixels below the lifted card center. Do not add a new selection icon or change the face.
Shift each of the three cards to its RIGHT exactly9 pixels to the right, preserving their original y positions/tilts/sizes and numbers. No card exists to the selected card's left, so no left-neighbor movement. Keep the four cards separated, all within the existing hand zone, away from the right confirm button. Do not move the central trick cards.
Keep all pixels outside the bottom hand visually unchanged, no new labels or annotations, no watermark, no interface chrome. Retain the original painterly lacquer/paper/old-gold look. This is a subtle endpoint, not an exploded-card display.
```
## One targeted retry

Raw candidate: `art/source/web-v3/selected-finish-landscape-v1-retry.png`. First candidate retains four correct cards but moves selected center right and shifts neighbors more than 9px. Retry is not a verified exact geometry endpoint; compare hand ROI before acceptance.

```text
Use case: precise-object-edit. Original supplied 1672x941 image is edit target. Only bottom hand endpoint. Keep four cards LEAF5/MOUNTAIN8/KNOT2/SUN6. Exact source pixel constraints: upright selected LEAF5 outer PAPER bounds x547..681,y660..864 (center x614), halo around it. DO NOT shift selected card right. It must stay at original x614 center. Other cards move right9px ONLY: MOUNTAIN8 paper around x699..837,y671..866; KNOT2 x844..982,y675..869; SUN6 x988..1137,y680..880. Preserve sizes and tilts of unselected cards, no new gap wider than 20px. Original central trick7/3/1/9 and rest scene unchanged. Selected card has zero rotation and subtle12px lift, NOT enlarged. Gold halo retained8px below lifted center. No other change.
```
