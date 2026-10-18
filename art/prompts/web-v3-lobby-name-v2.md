# Lobby blank name plaque v2

Built-in ImageGen with one targeted retry. Original output: `art/source/web-v3/lobby-name-v2.png`, 2122 x 741 RGBA. Runtime `art/runtime/web-v3/lobby-name-v2.png` uses only mechanical alpha trim plus 12px transparent padding; no artwork resizing, stretching or alpha repainting. Alpha 10% visible bounds 2068 x 576 at +27+74, ratio 3.590:1, versus 3.55 target (about 1.1% difference). Outer alpha reaches zero. Center sample alpha 253/255 (~0.992), visually solid but not mathematically fully opaque; this known limitation is preserved under the no-alpha-modification instruction.

Blank dark-green field and soft cloud-petal lobed ends retained; no name, check, avatar, status, diamond beads or added decoration. Gold border is heavier than tiny source edge and should be checked at target size.

First exact prompt:

```text
Use case: background-extraction. Input tight crop is a reference for ONLY the upper dark-green gold-edged name plaque currently reading 青竹客. Reconstruct this exact plaque as a standalone EMPTY runtime asset. Preserve its soft rounded CLOUD-PETAL lobed ends and subtle stepped rounded shoulders, thin warm antique gold edge, matte deep forest-green lacquer interior and quiet broad center. Visible silhouette width:height MUST be approximately 3.55:1 (example visible 1420x400), NOT a flatter 4.15:1 strip. This ratio is the actual visible gold-border silhouette, not transparent padding.
Remove all name text, avatar/check/status capsule and scene. Interior fully opaque dark green and completely blank; no diamond beads, no gems, no pointed ends, no new patterns or ornament. The cropped reference's tiny side marks should not become prominent new decoration: omit these tiny diamond/bead-like marks, leave soft cloud-petal ends quiet. Match authored 2D hand-painted materials, no thick 3D bevel. Genuine RGBA transparency outside, small transparent margin. ONE plaque only. Do not use extra top/bottom transparent padding to fake the required visible proportion.
```

Selected retry exact prompt:

```text
Use case: precise-object-edit. Correct supplied blank green cloud-petal plaque's ACTUAL ARTWORK HEIGHT. Current visible bounds 2063x505 =4.085:1, too flat. Regenerate with SAME visible width 2063 but visible height approximately581, giving 3.55:1. Increase the height of the actual opaque green center AND gold frame by 15 percent. Do not add transparent padding to fake it, do not stretch the bitmap. Redraw authored final proportions. Keep exactly same soft cloud-petal lobed ends, quiet unpatterned dark green lacquer center and thin warm gold edge, no diamond beads or new ornaments. Blank with no text, icon, avatar or status. Center interior alpha fully 1.0 opaque; outside fully alpha zero. Small transparent outer margin. Visible outline must measure close to3.55:1.
```
