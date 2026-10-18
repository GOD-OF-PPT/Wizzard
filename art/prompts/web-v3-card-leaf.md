# Single leaf blank-rank card

## v2 targeted revision

Output: `art/runtime/web-v3/cards/leaf-v2.png`; v1 preserved. Built-in ImageGen edit.

Measured v2: 1024×1536 RGBA; alpha 0–254; 1% alpha body bounds 969×1472 at +27+31. Corner ornaments visually about118px wide (12.2% visible card width). Printed continuous inner border removed; only thin outer paper-edge line remains. Central leaf and three pale veins visually retained; exact pixel identity was not asserted.

Use case: precise-object-edit. Input1 leaf-v1 blankcard is EDIT TARGET, input2 smalloriginalcard is supportingreference for cornerornament scale. Perform ONLY TWO changes to input1. (1) REMOVE ALL continuous rectangular printedinnerborderlines onpaper, both nested thinwarmrectangles; replace theirpixels withmatchingcream papertexture. Retain ONLY outermostthinphysicalpaperedge, no printedcontinuousframe atall. (2) Shrinkeachof FOURtealcornermeanderornaments from~20%cardwidth to~12%cardwidth (~115pxwide on1024canvas), placeclosetocorners asoriginalreference. Keepornerorientation andtealcolor. Strictlypreserve centralSINGLEleafsilhouette, THREEpaleveins, exactposition,size,color and papertexturefrominput1 unchanged. No digits,text,newdecoration. Preserve1024x1536exact2:3uprightfrontface andgenuinealpha0outsidecard. No glow/shadow/perspective. Do not redesignleaf.

Built-in ImageGen. References: `art/reference/web-v3/card-leaf-reference.png` and `art/mockups/web-v3/05-gameplay-final.png`.

Output: `art/runtime/web-v3/cards/leaf-v1.png`.

## Exact prompt

Use case: background-extraction. Input1 is exact 青叶 leaf card reference, input2 gameplay supporting visual context. Produce ONE standalone upright front-facing card face, 2:3 portrait512x768 or higher exact2:3, realRGBA transparency outside card. Card nearly fills canvas with about2% transparent margin. Match reference faithfully: flat cream xuan-paper face with subtle texture, very thin warm paper edge, four TEAL angular meander corner ornaments. Center ONLY ONE large TEAL LEAF silhouette matching input1: a SINGLE pointed leaf, gently curved pointedtip, taperedstem, three palecream curved vein branches inside. This is one unifiedleaf, NOT olddoubleleaf, no secondleaf, no mirroredpair. Remove top-left numeral5 completely leaving clean emptycream paper in rankarea, and no digits anywhereelse. No words/text/glyphs. Remove gold selectionglow, tabletop/background, allperspective androtation. Straightvertical parallel sides, softly rounded cardcorners, flat2D originalgame painting, no3D bevel, no extra patterns. Preserve referenceleafshape and simple3paleveins precisely.
