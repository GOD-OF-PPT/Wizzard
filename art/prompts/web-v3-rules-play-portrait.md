# Portrait rules: 出牌规则

Built-in image_gen only. Source: `art/mockups/web-v3/portrait/08-rules.png`.

## Immutable design

```text
Use case: precise UI-state edit.
Edit target: supplied941x1672 original portrait rules screen. Preserve all scene, geometry, foxillustration, typography hierarchy, title/header/tabs,2x2chaptertiles,2x2stepcircles andpaperlabels andfooter. 游戏规则tab stays selectedgreen, 体验设置neutral. First快速上手, second王牌与牌力 andfourth计分与局制 become/remain neutralbrown. Third出牌规则 becomes selectedgreen+gold like original firsttile; preserveits cardicon andarrow.
Bodyheading exactly 出牌规则. Replaceparagraph exactly: 持有领出花色的数字牌时必须跟色；没有该花色时可以打出其他数字牌。至高牌和虚无牌随时可出。先选牌，再确认出牌。 Fit3 compact readablelines in originalparagraphband above stepcircles, without touchingcircles. Fourstep labels readingorder: 查看领出花色 / 选择合法手牌 / 确认出牌 / 胜者领下一墩. Keepnumbers1,2,3,4. Fitlonglabels insideexistingpaperplaques withslightlysmallerfontsize ifneeded, do notresizeplaques. Footerunchanged 快速局共8轮·每轮1至8张牌. Keepallbandsdisjoint, exact941x1672, no unrelatedchanges.
```

Output: `art/mockups/web-v3/portrait/08-rules-play.png`,941×1672.

## Runtime clean layer

```text
Use case: precise-object-edit
Edit target: supplied941x1672 portrait 出牌规则 screen. Remove ONLY dynamic text: both tablabels 游戏规则/体验设置; fourchapterlabels 快速上手/王牌与牌力/出牌规则/计分与局制; bodyheading出牌规则; entire3linebodyparagraph; stepnumerals1,2,3,4; steptexts 查看领出花色/选择合法手牌/确认出牌/胜者领下一墩; footertext快速局共8轮·每轮1至8张牌. Fillletterpixels with matchingpaper/brown/greenmaterials.
KEEP all staticicons/arrows, selectedgreen规则tab, neutralsettingstab, thirdchaptergreen+gold selected, otherthreechapterbrown. Keep topbranding奇术茶馆, title规则与设置, closeX关闭. Keep foxillustration, clouds, blankdarkcircles, blankpaperstepplaques, footerplaque, all geometry/scene/materials exactlysame. Do noterasebodyillustration. No redesign. Same941x1672.
```

Output: `art/runtime/web-v3/portrait/rules-play.png`,941×1672.
