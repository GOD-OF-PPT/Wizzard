# Web v3 wide join-room — room-code keyboard focus candidate v1

Mode: built-in ImageGen edit (`precise-object-edit`).

Edit target: `art/mockups/web-v3/03-join.png` (1672 × 941).

Raw candidate destination: `art/source/web-v3/join-code-focus-wide-v1-candidate.png`.

## Full prompt

Use case: precise-object-edit.
Asset type: the selected landscape Enchanted Teahouse join-room interface, with exactly one keyboard-focus state added.
Input image 1 is the edit target and strict source of truth. Preserve the entire 1672 × 941 frame and exact aspect ratio. Keep all existing scene artwork, text, fields, numbers, controls, layout, textures, and lighting unchanged. Do not crop, zoom, move, restyle, or redesign anything.
Only change: add one continuous, restrained, clearly visible warm ivory-gold keyboard-focus ring around the entire group of six cream parchment room-code boxes. In original-image coordinates, its approximate outside boundary is x=615, y=475, width=603, height=111. The ring is one rounded rectangle surrounding all six boxes together, approximately 3 pixels thin, with 10-pixel corner radius and only a slight warm glow. Place it outside the six existing field borders with a small clear gap. Do not put rings around individual digits. Add no solid fill, no new backing plate, no tint, and no change to the existing red lacquer background inside or outside the ring. The ring must never cover the six box borders, any digits, the room-code label, or the helper line.
Invariants: keep the exact six-digit sequence “628315”, the nickname “茶客听雨”, all existing borders, the helper “输入好友分享的六位数字”, title, portrait, animal travelers, lanterns, stars, room panels, table, return button, and join-room button unchanged. Do not add a cursor, icon, new text, extra ring on another control, or additional decoration. The result is a surgical keyboard-focus state edit only.

## Handling

Save the raw generated result unchanged. The parent thread will composite only the narrow outer ring strips into the source, preserving the authored scene and digits. Do not replace `03-join.png`.

## Result inspection

The raw candidate is 1672 × 941 and adds exactly one continuous rounded warm ivory-gold ring around all six boxes together. The original nickname, digits “628315”, and helper copy remain. No new caret, fill panel, text, or other focus ring was introduced. The generated ring is somewhat larger and brighter than the requested restrained 603 × 111 boundary: its bright core footprint is approximately x=609–1225, y=466–593 inclusive (617 × 128), with a soft glow extending several pixels beyond that. These core bounds were measured using the bright-gold pixels in the outer ring strips while excluding the original box interiors. A padded enclosing region is x=604, y=461, width=627, height=138. Use only narrow outer strips, since the parent must preserve the original boxes and digits rather than replacing their interior rectangle. The candidate is saved unchanged, without resizing, color adjustment, or other postprocessing.

Raw built-in output: `C:/Users/KSG/.codex/generated_images/01a16e77-e345-7640-aa04-9062da33c1ea/exec-fd5d691a-d142-4efa-b51a-eed1689b75b0.png`.
