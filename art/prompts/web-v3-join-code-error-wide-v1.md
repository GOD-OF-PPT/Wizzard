# Web v3 wide join-room — short-code validation candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`).

Edit target: `art/mockups/web-v3/03-join.png` (1672 × 941).

Raw candidate destination: `art/source/web-v3/join-code-error-wide-v1-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: an existing selected landscape Enchanted Teahouse game interface screenshot, edited into exactly one short-room-code submit-validation state.
Input image 1 is the edit target and strict source of truth for all scene artwork and interface layout. Preserve the complete 1672 × 941 composition and exact aspect ratio. Do not crop, move, zoom, reflow, restyle, or redesign anything.
Change only the six room-code field interiors and their one existing helper-text line. There are six cream parchment code boxes in a horizontal row. Replace the original six-digit code 628315 with a partial code: first box contains “1”; second box contains “2”; third, fourth, fifth, and sixth boxes are completely blank. Keep the numerals centered, dark ink brown, and in exactly the same handwritten type style and scale as the original digits. Restore the original pale cream parchment texture beneath every removed numeral. Preserve all six boxes' position, size, gold borders, texture, and spacing precisely. Do not add a caret or focus outline.
Replace the original helper line “输入好友分享的六位数字” below the boxes with the exact single-line text “请输入六位数字房间码”. Use the same restrained warm ivory-gold handwritten typography and the exact original helper-line vertical position, within approximately x=714–1110, y=595–621 in original-image coordinates. Keep the replacement centered as a single readable line within the room-code row, with all ten Chinese characters correct and complete. No new panel, icon, red text, error veil, tint, or banner.
Invariants: preserve absolutely all other pixels and content as faithfully as possible: full night teahouse scene, lanterns and stars, animal travelers and their poses, join-room title, all panel edges and decorations, portrait, the nickname “茶客听雨”, nickname field, labels, return button, join button, table, lighting, palette, density, and spacing. Keep normal field borders, no extra focus border. This is one surgical state edit, not a redesign.

## Handling

Keep the raw generated candidate unchanged. The main thread will composite only room-code interiors and helper-text regions back into the selected source to preserve all other page pixels. Do not replace `03-join.png`.

## Result inspection

The 1672 × 941 raw candidate contains “1” and “2” in the first two code boxes and leaves the other four completely blank. The nickname remains “茶客听雨”. The helper line reads the complete “请输入六位数字房间码”, with no new icon, panel, veil, or focus ring. Its actual warm-gold glyph bounding box is approximately left=714, top=596, right=963, bottom=617 (250 × 22 inclusive); a padded extraction rect is x=710, y=592, width=258, height=30. These bounds were checked from the light gold pixel footprint within the isolated helper-text band. Surrounding artwork remains visually similar but is not assumed pixel-preserved; composite only the needed field and helper regions. The candidate is preserved without resizing, recoloring, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-93ac3e77-09fb-4e33-8743-e3f90fe009a2.png`.
