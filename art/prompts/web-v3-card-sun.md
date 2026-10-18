# Sun blank-rank card

Built-in ImageGen. References: `art/reference/web-v3/card-sun-reference.png` and `art/mockups/web-v3/05-gameplay-final.png`.

Output: `art/runtime/web-v3/cards/sun-v1.png`.

## V2 precise border/corner repair

Built-in ImageGen precise-object-edit. Edit target sun-v1, original small card-sun-reference as style reference only. Change ONLY: remove ALL continuous rectangular gold surface-frame lines (both nested outlines), restoring uninterrupted matching cream paper; retain only thin warm physical paper edge. Shrink all four ochre-gold meander corner ornaments to12% card width, maximum13%, preserving shape and placing near physical corners about3% inset. Preserve central EIGHT-ray sun, disk and concentric double circular ring/cream gap, exact position/size/color, paper texture/color, upright2:3 silhouette and rounded corners. No motifs/digits/text/table/background; genuine exterior transparency and generated alpha retained. Do not simplify or redraw central sun.

V2 output copied directly without image postprocessing to `art/runtime/web-v3/cards/sun-v2.png`,1024×1536 RGBA. Alpha≥50% card bounds `960×1460+32+38`. Ochre mask in200×200 corner windows excluding physical edge (r>1.1g,g>1.5b,b<0.4): TL102×114,TR103×114,BL102×115,BR102×115. Largest width103/960=10.73%, below13%. Inner continuous rectangular frame removed; only the outer physical paper edge remains. Central eight-ray/concentric-circle sun visually preserved; generated edit does not guarantee pixel-identical paper texture. V1 untouched.

## Exact prompt

Use case: background-extraction. Input1 exact赭日sun-cardreference; input2 gameplay supportingcontext. Create ONE standalone upright perfectlyfront-facing2:3 blankrankcard1024x1536RGBA. SameEnchantedTeahouse cardseries: flatcreamy xuanpaper, thinwarmedge, softlyroundedcorners, fourochre-goldangularmeandercornerornaments. CentralONLYsimpleflatOCHREGOLDSUN exactlylikeinput1: EIGHT triangular rays evenlyaround circularsun, doubleconcentriccircularringcore withflatgoldcenter, cleanplainemblem. No mysticalornament,no realistictextureinsideemblem,no face,no extrarays. Eraseupperleft6entirely, leavecleanpaper rankarea; no digitsorwordsanywhere. Removegoldselectionglow,perspective,rotation,table/background. Genuinealpha0outsidecard, cardnearlyfills96%canvas (~2%transparentmargin). Opaquepaperinterior. Flat2D painterlypaper withsimpleplainprintedemblem, no3Dbevel,noshadow,notext.
