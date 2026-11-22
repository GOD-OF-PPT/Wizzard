# Web v3 landscape gameplay — unselected disabled action candidate v1

Mode: built-in ImageGen edit (`text-localization`).

Edit target: `art/mockups/web-v3/05-gameplay-final.png` (1672 × 941).

Raw candidate destination: `art/source/web-v3/select-idle-action-landscape-v1-candidate.png`.

## Full prompt

Use case: text-localization.
Asset type: the selected landscape Enchanted Teahouse gameplay screenshot, with a local action-label-only idle/disabled state.
Input image 1 is the strict edit target and the source of truth for every pixel of composition and artwork. Preserve the complete 1672 × 941 frame and aspect ratio. No crop, zoom, rearrangement, redesign, or style transfer.
Only change the four Chinese characters inside the green action plaque at the lower right: replace “确认出牌” with the exact text “选择手牌”. Match the source's handwritten calligraphy, original centered position, exact approximate character size, baseline, spacing, and composition. The new text must be lower-brightness but still readable warm ivory-gray-gold, about 50% of the original text's perceived brightness, so the action visibly reads as disabled until a hand card is selected. Reduce only the new lettering brightness. Keep all four characters correct, complete, and fully inside the same existing safe area.
Strict invariants: preserve the green plaque itself, its lacquer texture, gold border, cloud ornaments, size, geometry, position, and light levels. Preserve every other scene element, animal, portrait, all four hand cards and selection halo, the central cards, HUD, timer, existing text, and table exactly as in the source. No new overlay, gray veil, fill panel, icon, focus border, cursor, badge, or additional wording. This is a surgical replacement of the action lettering only, not a complete no-selection scene change.

## Handling

Save the raw ImageGen candidate unchanged. The parent thread will extract only the action lettering region and composite it into the selected source, preserving all other authored pixels. Do not replace `05-gameplay-final.png` or runtime assets.

## Result inspection

The 1672 × 941 candidate replaces the lower-right action with the complete “选择手牌” in muted low-brightness ivory-gray-gold lettering at approximately the source's original centered size and baseline. The green plaque, gold edge, and cloud ornament remain bright; no veil, icon, panel, or extra wording appears. The letter footprint is approximately x=1330–1537, y=724–772 inclusive (208 × 49), measured from the muted light lettering pixels within the isolated plaque-center region. A padded extraction rect is x=1325, y=719, width=218, height=59. Existing hand cards, selected halo, central cards, timer, and composition are visually retained; the candidate is only a label source, since surrounding pixels from generative editing are not assumed exact. The raw result is preserved with no resizing, color correction, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-51f8a9a5-2a99-48eb-949d-230e1200432e.png`.
