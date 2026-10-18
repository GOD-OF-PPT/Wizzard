
## V2 proportion correction

Built-in ImageGen edit using v1 plus landscape gameplay reference. Output: `art/runtime/web-v3/trump-status-v2.png`. Only excess transparent canvas outside a 12px inset of the measured visible bounds was cropped and a 12px transparent border added; artwork was not scaled or stretched.

Measured canvas: 2007 x 448 RGBA. Alpha 10% visible bounds: 1967 x 400, approximately 4.92:1 (target approximately 5.0:1). The actual paper body is taller, not padded to simulate height. Alpha is retained. Blank center, cream cloud caps and gold borders preserved; no text or icons.

Exact v2 prompt:

```text
Use case: precise-object-edit.
Edit target: Image 1 blank parchment plaque. Image 2 gameplay screenshot is reference for original central parchment HUD proportions.
Change ONLY the overall visible plaque proportion from 5.59:1 to 5.0:1 by INCREASING THE ACTUAL PAPER AND BORDER HEIGHT, not by adding transparent top or bottom padding. Target visible gold border bounding box 1500 pixels wide by 300 pixels tall, or any higher resolution exact 5.0:1 equivalent. Keep complete visible plaque filling nearly the entire output canvas with only 1-2% transparent margin.
Preserve cream rounded cloud-scroll caps at both ends, thin warm antique-gold double edging, broad quiet cream parchment center, subtle hand-painted paper texture, matte warm 2D illustration. Keep cloud caps proportional to the newly taller paper. The complete visible gold edge including both cloud caps must be exactly approximately five times wider than tall.
No text, no digits, no icon, no sun, no flower, no extra ornament. Interior must remain completely blank and quiet. Genuine RGBA transparency outside plaque; preserve clean antialiasing. Do not flatten or stretch the original image; redraw to the taller final aspect as authored artwork. Single standalone runtime component only.
```


Built-in ImageGen. References: `art/mockups/web-v3/05-gameplay-final.png` and `art/mockups/web-v3/portrait/05-gameplay.png`.

Output: `art/runtime/web-v3/trump-status-v1.png`.

Generated 2172×724 RGBA. Trimmed excess transparent canvas only and added a small transparent border with ImageMagick; artwork geometry and alpha preserved.

Final transparent padding normalized around 1% alpha visible bounds. Final canvas 2058×370, visible bounds 1978×354 at +40+8, visible proportion 5.59:1.

## Exact prompt

Use case: background-extraction. Extract/recreate ONLY the central small 本轮王牌 parchment HUD plaque from provided two gameplay screenshots (landscape approx x676–996,y511–575), as one independent EMPTY runtimebitmap. Preserveoriginal cream-paperfield, thinantiquegoldborder, TWO smallroundedcloud-scroll endcaps. Visiblebodywidth:height approximately5:1, for example800x160visible; widequietcenter, originalfinalproportion. EntirePNG canbe832x192orhigher matchingwideaspect; genuinealpha0outsideplaque, visiblebodyfills~96%canvaswithsmallmargin. Remove sunicon and ALL text/digits/symbols leavingcompletelyblankpaperinside. Reserveleft22%emptyforfutureicon andright70%quietunpatternedpaperfordynamiclabel. NO icons, no bakednumbers, nowords, nobamboo/leaves, nopointed/taperedendcaps, no oldsmallPlaquetriangleends, noadditionalornaments, no3Dbevel, no backgroundscene. Authoredwarm2D handpaintedmatte UIasset faithful to referencecloudcappedlabel.
# Blank trump-status parchment plaque
