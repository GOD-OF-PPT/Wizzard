# Design QA — Enchanted Teahouse Interaction Prototype

## Comparison target

- Source visual truth:
  - `art/mockups/home-screen.png`
  - `art/mockups/friend-room-screen.png`
  - `art/mockups/gameplay-screen.png`
  - `art/mockups/round-results-screen.png`
- Browser-rendered implementation:
  - `art/review/browser/home-implementation.jpg`
  - `art/review/browser/friend-room-implementation.jpg`
  - `art/review/browser/gameplay-implementation.jpg`
  - `art/review/browser/round-results-implementation.jpg`
- Viewport: `1672 × 941`, landscape.
- States: neutral home, neutral friend room, round 4 gameplay before selection, round 4 results.

## Evidence

Full-view source/implementation pairs, left to right at the same crop and viewport:

- `art/review/browser/home-comparison.png`
- `art/review/browser/friend-room-comparison.png`
- `art/review/browser/gameplay-comparison.png`
- `art/review/browser/round-results-comparison.png`

Additional interaction and responsive evidence:

- `art/review/browser/rules-dialog-implementation.jpg`
- `art/review/browser/gameplay-selected-implementation.jpg`
- `art/review/browser/gameplay-round-five-implementation.jpg`
- `art/review/browser/portrait-rotate-prompt.jpg`

Focused-region crops were not needed. The implementation uses each selected source raster directly at the source's full `1672 × 941` frame, and the full-view contact sheets retain original resolution, so typography, controls, icons, card edges, and imagery remain readable in the same comparison input. Non-reference interaction states were inspected separately at the same full viewport.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the four reference states preserve their source typography exactly because their visible copy remains inside the approved raster. New rules/settings copy uses Noto Serif SC and Noto Sans SC, matching the art guide; no clipped or awkward wrapping was observed.
- Spacing and layout rhythm: the four source states retain their original alignment, density, margins, and clear central playfield. Percentage-based hotspots follow the stage rather than the viewport.
- Colors and visual tokens: source palette and lighting are unchanged. New overlays reuse the supplied red, navy, parchment, and antique-gold runtime panels without generic placeholder styling.
- Image quality and asset fidelity: all visible reference imagery comes from approved project PNGs. Runtime feedback uses the supplied `selected-halo`, panel, plaque, and scroll assets. No inline SVG, emoji, CSS illustration, or generic image placeholder is used.
- Copy and content: semantic headings and button names match the visible Chinese controls. The rules summary matches the documented friends-only, 3–6 player, eight-round quick mode.
- Icons: all visible source icons remain in the approved raster; new overlay controls use supplied raster chrome.
- States and interactions: rules/settings opens and closes; invitation produces feedback; room start enters gameplay; selecting `山 1` sets `aria-pressed`; play advances to results; continue advances to round 5.
- Accessibility and responsiveness: headings, buttons, dialog naming, status messages, reduced-motion handling, and keyboard focus indicators are present. In portrait orientation the underlying game controls are hidden and only the rotate-device prompt remains exposed.

Known source limitation, accepted for this visual-validation harness: the round 4 gameplay mockup shows eight hand cards, which does not match the quick-mode rule of four cards in round 4. Only four card controls are exposed in round 4 (and five after continuing to round 5); the extra visible cards are inert pixels in the static reference. The rule document and pure TypeScript engine remain the behavior truth; the future Cocos runtime must render dynamic card counts from the engine rather than copy the mock data.

## Comparison history

1. Initial comparison found a P2 fidelity issue: the CSS stage used mathematical `16:9`, while the generated source frames are `1672 × 941`, causing a half-pixel vertical resample. Fix: stage sizing was aligned to the source ratio (`177.6833vh` / `56.2804vw`) while remaining effectively 16:9. Post-fix evidence: all four comparison files above.
2. Initial friend-room evidence was captured after clicking Invite, so its focus outline represented a different state from the neutral source. Fix: the room was re-entered and recaptured before any room action. Post-fix evidence: `art/review/browser/friend-room-comparison.png`.
3. Responsive review found that the portrait prompt visually covered the game but left underlying controls in the accessibility tree. Fix: portrait media rules now hide the stage, dialog, and notice; the browser DOM snapshot exposes only `请将手机横向旋转`. Post-fix evidence: `art/review/browser/portrait-rotate-prompt.jpg`.

## Browser verification

- Primary interactions tested: rules open/close, create room, invite feedback, start game, select card, play card, show results, continue to round 5.
- Desktop viewport checked: `1672 × 941`.
- Portrait viewport checked: `390 × 844`.
- Browser console warnings/errors checked: none.
- Automated UI tests: 6 passing.
- Full project tests: 40 passing, including 8,000 deterministic complete-match deal simulations across both modes and every supported player count.

## Implementation checklist

- [x] Match the four approved landscape states.
- [x] Complete the main friend-room interaction path.
- [x] Add selected-card and next-round feedback.
- [x] Add rules/settings and invite feedback.
- [x] Verify landscape and portrait behavior.
- [x] Verify browser console, tests, types, production build, and dependency audit.

## Follow-up polish

- P3: replace the static gameplay and result rasters with runtime-composed Cocos nodes after the interaction layout is frozen, preserving this visual target while making every card count, bid, score, and avatar state dynamic.

final result: passed
