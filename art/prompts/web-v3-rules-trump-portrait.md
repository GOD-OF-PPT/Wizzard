# Portrait rules: 王牌与牌力

Built-in image_gen only. Source: `art/mockups/web-v3/portrait/08-rules.png`.

## Immutable design

```text
Use case: text-localization / precise UI-state edit.
Edit target: supplied941x1672 portrait rules screen. Preserve ALL pixel layout, scene, fox illustration, parchment, frames, header, typography hierarchy, two tabs and2x2 chapter tiles and2x2 step diagrams. Change only chapter2 state/content. 游戏规则 tab stays green selected. First chapter 快速上手 becomes neutral brown matching other neutral tiles, gold icon and arrow kept. Second chapter 王牌与牌力 becomes green selected with gold frame like original first selectedtile. Other tiles neutral unchanged. Body heading becomes exactly 王牌与牌力. Paragraph exactly: 翻出的数字牌决定本轮王牌花色。翻出至高牌时，由发牌者选择花色；翻出虚无牌时，本轮没有王牌。 Fit it in original paragraph safearea above circles using3compact readable lines, keep heading hierarchy and circles positions unchanged. Four step labels in reading order exactly 首张至高牌 / 最大王牌 / 最大领出牌 / 虚无牌最低. Circles keep1,2,3,4. Footer keeps 快速局共8轮·每轮1至8张牌. Keep body fox unchanged, no addedillustrations. Exact941x1672 portrait. Do not redesign, move any geometry or change unrelated text.
```

Output: `art/mockups/web-v3/portrait/08-rules-trump.png`,941×1672.

## Runtime clean layer

```text
Use case: precise-object-edit
Edit target: supplied941x1672 portrait 王牌与牌力 selected rules screen.
Create runtime clean layer by removing ONLY these dynamic text pixels: both tab labels 游戏规则 and 体验设置; all four chapter labels 快速上手,王牌与牌力,出牌规则,计分与局制; body heading王牌与牌力; all three body paragraph lines; four step numerals1,2,3,4; four paper step labels 首张至高牌,最大王牌,最大领出牌,虚无牌最低; footer text 快速局共8轮·每轮1至8张牌. Replace removed letters seamlessly with their original paper/green/brown material.
Keep STATIC top branding奇术茶馆, title规则与设置, close label关闭 and X. Keep ALL icons and arrows on chaptertiles, selected game tab greenbackground, neutral settings tab, chapter1 neutralbrown, chapter2 green+gold SELECTED, chapter3/4neutralbrown. Keep the empty darkstepcircles and blankpaperlabel plaques, footerplaque. Keep body fox illustration in exactly sameposition, clouddecorations, all frames, scene, parchment, all geometry and941x1672dimensions identical. Blank ONLY bodytext, never erase illustration or clouddecoration. No layout changes, no added text.
```

Output: `art/runtime/web-v3/portrait/rules-trump.png`,941×1672.
