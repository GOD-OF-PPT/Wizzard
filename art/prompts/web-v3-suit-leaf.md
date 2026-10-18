# Leaf suit extraction

Mode: built-in ImageGen; background-extraction.

Inputs: `art/runtime/web-v3/cards/leaf-v2.png` (edit target) and `art/reference/web-v3/card-leaf-reference.png` (supporting reference).

Prompt: Extract the exact single teal leaf emblem centered on Image 1. Preserve exactly the leaf contour, proportions, upward curving flame-like tip, lower curved stem, three pale branching veins, original deep teal color and subtle painted interior texture. Deliver one independent transparent square PNG, optically centered and filling about 80 percent of square height. Make only surrounding paper/card background transparent. Keep the teal leaf interior opaque and solid; preserve the pale cream internal veins as pale cream ink, not transparent holes. Remove card paper, frame, corner ornaments, numbers, text and gold glow entirely. One single leaf only, never a pair of leaves, no new geometry, no shadow, no backdrop, no additional objects.

Output: `art/runtime/web-v3/suits/leaf-v1.png`, 1024 × 1024 RGBA. Generated alpha preserved; uniformly fit into an 820px box and centered on transparent canvas with ImageMagick.
