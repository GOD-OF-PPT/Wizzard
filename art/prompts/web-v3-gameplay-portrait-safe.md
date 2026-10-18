# Portrait gameplay action safety correction

Built-in ImageGen edit of `art/mockups/web-v3/portrait/05-gameplay.png`. Output `art/mockups/web-v3/portrait/05-gameplay-safe-v2.png`, measured 941 x 1672.

Reason: original confirm-play plaque overlapped the last hand card and its click area. Move the action below the hand into a separate safe band.

Inspection: full green plaque now sits around x669..938, y1502..1633; hand bottom is around y1478, leaving roughly 24px real separation; bottom margin about 39px. Original exposed area has been reconstructed with dark wood. Countdown and hand remain in the same apparent positions. The generated translation is approximately 104px rather than exactly 90px; so this is a safer candidate but not an exact-coordinate acceptance. Full-image AE is nonzero, therefore non-target pixel identity is NOT claimed. Do not treat this as runtime implementation or final pixel acceptance.

Exact prompt:

```text
Use case: precise-object-edit.
Edit target: supplied portrait gameplay design, EXACT 941x1672 pixels.
ONE STRICT LOCAL EDIT ONLY: translate the entire bottom-right green "确认出牌" button plaque including gold frame and its attached lower-right gold cloud ornament vertically DOWN by exactly 90 source pixels. Keep button size, shape, text, material, original horizontal x coordinate and every ornament unchanged. Desired new total bounds approximately x675–923, y1496–1622, leaving about 50 pixels beneath it. Reconstruct the newly exposed old button region with a seamless continuation of the existing curved table edge / wood grain.
The hand cards must remain exactly where they are, fully visible. Ensure a real visible gap of at least 20 source pixels between the LOWEST edge of the hand cards and the TOP gold border of the moved button. Do not change, move or repaint the countdown, any hand card, players, HUD, background or other UI. Keep all non-target pixels and overall composition invariant. Only the button's old and new occupied regions may change. Do not add controls or text, do not resize canvas or crop.
```
