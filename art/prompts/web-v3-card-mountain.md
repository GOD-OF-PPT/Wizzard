# Web v3 mountain numeric card

Built-in image_gen transparent edit. Source: `art/reference/web-v3/card-mountain-reference.png`; style: `art/mockups/web-v3/05-gameplay-final.png`.
Output: `art/runtime/web-v3/cards/mountain-v1.png`.

```text
Use case: background-extraction / precise-object-edit
Inputimages: image1 closemountaincard is primaryshape/materialreference; image2gameplay supportsstyle. ProduceONEindependent upright front-facing 2:3 numericalcardface blankofdigits,512x768orhigherexact2:3. Reproducecreamflatxuanpaper,thinwarmtanroundededge,FOURindigogeometricmeandercornerornaments exactlyasreference. Centeroriginalindigomountains emblem: three main indigopeaks, tallestbackcenter, two sidepeaks, centralfront lowtriangle, exactreferenceangularsilhouetteandcreamsnowlinegaps, no newmountainpainting. Removeupperleft8 entirelyandfillcleanpaper; NOdigitsinanycorner. Noletters/text. De-rotate/de-perspective: strictlyverticalparallelsides,horizontaltopbottom, flatfrontalorthographicface. Removealltable/scene. Outsidecardtrulytransparentalpha; innerpapercardopaque. Cardnearlyfills2:3canvaswithabout2%transparentmarginallaround. Noextrasymbols/newpatterns/shadow/backdrop. Preserveoriginallowdetailflatindigoemblem—notrealisticmountains.
```

## v2 border and corner correction

Output: `art/runtime/web-v3/cards/mountain-v2.png`.

```text
Use case: precise-object-edit
Image1target is currentblankmountaincard. Image2originalcroppedreference dictatescornerornaments. ONLY TWO corrections: 1 Completely REMOVE continuousdoublelinerectangularborder aroundpaperface. Filllineswithmatchingpaper. KeepONLYthinwarmphysicaloutercardedge, nointeriorrectangleframe anywhere. 2 Shrink EACHofthefourindigomeandercornerornaments to12%ofthecardwidth, NEVERexceed13%, anchorclosetocorrespondingcorner. Currentornaments20%widearetoolarge. Atcardwidth958px ornamentmaxwidth115px. Allfourmustbemodestlikeimage2. Keepcardpapertexture/mountainemblemshape/colors/centerposition/sizeandflatfront2:3geometryunchanged. Blankdigits,nofont/text. Keeptransparentoutsidecardandgeneratedalpha. No newdecoration. Preserve1024x1536canvas.
```
