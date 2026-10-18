# Knot suit extraction

Mode: built-in ImageGen; background-extraction.

Inputs: `art/runtime/web-v3/cards/knot-v2.png` (edit target), `art/reference/web-v3/card-knot-reference.png` (supporting reference).

Prompt: Extract the exact central vermilion red Chinese knot emblem from the card. Deliver a single isolated transparent square PNG, optically centered, emblem about 80 percent of canvas height. Preserve all original geometry, proportions, four loops (upper, left, right, lower), central diamond opening, two detached small diamonds, curled angled lower arms and pointed lower teardrop tip. Preserve the exact rich red hue and subtle painted texture. Remove only the surrounding cream paper, including paper inside all loop/diamond openings: these background openings must be transparent. Keep every red region and red interior texture fully opaque. Remove card border, corner ornaments, text, number and gold glow entirely. Do not redesign or simplify this emblem, do not add rope, tassels, shadows or objects. Exactly one Chinese knot suit emblem with original proportions on genuinely transparent background.

Output: `art/runtime/web-v3/suits/knot-v1.png`, 1024 × 1024 RGBA. Generated alpha preserved, uniformly fitted into an 820px box and centered with ImageMagick.
