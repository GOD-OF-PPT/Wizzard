# Card v5 portrait sun: remove rank numeral only

Mode: built-in ImageGen precise local edit; preserve alpha.

Edit target: `art/source/web-v3/cards-v5/portrait-sun-reference.png` (560 × 840 RGBA).

Candidate: `art/source/web-v3/cards-v5/portrait-sun-rank-clean-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: original Enchanted Teahouse ochre-sun card, rank-free local cleanup candidate.
Input images: Image 1 is the sole edit target and exact source of truth: existing 560 × 840 RGBA 2:3 card mechanically extracted from the selected page.
Primary request: completely remove only the black numeral “6” at the upper-left of this card. The original numeral ROI is approximately x=98,y=111,width=116,height=174. Rebuild the numeral ink and antialias fringe as seamless continuous original warm ivory paper grain. That rank area must be blank unlettered paper, without any dark 6, light 6, embossed 6, translucent digit, outline, shadow, numeral-shaped grain or patch seam. Preserve the existing adjacent paper color and illumination.
Composition/framing: exact 2:3 composition, preferably 560 × 840. Preserve the card's complete original location, size, angle and alpha outline. Do not crop, recenter, zoom or move.
Constraints: change only numeral 6. Preserve all ochre sun rays, central circle and ring, corner ornaments, paper edge, original fine border, shadows, color and every other element. Do not shift, redraw, recolor, simplify or resize the sun or its top ray. Preserve actual original transparency on the outer background and existing antialiased edges. Add no new rank, glyph, letter, word, symbol, ornament or watermark.
Avoid: any dark/light/embossed 6 ghost; damage to upper-left corner motif or sun's upper ray; smooth flat paper patch; bleached or recolored paper; modified sun geometry or borders; changed edge/shadow/silhouette; opaque exterior; additional edits.

## Integration contract

Save the raw generated candidate without post-processing. Root-thread integration will take only cleaned numeral ROI material into the exact extracted reference, preserving original pixels elsewhere. Do not edit final/runtime resources, code or browser.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-c57a9759-2e64-4f4d-bca6-25466ae9d018.png`.
- Copied unchanged to the requested candidate destination.
- Actual resolution: 1024 × 1536, exact 2:3. RGBA (`Format32bppArgb`), alpha min 0 / max 253, 75,854 alpha-zero pixels, 1,497,010 partial-alpha pixels. Corner alphas TL/TR/BL/BR = 0/0/1/0; a nearly transparent alpha-1 fringe exists at bottom-left. Actual transparency is present; opacity distribution is not exact source preservation.
- Visual inspection: black 6 fully gone; no visible pale, embossed, shadowed or outlined 6 remains in the restored paper area. Sun upper ray, central ring, other rays and corner ornaments remain structurally intact.
- Candidate has generative paper/edge differences outside the numeral area, so it must not replace the full mechanically extracted card. Root integration should copy only the cleaned original numeric ROI.
- At 1024 × 1536, original ROI (98,111,116,174) maps proportionally to approximately (179,203,213,319).
