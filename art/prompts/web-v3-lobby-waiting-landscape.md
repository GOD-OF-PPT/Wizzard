# Lobby waiting-for-ready condition correction

Built-in ImageGen edit. Source `art/mockups/web-v3/04-lobby.png`; output `art/mockups/web-v3/04-lobby-waiting-v2.png`, measured 1672 x 941.

Reason: source shows one unready human yet an enabled start label. Correct the design to the valid disabled waiting-for-ready condition, without changing business rules or marking the human ready.

Inspection: right green-gold button reads 等待准备 in muted warm gray-beige. Four humans, three prepared, one waiting, ready AI, open seat, room 628315 and 取消准备 retain their source presentation. Overall layout retained; generated edit is not claimed to preserve non-target pixels bit-for-bit.

Exact prompt:

```text
Use case: text-localization.
Edit target: supplied friend-room lobby screenshot, exact 1672x941.
ONLY EDIT the text inside the lower-right GREEN GOLD-FRAMED PRIMARY BUTTON. Replace its existing "开始游戏" label with EXACTLY "等待准备". Render the new four Chinese characters in low-contrast muted warm gray-beige ivory, clearly disabled but still readable. Preserve original hand-painted calligraphy style, text size and optical center.
Keep the button's original GREEN lacquer material and GOLD frame, shape, dimensions, ornaments and position. Do not introduce a gray panel or wash out the green button itself.
Every other pixel/content/composition must remain unchanged: 青竹客/云游鹤/花间狐 all 已准备 with checks, 墨隐熊 等待准备 without check; AI旅人 已准备; one empty 等待好友 seat; bottom-left 真人 4/6 · 已准备 3人; cancel button 取消准备; room number 628315; all avatars, status text, icons, table, room, invitation button and background. Do not fix the unready player by marking them ready. This edit corrects the design condition: one human is unready, so start is disabled with reason 等待准备. No other new text or visual modifications.
```
