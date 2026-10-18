# Number-card v3 source-fidelity correction

Built-in ImageGen `precise-object-edit`, project-bound independent reusable faces. Do not edit any page mockup. Source is immutable `art/mockups/web-v3/05-gameplay-final.png`; existing v2 faces are supporting inputs only, not new design truth.

Four distinct calls, one per leaf/mountain/knot/sun. Intended output 1024×1536, full front-facing 2:3 card, opaque ivory paper, no text/rank/numeral. Consuming component remains CardView with live number. Raw outputs `art/source/web-v3/cards/<suit>-v3.png`; reviewed runtime derivatives are versioned and must not overwrite v2.

```text
Use case: precise-object-edit. Asset: one independent reusable 2:3 parchment number-card face for the supplied Enchanted Teahouse gameplay design. Image1 is the selected full-page design and visual truth; image2 is the existing reusable face to correct, NOT a new design source. Output a single front-on rectangular card face, 1024x1536, tightly fills the image, no scene, perspective, shadow or external background.
Preserve the source paper's warm ivory, subtle fibers, thin aged-gold edge and modest rounded corners. Preserve the correct central SUIT symbol and its exact source anatomy, relative size and position; do not invent a mascot, new logo, extra frame or ornaments. The source has four clearly readable, substantial angular cloud/meander corner marks. Existing v2 corners look too small and delicate in the browser. Match the source's bold corner geometry; each corner occupies approximately14–15% of card width, inset about5%, with the corresponding mirrored orientations. Do not add a continuous colored border or a second frame.
Keep the upper-left live-rank band open beside and below its corner, no numeral, letter, Chinese text, suit label or watermark anywhere. The central symbol should not enter this rank-safe band. Match the source, not a generic playing-card template. Avoid losing the handmade paper/painterly quality to a flat vector aesthetic.
SUIT and color are specified per call: green leaf / deep-blue mountain / red knot / warm-ochre sun. All other geometry and material stay consistent.
```

Acceptance: compare generated face and the corresponding source card at the actual authored display scale. Reject a visually unrelated central symbol, tiny corners, continuous colored frame, baked rank, large outside padding, or missing paper. Source screenshots and production scene must not be changed to fit a bad face. Chrome re-capture remains required after any runtime adoption.

## Targeted leaf retry

Edit `leaf-v3.png` only: scale the four corner marks to70% of their current dimensions, keeping outer anchors, central leaf, paper and edge unchanged. Save sibling `leaf-v3-retry.png`; no further retry. Actual result undershot to12.3–12.7% width and moved anchors; not adopted.

## Targeted knot retry

Primary reference is the closer `art/reference/web-v3/cards/knot-source-hand-v1.png`; v3 is secondary. Reduce corner marks to75–80% of current size, target15–16% width, and follow source's slimmer loop stroke/anatomy. Do not copy rank2, tilt or scene. Preserve the rest, save `knot-v3-retry.png`. Actual corner width12.7% and central symbol smaller; not adopted.

## Sun closer reference

Sun uses `art/reference/web-v3/cards/sun-source-hand-v1.png` as closer art anchor alongside full source and v2. Preserve original eight-ray sun and paper; corner target15–16%, blank rank, front-on opaque1024×1536. First result had extra edge lines, corrected in one targeted retry. Final candidate still has larger sun and12.2%-width corners; not adopted. Actual Sun prompt provenance is recorded separately in `web-v3-sun-v3-actual-prompts.md`.

All six raw candidates remain in `art/source/web-v3/cards/`; original page designs and currently consumedv2 faces remain unchanged. Detailed comparison: `docs/25-web-v3-gameplay-source-fidelity.md`.
