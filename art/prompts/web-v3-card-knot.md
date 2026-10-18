# Web v3 card: vermilion knot

Built-in ImageGen precise-object-edit. First reference/edit target: `art/reference/web-v3/card-knot-reference.png`; supporting gameplay style reference: `art/mockups/web-v3/05-gameplay-final.png`.

## Prompt

Single independent card front, perfectly upright front-on orthographic, no rotation/perspective. Exact2:3 silhouette,512×768 or higher equal ratio. Cream rice-paper face, thin warm beige layered edge, softly rounded corners, about2% transparent exterior margins.

Preserve original four small red geometric angular Chinese meander corner ornaments. Preserve central vermilion Chinese-knot silhouette: symmetric linked four-loop knot, diamond crossing middle, round horizontal side loops, upright pointed oval/diamond upper loop, two descending vertical pointed-diamond/teardrop forms in lower structure. Match ribbon thickness, negative space, angular over-under composition and modest size. Flat printed vermilion, not realistic rope or tassel. No invented loops, flowers or symbols.

Remove black numeral2 at upper-left and fill with matching clean cream paper. No numerals/letters/text in any corner or anywhere else. Keep red corner ornaments. No table, hand, scene, exterior shadow, extra card/object or extra border ornament. True transparency outside rounded rectangular card; cream paper opaque. Preserve generated alpha.

## Delivery inspection

Generated1024×1536 RGBA; alpha≥50% body957×1414+34+61. Only transparent-canvas crop996×1494+14+21 then proportional resize1024×1536, maintaining2:3 canvas. No drawing, vector substitute, perspective transform, alpha repaint or nonuniform stretching.

Saved `art/runtime/web-v3/cards/knot-v1.png`,1024×1536 RGBA. Exterior corners alpha0, paper near-opaque generated alpha retained. Upright front face, no numerals/text, four red meander corners, red central four-loop Chinese knot and lower pointed drop. Source reference is small; this is a generated faithful visual reconstruction rather than pixel-identical tracing.

Final alpha≥50% body bounds: `983×1453+21+41` (left/right about2%, top/bottom about2.7%).

## V2 targeted fidelity repair

Built-in ImageGen precise-object-edit. First image/edit target `cards/knot-v1.png`, second image/original style reference `card-knot-reference.png`. Change ONLY two things: (1) remove ALL continuous gold/beige rectangular surface-frame strokes, both nested outlines; replace with matching uninterrupted cream paper, retain only thin physical warm card edge; (2) shrink each of four red corner meander ornaments to exactly12% of card width, maximum13% (about118px for983px card), preserving ornament shape and tucking close to physical corners about3% inset. Preserve central red knot shape/size/position/color, paper texture/color, upright2:3 silhouette, rounded corners and generated alpha. No numeral/text/new ornament. Do not redraw central symbol. Exterior genuinely transparent.

V2 output copied directly without raster processing: `art/runtime/web-v3/cards/knot-v2.png`,1024×1536 RGBA. Alpha≥50% card bounds `987×1457+19+39`. Red mask measurement (r>1.5g,r>1.5b,r>0.4), in250×250 corner windows: TL99×103,TR99×104,BL98×103,BR98×103. Maximum corner ornament width99/987=10.03%, below13% limit (generated smaller than12% target). Visual inspection confirms no continuous surface rectangular frame; only thin physical warm edge remains. Central knot retained by edit, without claim of pixel-identical texture. V1 preserved.
