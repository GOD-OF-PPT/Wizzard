# 多标签保护状态：横竖独立设计 v2

工具：内置 ImageGen。编辑目标分别是 `art/mockups/web-v3/01-home.png` 与 `portrait/01-home.png`，不覆盖原文件。

## Landscape exact prompt

Use case: precise-object-edit. Asset: full-screen browser game home functional state. Input image is the edit target, exact 1672×941 canvas. Preserve the Enchanted Teahouse composition, all four menu plaques, title, guest plaque, characters, lighting and original pixels outside three local edit rectangles.

Add one compact parchment notice INSIDE x775 y34 width550 height230. Pale warm paper, restrained dark lacquer edge, thin old-gold border, small cloud corners matching this image. Do not extend past that rectangle, cover the title at left, guest plaque at right or crane hat below. Exact text: title “房间已在另一标签页打开”, one line at y60–93, warm brown brush lettering approximately29px; helper “请先关闭原标签页，再刷新此页继续。” one line at y110–135, approximately22px; second helper “单人练习与规则仍可使用。” at y145–168, approximately22px. Small green lacquer action x965 y187 width170 height50 with ivory lettering “刷新此页” about26px. Notice text must be readable and wholly inside its frame.

Only soften saturation slightly on existing 创建房间 plaque inside x150 y350 width510 height108 and 加入房间 plaque inside x150 y471 width510 height109. Preserve original text, dimensions and geometry. Do not change practice/rules plaques. No lock, spinner, extra modal, extra text, new icon, login or watermark. Full canvas remains1672×941.

## Portrait exact prompt

Use case: precise-object-edit. Asset: full-screen browser game home functional state. Input image is the edit target, exact941×1672 canvas. Preserve all four menu plaques, title, guest plaque, background and original pixels outside three local edit rectangles. Add ONE parchment notice fully contained in x90 y1250 width760 height370, overlaying the lower travelers/table area; keep all four entry plaques above y1015 completely unobstructed. Pale warm paper, restrained dark lacquer edge, old-gold fine border and small cloud corners, original Enchanted Teahouse art direction. Text in warm dark-brown brush lettering, centered: title “房间已在另一标签页打开” one line, about40px high at y1280–1330. Helper “请先关闭原标签页，再刷新此页继续。” one line, about30px at y1360–1400. Helper “单人练习与规则仍可使用。” one line, about30px at y1415–1455. Green lacquer action x320 y1500 width300 height75 with ivory “刷新此页” about36px. Every line fully inside the quiet parchment area.

Only soften saturation slightly on existing 创建房间 plaque inside x190 y478 width560 height115 and 加入房间 inside x190 y615 width560 height115. Preserve text, exact sizes and positions. Practice/rules plaques remain unchanged and usable. No lock, spinner, extra modal, extra text, new icon, login or watermark. Full canvas remains941×1672.

Raw generation may change unrelated pixels. Only inspected local ROIs may be composed into immutable originals, with an outside-pixel invariance report before implementation.
