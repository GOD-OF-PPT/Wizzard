# Gameplay no-action wood repair

Built-in ImageGen precise-object-edit. Final source scene `art/runtime/web-v3/gameplay-no-action-scene-v1.png` is an intermediate only, not a runtime replacement. Runtime candidate `art/runtime/web-v3/gameplay-no-action-patch-v1.png` is a lossless 425x170 crop at x1235,y665, no resizing.

First exact prompt (discarded full-scene result also removed timer ring):

```text
Use case: precise-object-edit. Edit supplied landscape 1672x941 runtime scene. STRICTLY change only the bottom-right empty green action plaque, its gold frame and attached lower-right gold cloud ornament, approximately x1245–1640,y675–815. Remove them entirely and reconstruct the underlying continuous curved lacquered wooden table edge and dark woodgrain, matching neighboring material, perspective, lighting and shadows seamlessly. No remnants of green plaque, gold frame or cloud. Keep EVERY other empty HUD, frame, background object and pixel composition unchanged. No text, number, player or new ornament in repaired region. Same 1672x941 canvas; no crop, no resizing, no redesign.
```

Final exact repair prompt:

```text
Use case: precise-object-edit. Image 1 ORIGINAL runtime scene is the edit target. Image 2 is reference ONLY for the repaired bottom-right wood area. Remove ONLY the green rectangular action plaque with gold border at x1245–1640,y675–815 and its lower-right cloud ornament. Repair that rectangle with table wood matching image 2. CRITICAL KEEP the separate large GOLD CIRCULAR EMPTY TIMER RING centered near x1465,y553 and its LOWER-LEFT CLOUD at x1390,y615 EXACTLY as Image 1. That circular timer and cloud above y650 are NOT THE REMOVAL TARGET. Keep all original other HUD and scene unchanged. Output 1672x941. Only bottom rectangular plaque goes away. The circle MUST remain visible. No new content.
```

The patch contains continuous lacquer table edge and dark wood; no plaque, number, text or player. Full scene preservation is not a pixel-identity guarantee; consume only the specified local patch and check integration edges against original. Source final scene is 1672x941.
