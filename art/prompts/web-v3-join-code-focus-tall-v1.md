# Portrait join-room: keyboard focus on room-code group v1

Mode: built-in ImageGen precise local edit.

Edit target: `art/mockups/web-v3/portrait/03-join.png`, 941 × 1672.

Candidate: `art/source/web-v3/join-code-focus-tall-v1-candidate.png`.

## Complete prompt

Use case: precise-object-edit
Asset type: a single keyboard-focus interaction-state mockup for the selected portrait Enchanted Teahouse join-room page.
Input images: Image 1 is the complete selected 941 × 1672 join-room page; it is the edit target and sole source of truth.
Primary request: add one continuous, restrained, clearly visible warm rice-gold keyboard-focus ring around the entire group of six existing parchment room-code number cells. The ring is an unfilled rounded rectangle with approximately 5 source-pixel line thickness, 14 source-pixel corner radius and a very slight warm glow. Its outer bounds are approximately x=157,y=932,width=628,height=129 in the original 941 × 1672 coordinate system. The existing six cell frames and digits 6 2 8 3 1 5 remain completely unchanged inside this outer ring, with visible breathing space between the ring and cell frames.
Composition/framing: preserve exact 941:1672 portrait composition and source coordinates. Output may be proportionally larger but do not crop, move, resize or reframe any component.
Constraints: add only this single thin outer focus ring around the six-cell group. No filled background, large glow, white wash, cursor, caret, icon, extra text, underline, duplicate ring, or focus state on any other control. Do not cover or redraw any digit or existing cell frame. Preserve every original image element: nickname “茶客听雨”, avatar, six digits “628315”, helper “输入好友分享的六位数字”, labels, title plaque, panel, gold and parchment textures, both buttons, complete scene, characters, curtains, lanterns, distant landscape, tea table, ornaments and all existing spacing. The normal nickname field does not receive a ring.
Text (verbatim): all existing text unchanged; no new text.
Avoid: new boxes with filled backgrounds; focus around individual cells; changed numeric values; changed artwork, characters, panels or buttons; resized room-code group; extra new UI objects; thick neon glow; watermark.

## Integration contract

Preserve the raw generated candidate without color/tonal edits. Do not overwrite selected `03-join.png`. Main-thread integration will take only the narrow outside ring strips back onto the original to preserve scene and digit pixels exactly.

## Generated result

- Raw output: `C:/Users/KSG/.codex/generated_images/01a16e78-21c8-7482-a24a-924c851b87dc/exec-cd169093-e9fc-41f4-bfbe-bd053d08f538.png`.
- Copied unchanged to the candidate destination. Actual resolution: 941 × 1672.
- Visual inspection: one continuous unfilled warm-gold ring surrounds the six-cell group; original digits, nickname and helper are readable and structurally intact. No extra cursor, icon, text, focus ring on other controls, or filled background.
- The glow is stronger than the requested very slight glow. The raw candidate is kept intact; main-thread integration should explicitly decide whether it matches the intended restrained focus state.
- Measured bright ring core outer bounds: x=155,y=930,width=631,height=133. Measurement searched x=145..794/y=928..1067 outside the original six-cell interior using RGB R>230,G>190,B>70. Suggested glow-safe outside envelope: x=145,y=921,width=651,height=151; copy only narrow outside strips and preserve the original cell group interior.
