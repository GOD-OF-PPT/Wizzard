# Web v3 portrait final ranking

Mode: built-in `image_gen` only. Design reference: `art/mockups/web-v3/07-ranking.png`; portrait composition reference: `art/mockups/web-v3/portrait/06-results.png`.

## Design prompt

```text
Use case: ui-mockup
Asset type: finished 9:16 portrait final-ranking game screen, target 941x1672 pixels or closest 9:16.
Input images: Image 1 is landscape ranking content/style reference; image 2 is portrait results composition/style reference.
Primary request: create the matching independent portrait final-ranking screen. Reuse portrait image 2's exact warm lantern teahouse night environment, large parchment scroll with teal patterned rollers and gold caps, floral margins, title plaque and broad bottom stacked paper/green action plaques. Match its painted lacquer, parchment grain, typography and density. Compose ranking in the scroll center with three columns only: 名次 玩家 总分. Six evenly spaced readable ordered rows, ranks 1 through 6; animal-traveler circular avatars as in references. Row data exactly: 1 青竹客 180; 2 云游鹤 150; 3 花间狐 120; 4 墨隐熊 100; 5 星眠猫 80; 6 AI旅人 60. First row gently gold highlighted as landscape. Title plaque exactly 快速局总榜. Subtitle immediately below title exactly 八轮已毕·下回再会. At bottom, stacked paper plaque 返回首页, then green plaque 再来一局. Preserve spacious content-safe columns, no floral overlap. No extra text, no watermark, no phone/browser frame. Portrait is genuine reflow, not cropped landscape. Deliver a single full-bleed finished screen.
```

Selected immutable design: `art/mockups/web-v3/portrait/07-ranking.png` (941×1672).

## Clean runtime edit prompt

```text
Use case: precise-object-edit
Asset type: clean runtime background derived from the selected portrait final-ranking design.
Edit target: the supplied portrait ranking screen, 941x1672. Change ONLY the six row entries and two button labels. Remove all rank numerals 1,2,3,4,5,6 (retain their decorative diamond outlines); remove all six circular avatars including their circular frames, all six player names, all scores 180,150,120,100,80,60. Fill those small regions seamlessly with the existing parchment texture or first-row gold highlight. Remove the text 返回首页 and 再来一局 from the paper and green bottom plaques, replacing only letter pixels with the same plaque material.
Invariants: KEEP title 快速局总榜, subtitle 八轮已毕·下回再会 and column labels 名次 玩家 总分 unchanged and at exactly the same coordinates. Keep every row separator, first-row gold highlight shape, empty rank diamond outlines, scroll, title plaque, flowers, rollers, lantern teahouse background, action plaque borders and decorations, dimensions, colors, typography, and geometry IDENTICAL. Do not rearrange, resize, restyle, repaint unrelated areas, or invent labels. Result is the same screen with blank dynamic row contents and blank action labels. Opaque full-bleed PNG.
```

Runtime destination: `art/runtime/web-v3/portrait/ranking.png`.

## Dynamic title/subtitle runtime v2

Edit source: `art/runtime/web-v3/portrait/ranking.png`. Original design and first clean layer are preserved.

```text
Use case: precise-object-edit
Edit target: supplied 941x1672 portrait clean ranking background.
Make just two local text removals: remove 快速局总榜 from the upper title plaque, filling its letters with matching plain parchment texture; remove 八轮已毕·下回再会 from the subtitle area below the plaque, filling only the letter pixels with matching parchment. Keep the flanking thin subtitle horizontal rules and their dot ends exactly intact.
Everything else must remain identical: column labels 名次 玩家 总分, their brushstroke band, all six rank diamond outlines, all row separators, gold first row, scroll rollers, title plaque geometry and floral emblems, flowers, lantern night teahouse, both blank bottom action plaques, original geometry and dimensions. Do not move, resize, redraw or restyle any unrelated element. No added text. Opaque PNG with same 941x1672 dimensions.
```

Runtime destination: `art/runtime/web-v3/portrait/ranking-v2.png` (941×1672).
