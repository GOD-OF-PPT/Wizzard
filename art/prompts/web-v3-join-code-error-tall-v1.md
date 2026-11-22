# Portrait join-room: short room-code validation state v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/mockups/web-v3/portrait/03-join.png`, 941 × 1672.

Candidate: `art/source/web-v3/join-code-error-tall-v1-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: one UI validation-state mockup for the selected portrait Enchanted Teahouse join-room page.
Input images: Image 1 is the selected 941 × 1672 portrait join-room page, the edit target and sole source of truth.
Primary request: create exactly the short-room-code submission validation state using only two local edits. First, within the existing six gold-framed parchment room-code cells, show “1” centered in the first cell and “2” centered in the second cell, using exactly the original dark brown calligraphic numeral style, scale, weight, and optical alignment. Leave the remaining four cells completely empty, restoring their original warm parchment texture with no caret or placeholder. Second, replace the existing helper sentence “输入好友分享的六位数字” with exactly “请输入六位数字房间码”. Keep the same single-line warm rice-gold handwritten style and same original helper-line location, approximately x=312–625, y=1074–1104 in source-image coordinates. Keep the new sentence horizontally centered beneath the six cells and fully readable.
Composition/framing: preserve the exact full 941:1672 portrait composition; output may be proportionally larger but must keep all original positions, scale, spacing, and geometry. Do not crop or reframe.
Constraints: preserve all six room-code cell frames exactly and keep the nickname “茶客听雨” unchanged. Preserve all original scenery, characters, curtains, lanterns, distant landscape, large red lacquer panel, gold trim, central avatar, 加入房间 title plaque, 昵称 label and field, 房间码 label, ornament dividers, 返回 button, 加入房间 button, tea table, and every decorative arrangement. No new panel, icon, error overlay, red treatment, focus outline, focus glow, border change, or layout shift. No additional changes anywhere outside the numerals and helper sentence.
Text (verbatim): “1” in first room-code cell, “2” in second room-code cell, four empty cells, helper “请输入六位数字房间码”.
Avoid: redesigning the page; changing the avatar or nickname; altering background colors, panel textures, or borders; adding cursor, cross, warning icon, new label, or new UI; any wrong, missing, duplicated or extra Chinese character; moving buttons; watermarks.

## Integration contract

Save the original generated output without color/tonal edits. Do not overwrite the selected `03-join.png`. The main thread will compose only the room-code content and helper-text ROIs onto the selected source, preserving all other source pixels.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-32e6899a-f51c-4c21-bc34-63210415e35f.png`.
- Copied unchanged to the candidate destination. Actual resolution: 941 × 1672.
- Visual inspection: first two cells contain 1 and 2; the last four cells are empty; helper sentence reads “请输入六位数字房间码”. Nickname, avatar, borders, scene, and button composition remain structurally intact; no new focus outline, warning panel, or error icon.
- Actual helper-line bright text bounding box: x=318, y=1069, width=305, height=27, measured inside x=280..659/y=1060..1107 with RGB threshold R>200, G>150, B>70. This is a bright-core measurement, not full antialias coverage. Suggested padded crop: x=310, y=1063, width=322, height=40.
- The helper line is about five pixels higher than the approximate requested y band; the main thread may place the extracted helper ROI at the selected original line baseline.
