# Design QA — 奇术茶馆动态牌局

## Comparison target

- Source visual truth:
  - `art/mockups/gameplay-screen.png`
  - `art/mockups/round-results-screen.png`
- Browser-rendered implementation:
  - `art/review/browser/gameplay-round-four-final.png`
  - `art/review/browser/round-results-final.png`
- Desktop viewport: `1600 × 900`, landscape.
- Responsive viewport: `844 × 390`, landscape phone.
- States: quick-mode round 4 human turn; round 4 scoring overlay.

The gameplay mockup is visual guidance rather than valid quick-mode data: it shows eight hand cards in round 4. The implementation deliberately follows the rules engine and renders the actual dynamic hand count, bids, plays, dealer, trump, timer, and scores.

## Evidence

Full-view source and implementation are combined into the same comparison images:

- `art/review/browser/gameplay-comparison.png`
- `art/review/browser/round-results-comparison.png`

Focused comparisons used to inspect HUD typography, avatar treatment, score rows, parchment surfaces, and action controls:

- `art/review/browser/gameplay-comparison-focus.png`
- `art/review/browser/round-results-comparison-focus.png`

Additional responsive and interaction evidence:

- `art/review/browser/gameplay-trump-final.png`
- `art/review/browser/gameplay-final.png`
- `art/review/browser/gameplay-bid-mobile-landscape.png`
- `art/review/browser/round-results-mobile-landscape.png`
- `art/review/browser/portrait-rotate-prompt.jpg`

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: display text uses Noto Serif SC and compact interface text uses Noto Sans SC. Round, trump, timer, bid, score, and action hierarchy remains readable at desktop and the checked landscape-phone breakpoint. The source uses more hand-brushed lettering in places; the current font choice is an acceptable production-safe approximation.
- Spacing and layout rhythm: the runtime preserves the clear lacquer-table playfield, six-seat perimeter, centered trick, bottom hand fan, and right-side turn action. The local viewer is rotated into the intended bottom-left seat and 3–6 player slot maps no longer depend directly on server seat zero.
- Colors and visual tokens: lacquer red, navy, parchment, antique gold, green status, positive red, and negative blue all map to the approved art direction. State feedback remains visible without flattening the table lighting.
- Image quality and asset fidelity: avatars, cards, card back, table, halos, countdown ring, plaques, panels, score scroll, and action controls use the approved runtime PNGs. The score scroll uses the documented nine-slice asset. No inline SVG, emoji, CSS illustration, generic placeholder, or text-symbol control remains in the live match UI.
- Copy and content: phase instructions, trump state, local/remote turn wording, bids, trick counts, scoring, 30-second limit, and timeout delegation are state-driven and consistent with the documented rules.
- Icons and card legibility: number-card corners inherit suit color; special cards no longer receive intrusive `至/虚` overlays; trump choices retain visible suit artwork with asset-backed labels.
- States and interactions: trump choice, sequential AI bidding, human bid, legal/illegal hand states, selected card, authoritative play intent, trick result, round score, next round, dealer rotation, restart, and 30-second local timeout delegation were exercised in the browser.
- Accessibility: blocking panels expose dialog semantics and receive initial focus; underlying hand controls are disabled outside the legal local turn; status/timer labels are semantic; focus remains visible through asset-shaped glow; non-essential motion respects `prefers-reduced-motion`.
- Responsiveness: at `844 × 390`, bid and score panels remain inside the viewport with no body overflow (`844 × 390` scroll dimensions), all primary actions remain visible, and the portrait rotate prompt remains the intended fallback.

## Comparison history

1. P1 — the first dynamic results implementation used the dark red primary panel with small, low-contrast rows. Fix: rebuilt it with the parchment `score-ribbon` nine-slice, avatar rows, larger typography, semantic positive/negative score colors, and asset-backed footer actions. Post-fix evidence: `round-results-final.png` and both result comparison images.
2. P1 — short landscape phones could overflow fixed-aspect bid/results panels. Fix: removed minimum button widths, added a short-landscape layout, compacted score rows only at that breakpoint, and verified `844 × 390` with no document overflow. Post-fix evidence: `gameplay-bid-mobile-landscape.png` and `round-results-mobile-landscape.png`.
3. P1 — status pills, bid controls, and a return button were code-drawn substitutes. Fix: replaced them with `small-plaque`, `green-status`, `secondary-panel`, and other approved runtime assets. Post-fix evidence: latest gameplay and results screenshots.
4. P2 — blocking states lacked dialog/focus semantics and hand buttons remained reachable outside play. Fix: added modal semantics and initial focus, and disabled cards whenever the local player cannot legally act. Post-fix DOM inspection exposed only the active dialog controls as enabled actions.
5. P2 — pending trump displayed as “无王牌”, bidding showed “等待领出”, special cards had intrusive corner glyphs, and match animations were absent from reduced-motion handling. Fix: corrected phase copy, limited the empty-trick hint to play, removed special-card corner text, added suit-colored number corners, and extended reduced-motion rules.
6. P2 — the results table remained materially smaller than the approved source after the first parchment pass. Fix: increased desktop row height, avatar scale, and score typography while retaining a compact phone override. Post-fix evidence: `round-results-comparison-focus.png`.

## Browser verification

- Primary path tested: home → practice → trump selection → AI bids → human bid → multiple tricks → round results → continue through round 4.
- Desktop checked at `1600 × 900`.
- Landscape phone checked at `844 × 390`.
- Browser console checked after a clean reload: no new errors.
- Dynamic round 4 and round 4 results captured at the same viewport as their comparisons.
- `npm run typecheck`, all 41 tests, and the production Vite build passed after the final visual changes.

## Follow-up polish

- P3: the approved results mockup includes a separate “查看总榜” action; the current round table already exposes total scores, so this secondary view is deferred until the multiplayer room flow defines whether it needs a distinct ranking mode.
- P3: the static gameplay mockup intentionally overstates hand and table-card density. The implementation keeps rules-correct dynamic counts rather than reproducing that invalid sample data.

final result: passed
