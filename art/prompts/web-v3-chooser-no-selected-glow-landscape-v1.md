# Web v3 landscape chooser — remove disabled-card selection glow candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`).

Edit target: `art/mockups/web-v3/11-chooser.png` (1672 × 941).

Raw candidate destination: `art/source/web-v3/chooser-no-selected-glow-landscape-v1-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: the selected landscape Enchanted Teahouse chooser-modal screenshot; one tiny semantic correction to a disabled card's exterior effect.
Input image 1 is the edit target and the strict source of truth. Preserve the complete 1672 × 941 frame and exact aspect ratio, with no crop, zoom, reflow, redesign, or composition change.
Only edit: remove the orange-gold selected-card glow around the outer edge of the first disabled local hand card at the bottom left of the hand, partly hidden behind the chooser modal. It is the local hand card showing number 5 and a teal leaf. Erase only its exterior orange-gold luminous selection halo and its radiating light. Replace that thin exterior glow footprint with the immediately surrounding matching dimmed dark lacquer table/background, and preserve the existing ordinary card border and normal physical shadow.
Strict invariants: keep this card's original numeral 5, teal leaf symbol, paper edge, texture, size, position, angle, occlusion, and dimmed disabled appearance absolutely unchanged. Keep the full chooser popup, four trump-choice cards, every character and line of text, other local hand cards, avatars, timer, buttons, table, lacquer decoration, scene, dimming, and lighting unchanged. Do not remove the card itself, redraw its face, shift its edge, add another effect, brighten the disabled hand, or change any content. This is only an exterior selected-glow removal candidate; do not redraw the page.

## Handling

Preserve the raw generated candidate unchanged. The root agent will extract only the exterior glow ROI and composite it into the authored source. Do not replace the selected chooser mockup, runtime assets, code, or browser content.

## Result inspection

The raw candidate is 1672 × 941. The orange-gold selected halo around the exposed first local hand card is visibly absent; the 5, teal leaf, paper, disabled dimming, and occlusion remain. The chooser modal, four trump-choice cards, timer, and scene layout are visually retained. This is not whole-page acceptance: generative editing makes subtle texture and edge changes outside the requested effect. Use an exterior-only mask in a conservative enclosing ROI x=528, y=690, width=176, height=207; exclude every original paper/card pixel, the adjacent second card, and the chooser border. The left exterior band and bottom exterior band contain the clearest effect removal. Do not composite a full rectangle, and do not include y<690 because it can alter the chooser's lower gold border. Preserve the authored card edge rather than adopting the candidate's subtly regenerated edge. Candidate is copied unchanged with no resize, recolor, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-2059afe5-de31-4f8e-8fbf-8b6ee8d2f8fe.png`.
