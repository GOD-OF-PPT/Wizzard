# Web v3 landscape trump HUD — single-character correction candidate v1

Mode: built-in ImageGen edit (`text-localization`). The sole input is selected original source art, never an implementation screenshot.

Edit target: `art/source/web-v3/hud-source-v1/landscape-trump-reference.png` (331×75).
Raw candidate: `art/source/web-v3/hud-source-v1/landscape-trump-corrected-candidate-v1.png`.

## Full prompt

Use case: text-localization.
Asset type: original Enchanted Teahouse horizontal parchment trump-status plaque; one incorrect Chinese character needs a surgical correction.
Input image1 is the sole strict edit target. Preserve the entire original331×75 crop, exact full-crop aspect ratio, authored plaque position and silhouette, paper tint, gold double border, both tiny end flowers, red sun-wheel icon, backgroundRGB, shadows, and all existing text exactly as faithfully as possible. Do not crop, zoom, recenter, redesign, change dimensions, or move any element.
Change exactly ONE character in the existing red handwritten label. The source reads “本轮王牌·藏日”. Replace only the incorrect “藏” with the correct “赭”, producing exactly “本轮王牌·赭日”. The replacement character is 赭, UnicodeU+8D6D, formed by 赤 on the left and 者 on the right. Render that correct complete character clearly in the same original red-brown ink, handwritten brush style, font size, stroke weight, baseline, and exact existing character slot. Do not use 藏, 猪, 堵, or any substitute. Keep its width and spacing consistent with the original word. Remove the old藏 strokes and their tiny shadow only where necessary, seamlessly restore the immediate original ivory paper beneath, then render the correct赭. The new character must not touch the adjacent centered dot or unchanged 日.
Strict invariants: all other original characters 本轮王牌, the centered separator dot, the final日, their exact positions and stroke appearances, and the sun-wheel icon stay unchanged. Preserve the frame, flowers, material, shading, dimensions, background, edges, and layout. No new text, symbol, panel, glow, line, icon, ornament, backing, extra margin, or transparent cutout. Do not retype the whole label or regenerate the whole plaque. This is a local single-character correction only.
Return the same331×75 canvas if possible, otherwise the same full crop at a proportionally identical larger size. Preserve the source composition without extra top/bottom margins. Opaque original background, no transparency.

## Handling

Save raw generated output unchanged. Main will extract only the corrected characterROI after registration, retain exact original pixels elsewhere, and never replace the whole source with a drifting candidate. Do not postprocess, resize, crop, recolor, or edit code, whole-page designs, browser state, runtime assets, or original artwork.

## First-output inspection

The model changed the requested character but its left radical visually resembles犭, giving a猪-like glyph rather than a verified correct赤+者赭. Thereforev1 is retained as raw rejected/uncertain generation provenance, not accepted as correct lettering. All remaining source content is visually similar but regenerated, and broad white top/bottom margins were added. A second targeted attempt from the original sole source will be saved as a separate sibling without overwritingv1.

The actualv1 output is2170×725 opaque24-bitRGB. The source-like red-background band measures y97–594 atx5, spanning the canvas width; white margin exists above and below. The plaque itself is approximately x23–2137,y135–565. Other lettering, sun-wheel size, frame contour, colors, and textures are visually similar only, not pixel-preserved. Extract no whole asset from this candidate.

First raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-977f3342-411c-4b92-bb1e-4bbb331a5b44.png`.

## Second targeted attempt — full actual prompt

用例：对输入原图做极小的汉字勘误，不是重新设计。输入图1是唯一编辑目标，是331×75的奇术茶馆王牌状态纸牌匾。维持原图全部构图、日轮、其他所有字、字号、色彩、双金边、两端小花、纸纹、阴影及红棕背景不变，原尺寸或严格同比放大，不能改变排版或增加白边。
只把原稿最后两个字“藏日”里的第一个字改为“赭”，完整文字必须清楚写成“本轮王牌·赭日”。关键字是Unicode U+8D6D的赭，左右结构：左部是完整的“赤”，右部是完整的“者”。请让左边赤部七笔结构清晰可辨：上部“土”（横、竖、横），下部撇、竖钩、撇、点；右边者部下方有完整的日。左部赤的上方两横和中间竖必须写清楚，不能把左部简化成只有弯钩和撇的偏旁。保持原稿红棕色书写笔触，只在原“藏”占用的单字位置写出结构正确的赭；不移动前面的圆点、不移动最后的日，不缩小字号，不重写前面的本轮王牌。
清除被替换字的旧笔画和字影并用相邻原纸纹补齐，再绘正确赭字。所有其他像素尽可能保持原样，不增加任何别的文字、图标、光效、线框或装饰，不删除或修改日轮。保持不透明背景；不是透明抠图、不是新牌匾。仅输出该原稿上这一处单字修正结果。

Second raw candidate destination: `art/source/web-v3/hud-source-v1/landscape-trump-corrected-candidate-v2.png`.

## Second-output inspection

The second candidate visibly shows the correct赭 with a legible赤 left component and者 right component. Full text reads “本轮王牌·赭日”; the wrong source藏 is absent and the corrected character stays between the separator and final日. This passes the local visual character-reading check, not whole-plaque pixel fidelity. The complete raw image is2170×725 opaque24-bitRGB. The source-like red-background band atx5 measures y98–594 inclusive across the canvas, with white margins above and below. Plaque silhouette is approximately x23–2137,y135–565. The corrected red glyph's thresholded ink bounds are x1546–1707,y264–429 inclusive (162×166); a small padded extraction region is x1541,y259,width172,height176, pending main's registration.

Likev1, the second output subtly regenerates the icon, text strokes, frame, color, paper grain, and background rather than preserving non-edit pixels exactly; it also keeps added white margins. Only extract and locally register the corrected赭 ink/nearby cleanup footprint into original source art. Retain original other lettering, sun, flowers, frame, background, size, and shadows. Both raw candidates remain saved unchanged, with no resampling, cropping, recoloring, or other postprocessing; no code, canonical page, browser, or runtime resource edits occurred.

Second raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-6a9ccba7-7d9c-4246-8052-6ea42a06becc.png`.
