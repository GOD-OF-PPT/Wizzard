# Mode-plaque player icon

Built-in ImageGen, transparent output; reference `art/mockups/web-v3/05-gameplay-final.png`.

Actual prompt:

> Extract/recreate as independent raster asset ONLY the tiny cream-gold single-player person icon inside the upper-right 单人练习 plaque (around x1472..1515,y23..55) from this reference. One small seated person bust silhouette with round head, curved shoulders/arms and teacup-like rounded lap details matching source. Soft flat ivory/old gold, original painterly tiny UI silhouette, not 3D, not two people. Genuine transparent background; no plaque, no text, no scene, no border. Center one icon with modest transparent padding, square512 canvas. Preserve source anatomy as closely as possible.

Raw: `art/source/web-v3/mode-player-v1.png`. Generated canvas1280×1280; alpha>16 bounds with6px safety crop `(326,316,601,625)`, resized proportionally to256px high as `art/runtime/web-v3/mode-player-v1.png`. No vector/CSS drawing or recoloring. Source reference remains unchanged.

Actual icon has thicker brown outline and more explicit cup than tiny source. Chrome native-size comparison shows similar silhouette and placement, not pixel-identical anatomy. See docs32.
