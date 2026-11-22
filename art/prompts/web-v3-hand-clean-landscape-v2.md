# Web v3 landscape gameplay — clean local-hand workplate candidate v2

Mode: built-in ImageGen edit (`precise-object-edit`).

Edit target: `art/mockups/web-v3/05-gameplay-final.png` (1672 × 941).

Raw candidate destination: `art/source/web-v3/hand-clean-landscape-v2-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: selected landscape Enchanted Teahouse gameplay screenshot, made into a clean local-hand compositing workplate.
Input image 1 is the strict edit target. Keep the full 1672 × 941 frame and exact aspect ratio, with no crop, zoom, reflow, restyle, or layout change.
Primary edit: completely erase only the four large local-player hand cards at the bottom center, identified as LEAF 5, MOUNTAIN 8, KNOT 2, and SUN 6. Also erase every gold selection halo and sparkle surrounding the first local hand card, and every cast shadow belonging to these four local hand cards. Fill the removed objects' entire footprint with continuous authentic matching dark lacquer table and table-rim texture from the immediate surroundings. The permitted edit area is approximately x=520 through 1155, y=654 through 902 in the original 1672 × 941 coordinate system. The clean result must contain no residual card lettering, number, suit symbol, rectangular edge, card corner, selection glow, halo, sparkle, or card shadow. Reconstruct the desk material naturally, carrying its existing curved edge and grain through the cleared area without introducing a new object or panel.
Strict invariants: do not touch the local player's “青竹客” portrait or name plaque; do not change the central played-card group with numbers 7, 3, 1, and 9; preserve the right-side timer, confirm button, every visible word, character, panel, score, avatar, scene element, and all original geometry outside the local-hand footprint. Preserve the art style, lighting, warm palette, scene detail, and camera position exactly. Do not move any UI to fill the gap. Do not introduce a blank rectangle, blur patch, repeated pattern, altered table scale, new icon, or text. This is a surgical removal of the four local hand cards and their effects only.

## Handling

Preserve the raw generated candidate unchanged. This is a workplate for accurate card-geometry compositing; it must not replace the full runtime screenshot or the selected source. The main thread will inspect and composite only the necessary local region.

## Result inspection

The 1672 × 941 raw candidate removes all four bottom hand cards and the first card's selection halo, with no visible residual numeral, suit, card rectangle, card corner, glow, or card shadow in the cleared band. The red lacquer tabletop, floral lacquer detail, curved gold table edge, and dark front apron continue across that area. The local portrait and name, central 7/3/1/9 cards, timer, confirm button, and surrounding composition are visually retained. Generative editing is not pixel-preserving: subtle texture changes exist across the image, so the main thread must extract only the required bottom-hand region and preserve the original scene elsewhere. The candidate was copied unchanged with no resizing, recoloring, or other postprocessing. No runtime asset was replaced.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-c899bf19-db82-464b-b431-b09509c86f56.png`.
