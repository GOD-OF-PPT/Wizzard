# Portrait gameplay: clean local-hand workplate v2

Mode: built-in ImageGen precise local edit.

Edit target: `art/mockups/web-v3/portrait/05-gameplay-safe-v2.png`, 941 × 1672.

Candidate: `art/source/web-v3/hand-clean-portrait-v2-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: clean raster workplate for exact reconstruction of the original selected portrait gameplay hand.
Input images: Image 1 is the complete selected portrait gameplay page, the edit target and only source of truth.
Primary request: remove only the bottom local player's four hand cards, identified as LEAF 5 / MOUNTAIN 8 / KNOT 2 / SUN 6, and remove every part of the first card's golden selection halo, the four card shadows, and all corresponding card-edge reflections. Rebuild that small cleared area as a seamless continuation of the authentic surrounding dark lacquered table, table rim and floor texture. The edit region is approximately x=118..735,y=1245..1508 in the original 941 × 1672 image. Leave a completely clean quiet material surface with no remaining card glyphs, digits, rectangles, borders, shadows, or gold selection glow.
Composition/framing: preserve exact 941 × 1672 full portrait image and all composition coordinates; do not crop, reframe, zoom, move or resize anything.
Constraints: alter only the bottom local-hand region. Preserve absolutely every other original element, especially the local 青竹客 avatar/nameplate immediately above the hand; central tabletop 7/3/1/9 cards; right-side timer; independent confirm button below the hand around y=1520 and below; all other text, icons, characters, scene objects, decorative details, layout, colors, and textures. Reconstruct material only where the hand and its associated shadows/glow had hidden it. Do not invent any new object, button, border or decoration. The source scene's dark lacquer material must remain continuous and naturally lit.
Text (verbatim): no new text; all text outside removed hand cards remains unchanged.
Avoid: any ghost of a card, numeral, suit symbol, rectangular panel, card-shaped outline, golden halo or cast shadow in the cleared hand zone; editing the local avatar/nameplate; touching the independent confirm button; changing central 7/3/1/9 cards; moving UI or characters; lightening the entire table; new objects; watermark.

## Integration contract

Save raw generated output without color/tonal modification. Preserve the selected original. This candidate is a clean working base only; do not replace the full runtime background with the generated image. Main-thread integration will take only necessary card-area pixels into the exact source.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-147a9910-43da-4be6-bddc-acb627e0b21f.png`.
- Copied unchanged to the candidate destination. Actual resolution: 941 × 1672.
- Visual inspection: all four bottom hand cards, their glyphs, gold selected halo and cast shadows are absent. Cleared region shows continuous curved dark lacquer table aprons, trim and recessed ornament textures; no obvious card-shaped residue remains.
- Local avatar/nameplate, central 7/3/1/9, timer, independent confirm button and whole-page layout remain structurally intact. As a generative edit this is not a proof of unchanged pixels outside the requested area; restrict integration to the hand-removal ROI as planned.
