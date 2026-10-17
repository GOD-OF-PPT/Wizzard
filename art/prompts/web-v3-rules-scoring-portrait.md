# Portrait rules: 计分与局制

Built-in image_gen only. Source: `art/mockups/web-v3/portrait/08-rules.png`.

## Immutable design

```text
Use case: precise UI-state edit.
Edit target: supplied941x1672 original portrait rules screen. Preserve ALL geometry, scene, foxillustration, paper, frame, typographyhierarchy, two tabs,2x2chaptertiles,2x2steps andfooter. 游戏规则tab stays selectedgreen, 体验设置brown. First快速上手, second王牌与牌力, third出牌规则 neutralbrown. Onlyfourth计分与局制 selectedgreen+gold likeoriginalfirsttile; preserveits scrollicon andarrow.
Bodyheading exactly 计分与局制. Exactparagraph: 预测准确：20分基础分，加上每赢一墩10分。预测不准：每差一墩扣10分。总分可为负；最后总分最高者获胜，同分并列。 Fitin3compactreadablelines withinoriginalparagraphband abovestepcircles. Fourstep labels readingorder exactly 预测准确 +20 / 每赢一墩 +10 / 每差一墩 −10 / 总分最高获胜. Keepnumerals1,2,3,4. Fitlabels insidesamepaperplaqueswithoutchanginggeometry. Footerunchanged 快速局共8轮·每轮1至8张牌. Allbodycontent stayssafeanddisjoint. No unrelatedchanges; exact941x1672.
```

Output: `art/mockups/web-v3/portrait/08-rules-scoring.png`,941×1672.

## Runtime clean layer

```text
Use case: precise-object-edit
Edit target: supplied941x1672 portrait scoringrules screen. RemoveONLY dynamictext: bothtablabels 游戏规则/体验设置; allfourchapterlabels 快速上手/王牌与牌力/出牌规则/计分与局制; bodyheading计分与局制; allthreeparagraphlines; fourstepnumbers1,2,3,4; steptexts预测准确+20/每赢一墩+10/每差一墩−10/总分最高获胜; footertext快速局共8轮·每轮1至8张牌. Seamlesslyfillletterpixels with originalmatchingpaper/green/brownmaterial.
Keepstaticicons/arrows, 游戏规则green selectedtab, settingsbrown, fourthchaptergreen+gold SELECTED, otherthreebrown. Keep topbranding奇术茶馆,title规则与设置,closeX关闭. Keep allframes/circles/paperplaques/footerplaque,foxillustration/clouds/scene and exactgeometryunchanged. Blanktextonly, notillustration. Same941x1672, noaddedcontent.
```

Output: `art/runtime/web-v3/portrait/rules-scoring.png`,941×1672.

## Static-label correction

```text
Precise corrective edit. Image1 is current cleanlayer target. Image2 is original scoringdesign reference. Restore ONLY static text 规则与设置 inside titleplaque and 关闭 besideX on closebutton, and restore small goldcloud ornament beside originalbodyheading at about(550,835), exactlymatching image2. Do not restore any dynamictext. Alltablabels/chapterlabels/bodyheading/paragraph/stepnumbers/steptexts/footertext remainblank. Keep currentfourthchaptergreen selected,icons/arrows,fox,circles,plaques,geometry and941x1672 unchanged. No otherchanges.
```
