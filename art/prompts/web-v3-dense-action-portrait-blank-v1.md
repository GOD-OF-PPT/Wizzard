# Web v3 dense portrait — isolated blank green action plaque candidate v1

Mode: built-in ImageGen edit/extraction (`precise-object-edit` + transparent cutout).

Full-page edit target and exact artwork source: `art/source/web-v3/dense-hand-portrait-idle-v2-candidate.png`.

Source region: approximately x=276–665, y=1070–1172, including the authored left cloud ornament. The page is a design candidate, not an implementation screenshot.

Raw asset candidate: `art/source/web-v3/dense-action-portrait-blank-v1-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: one isolated original green action-plaque raster extracted from the supplied Enchanted Teahouse portrait design.
Input image 1 is the strict full-page artwork source and edit target. Locate the exact long horizontal green action plaque near x=276–665,y=1070–1172, with the muted Chinese “选择手牌” label and its left cloud ornament. Extract ONLY that plaque including its complete original outline, gold rim, ornamental corners, and left cloud. Remove all surrounding portrait scene and interface to genuine RGBA transparency. The rest of the full page is reference context only and must not appear in the isolated output.
Remove ONLY the “选择手牌” lettering from the plaque center and fill the exact former character footprints with seamlessly matching continuous original dark green lacquer texture and subtle shading. The center must be completely blank: no text, symbols, numeral ghosts, icons, embossed characters, glow patch, or extra decoration.
Preserve the plaque's exact authored long proportions, approximately3.8:1 visible silhouette including the original cloud. Preserve its original green and gold colors, layered thin gold border, ornament shapes, left cloud position, corner geometry, original texture, shading, and light. Do not redesign, thicken, round, enlarge, mirror, or move any piece. No extra ornaments, no new shadow, no new halo, no new frame, and no background scene or color. Do not turn it into a generic rounded button.
Output an isolated close-up approximately1560×440 pixels, or a similarly4× enlarged sharp view of the exact source plaque, keeping the full visible silhouette at its approximately3.8:1 ratio. Use tight transparent edges, with only the minimal transparent pixels required to keep the full cloud and gold outline unclipped, no broad empty margins. Preserve all edges with real alpha rather than a checkerboard or flat background. This is an exact source-plaque extraction and local lettering removal, not a new visual design.

## Handling

Keep the raw built-in candidate unchanged, without crop, resize, recolor, background cleanup, or other postprocessing. Do not modify source code, browser state, runtime resources, or canonical mockups. Report true output dimensions, alpha, and visible alpha bounds.

## Result inspection

The single generated output contains only a blank dark-green long plaque with gold border and lower-left cloud ornament. “选择手牌” is fully absent without an apparent character ghost. It has genuine RGBA transparency (`Format32bppArgb`), actual dimensions 2115 × 743, alpha min/max0/255, 640244 completely transparent pixels, and 1569844 pixels below alpha255.

Alpha bounding boxes, inclusive:

- Any nonzero alpha: x55–2090, y7–742. This includes faint stray pixels beyond the visible silhouette.
- Alpha greater than16: x70–2082, y138–619 (2013 ×482).
- Alpha greater than128: x71–2081, y139–618 (2011 ×480, visible ratio≈4.19:1).

The image therefore does not satisfy the requested tight edges or exact3.8:1 visible ratio. It has substantial top/bottom transparent margin plus very faint exterior alpha speckles, and the gold border/cloud geometry is a generative approximation of the source rather than a mechanical extraction. The center is clean and the general style is retained, but do not claim exact source anatomy or adopt it without separate geometry/mask reconciliation. This report does not modify the raw output; no cropping, resizing, alpha cleanup, recoloring, runtime/code/browser/source changes occurred.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-fa55e5a0-5ce4-4e4c-8c00-607cb23c368d.png`.
