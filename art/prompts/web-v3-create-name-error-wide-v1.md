# Web v3 wide create-room — empty-name validation candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`).

Edit target: `art/mockups/web-v3/02-create.png` (1672 × 941).

Raw candidate destination: `art/source/web-v3/create-name-error-wide-v1-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: an existing selected landscape game interface screenshot, edited into exactly one empty-nickname submit-validation state.
Input image 1 is the edit target and the strict source of truth for all layout and artwork. Preserve the full 1672 × 941 composition and exact aspect ratio. Do not crop, zoom, move, redesign, restyle, or reflow anything.
Change only these small regions in the nickname row near the upper center: inside the existing gold-edged nickname input field, remove the ivory characters “茶客听雨”, the thin vertical caret immediately following them, and the round X clear control at the right. Restore the same quiet deep navy-blue input background seamlessly where those objects used to be. Keep the input's normal single gold border, its shape, size, and position exactly unchanged. Add no focus ring or extra border.
Add one line of readable warm ivory-gold handwritten Chinese text, exactly “请填写茶客昵称”, into the blank horizontal band directly below the nickname input but still inside the same large nickname row panel. In the original 1672 × 941 coordinate system, the available band is x=742, y=301, width=460, height=29. Start the warning near x=742 and fit its entire single line within that 29px-high band. Match the teahouse interface's existing warm handwritten lettering with restrained contrast. The full seven-character text must be correct, complete, and easily readable.
Invariants: keep absolutely everything else unchanged, including the full night teahouse scene, title, animal travelers, nickname portrait and “昵称” label, all panel and input borders, the selected green “6人” seat button, every other seat control, AI toggle and copy, timer toggle and copy, mode field, back button, and create button. Preserve all scene colors, textures, glow, lighting, and spacing. Do not put a new panel, icon, badge, red tint, red text, veil, or overlay around the error. This is a surgical local UI-state edit only.

## Handling

Keep the raw generated candidate unchanged. The parent thread will composite only the specified input and validation-text regions back into the selected source to ensure the rest of the authored page stays pixel exact. Do not replace `02-create.png`.

## Result inspection

The raw generated candidate removes the nickname, caret, and X and restores the dark field. It renders the complete single-line warning “请填写茶客昵称” in warm gold inside the nickname row, with the normal field border and no focus ring, added panel, icon, or tint. The warning's left edge is approximately x=715 rather than the requested x=742; the main thread must align the warning ROI to x=742 while composing it into the independent final state. The overall page remains 1672 × 941 with the selected six-seat button and both toggles preserved. Treat unchanged surrounding artwork as visually similar only, since generative editing is not pixel-preserving. The candidate is saved without resizing, recoloring, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-e01b0acf-5a11-4ec8-a162-a926528ff853.png`.
