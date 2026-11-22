# Portrait gameplay: idle disabled select-hand action v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/mockups/web-v3/portrait/05-gameplay-safe-v2.png`, 941 × 1672.

Candidate: `art/source/web-v3/select-idle-action-portrait-v1-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: single idle/disabled action-state raster for the selected portrait Enchanted Teahouse gameplay mockup.
Input images: Image 1 is the selected complete portrait gameplay mockup, the sole edit target and visual source of truth.
Primary request: edit only the standalone green action plaque at the bottom right, approximately x=666..940,y=1501..1635 in source-image coordinates. Change its label from “确认出牌” to exactly “选择手牌”, representing the disabled action before a hand card is selected. Preserve the original handwritten Chinese style, size, position and optical baseline. Render the replacement label in a clearly readable subdued warm rice-grey-gold. Slightly darken and desaturate the green plaque itself, approximately 68 percent of its original brightness, while retaining the same green material, exact authored silhouette, fine gold border and lower-right scroll ornament. The label should look disabled yet legible.
Composition/framing: exact full 941 × 1672 portrait composition. No crop, scaling, reframing or scene movement.
Constraints: change only this bottom-right independent action plaque and its text. Do not place a black rectangular overlay or an extra dark box; edit the native material and lettering in the existing plaque shape. Preserve all original pixels as closely as possible elsewhere, including all four local hand cards and the selected first-card halo, the local avatar/nameplate, central 7/3/1/9 cards, trump status, right-side 28秒 timer, other players, all scenery, return-home control, labels, characters, ornaments, table and every panel. Keep the action plaque geometry and dimensions unchanged, with detailed border and corner ornament intact.
Text (verbatim): “选择手牌”. Every other original text remains unchanged.
Avoid: changing hand cards or selected halo; changing timer or gameplay state; new icons, panels, cursors, shadows or overlays; a black rectangle; altering scene illumination; moving or resizing the action plaque; unreadable text; watermark.

## Integration contract

Save the raw generated candidate without color/tonal adjustments. Preserve selected `05-gameplay-safe-v2.png`. Main-thread integration will use only the action-plaque ROI so unrelated generated pixels do not replace original pixels.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-8118f9b1-b19d-4fc7-8ddb-f61622c8d133.png`.
- Copied unchanged to the candidate destination. Actual resolution: 941 × 1672.
- Visual inspection: bottom-right label reads “选择手牌” in subdued readable warm grey-gold, with darkened/desaturated green plaque and original fine border/ornament retained. No rectangular overlay or new component. All four hand cards, selected halo, timer, central cards, characters and scene remain structurally intact.
- Plaque visual outer bounds are approximately x=668,y=1501,width=271,height=137 including the lower-right ornament. Text bright-core bounding box is approximately x=711,y=1547,width=182,height=43 (the far-right ornament may touch this measurement near its bottom-right). Suggested local text-only crop: x=703,y=1540,width=190,height=54, preserving original ornament when integrating.
- The requested 68 percent material brightness is a generation instruction, not an independently measured luminance ratio. Candidate is preserved raw; compare the plaque ROI before acceptance.
