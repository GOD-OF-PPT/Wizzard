# Web v3 lobby nickname plaque

Built-in ImageGen, transparent background. References: `art/mockups/web-v3/portrait/04-lobby.png` and `art/mockups/web-v3/04-lobby.png`.

## Prompt

Use case: stylized-concept. Single transparent raster game UI component. Reproduce ONLY the small dark green player nickname plaque directly below the animal avatars, such as below the crane or fox; do not reproduce any screen.

One empty horizontal dark green lacquered wooden nickname nameplate, final visible silhouette about 3.6:1 wide to tall, target 900×250 or similar. Fill canvas nearly fully with narrow transparent margins.

Exactly the reference's soft cloud/petal end silhouette: long quiet central top and bottom bands, rounded stepped shoulders near each corner, broad rounded lobe at each lateral end. Not a plain rounded rectangle or rectangular navigation panel. Fine aged warm gold double rim following scalloped silhouette; small subtle four-petal gold diamond ornaments near left and right tips.

Matte painterly hand-painted Enchanted Teahouse artwork, softly worn antique gold, opaque deep forest green center with restrained brushed lacquer/wood grain and soft warm highlights. Flat front-on orthographic component without perspective. Quiet central interior for dynamic nickname.

One plaque only. No text, letters, numbers, avatar, ready-state pill, checkmark, extra plate, or unrelated icon. No dramatic cloud scrolls or glossy 3D rendering. True transparency outside the silhouette; green interior and gold border fully opaque without holes. Preserve alpha.

## Delivery

Generated source: 1995×788 RGBA. Only transparent canvas crop and proportional resize were performed with ImageMagick; no painting or synthesized vector replacement. Runtime canvas: 900×250 RGBA, retaining generated alpha. Actual opaque body is slightly wider than the requested approximation, about 4.12:1. The generated original remains in the default Codex generated-images directory.

Inspection: alpha ≥ 50% bounds are `874×212+12+19`. Interior sample rectangle `(150,60,600,130)` has alpha 252–254/255, center 253/255. The built-in output therefore has a near-opaque rather than mathematically fully opaque interior. No forced alpha repair was applied. This is an explicit acceptance gap against the strict fully-opaque request; minor edge speckles also remain.
