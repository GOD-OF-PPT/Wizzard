# Landscape rules chapter 2: 王牌与牌力

Built-in ImageGen edits. Source: `art/mockups/web-v3/08-rules.png`.

## Immutable design prompt

Output: `art/mockups/web-v3/08-rules-trump.png`.

Use case: precise-object-edit. Edit supplied Enchanted Teahouse landscape rules screenshot into chapter TWO. Preserve exact 1672x941 canvas, scene, full lacquer frame, fox, parchment panel, navigation geometry, title 规则与设置, top tabs and close button. 游戏规则 top tab remains selected GREEN; 体验设置 neutral BROWN. Left chapter1 快速上手 must become neutral BROWN; left chapter2 王牌与牌力 must become selected GREEN with GOLD border, matching former chapter1 selection style. Chapter3 出牌规则 and chapter4 计分与局制 remain neutral brown. Body heading exactly 王牌与牌力. Replace paragraph exactly with: 翻出的数字牌决定本轮王牌花色。翻出至高牌时，由发牌者选择花色；翻出虚无牌时，本轮没有王牌。 Keep readable Chinese font and body bounds before fox, use 2–3 lines if needed. Keep four numbered circles and arrows and replace four labels left-to-right exactly: 首张至高牌 / 最大王牌 / 最大领出牌 / 虚无牌最低. Footer unchanged 快速局共8轮 · 每轮1至8张牌. Preserve all other composition and original art. No layout redesign.

## Clean runtime layer prompt

Output: `art/runtime/web-v3/rules-trump.png`.

Use case: precise-object-edit. Produce a CLEAN RUNTIME LAYER from provided landscape chapter2 rules screenshot. Preserve exact1672x941 scene/layout/frame/fox/parchment/ornaments. Remove ONLY dynamic text: labels 游戏规则 and 体验设置 from top tabs; all four left chapter labels 快速上手,王牌与牌力,出牌规则,计分与局制; body heading王牌与牌力 and entire explanatory paragraph; all four circle numerals1,2,3,4; four step labels 首张至高牌,最大王牌,最大领出牌,虚无牌最低; footer text快速局共8轮 · 每轮1至8张牌. Reconstruct matching original paper/lacquer textures behind removed text. Crucial selected-state invariant: TOP FIRST TAB stays GREEN selected and TOP SECOND TAB BROWN neutral. LEFT FIRST CHAPTER BROWN neutral; LEFT SECOND CHAPTER GREEN GOLD selected; chapters3/4 neutral BROWN. Retain all navigation icons and arrows, circular step backgrounds and between-step arrows, footer plaque, fox and scene. Retain static large logo奇术茶馆, title规则与设置, close×关闭. No newtext, no otherchanges. Opaque full canvas PNG.
