# Landscape selected-card animation endpoint — ImageGen raw candidate

Built-in ImageGen edit. Immutable target: `art/mockups/web-v3/05-gameplay-final.png`. Raw output: `art/source/web-v3/selection-complete-landscape-v1.png`, 1672 × 941.

## Exact prompt

Use case: precise-object-edit. Asset: exact UI animation completed-frame mockup. Image1 is the exact edit target at1672×941, not merely inspiration. Make only a small geometric change in bottom local hand area x525..1140 y650..900. The first green-leaf card with numeral5 is selected: eliminate its original slight counterclockwise tilt, render its whole ivory card exactly upright at zero degrees, with perfectly vertical left/right edges and perfectly horizontal top/bottom edges. Target card rectangle x545..685 y658..867, centered x615 unchanged. It should be raised12px relative to the other hand cards, whose ordinary top edges stay at abouty670. Preserve card's size, ivory paper, teal corners, black numeral5, large teal leaf symbol exactly. Its gold selected glow follows this upright rectangle, with halo optical center8px below card center; do not let glow reach HUD above. Shift each of the other three hand cards (blue mountain8, red knot2, amber sun6) right9px only, keep their size/art/symbol/numeral and original rotation. Preserve exact canvas1672×941, every other pixel including background, center trick, timer28秒, confirm button确认出牌, avatars, score/name plaques and all text. This is an animation-endpoint geometry correction, not a redesign. Strong invariants: selected first card MUST be perfectly upright with no tilt, card topy658 and bottomy867. No new artwork, no changed color, no new symbols, no different typography, no caption, no dimming, no canvas border, no watermark.

## Inspection and unresolved differences

- Canvas is exactly 1672 × 941. The selected leaf5 is visibly upright; its edges are parallel to the image axes, and the numeral and leaf remain readable.
- The selected card body appears approximately x542–681 / y665–865; the outer bright halo is approximately x535–686 / y659–871. These are visual estimates, not contour-ground-truth measurements.
- This is **not an accepted pixel-accurate endpoint**: the card body is about 7px lower and 4px left of the requested body rectangle x545–685 / y658–867. Relative lift from adjacent card upper edges appears about 8px rather than a verified 12px. The halo's 8px downward optical offset and exact +9px neighbor translations are unverified.
- The green leaf symbol changed slightly in its internal stroke shape, despite the preservation instruction. All four card illustrations/paper textures received small regeneration changes. Numeral5 remains close in apparent size but is not established as identical.
- The independent output's other text, portraits, center cards, timer and button retain the same visible composition, but raw pixel invariance failed: outside proposed hand ROI x520 y650 w630 h250, 1,387,634 pixels differ. Inside, 156,138 differ. Whole-image RGB mean absolute channel difference is 6.1196163774; maximum channel difference255.
- A possible local-composition ROI is `{ "x": 520, "y": 650, "width": 630, "height": 250 }`, covering old/new hand positions and glow. Do not integrate this ROI as approved without correcting the listed geometry/art differences; do not overwrite the immutable full source.

Generated source: `C:/Users/KSG/.codex/generated_images/01a156e3-52ca-7313-ac21-bb63fb0dc002/exec-d127ca26-b04f-48c7-9193-0ce25361c823.png`.
