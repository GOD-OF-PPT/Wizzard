# Web v3 recovery landscape session-ended — keyboard-focus candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`). Input is selected source design, never an implementation screenshot.

Edit target: `art/mockups/web-v3/16-session-ended-network-v3.png` (1672×941).
Raw candidate: `art/source/web-v3/recovery-source-v1/landscape-session-ended-focus-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: the selected Enchanted Teahouse session-ended landscape design, adding a single keyboard-focus outline to the existing paper action button.
Input image1 is the sole full-page edit target and strict source of truth. Preserve its exact1672×941 canvas and every existing scene, layout, dimming, material, color, animal, portrait, label, paragraph, border, and control pixel as faithfully as possible. Do not crop, zoom, reframe, restyle, redraw, resize, shift, remove, or reword anything.
Only add ONE calm thin continuous pale ivory-gold keyboard-focus outline outside the existing paper action button's authored shape. The source action bounding rectangle is approximately x665,y567,width343,height87. Its exact Chinese label remains “返回首页”. Preserve the existing paper material, cloud-scroll ornament, gold edge, text size, baseline, shape, size, and position without modification. Place the new outline outside the authored shape with a quiet4px gap. It is approximately3px thin with softly rounded approximately14px corners; outer boundary approximately x658–1015,y560–661 in full-page pixels. Keep the outline complete and readable but restrained. Follow the existing paper button's authored shape. Never touch or cover any original button pixel.
No glow, sparkle, halo, rays, new shadow, fill, tint, veil, icon, changed opacity, or focus ring on any other element. No new panel or backing rectangle. Add only the single pale ivory-gold line in the narrow exterior ring region. All page content including the title “本次连接已结束”, body message, scene dimming, and “返回首页” stays exactly as-is. This is a surgical keyboard-focus state edit, not a page redesign.

## Handling

Save raw generated image unchanged. Main will retain only bounded new ring pixels and normalize their coordinates, preserving original bodyRGB. No postprocessing, code, browser, runtime, canonical mockup, or reference-art edits. Do not replace the whole page.

## Single-output inspection

Actual output1672×941. Exactly one pale ivory-gold rounded outline surrounds the paper action. “返回首页” and the existing paper/button appearance remain visually intact; no obvious glow, sparkle, new fill, icon, or rewording appears. The added bright ring's exterior bounds measure approximately x658–1013,y562–658 inclusive (356×97), from changed pale pixels outside the original action rectangle in the local ring band. This is2px below the requested top,2px short of the requested right, and3px short of the requested bottom. The generated ring is approximately2–3px, with somewhat rounder corners than the requested14px and a gap varying around3–5px. All source body pixels must still be retained independently: the generated whole page is visually similar rather than exact source-RGB evidence. Raw candidate is unprocessed.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-66f413de-234d-46f2-b32b-7181bc16586f.png`.
