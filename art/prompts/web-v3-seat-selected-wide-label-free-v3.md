# Web v3 selected six-seat wide button — label removal candidate v3

Mode: built-in ImageGen edit (`precise-object-edit`)

Edit target: `tmp/entry-calibration/seat-wide-source.png` (160 × 86 pixels).

Requested candidate: `art/source/web-v3/seat-selected-wide-label-free-v3-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: existing raster UI button crop for the Enchanted Teahouse browser game.
Input image 1 is the edit target, not a style reference. It is a 160 × 86 crop of a selected green six-seat button.
Primary request: erase only the central ivory text “6人” and fill its exact former footprint with continuous matching dark green lacquer texture from the immediately surrounding button interior. Leave the center blank, with no replacement lettering, symbol, or ornament.
Composition/framing: keep the entire original crop and exact 160:86 aspect ratio. Preserve its original geometry and positioning. A larger output is acceptable if the full original crop and proportions are preserved.
Invariants: keep the full double gold border, irregular beveled corners, edge glow, all existing subtle green shading, surrounding midnight-blue background, upper-right gold circular badge, and the dark green checkmark inside that badge unchanged. Preserve all existing spacing, edge locations, scale, proportions, palette, lighting, and material character. Make no edits outside the old central “6人” lettering footprint except the minimal local texture blending required to remove the lettering cleanly.
Avoid: new text; altered checkmark or circle; missing border; redesigned shape; changed background; new icon; new highlights; shifted geometry; recentering; crop; transparency; global color correction; watermark. This is a surgical text removal, not a redesign.

## Handling

Preserve the raw generated candidate without independent color correction or other postprocessing. This candidate is not yet the final runtime texture; the main thread will compose only its cleaned text region back into the source crop to retain exact authored border pixels.

## Result inspection

The built-in ImageGen output was saved unchanged as the requested candidate. The center lettering is removed and the green interior continues through it. The output remains a wide button with the surrounding midnight-blue field, gold edge glow, border, and upper-right check badge. Exact pixels outside the lettering were not preserved by generative editing: the outer edge glow and partial right-edge gold arcs differ subtly. Use only the central cleaned lettering region when compositing into the original 160 × 86 crop, as planned; do not replace the entire authored button with this candidate.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-3087ff71-1f14-4e21-8cc1-2b708ab30e0f.png`.
