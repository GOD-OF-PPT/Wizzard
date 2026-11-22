# Web v3 central trick landscape — opaque rank paper patch v1

Mode: built-in ImageGen edit (`precise-object-edit`), explicitly `transparent_background:false`.

Edit target: `art/source/web-v3/trick-faces-v1/landscape-rank-paper-reference.png` (115×175 RGB source crop containing only black7 and original quiet ivory paper).
Raw candidate: `art/source/web-v3/trick-faces-v1/landscape-rank-paper-clean-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: small completely opaque original card-paper texture patch for bounded numeral cleanup, not an isolated card and not a transparent cutout.
Input image1 is the sole strict edit target. It is a115×175 RGB close crop containing the black numeral7 and the warm ivory paper immediately around it, with no emblem, colored corner, border, or alpha. Retain exactly this crop's original warm ivory/beige tone, quiet low-contrast paper grain, source softness, lighting, and full rectangular composition. Larger output is acceptable at the same115:175 aspect ratio, with no recentering, border, margin, cutout, or new object.
Remove only the black7 and every part of its cast shadow/edge halo. Fill the entire former numeral shape seamlessly with continuous matching original warm ivory paper, as if no ink was ever printed there. The complete output must be ordinary uninterrupted original paper. No dark7 fragment, pale7 ghost, numeral-shaped shadow/highlight, embossing, indent, line, marking, symbol, or watermark may remain. Do not substitute a lighter7; erase its form completely.
Keep the paper quiet and nearly uniform at the same warm source tone, with only the subtle existing paper grain. No strong mottling, broad cloudy stains, added watercolor patches, heavy fibers, new gradient, vignette, lighting effect, texture seams, or artificially smoother rectangle. The paper must cover every pixel edge-to-edge. Absolutely no transparent or semitransparent internal or external areas; all pixels completely opaque with alpha255 if an alpha channel exists. Do not remove the paper background. No checkerboard, black/white cutout backdrop, new margins, frame, card silhouette, or decorative objects. This is an opaque paper-only edit of the original rank crop, not a new background design.

## Handling

Save the raw generated image unchanged. Root will register the quiet paper patch to each source boundary tone and use it only within four bounded numeralROIs, retaining all source emblems and exact geometry. Do not postprocess, resize, crop, recolor, clean alpha, or edit code/browser/runtime/canonical art. The four earlier full-face candidates remain retained as generation provenance, not replaced.

## Result inspection

The generated patch is entirely warm ivory paper edge-to-edge. The7 and its shadow are completely absent, without an apparent pale7, embossed numeral, numeral-shaped stain, new marking, or frame. The grain is fine and low contrast, though it is generated texture rather than exact recovered source pixels; main should still inspect the registered local tone match.

Actual output is1017×1546, approximately the115:175 source aspect but not exact source dimensions. Pixel format is `Format24bppRgb`; measured effective alpha is255 at every pixel, with zero transparent and zero semitransparent pixels. This satisfies the opaque-paper requirement and avoids the earlier full-face candidates' global semitransparency. A16px-grid RGB sample mean is approximately[240.95,213.8,166.5]; this is diagnostic only, not a color-matching claim. No crop, resize, alpha adjustment, recolor, or other postprocessing was applied. Earlier four raw full-face candidates remain saved unchanged and their alpha/geometry deviations are individually documented.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-da37faf4-487f-4019-a9b4-aa93210a9240.png`.
