# Blank bid timer furniture v1

Mode: built-in ImageGen edit/reference extraction with actual transparent background.

Reference/edit target: `art/source/web-v3/bid-timer-portrait-v3-candidate.png`.

Asset destination: `art/source/web-v3/bid-timer-blank-v1.png`.

## Complete prompt

Use case: background-extraction
Asset type: isolated raster timer furniture with real alpha transparency for the Enchanted Teahouse browser game.
Input images: Image 1 is the source of truth. Use only its new bottom-right round “28秒” timer furniture as the reference/edit target; exclude the entire surrounding game screen.
Primary request: produce one standalone 512 × 512 PNG with a truly transparent exterior. Precisely preserve the source timer's thin warm-gold circular ring, delicate inner rim, dark brown slightly translucent/deep dark circular disk, warm gold edge glow, and the original light warm-gold cloud ornament attached at the lower-left. Remove all internal contents: the entire disk interior must be empty with no hourglass, no “28秒”, no number, no words, no glyph, no icon and no symbol. Rebuild the empty interior as continuous matching dark brown material. This is the existing timer furniture isolated and emptied, not a new timer design.
Composition/framing: circular ring remains a true circle. Center the complete ring-plus-cloud object in the 512-pixel square and let it nearly fill the frame while maintaining at least 16 transparent pixels around every outer glow and the complete cloud ornament. Do not cut off any cloud, ring or glow.
Style/material: exactly match the reference's fine original teahouse UI rendering: delicate luminous warm-gold metal rim, deep brown glazed disk, subtle gold spark/glow and sculpted parchment-gold cloud. Preserve the original relative cloud/ring sizes and attachment position.
Constraints: use actual transparent alpha outside the object, not a checkerboard, solid black/white background, fake transparency pattern or any game scene. Preserve the original thin ring geometry; do not thicken, cartoonify, simplify or redesign it. No backing panel, no extra ornament, no text, no numerals, no hourglass and no symbol anywhere in the interior. Do not include any other part of the source page.
Avoid: filled square background; rectangular shadow tile; checkerboard pixels; new timer style; thicker ring; oval geometry; cropped cloud; bright opaque empty disk; internal labels, numbers, hourglasses or icons; watermark.

## Preservation contract

Save the raw generated PNG as returned, without resizing, recoloring, alpha editing or any other post-processing. Root-thread integration will perform only mechanical alpha cropping and layout composition.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-cbc2e6ad-9c4f-447b-bb7b-d754cfbf0f86.png`.
- Copied unchanged to the destination. Actual resolution is **1254 × 1254**, not requested 512 × 512. Pixel format is RGBA (`Format32bppArgb`).
- Alpha audit: min 0 / max 255; 587,861 fully transparent pixels; 984,570 partial-alpha pixels; 85 fully opaque pixels; all four image corners have alpha 0. Center alpha is 250. Transparency is real, not a painted checkerboard.
- Bounding box of every nonzero-alpha pixel: **x=0,y=0,width=1240,height=1254**. Faint alpha/glow reaches image edges, so the requested full 16 px transparent border is not satisfied.
- Additional measured crop guides: alpha >8 box is x=39,y=36,width=1147,height=1127; alpha >128 box is x=44,y=99,width=1113,height=1057. No alpha thresholding or cropping has been applied to the saved image.
- Visual inspection: circular dark brown disk interior has no hourglass, number, word, letter or central symbol; the gold rim, lower-left cloud ornament and warm glow are present, with no page/background scene. Compared with the reference, the ring/glow reads stronger and the rim has small diamond markers. Preserve raw and treat these as explicit design differences, not exact-match acceptance.
