# Portrait experience settings

Built-in image_gen only. Source: `art/mockups/web-v3/portrait/08-rules.png`.

## Design prompt

```text
Use case: precise UI-state edit. Edit supplied941x1672 original portrait rules screen into体验设置. Preserve scene/frame/staticheader/fox/navgeometry exactly. TOP游戏规则tab becomesneutralbrown, TOP体验设置tab green+gold selected. Allfourchapterbuttons neutralbrown, noactivechapter, preserveicons/arrows/labels.
Bodytitle体验设置. Exactparagraph 偏好保存在当前浏览器，仅影响本机显示。 Removeallfourstepcircles andstepplaques entirely. Replace withTHREEquietparchmentsettingrows in leftbody x105–625,width520,height110, topedges y1050,y1185,y1320. Foxstaysrightx650+unobscured. Row1label合法牌提示 withgreenONswitch andexplicit开启. Row2label减少动效 withnavyOFFswitch andexplicit关闭. Row3 centeredpaperaction恢复默认. Keepfooterunchanged atoriginaly1500with快速局共8轮·每轮1至8张牌. Warmteahousepaper/goldmaterial. Quietreadablelabelsandswitchessafelyinsiderows. No newicons or unrelatedelements, no geometrychangeselsewhere. Same941x1672.
```

## Geometry correction

```text
Precise geometry correction of image1 settingsmock using image2 originalrules as geometrytruth. Restore fox EXACTLY to image2 position/size (head nearx800,y1310,body tobottom), do notshrinkorlowerit. Settingrows MUST stay onlyleft x105to625. Threepaperrows EXACT visiblebounds: firstx105,y1050,width520,height110; secondx105,y1185,width520,height110; thirdx105,y1320,width520,height110. They MUST NOTextendrightofx625 orbehindfox. Label/switch/opentext fitcompactlyinside: row1合法牌提示 greenONswitch开启; row2减少动效 navyOFFswitch关闭; row3centered恢复默认. Remove priorfullwidthrowsandnestedrestoreplaque. Keep correctsettingsselectedtab/allneutralchapters/title/paragraph/footer unchanged. Footeroriginaly1500. Preserve941x1672. Do ONLYthesecorrections.
```

Selected design: `art/mockups/web-v3/portrait/08-settings.png`,941×1672. Rows remain approximatelyx80–660,y965–1095,1120–1245,1270–1380; these differ from requestedx105–625 andy1050/1185/1320. Fox restored to originalplacement; row/fox content is disjoint.

## Runtime clean layer

```text
Use case: precise-object-edit. Edit supplied941x1672 settingsscreen into cleanruntime layer. RemoveONLY dynamictexts: tablabels游戏规则/体验设置; chapterlabels快速上手/王牌与牌力/出牌规则/计分与局制; bodytitle体验设置; paragraph偏好保存在当前浏览器，仅影响本机显示。; rowlabels合法牌提示/减少动效; both switches entirelyincludingthumbs/tracks; statuslabels开启/关闭 withinsettingrows; 恢复默认; footertext快速局共8轮·每轮1至8张牌. Fillremovedareas withmatchingmaterial. Keep THREEemptyparchmentsettingrows exactlycurrentbounds. Keep静态header规则与设置andcloseX关闭 unchanged. Keepbrand奇术茶馆, allchaptericons/arrows,selectedgreen体验设置tab, neutralbrown游戏规则tab, allfourneutralbrownchaptertiles,clouds,foxillustration andscene. No stepcircles. Preserveallcurrentgeometryand941x1672. Do not remove header关闭, onlysettingrow关闭.
```

Output: `art/runtime/web-v3/portrait/settings.png`,941×1672.

## Footer plaque correction

```text
Precise local correction. Image1clean settings target. Image2design reference. Restore ONLY the empty parchment footerplaque atoriginalx100–640,y1478–1540, matchingimage2 border/cloudends andpapertexture. Keepits textblank. Do notalteranythingelse. Currenttab/chapterlabels/settinglabels/switches/bodytextremainblank. Keepstaticheader/closeandfoxunchanged. Same941x1672.
```
