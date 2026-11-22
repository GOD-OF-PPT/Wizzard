# Web v3 landscape current ranking — after round4 candidate v1

Mode: built-in ImageGen edit (`text-localization` / precise source-state edit). Sole input is selected source design, never a runtime or implementation screenshot.

Edit target: `art/mockups/web-v3/07-ranking.png` (1672×941).
Raw candidate: `art/source/web-v3/results-source-v1/landscape-current-ranking-candidate-v1.png`.

## Full prompt

Use case: text-localization, precise-object-edit.
Asset type: one existing Enchanted Teahouse landscape ranking-page design, edited into the CURRENT accumulated ranking viewed after round4 during an ongoing game.
Input image1 is the only full-page edit target and strict source of truth. Preserve exactly the complete1672×941 canvas, aspect ratio, full composition, original lacquer/parchment frame, all avatars, every table row and column coordinate, original background, lanterns, animals, flowers, flourishes, trim, lighting, paper tint, materials, density, spacing, and hierarchy as faithfully as possible. Do not crop, zoom, reframe, recenter, redesign, restyle, move, resize, or remove any component. This is a local content-only state change.
Change only these specific text contents within their existing authored slots, matching each source slot's original handwritten typography, size, ink color, optical baseline, centering/alignment, and brush weight:
1. Main title becomes exactly“当前总榜”.
2. Subtitle becomes exactly“已完成第4轮”. This is an intermediate lookup after round4, not the finished eight-round game.
3. The six rows' accumulated TOTAL scores, top to bottom, become exactly80,60,50,40,20,10. Keep the original ranks, all six original player names, portraits, row order, table headers, other columns, and their positions unchanged. Change only the total-score numbers; do not edit other row data.
4. Existing paper secondary button label becomes exactly“返回结算”. Keep its authored paper shape, gold diamonds/ornaments, position, and size.
5. Existing green primary button label becomes exactly“继续下一轮”. Keep its authored green shape, texture, cloud/gold ornaments, position, and size; fit the full five-character label within the original content-safe area without resizing the button or shifting either footer action.
No finished-game wording may remain in the edited state: specifically replace any old subtitle about eight completed rounds with the exact subtitle above, and replace“再来一局”with“继续下一轮”. Do not add another line, new subtitle, tooltip, badge, explanatory copy, icon, overlay, panel, button, glow, or decoration. Do not show“八轮已毕”. The game continues beyond this round4 current-ranking lookup.
Strict invariants: keep all original names, ranking numerals, avatar identity/art, table geometry, backgrounds, borders, decorations, frame, row shading, remaining data, and visual proportions unchanged. Preserve all pixels outside the explicitly listed text slots as faithfully as possible. This is the same selected page with updated intermediate-state labels and six total scores only, not a newly composed results screen.
Output the entire1672×941 frame, no crop and no added margins.

## Handling

Save raw full-frame ImageGen result unchanged. Main will locally compose only approved updated text/score regions while retaining unrelated source pixels. Do not resample, crop, recolor, postprocess, change formal designs, runtime code/assets, browser, or the original selected source. Do not use a drifting full-page replacement.

## Single-output inspection

Actual raw image is1672×941 opaque24-bitRGB. It visibly reads“当前总榜”and“已完成第4轮”. The six total scores are correct in row order80,60,50,40,20,10. Names, ranks, six avatar subjects, table structure, background, full frame, and decorations remain visually in their original positions. The footer correctly reads“返回结算”and“继续下一轮”; no八轮已毕 or再来一局 remains in the visible page. Both five-character primary label and four-character secondary label fit their authored button-safe regions without an obvious overlap.

Approximate ink bounds in full-page coordinates, inclusive, measured by color threshold within isolated text slots:

| Slot | Ink bounds x1,y1,x2,y2 |
|---|---|
| Title当前总榜 | 696,86,977,149 |
| Subtitle | 736,180,939,205 |
| Score80 | 1124,309,1169,342 |
| Score60 | 1124,386,1169,417 |
| Score50 | 1125,461,1168,493 |
| Score40 | 1123,537,1169,568 |
| Score20 | 1124,612,1168,644 |
| Score10 | 1127,690,1167,721 |
| Paper返回结算 | 557,776,732,816 |
| Green继续下一轮 | 919,776,1138,815 |

This passes only the requested new-content reading check. Generative paper grain, border highlight, small avatar/flower contours, lettering strokes, and subtle background detail differ from the source. The new title uses fewer characters and is narrower within the same fixed title plaque; no frame movement is required. Original non-edit pixels and all table/button geometry must remain protected by local compositing. Do not replace the whole page with the candidate. Candidate saved raw, without resize, crop, recolor, alpha alteration, or other postprocessing. No code, formal design, runtime resource, or browser edits occurred.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-87ccfc38-40c7-4519-bd34-6b2cdec5515f.png`.
