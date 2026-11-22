# Web v3 tall selected seat button — label-free candidate v3

Mode: built-in ImageGen edit.

Edit target: `tmp/entry-calibration/seat-tall-source.png` (170 × 120 pixels).

Candidate destination: `art/source/web-v3/seat-selected-tall-label-free-v3-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: original raster UI asset; tall selected seat-count button for the Enchanted Teahouse Web create-room dialog.
Input images: Image 1 is the edit target and the sole visual source of truth.
Primary request: remove only the central white Chinese label “6人”. Reconstruct the small area under those glyphs using a seamless continuation of the immediately adjacent deep emerald-green painted/lacquer texture, leaving the label area empty.
Composition/framing: preserve the complete supplied crop and its exact 170:120 aspect ratio; it may be produced at a proportionally larger resolution. Keep every object in the same relative position and size.
Constraints: change only the pixels belonging to the central “6人” label and the tiny antialiased fringe needed to remove it. Preserve the ornate pale-gold rounded rectangular border, its corner shape and double-line structure, all luminous edge glow, the upper-right circular pale-gold badge with its dark green check mark, the dark midnight-blue outer background, and the narrow reddish-brown/gold vertical strip at the far right edge. Preserve the original green color, subtle texture, illumination, contrast, and every border margin. No recoloring, sharpening, redesign, cropping, new elements, extra lettering, or watermarks. The result must be an empty selected button that is structurally identical to the edit target.
Avoid: moving the check mark or border; changing the check mark's shape; changing green hue or brightness; smoothing away the texture; flattening the glow; making a transparent background; replacing the outer crop; adding any text.

## Preservation note

This file records the original ImageGen request. Save the unmodified generated result as the candidate; do not apply color or tone adjustments. Final integration can reuse only the cleaned label ROI over the original crop so border pixels stay exact.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-3a2c09b4-3bdd-452c-8160-d62c2a6e803f.png`.
- Copied unchanged to the candidate destination above.
- Visual inspection: central label removed; green fill, gold border, selected check badge, midnight-blue surround, and right reddish-brown strip retained. The generative output is a structural match, not a pixel-preserving edit; integrate only the cleaned label ROI into the original crop.
