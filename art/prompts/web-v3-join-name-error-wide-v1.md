# Web v3 wide join-room — empty-name validation candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`).

Edit target: `art/mockups/web-v3/03-join.png` (1672 × 941).

Raw candidate destination: `art/source/web-v3/join-name-error-wide-v1-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: the existing selected landscape Enchanted Teahouse game interface screenshot, edited into one empty-nickname submit-validation state.
Input image 1 is the edit target and strict source of truth. Keep the complete 1672 × 941 composition and exact aspect ratio. Do not crop, zoom, move, reflow, or redesign anything.
Make one surgical edit only inside the pale parchment nickname input near the upper center. Remove the dark original nickname “茶客听雨” and restore the exact matching pale cream parchment background under it. In the same input, replace the old nickname with the exact Chinese validation message “请填写茶客昵称”. Keep this single line fully inside the original parchment field, left-aligned near original-image x=775, y=345. Render it in restrained handwritten Chinese lettering approximately 24px tall, one size smaller than the normal nickname, in reddish ochre-brown approximately #813919. The seven characters must be correct and complete. Do not put the warning below the input or add another row.
Invariants: preserve the original field's normal gold border, position, proportions, cream-paper texture, right-side flower watermark, and decoration. Keep the full room-code sequence “628315” and the helper text below it exactly unchanged. Preserve the full scene, all animals, portrait, title, labels, lanterns, stars, table, panel, buttons, spacing, colors, textures, and lighting. No caret, no focus outline, no extra border, no new panel or icon, no red overlay or tint, no text beyond the field. The target is exactly one local nickname-validation state, not a redesign.

## Handling

Preserve the raw generated candidate unchanged. The main thread will composite only the parchment field text ROI back into the selected source, keeping all other original pixels. Do not replace `03-join.png`.

## Result inspection

The 1672 × 941 candidate displays the complete single-line “请填写茶客昵称” inside the existing parchment field in reddish ochre-brown. It removes the normal nickname and adds no row, frame, icon, caret, or veil. The six-digit room code remains “628315” with its original helper copy. The actual dark-red glyph bounding box is approximately x=776–992, y=347–375 inclusive (217 × 29); a padded extraction rect is x=772, y=343, width=225, height=37. The glyph footprint is roughly 29px high rather than the requested approximately 24px, still visibly smaller than the normal nickname and comfortably inside the field. Bounds were measured from the reddish-brown pixel footprint in the isolated paper-field region. Surrounding scene similarity is not proof of exact pixels; use only the designated ROI. The candidate was copied unchanged with no resize, color adjustment, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-367a6c4f-e73d-46a3-a49c-63879ca0550f.png`.
