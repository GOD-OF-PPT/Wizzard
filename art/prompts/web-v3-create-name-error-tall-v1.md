# Portrait create-room: empty nickname validation state v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/mockups/web-v3/portrait/02-create.png`, 941 × 1672.

Candidate: `art/source/web-v3/create-name-error-tall-v1-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: one UI validation-state mockup for the selected portrait Enchanted Teahouse create-room page.
Input images: Image 1 is the selected 941 × 1672 create-room mockup, the edit target and sole source of truth.
Primary request: create the exact empty-nickname submission validation state with only two tiny local changes. First, erase the nickname text “茶客听雨”, its vertical caret, and its circular clear-X control inside the nickname input, rebuilding the same quiet dark navy-blue interior so the field is completely empty. Second, place the single readable Chinese validation line “请填写茶客昵称” in warm pale rice-gold handwritten lettering within the existing empty strip below the input, bounded by x=380, y=532, width=365, height=30 in the original 941 × 1672 image coordinates. Center the line vertically within that strip; keep the entire line inside the existing nickname row panel. Use approximately 22-pixel-tall lettering at source scale. Do not create a new panel or expand the row.
Composition/framing: preserve the full 941:1672 portrait composition and all original scene positions, sizes, spacing, colors, and typography. Output may be proportionally larger but must preserve alignment and near-exact original aspect ratio.
Constraints: keep the original gold border of the nickname input normal and unchanged. No additional focus outline, warning border, icon, red layer, error panel, or layout shift. Preserve every other original pixel as closely as possible: the whole teahouse scene; curtains, lanterns, moon, building, and all characters; original logo; 创建房间 title; avatar and 昵称 label; the selected 6人 state and all other seat buttons; AI补位 enabled; 出牌倒计时 disabled; 快速局·8轮; 返回 and 创建房间 bottom buttons. Do not change any wording except removing the input value and adding the specified validation sentence. Keep all existing borders, ornaments, glow, and panel anatomy.
Text (verbatim): “请填写茶客昵称”
Avoid: any redesigned component; any missing or changed character elsewhere; any new UI object; error red; new focus glow; enlarged nickname panel; changing the avatar; changing selected seats, switch values, mode, or buttons; cropping; reframing; watermarks.

## Integration contract

Save the raw ImageGen result without color/tonal edits. Do not overwrite `02-create.png`. The main thread will compose only the specified input and validation-text ROIs back over the selected original so unrelated generated pixels cannot drift into the state source.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-b73cc70e-98e0-4b3b-91c0-828d11192e5f.png`.
- Copied unchanged to the candidate destination.
- Visual inspection: input value, caret and clear-X removed; requested Chinese validation line is readable and stays inside the nickname panel below the unchanged normal-gold input border. No warning icon, red treatment, new panel, or focus outline was added.
- The generated text begins approximately at x=358, slightly left of the requested x=380 strip. Reposition the text ROI to the specified band when compositing; do not blindly crop at x=380 or the first glyph can be clipped.
