# Portrait join-room: empty nickname validation state v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/mockups/web-v3/portrait/03-join.png`, 941 × 1672.

Candidate: `art/source/web-v3/join-name-error-tall-v1-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: one UI validation-state mockup for the selected portrait Enchanted Teahouse join-room page.
Input images: Image 1 is the selected portrait join-room page, the edit target and sole source of truth.
Primary request: create the empty-nickname submission validation state. Make exactly one local edit inside the existing warm parchment nickname input. Remove the original black-brown nickname “茶客听雨”, restoring matching parchment underneath, and replace it with exactly “请填写茶客昵称” using restrained ochre-red-brown handwritten Chinese lettering, approximate color #813919. Make this replacement validation line around 27 pixels tall at the original source scale, one size smaller than the previous nickname. Place it left-aligned inside that same parchment field, starting near x=348,y=715 in the original 941 × 1672 coordinates, with the entire line comfortably inside the field.
Composition/framing: preserve the complete exact 941:1672 portrait composition, all original positions, relative sizes, spacing, colors and component anatomy. Output may be larger only at the same proportions. Do not crop or reframe.
Constraints: keep the existing nickname field's normal gold border and warm paper texture. Do not add a new line, focus outline, warning border, icon, panel, overlay or validation treatment outside the nickname field. Specifically leave the flower ornament and divider strip below the nickname field untouched and free of error text. Preserve every other original element: all scenery and travelers, curtains and lanterns, central avatar, 加入房间 title, 昵称 label, the six original room-code digits 6 2 8 3 1 5 in their exact order and style, the unchanged helper line “输入好友分享的六位数字”, the 房间码 label, 返回 and 加入房间 buttons, all lacquer, gold and parchment details.
Text (verbatim): “请填写茶客昵称” inside the nickname field only. Existing code remains “628315”; helper remains “输入好友分享的六位数字”.
Avoid: modifying code digits or helper text; changing the avatar, background, scene, buttons or panel shapes; warning icons; text under the nickname field; additional boxes or rows; changing normal border colors; red overlays; huge error lettering; any incorrect, missing or extra Chinese glyph; watermarks.

## Integration contract

Save the raw ImageGen candidate without color/tonal adjustments. Do not overwrite selected `03-join.png`. The main thread will extract only the nickname-field text ROI onto the selected original, preserving the rest of the selected original exactly.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-44708532-6da0-42de-a23b-9410a70b1e8d.png`.
- Copied unchanged to the candidate destination. Actual resolution: 941 × 1672.
- Visual inspection: readable “请填写茶客昵称” is contained inside the original paper nickname field; no new box, row, warning icon, focus outline, overlay, or divider-strip text. Room code and helper sentence remain structurally unchanged.
- Ochre text core bounding box: x=345, y=714, width=266, height=36, measured in x=335..649/y=700..758 with RGB R>90, R<190, G<130, B<100, R>G*1.3. Suggested padded crop: x=339, y=708, width=280, height=48.
- The generated lettering is approximately 36 px tall, larger than the requested ~27 px, and appears somewhat warmer/brighter than #813919. The candidate is preserved raw; main-thread integration should account for the size difference explicitly instead of claiming exact compliance.
