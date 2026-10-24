# Portrait chooser — remove unrelated play control

Mode: built-in ImageGen precise-object-edit. Input edit target: `art/mockups/web-v3/portrait/11-chooser.png`, 941×1672. Output raw retained in `art/source/web-v3/chooser-portrait-no-play-v2.png`. This is a semantic design correction: choosing trump immediately submits a suit; there is no playable-card confirmation action during this modal. Preserve the original v1 design.

## Exact prompt

Use case: precise-object-edit. Image 1 is the EDIT TARGET, not a style reference. Keep its entire 941×1672 canvas and composition. Change ONLY the bottom-right green lacquer button reading “确认出牌”, inside x668..940 y1390..1540. Remove that entire unrelated button, its gold frame, cloud flourish and lettering. Reconstruct the quiet warm brown table/teahouse scene naturally behind it, matching adjacent texture, lighting and illustration. Preserve the ivory hand cards immediately to its left and above, the circular hourglass/timer immediately above, every pixel of the large red four-suit chooser panel, its four suit cards, title and subtitle, the return-home plaque, characters, round sign and all other scenery. Do not add text or controls. This state is choosing a suit, so no confirm-play button may remain. Do not move, resize, redraw or recolor the chooser panel, hand, timer, avatars or text. No new objects, no crop, no padding, no watermark. Output exactly 941×1672.

## Composition contract

Use only the selected local ImageGen removal ROI; retain all original pixels outside it. Generate a new versioned design and matching pending revision. Never overwrite v1 or use a current implementation screenshot as the design target.

## Source inspection

The raw output removes the unrelated action correctly. The first hard-cut v2 derivative produced a visible rectangular seam through the exposed sun-card/table area; v3's feather band retained part of the old gold border. Neither is selected. V4 copies generated pixels within x630 y1360 w311 h220, with a16px fusion margin fully outside the old plaque/shadow. Original pixels outside this ROI remain unchanged. The selected files are `portrait/11-chooser-no-play-v4.png` and `portrait/18-chooser-pending-no-play-v4.png`. This does not establish Chrome implementation fidelity.
