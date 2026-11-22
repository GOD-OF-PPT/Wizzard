# Card v5 portrait leaf: remove rank numeral only

Mode: built-in ImageGen precise local edit; preserve existing alpha.

Edit target: `art/source/web-v3/cards-v5/portrait-leaf-reference.png` (560 × 840 RGBA).

Candidate destination: `art/source/web-v3/cards-v5/portrait-leaf-rank-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: original Enchanted Teahouse leaf card, rank-free local cleanup candidate.
Input images: Image 1 is the sole edit target and exact source of truth: an existing 560 × 840 RGBA 2:3 card crop mechanically extracted from the selected page.
Primary request: remove only the black numeral “5” in the upper-left of this card. The numeral ROI is approximately x=103,y=110,width=113,height=175 in original 560 × 840 coordinates. Reconstruct only the numeral's ink and antialias fringe as continuous matching warm ivory paper texture, leaving that former rank area blank. Maintain the original subtle paper grain, illumination and warm color.
Composition/framing: preserve the exact 2:3 image composition, full card crop, original card position, scale, angle and alpha outline. Prefer exact 560 × 840 output; do not crop, zoom, recenter or move anything.
Constraints: change only the black 5. Preserve the large teal leaf symbol pixel appearance, every leaf tip and fine vein, all teal corner patterns, paper edges, warm-gold fine outer frame, ordinary shadow, paper texture and original color elsewhere. Do not regenerate, shift, simplify, recolor or restyle the card. Preserve the existing truly transparent background and antialiased card silhouette. No new rank, letter, word, symbol, watermark or decoration.
Avoid: damaging or moving the upper leaf tip; editing top-left corner ornament; erasing paper texture; smoothing or bleaching the paper; changing contrast or color; changing border width, shadow or card dimensions; painting an opaque background; introducing a patch seam or new numeral.

## Integration contract

Save original generated result without post-processing. Root-thread integration will copy only the cleaned numeral ROI onto the mechanically extracted exact reference. Preserve all original reference pixels outside that ROI. Do not edit final assets, runtime resources, code or browser.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-794d00a1-ef6d-4b43-992a-f606bdafe604.png`.
- Copied unchanged to the requested candidate destination.
- Actual size: 1024 × 1536, exact 2:3 aspect ratio. Pixel format RGBA (`Format32bppArgb`); alpha min 0 / max 253, 97,233 alpha-zero pixels, 1,475,631 partial-alpha pixels, all four corners alpha 0. Actual transparency is present, but opacity distribution is not a preservation guarantee for the source.
- Visual inspection: black 5 is fully removed; former numeral region has continuous ivory paper fill. Upper leaf tip and top-left corner ornament remain intact in shape and separation. No replacement rank or new glyph was added.
- The original numeral ROI (103,110,113,175) maps proportionally to approximately (188,201,207,320) in this candidate. Root integration should align by source coordinates and use only the necessary numeral cleanup area.
- Generative differences outside the numeral region: the original orange luminous outer border was softened/changed, and the card/background silhouette is not pixel-identical. Do not use the whole generated card. Keep the mechanically extracted reference everywhere outside the numeric ROI as planned.
