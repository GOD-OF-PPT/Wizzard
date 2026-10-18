# Sun v3 actual generation prompts

Tool: built-in ImageGen. Both calls used `transparent_background: false`.

## First call

Inputs, in order:
1. `art/reference/web-v3/cards/sun-source-hand-v1.png`
2. `art/mockups/web-v3/05-gameplay-final.png`
3. `art/runtime/web-v3/cards/sun-v2.png`

Exact prompt:

```text
Use case precise-object-edit. Generate ONE independent reusable SUN card face, exact1024x1536 full-bleed front-on rectangular opaque ivory parchment. Image1 close crop is exact source identity/anatomy reference (has rank6 and perspective; REMOVE rank and straighten, never copy its scene). Image2 full gameplay is visual truth. Image3 existing sun-v2 is correction target supporting material only. Preserve original simple warm-ochre eight-ray sun: solid round central disk, narrow ivory annular gap, substantial ochre circular outer ring and EXACTLY EIGHT detached triangular rays, same source proportions, no face, no extra circles or rays. Central emblem same source card-relative position/size, leave upper-left rank band open. Four substantial ANGULAR cloud/meander corner marks, warm ochre, each about15–16% of card width (154–164px), about5% inset, correct mirrored orientations. Match source's square-edged meander anatomy rather than delicate curled v2 marks. Warm ivory subtle paper fibers, aged thin gold card edge and modest rounded corners. No numeral6 or any other number, letters, Chinese text, label, watermark, continuous ochre colored border, second frame, extra decoration, scene, perspective, outside padding, external backdrop or shadow. Full opaque paper card fills canvas. Preserve handmade painterly quality, not generic vector template.
```

First result was discarded for an unwanted extra inner frame. Generated original remains at `C:/Users/KSG/.codex/generated_images/01a14bbf-3b2d-70d2-81e4-24f23bed0ab0/exec-40343186-25ac-4cdd-8ead-0589880cadeb.png`.

## Targeted retry

Input: the first generated image, temporarily saved at `art/source/web-v3/cards/sun-v3.png` at the time of this call.

Exact prompt:

```text
Precise correction of this SUN card, keep exact1024x1536 opaque face and central eight-ray sun/paper unchanged. REMOVE the unwanted continuous inner ochre rectangular frame near x50 and y45: fill it seamlessly with matching ivory paper. Keep only ONE thin aged-gold OUTER edge, no second border. Remove dark olive exterior corner pixels, extend ivory paper fully to canvas corners. Slightly reduce EACH of the four angular corner meanders to160px width (15.6% of1024), maintaining5% inset and mirrored orientations. No rank/text. Preserve source sun geometry, warm parchment fibers and front-on full-bleed composition. No scene or shadow.
```

Final output: `art/source/web-v3/cards/sun-v3.png`, 1024×1536, opaque. Generated original: `C:/Users/KSG/.codex/generated_images/01a14bbf-3b2d-70d2-81e4-24f23bed0ab0/exec-ec9c9b15-e781-4513-bc3a-a91e582d5640.png`.

Observed residual deviation: corner marks approximately125px wide (12.2%), below the requested15–16%; no further generation was performed.
