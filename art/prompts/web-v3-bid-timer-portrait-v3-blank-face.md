# Web v3 portrait bid timer — blank dial center candidate v3

Mode: built-in ImageGen edit (`precise-object-edit`).

Edit target: `art/source/web-v3/bid-timer-portrait-v3-candidate.png` (941 × 1672).

Raw output: `art/source/web-v3/bid-timer-portrait-v3-blank-face-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: existing portrait Enchanted Teahouse bidding-screen raster, with one small timer-center clean-up.
Input image 1 is the edit target and strict source of truth. Preserve the full 941 × 1672 composition and exact aspect ratio. Do not crop, zoom, reflow, redesign, or reposition anything.
Only edit the center face of the new small timer in the lower-right region, approximately x=760–845, y=1125–1235 in the source coordinate system. Remove only the hourglass drawing and the text “28秒” from the dark circular dial. Fill their exact footprints seamlessly with the same quiet uniform dark brown material already present in that dial. The result must be an entirely blank dark-brown dial center, without text or symbols.
Strict invariants: preserve this timer's gold circular ring, lower-left cloud ornament, warm halo, original position, exact size, shape, lighting, and every existing edge outside the dial center. Preserve the entire rest of the page unchanged, including popup, portraits, labels, cards, all text, borders, and scene. Do not add tick marks, a diamond, jewel, new center symbol, scale, highlight, light effect, or texture pattern. Do not generate a standalone redesigned timer. This is a surgical removal of the hourglass and countdown lettering from the existing dial center only.

## Handling

Save the raw generated result unchanged. The root agent will composite only the cleaned dial-center ROI, retaining the exact original timer ring and ornament pixels from the input candidate. Do not edit code, browser content, or final mockups.

## Result inspection

The output is 941 × 1672. The dial center has no visible hourglass or countdown text; it contains only continuous quiet dark-brown shading. No jewel, new symbol, or new lighting effect was added. The gold ring, existing perimeter marks, lower-left cloud ornament, glow, size, and location appear retained without a visible structural redesign. Generative editing is not assumed pixel exact; keep the input candidate's ring and ornament pixels as instructed and composite only the cleaned center around x=760–845, y=1125–1235. The page elsewhere is visually similar only and was not accepted as unchanged pixels. The raw result was copied unchanged, with no resizing, recoloring, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-b8a49472-d286-4cce-8a09-ec4ec1cca372.png`.
