# Landscape rules chapter 4: 计分与局制

Built-in ImageGen edits. Source: `art/mockups/web-v3/08-rules.png`.

Design generation returned 1671×941; normalized the single-pixel width to requested 1672×941 with ImageMagick. Runtime generation returned 1672×941 directly.

## Immutable design prompt

Output: `art/mockups/web-v3/08-rules-scoring.png`.

Use case: precise-object-edit. Edit supplied Enchanted Teahouse rules screenshot into chapter FOUR. Preserve exact1672x941 geometry, scene, lacquer frame, fox, parchment, nav, static title规则与设置 and close. Top游戏规则tab selectedGREEN and 体验设置BROWN. Left chapters1快速上手,2王牌与牌力,3出牌规则 all neutralBROWN; only chapter4计分与局制 selectedGREEN+GOLD. Bodyheading计分与局制. Exactparagraph: 预测准确：20分基础分，加上每赢一墩10分。预测不准：每差一墩扣10分。总分可为负；最后总分最高者获胜，同分并列。 Place readable Chinese within original paragraph band abovecircles, beforefox; wrap3lines ifneeded with nooverlap. Four numberedcircles/arrows retained, labelslefttoright exactly 预测准确 +20 / 每赢一墩 +10 / 每差一墩 −10 / 总分最高获胜. Use two-line labels ifneeded; preserve disjoint footer. Footerunchanged快速局共8轮 · 每轮1至8张牌. Preserve allotherart/layout.

## Clean runtime layer prompt

Output: `art/runtime/web-v3/rules-scoring.png`.

Use case: precise-object-edit. Produce CLEAN RUNTIME LAYER from provided landscape chapter4 scoring screenshot, exact1672x941. Remove only dynamic text: top tablabels游戏规则/体验设置, allfour leftchapterlabels快速上手/王牌与牌力/出牌规则/计分与局制, bodyheading计分与局制, complete scoringparagraph, fourcircle numerals1/2/3/4, allfour steplabels including+20,+10,−10 and总分最高获胜, footertext快速局共8轮 · 每轮1至8张牌. Restore matching originaltextures. Preserve allframes,circles,icons,navarrows,betweencirclearrows,footerplaque,fox,scene,ornaments,geometry. Correctselectedbands mustremain: topfirsttabGREEN secondBROWN; leftchapters1,2,3BROWN; chapter4GREEN withGOLDborder. Preserve staticlogo奇术茶馆,title规则与设置,close×关闭. Nootherchanges. Opaque fullcanvasPNG.
