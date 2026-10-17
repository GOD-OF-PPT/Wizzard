# Web v3 lobby ready-status capsule

Built-in ImageGen, transparent background. References: `art/mockups/web-v3/portrait/04-lobby.png`, `art/mockups/web-v3/04-lobby.png`; specifically the small 已准备 capsule below each nickname plaque.

## Prompt

Use case: stylized-concept. One transparent blank ready-status capsule for the Enchanted Teahouse game lobby. Reproduce only the small simple lower status capsule with all writing removed.

Horizontal capsule approximately 3.1:1, straight top and bottom connecting fully round semicircular end caps. Target 620×200 or similar, filling nearly the canvas with small transparent safety margins. Single simple narrow aged gold outline, solid opaque dark forest-green center. No stepped edges, cloud lobes, petals or second border. Deliberately simpler than the nickname plaque above it.

Softly hand-painted matte lacquer, warm old gold edge, subtle quiet dark green brushed texture and gentle warm shading matching the references. Orthographic front-on, no perspective. No text.

One isolated empty green capsule only. No avatar, nickname plaque, wording, checkmark, leaves, flowers, ornaments, symbols, icons, filigree, curls or extra objects. No scene, large shadow or shiny 3D rendering. True transparency outside only; green fill and gold rim must be opaque, never hollow or semitransparent. Preserve genuine alpha.

## Output inspection

Generated source 2206×713 RGBA. Only transparent-canvas crop and proportional resize using ImageMagick; no painting, alpha repair, or vector replacement. Runtime file `art/runtime/web-v3/lobby-ready-v1.png`, 620×200 RGBA.

Visible bounds at alpha ≥ 50%: `604×149+8+25`. Actual silhouette ratio approximately 4.05:1, wider than requested 3.1:1. Green interior sample `(110,55,400,90)` alpha 252–254/255; center alpha 253/255, corner 0. Generated alpha preserved, with minor edge speckles. These are explicit fidelity limitations, not strict full-opacity/proportion acceptance.

## V2 targeted proportion correction

V1 rejected for its 4.05:1 silhouette. Built-in ImageGen edit: portrait lobby is supporting style reference; `lobby-ready-v1.png` is the edit target. Change only silhouette proportions to gold-edge-to-gold-edge width620 height200, exactly3.1:1. Two semicircular end caps diameter200/radius100, straight middle segment length420. Transparent canvas about650×220, body nearly fills canvas. Preserve matte dark green lacquer and simple single narrow aged gold rim. No text, symbols, icons, checks, avatar, leaves, clouds, petals, filigree, shadow or extra objects. Fully opaque interior/rim requested, genuine generated alpha preserved. No manual nonuniform stretching allowed.

The first targeted edit still produced a 2124×570 silhouette (3.73:1) and was not selected. A further built-in generation changes only the framing strategy: square transparent canvas, conceptual pill bounds x50–950/y355–645 on a1000×1000 canvas, visible900×290 (3.10:1), intentionally large transparent top/bottom margins to be cropped later. Same original portrait reference, short/tall capsule, semicircular radius145 endcaps, single gold rim and empty matte opaque dark green interior. No nonuniform manual scaling.

The square framing request was ignored by the built-in tool (2206×713 output, 1452×313 body), also rejected. Final targeted framing prompt: one short/tall capsule completely fills image width and height, gold edge touches all four side midpoints, zero top/bottom margin; transparent only in curved corner spaces. Canvas620×200; subject620×200; ratio3.1:1. Matte opaque forest-green center and single narrow old-gold rim; no text, icons, checks, avatars or ornament. No reference attachment for this framing-only retry, to avoid inherited wide framing.

Selected v2 source:2203×714 RGBA, silhouette fills source bounds (3.085:1). Proportional resize only to width620, then transparent canvas padding to650×220; no nonuniform stretching. Saved `art/runtime/web-v3/lobby-ready-v2.png`. Visible bounds alpha≥50%: `620×201+15+9`, ratio3.085:1 (within0.5% of3.1 target). Interior sample `(125,60,400,100)` alpha251–254/255, center253/255. Generated alpha preserved; minor generated edge speckles remain. V1 preserved as rejected candidate.
