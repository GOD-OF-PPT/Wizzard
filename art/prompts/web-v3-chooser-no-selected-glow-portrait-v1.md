# Portrait chooser: remove disabled first-hand-card selected glow v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/mockups/web-v3/portrait/11-chooser-no-play-v4.png`, 941 × 1672.

Candidate: `art/source/web-v3/chooser-no-selected-glow-portrait-v1-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: one local semantic correction candidate for the selected portrait chooser overlay state.
Input images: Image 1 is the complete existing 941 × 1672 selected portrait chooser page; it is the sole edit target and visual source of truth.
Primary request: remove only the orange-golden selected-state luminous halo on the outside edge of the bottom-left first disabled local hand card. This card is the paper card with the original black “5” and teal leaf symbol. Eliminate the bright orange-gold glow around its exterior so it has no selected-state cue. Restore the immediately surrounding dark lacquer/table/background texture where that glow had spilled, matching nearby material and lighting. Preserve the card itself exactly: its 5, teal leaf, decorative corner marks, paper, normal paper edge, ordinary shadow, position, angle and size. Match its unselected edge treatment to the other disabled hand cards, without changing the other cards.
Composition/framing: output exactly 941 × 1672, preserving the full page composition and every original coordinate. Do not crop, zoom, reposition or reframe.
Constraints: edit only the thin outside halo around the first bottom-left hand card. Preserve every other original element, especially the chooser modal, its four trump-card choices, all original text and icons, travelers/avatars/nameplates, timer, darkened/disabled hand cards, central table, scene, borders and all lighting elsewhere. This source intentionally has no confirm-play action button; do not add or restore any 确认出牌 button or other action. Do not redraw the whole page or change the card artwork. The first card must retain its original number 5 and teal leaf while losing only its exterior orange selected glow.
Text (verbatim): all original text unchanged; no new text.
Avoid: a new or restored confirm-play button; moving any element; changing overlay opacity, typography or modal geometry; replacing the first card; erasing its ordinary edge or symbol; adding a flat dark rectangular patch; changing any other card; gold selected outline or residual luminous halo around first card; watermarks.

## Integration contract

Keep the raw generated output without color or tone edits. Preserve the selected source. Root-thread integration will use only the narrow external edge ROIs necessary to remove the selected halo, not replace the complete page or card artwork.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-e09533c7-b6ce-4d35-9beb-dd114cd9843c.png`.
- Copied unchanged to the candidate destination. Actual resolution: 941 × 1672.
- Single-result visual inspection: first bottom-left 5/teal-leaf hand card no longer has the orange-gold selected glow; its paper face, glyphs and angle remain structurally intact. Chooser, four large trump choices, timer and scene composition are structurally retained; no confirm-play button was introduced.
- Suggested local removal envelope: x=122,y=1250,width=170,height=240, restricted to narrow strips outside the source card silhouette. Preserve the original card face and ordinary paper edge exactly; do not paste this full rectangle. Approximate protected card quadrilateral: (139,1271),(273,1266),(281,1467),(145,1475). Root integration must use the source's exact edge/mask, as these are visual estimates.
- The generative output is not proof of pixel invariance across the page or card edges. Use only the outside-edge material needed to remove glow and retain the selected source elsewhere. This is a local candidate, not a completed whole-page acceptance artifact.
