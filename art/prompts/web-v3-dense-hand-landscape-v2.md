# Web v3 dense-hand landscape — compact idle and selected candidates v2

Mode: two sequential built-in ImageGen edits (`precise-object-edit`).

This document records raw design candidates only. No implementation screenshot, code, browser, runtime asset, or canonical mockup is edited.

## Idle v2 full prompt

Use case: precise-object-edit.
Asset type: selected Enchanted Teahouse landscape eight-card local-hand design, precise bottom-row geometry revision only.
Input image 1 is the existing raw eight-card idle design and the strict source of truth for the whole page. Preserve the entire 1672 × 941 frame, exact aspect ratio, and every upper-scene, HUD, text, character, seat, nameplate, central-card, trump, timer, button, and table element as faithfully as possible. Do not fix or change any existing upper text, including its current wording. Do not crop, zoom, reframe, restyle, or redraw the page.
Only edit the bottom eight local hand cards to place them in exactly this compact straight horizontal arrangement. Every card has a 128 × 192 pixel logical box, zero degrees rotation, and vertical center y=775 in full-page coordinates. Card centers left to right are x=320,440,560,680,800,920,1040,1160. Therefore the complete row spans x=256–1224 and y=679–871, leaving a clear gap before the action lane starting x=1250. Neighbor overlap is at most 8 pixels. Exact card order and existing art are unchanged: teal leaf 5, navy mountain 8, red knot 2, ochre sun 6, teal leaf 11, navy mountain 12, gold celestial-starburst 至高 special, black steaming-tea-bowl 虚无 special. Preserve the original artwork for both special cards from the input. The digits 11 and 12 must each remain unmistakably two fully visible digits in the upper-left rank area. Do not hide any digit, compress the digits, replace 11 or 12 with a single mark, or clip any suit emblem.
This is the IDLE row: no selected halo, no lifted card, no card rotation, no shifted-out selected position, no glow around a local card. Preserve the green action plaque and its muted label “选择手牌” exactly. Restore the matching lacquer table where the old row is vacated. Make no change outside the bottom local hand and its immediately affected table footprint. Upper text must remain as-is.

Idle input: `art/source/web-v3/dense-hand-landscape-idle-v1-candidate.png`.
Idle raw output: `art/source/web-v3/dense-hand-landscape-idle-v2-candidate.png`.

## Selected v2 full prompt

Use case: precise-object-edit.
Asset type: selected Enchanted Teahouse landscape eight-card local hand, one selected-card interaction design.
Input image 1 is the new raw eight-card idle v2 candidate and strict full-page edit target. Preserve the full 1672 × 941 frame, exact aspect ratio, original scene, upper HUD, wording, all avatars/seats/nameplates, central trick 7/3/1/9, trump band, 28-second timer, and every other element as faithfully as possible. Do not fix upper text, crop, zoom, reframe, restyle, or redesign anything.
Only change the bottom-hand selected state and the existing action lettering. Select ONLY the fifth local hand card, teal leaf rank 11, at zero-based index 4. Its complete two-digit 11 and teal leaf must stay fully visible. All cards use the same 128 × 192 pixel logical boxes and zero rotation. Exact target centers in source pixel coordinates: first leaf 5=(311,775); second mountain 8=(431,775); third knot 2=(551,775); fourth sun 6=(671,775); selected fifth leaf 11=(800,763); sixth mountain 12=(929,775); seventh gold celestial-starburst special=(1049,775); eighth black steaming-tea-bowl special=(1169,775). This means only leaf 11 lifts by 12 pixels; all four cards LEFT of it move 9 pixels outward to the left, and all three cards RIGHT of it move 9 pixels outward to the right relative to the desired idle centers 320,440,560,680,800,920,1040,1160 at y775. Do not lift any other card. Keep the card order, paper, rank, suit symbols, and both established special-card artworks unchanged. All ranks, especially mountain 12 immediately right of the selected card, must remain fully exposed and legible after the outward shifts. No other selection effect.
Add one restrained gold selected halo around leaf 11 only, centered at (800,771), optically 8 pixels below the lifted card center. Halo approximately 156 pixels wide × 211 pixels tall, zero rotation. Its approximate outer box is x=722–878, y=665.5–876.5. Keep the selected card above the halo in layer order and do not let its glow obscure the adjacent 12 rank or the trump band. No halo around any other card, no sparkling veil, no new object.
In the existing lower-right green action plaque, replace the muted “选择手牌” lettering with the exact active ivory text “确认出牌”, matching the plaque's authored handwritten style, same size, centered position, and baseline. Preserve the plaque shape, border, cloud ornament, texture, and position. Keep the x≥1250 action lane clear of cards; the rightmost card's outer edge should stop at x≈1233. Restore continuous matching lacquer only where a moved hand card vacates its old location. Do not change any content outside these local hand/action-label footprints. This is one selected leaf-11 design state only.

Selected input: `art/source/web-v3/dense-hand-landscape-idle-v2-candidate.png`.
Selected raw output: `art/source/web-v3/dense-hand-landscape-selected-v2-candidate.png`.

## Idle v2 inspection before selected generation

The first raw edit retained exactly eight cards, their order, fully readable 11/12, both original special-card subjects, and the muted action, with no selected glow. It did not follow the requested compact coordinate placement: visually the row remains near x=320–1248, y=677–857, approximately 115 × 180 cards and centers near 378,497,615,734,851,966,1081,1194 at y767. The upper text was left as-is. The second prompt explicitly restates the desired coordinates and outward shifts. No pixel-exact geometry compliance is claimed for either generative result.

## Final single-output inspections and measured geometry

Both raw outputs are 1672 × 941. Selected v2 shows only leaf 11 lifted with one gold halo and changes the action to the correct active “确认出牌”. All eight cards remain present in the right order and ranks 11/12 are completely readable. It does not satisfy the requested exact geometry. The hand remains farther right and smaller than specified. The gold halo is a tall ellipse with small cross-axis line accents rather than a clean bitmap of the requested dimensions. Upper/HUD content remains visually similar, not exact source-pixel evidence; upper wording was not deliberately corrected.

The following bounding boxes were measured from light-paper pixels inside individual visual card regions (inclusive x1,y1,x2,y2). They describe the raw candidate, not exact logical API boxes. Borders and halos can extend beyond this threshold footprint.

| Index/art | Idle light-paper bbox | Idle paper center | Selected light-paper bbox | Selected paper center |
|---|---|---|---|---|
| 0 leaf 5 | 321,677,434,854 | 377.5,765.5 | 299,678,412,855 | 355.5,766.5 |
| 1 mountain 8 | 440,676,553,855 | 496.5,765.5 | 421,678,534,855 | 477.5,766.5 |
| 2 knot 2 | 559,675,671,854 | 615,764.5 | 542,678,653,855 | 597.5,766.5 |
| 3 sun 6 | 677,676,789,854 | 733,765 | 660,678,776,856 | 718,767 |
| 4 leaf 11 | 795,676,904,854 | 849.5,765 | approx 782,665,897,849, excluding halo | approx 839.5,757 |
| 5 mountain 12 | 910,676,1018,854 | 964,765 | 907,678,1018,856 | 962.5,767 |
| 6 highest special | 1024,677,1138,855 | 1081,766 | 1026,678,1136,856 | 1081,767 |
| 7 lowest special | 1139,677,1248,856 | 1193.5,766.5 | 1144,678,1256,856 | 1200,767 |

The selected halo bright-gold footprint, excluding card-paper and neighbor interiors, measures approximately x=775–905, y=650–869 inclusive, 131 × 220, center 840,759.5. Glow has no crisp outer edge and may extend farther. This differs from target center800,771 /156×211; the selected card also differs from requested center800,763 /128×192. Neighbor shifts are not uniformly9px: the left neighbors move roughly15–22px left, the right neighbors move roughly0–7px. The rightmost visible paper reaches1256 and therefore still enters the x≥1250 action lane. Root must independently fix all card poses and halo geometry by allowed local compositing. No candidate was postprocessed, no runtime/code/browser/canonical source was edited.

Idle raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-76d44278-dabd-4d27-90c2-95022bcd1d66.png`.

Selected raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-cce4953e-bfe3-4a15-9808-0fe7ef57905c.png`.
