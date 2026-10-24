# Portrait chooser pending v3

- Tool: built-in ImageGen edit.
- Input: `art/mockups/web-v3/portrait/11-chooser.png` (941 × 1672).
- Raw output: `art/source/web-v3/chooser-pending-portrait-v3.png` (941 × 1672).
- The v2 candidate inserted an extra status line and shifted the card rows downward. It is rejected as a faithful geometry reference.
- This v3 uses the permitted fallback: replace the original subtitle with pending text at its existing baseline. The first and second choice-card rows retain y ≈ 576 and y ≈ 891.
- This is a raw generative output; unchanged areas may have small generative differences. Use original source plus tightly scoped generated regions for the eventual design rather than replacing unrelated source regions wholesale.

## Exact prompt

Precise text-only UI edit. The input is the exact edit target, a 941×1672 portrait game screenshot. Keep the entire image pixel-registered to input. Change ONLY the one existing subtitle line centered at x471,y527: replace the Chinese sentence “翻出至高牌，由发牌者选择。” with the exact Chinese text “正在提交选择…”. Keep that replacement on precisely the original subtitle's baseline and in the original subtitle style and size. Do not add any second line. Preserve the decorative gold horizontal dividers on each side of this subtitle. Also slightly mute the saturation/contrast of the four choice cards to signal disabled, without changing their position, size, shapes, symbols or text. The four choice cards MUST stay at the original positions: top row begins y576, second row begins y891; their left edges are x210 and x498. Keep panel edges x78 to865,y392 to1226. Everything else, including title, scene, hand, avatars, timer, and actions is unchanged. Do not move any existing pixel geometry. Preserve exact full output dimensions941×1672, no margins or crop. No spinner. Return full image.
