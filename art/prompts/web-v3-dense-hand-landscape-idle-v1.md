# Web v3 dense-hand landscape — eight-card idle design candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`).

Edit target: `art/mockups/web-v3/25-gameplay-selection-idle-v2.png` (1672 × 941).

Supporting original raster art: `art/runtime/cards/highest-special.png` (gold starburst, clouds, orbital linework); `art/runtime/cards/lowest-special.png` (black ink steaming tea bowl and circular brush stroke). Paths verified through the imports in `src/game-assets.ts`. No implementation screenshot is used.

Raw candidate destination: `art/source/web-v3/dense-hand-landscape-idle-v1-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: a selected landscape Enchanted Teahouse game-screen design, edited into one new dense eight-card local-hand idle state.
Image 1 is the strict full-page edit target, 1672 × 941. Image 2 is original supporting artwork for the seventh special card, 至高: reproduce its established gold starburst, circular orbital linework, and cloud motifs on ivory paper. Image 3 is original supporting artwork for the eighth special card, 虚无: reproduce its established black ink steaming tea bowl inside the circular brush stroke on ivory paper. Images 2 and 3 are supporting card-art references only and must not alter the page's composition or art style.
Keep the full image-1 page at exactly 1672 × 941 with its original Enchanted Teahouse style, camera, lighting, scene, color, material, and layout. Do not crop or zoom. Make exactly two local changes: the round scroll copy and the bottom local hand.
First change: on the parchment round scroll at the upper left, change “第4轮” to “第8轮”, and “每人4张” to “每人8张”. Match the existing dark handwritten type, position, size, and two-line hierarchy. Do not change the scroll's artwork or geometry.
Second change: replace only the existing bottom four-card hand with exactly eight cards in one straight horizontal row. Exact left-to-right order: (1) teal-leaf suit rank 5; (2) navy mountain suit rank 8; (3) red knot suit rank 2; (4) ochre sun suit rank 6; (5) teal-leaf suit rank 11; (6) navy mountain suit rank 12; (7) 至高 special using image 2's exact established gold celestial-starburst artwork; (8) 虚无 special using image 3's exact established black steaming tea-bowl artwork. All eight must be present once, with no ninth card and no missing special. Ordinary cards use the same ivory paper, color-specific angular corner motifs, suit emblems, and black upper-left rank typography as image 1. The 11 and 12 must have TWO unmistakable black digits, not a stylized single mark, and their digits must remain fully visible. Keep each numeric rank in the upper-left safe area, clear of all overlap. Special cards have their original distinctive artwork; do not invent ordinary-suit symbols or numeric ranks for them.
Card geometry in the original full-page pixel coordinates: each approximately 140px wide × 210px tall, zero rotation, all at one shared vertical center y=774. Exact approximate horizontal centers are x=370, 480, 590, 700, 810, 920, 1030, and 1140 respectively. Thus the entire hand fits approximately x=300–1210, y=669–879. A restrained 30px overlap between neighbors is allowed, preserving the exposed upper-left ranks, suit emblems, and clear spread. Show all cards at their ordinary idle level with no selected halo, no selection glow, no raised or lifted card, no fan rotation, and no card disproportionately larger than its neighbors. Keep the right action lane beginning x=1250 completely clear of cards. Keep all bottom card faces readable.
Strict invariants elsewhere: preserve all animals, seats, portraits, nameplates, local-player 青竹客 plaque and statistics, the central trick cards 7/3/1/9, the trump band, the 28-second timer, every other label and scene detail, and the lower-right green action's exact shape and muted text “选择手牌”. Do not create a selected state or change the action label. Do not move any other interface element, alter the central hand/trick, add overlays, icons, new panels, new text, new glows, or a new layout. Only the round-scroll copy and bottom hand change. This is one source design candidate for a dense idle hand, not a redesign of the whole page.

## Handling

Preserve the raw generated candidate unchanged, without resizing, color adjustment, or any postprocessing. The root agent will inspect and locally compose only the allowed hand/scroll regions and independently fix exact card poses. Do not modify code, browser, canonical mockups, or runtime resources. This task generates no selected state.

## Single-output inspection

Actual output is 1672 × 941. The round scroll correctly reads “第8轮” and “每人8张”. Exactly eight bottom cards appear in the requested order: leaf 5, mountain 8, knot 2, sun 6, leaf 11, mountain 12, gold starburst special, and black tea-bowl special. The 11 and 12 are unmistakably two-digit values with no digit occlusion. Both special designs visibly follow the supplied original artworks. There is no selected halo or lifted hand card, and the row is approximately horizontal and unrotated. The upper composition, central 7/3/1/9 trick, trump band, 28-second timer, and muted “选择手牌” action remain visually retained.

Geometry does not exactly follow the requested poses: visually the generated hand spans approximately x=318–1254, y=675–862 with centers near x=380, 499, 617, 733, 848, 963, 1076, 1194 and common y≈769. Cards are roughly 118–123px wide and 184–187px tall, generally adjacent rather than overlapping by the requested 30px. The last special reaches approximately x=1254 and therefore enters the x≥1250 action lane by a few pixels, very close to the plaque border. Root must locally compose correct 140 × 210 geometry at the specified x centers before using this as a final canonical design. No selected state was generated. Non-edit pixels are visually similar only, not pixel-preservation evidence. The raw candidate is copied unchanged; no crop, resize, recolor, or other postprocessing was performed.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-93a767fc-8250-4c78-9e08-affe2a91773f.png`.
