# Portrait current ranking after round4: full-page state candidate v1

Mode: built-in ImageGen precise text/state edit, `transparent_background:false`.

Sole edit target: `art/mockups/web-v3/portrait/07-ranking.png`, actual941 ×1672 RGB.

Raw candidate destination: `art/source/web-v3/results-source-v1/portrait-current-ranking-candidate-v1.png`.

## Complete prompt

Use case: ui-mockup
Asset type: exact-layout portrait current-total-ranking state queried after the fourth round, using the existing selected Enchanted Teahouse ranking page.
Input images: Image1 is the complete original941 ×1672 selected ranking page, sole edit target and source of truth for every component coordinate, avatar, frame, table, background, decoration and visual style.
Primary request: create the distinct mid-match “view current total ranking after round4” state by changing ONLY the listed text/score ink in the existing original text slots. Keep every original component, coordinate, width/height, spacing, hierarchy, paper/frame silhouette, illustration and material unchanged. Do not move, resize, reflow or redesign anything.

Exact content substitutions:
1. On the existing upper title plaque, replace 快速局总榜 with exactly **当前总榜**, centered within the same plaque using original dark handwritten brush style and matching readable optical scale. Do not shrink or move the plaque or ornaments.
2. On the existing small subtitle line below title, replace the complete old 八轮已毕·下回再会 wording with exactly **已完成第4轮**, keeping the original horizontal decorative lines and dots unchanged, same baseline and central slot. No eight-round completion/replay wording remains.
3. Preserve the six original rows, rankings, names and specific avatar identities exactly, and replace ONLY total-score numbers in their existing right-side slots: rank1 青竹客→**80**; rank2 云游鹤→**60**; rank3 花间狐→**50**; rank4 墨隐熊→**40**; rank5 星眼猫→**20**; rank6 AI旅人→**10**. Keep the same original number font/size/ink style, baseline and score-column alignment. Keep rank1 score's original warm dark-gold emphasis and other scores' original dark ink, only changing the digits. Retain original row boundaries and first-place golden highlight, all table headers名次/玩家/总分, every name/rank/avatar, and exact column coordinates.
4. On the existing bottom paper secondary button, replace 返回首页 with exactly **返回结算**, same four-character size, ink weight, optical center and baseline, preserving its diamond ornaments, paper pattern and fine gold borders.
5. On the existing bottom green primary button, replace 再来一局 with exactly **继续下一轮**, same original handwritten warm-ivory style and optical center/baseline, sized to fit the existing authored label-safe area without changing button geometry. Preserve green lacquer, bottom flower ornaments and fine gold border.

Semantic requirements: this is an in-progress fourth-round ranking query, not final rankings or rematch. The page must contain 当前总榜 and 已完成第4轮 and the two actions 返回结算/继续下一轮. Absolutely no 八轮已毕, 下回再会, 再来一局, 返回首页 or equivalent final-game/replay wording. Do not add a new explanation, status bar, tag, footer or icon.

Critical preservation: all existing scene pixels and full component layout remain unchanged as closely as possible: entire teahouse, moonlit architecture/lanterns, original paper scroll and teal patterned pillars, title plaque, original six avatars and their identities/poses/crops, table rows/columns/highlight, decorative plum/chrysanthemum branches, gold details, lower paper/green buttons, floor, foreground blurred leaves and every original text outside the substitutions. In particular AI旅人 keeps its original avatar from this selected ranking source, not an animal replacement. No new composition, pose, object, font system, card, icon or decoration. Restore original underlying paper/green material only where removed ink leaves gaps; no patched rectangles.

Composition/framing: output exactly941 ×1672 full portrait page with identical source bounds/aspect. No crop, zoom, reframe, recenter, padding, rotation, changed canvas, shifted or scaled component. Opaque RGB appearance, no transparency/checkerboard.
Text(verbatim): title“当前总榜”; subtitle“已完成第4轮”; total scores80/60/50/40/20/10; paper action“返回结算”; green action“继续下一轮”. Existing names/ranks/table headers unchanged.
Avoid: final-game/rematch wording; inaccurate/missing/duplicated Chinese glyphs; leftover old scores; changed name/avatar/ranking; changed table geometry; shifted score positions; changed component dimensions; new panel/status/footer; brighter/darker scene; watermark.

## Integration contract

Keep raw full-page output unchanged without resampling, cropping, resizing, recoloring or post-processing. Main thread will locally compose approved ink/state changes while preserving exact unrelated source pixels. No canonical formal-design, runtime/code or browser edits in this task.

## Generated result and inspection

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-3b1c3569-b951-4a60-a72a-dc1d68b0a7aa.png`.
- Copied unchanged to candidate destination. Actual **941 ×1672 RGB (`Format24bppRgb`)**, no white padding or post-processing.
- Single-result content inspection: title reads 当前总榜; subtitle reads 已完成第4轮; six original rows/names/ranks remain in order with total scores80/60/50/40/20/10. Original six avatar identities remain recognizable, including original AI旅人 human portrait. Paper action reads 返回结算; green action reads 继续下一轮. No visible八轮已毕/下回再会/再来一局/返回首页 remains.
- Layout and scene remain structurally aligned to source: title plaque, subtitle baseline, table headers, six row centers/columns, scroll frame, decorations and both buttons have no obvious major relocation. However the subtitle center text/ornament spacing is rebalanced and regenerated; character stroke shape/score alignment/green label fit are not exact source-pixel acceptance. Entire image is generative, so unchanged art is not pixel invariant.
- Read-only8px-grid comparisons of protected non-edit regions prove drift: upper scene x0,y0,w941,h270 has3953/4012 changed samples, mean absolute RGB-channel delta2.668; six-avatar column x329,y555,w102,h646 has1044/1053 changed samples, mean8.174; left scroll x20,y356,w130,h945 has2015/2023 changed samples, mean5.778 (0..255 channel scale). Keep exact source avatars, border, scene and other protected pixels when composing text/state edits.
- Main should use separate bounded ink/text replacement masks for title, subtitle, six scores and two button labels, protecting row geometry and decorative baseline dots/lines from source. Do not wholesale adopt this candidate as a canonical page.
- Original source and formal design/code/runtime/browser remain untouched.
