# Web v3 landscape ranking secondary action — return-to-results lettering v1

Mode: built-in ImageGen edit (`text-localization`). Source-art crop only, no implementation screenshot.

Edit target: `art/source/web-v3/results-source-v1/landscape-ranking-secondary-reference-v1.png`.
Raw candidate: `art/source/web-v3/results-source-v1/landscape-ranking-return-results-candidate-v1.png`.

## Full prompt

Use case: text-localization.
Asset type: an original Enchanted Teahouse parchment secondary-action button from the landscape ranking page; only the action lettering changes.
Input image1 is the sole strict edit target. Preserve the complete original crop, its exact width/height proportion, authored paper button silhouette, paper tint and texture, corner decoration, both side diamond-shaped gold ornaments, layered border, original shadow, and background as faithfully as possible. Do not crop, zoom, recenter, move, stretch, restyle, or redesign the button.
Only replace the existing four-character Chinese label “返回首页” with the exact new four-character label “返回结算”. Render all four correct characters fully and clearly in the same original dark reddish-brown handwritten brush style, original font size, ink weight, spacing, centered horizontal position, and optical baseline. The replacement must say exactly 返回结算, not 返回首页, 返回结束, 返回结果, or any other wording. Keep the text wholly inside the original content-safe area and do not touch either side diamond ornament. Restore the tiny former strokes/shadows to matching original paper only where necessary before rendering the new wording.
Strict invariants: keep paper material, reflections, decorative pattern, both diamond gold accents, complete border and silhouette, size/proportion, background, shadow, and every other detail unchanged. Do not add icons, new ornaments, framing, a backing panel, glow, extra margins, transparency, new text, or changed lighting. Do not redraw a generic button. This is a surgical text substitution on the exact source button only.
Return the original crop size if possible; if the output is larger, preserve the exact complete source-crop aspect ratio and avoid extra top/bottom margins. Keep the source's opaque backgroundRGB, not a transparent cutout.

## Handling

Save raw ImageGen output unchanged. Main will extract only the newly generated lettering after registration and retain the source button's exact original RGB, shape, border, ornaments, and shadow. No whole-button replacement. Do not resample, crop, recolor, postprocess, or edit code, canonical designs, runtime assets, browser, or original reference art.

## Single-output inspection

The generated button clearly reads the complete correct“返回结算”, with handwritten dark ink and four centered characters. Both gold diamond ornaments remain recognizable, and no new text/icon appears. The local reading check passes, while full-button fidelity is unproven and visibly imperfect.

Actual source dimensions369×101; raw generated dimensions2172×724, opaque24-bitRGB. The generated crop has additional white top/bottom margins and a different full-canvas aspect ratio. Atx5, the source-like paper-background band measures y66–656 inclusive, spanning the full width. The visible button itself is approximately x32–2166,y96–633. Dark lettering footprint within the isolated content region measures x576–1609,y242–503 inclusive (1034×262); a small padded extraction region isx570,y236,w1046,h274 pending registration. The lettering appears somewhat larger/heavier relative to the panel than the source, and the paper tint, pattern, rim highlights/thickness, shadow, and diamond contours are subtly regenerated. Main should extract only dark lettering after appropriate size/baseline registration; preserve all exact original paper, decorations, frame, shadow, and backgroundRGB. Candidate is not a whole-button replacement. Raw output is copied unchanged, with no resampling, cropping, recoloring, or other postprocessing. No code, formal design, browser, or runtime resources were changed.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-0aa48618-bebf-4039-a656-537187653228.png`.
