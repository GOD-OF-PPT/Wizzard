# Portrait HUD trump parchment: retry single-character correction v2

Mode: built-in ImageGen precise local edit, `transparent_background:false`.

Sole original edit target: `art/source/web-v3/hud-source-v1/portrait-trump-reference.png` (359 ×80 RGB). Do not use rejected v1 as input.

Raw candidate destination: `art/source/web-v3/hud-source-v1/portrait-trump-corrected-candidate-v2.png`.

## Complete prompt

任务类型：对原图做严格局部文字编辑，不是重画界面。
唯一输入图：原始359×80像素纸色王牌状态牌。当前红字为“本轮王牌·藏日”。

必须真正替换一个字：把错误的“藏”完全擦除，重新写上正确的 **“赭”**。正确最终文案是 **“本轮王牌·赭日”**。前一次编辑错误地保留了藏字，这次绝对不能保留或描摹原来的藏字结构。

正确字的字形规则：
- 目标是简体汉字 **赭**，Unicode U+8D6D。
- 它是左右结构，左半边必须是完整的 **赤**，右半边必须是完整的 **者**，组合为一个字“赭”。
- 左边“赤”的上部为“土”形笔画，下部有赤字特有的下垂笔画和左右点撇。
- 右边“者”的上部为“耂”，下部是完整的“日”框。
- **绝对禁止艹草字头，绝对禁止臧字主体，绝对禁止犭犬旁。不能写成藏、褚、猪，也不能把赤和者写成分开的两个字。**
- 请采用清晰可辨认的赤+者左右字形，优先保证字正确，再匹配原有手写笔触。不要为了模仿原字而再次写出藏。

局部范围：原图靠右的藏字槽位约x252..284,y24..55。仅更换这个字的红色笔画、原字阴影及必要抗锯齿像素。旧笔画空出的区域恢复为相邻相同暖纸纹。新“赭”保持原字大致位置、字号、基线、红色颜料、书写笔触、光照及微弱字影，不移动任何其他字。

必须保持：其余“本轮王牌”、分隔圆点和最后“日”字全部不变；左侧红日轮及每条光芒不变；原纸纹、色调、旧金双边、两端小花、完整外轮廓、阴影、红褐背景、所有相对位置与原始359:80比例不变。不要重写整句，不要添加任何新图标、文字或花纹。

画布：保留完整359×80原裁片；工具如只能输出较大尺寸，也须保留相同比例和完整相对构图。不裁切、不加白边黑边、不加透明背景、不重新取景、不移动或缩放牌匾。输出为不透明RGB外观。

最终逐字核对：本 / 轮 / 王 / 牌 / · / **赭（左赤、右者）** / 日。只允许这一个字从“藏”变为“赭”。没有艹顶、没有犭旁、没有臧体。无水印。

## Integration contract

Save the raw generated result unchanged; no resizing, cropping, resampling, recoloring, alpha editing or other post-processing. Main will only compose a verified correct glyph and retain original source elsewhere. No code, canonical full-page design, browser or runtime changes. The v1 remains rejected rather than overwritten.

## Generated result and inspection

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-4343cb11-633d-47c1-8dd8-20ecc3a9af89.png`.
- Copied unchanged to requested v2 candidate destination. Actual **2168 ×725 RGB (`Format24bppRgb`)**, no post-processing.
- Effective nonwhite content band approximately **x0,y120,width2168,height481** (nonwhite threshold235 sampled at x5/center/right-6). Tool again adds upper/lower white padding. Main must compensate for y120 offset and locally register the glyph; whole-canvas crop/aspect is not preserved.
- Visual check against the specific prior failure: the new character now has a distinct left赤 structure and right者 with lower日, without the old shared艹 top/臧 body and without犭. It is visibly different from rejected v1's藏. Candidate is intended to read 本轮王牌·赭日; main-thread radical-level review remains the acceptance boundary before composition, given the prior misread.
- Corrected red-ink glyph box approximately **x1539,y276,width165,height163** (R>80,G<100,B<80,R>G*1.5 within right-label protected window; excludes faint fringe/shadow). Only its ink/fringe is eligible for composition after verification.
- Remaining label, sun, paper, gold borders and end flowers remain structurally recognizable, but regenerated stroke/paper/border pixels and white padding still drift. Keep exact original source everywhere outside the corrected glyph. Do not replace the whole plaque or entire character rectangle.
- V1 record explicitly marked rejected; original reference unchanged. No code, full-page design, browser or runtime resources modified.
