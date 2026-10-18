# Landscape reconnecting state

Built-in ImageGen. References: `art/mockups/web-v3/05-gameplay-final.png` (composition), `art/mockups/web-v3/12-connection-error.png` (modal style).

Output: `art/mockups/web-v3/15-reconnecting.png`, measured 1672 x 941.

Exact prompt:

```text
Use case: ui-mockup
Asset type: single independent landscape game reconnecting state design, exact 1672x941 pixels.
Input image 1: gameplay composition/background reference and edit base. Input image 2: midnight-blue gold-framed cloud-ornament modal material/style reference only.
Primary request: Show the same Enchanted Teahouse game during a temporary network interruption and automatic recovery. Keep image 1's lacquer table, original traveler portraits, paper cards, lanterns, moonlit teahouse and warm hand-painted style. Apply a light uniform dark overlay to the gameplay background, leaving it recognizable.
Add one COMPACT modal centered around screen center, roughly 760 wide and 390 high, with midnight-blue textured face, fine gold frame, restrained cream-paper/gold cloud ornaments inspired by image 2. Clear hierarchy and generous quiet text area. It must be separate from the top-right utility and top-left return-home areas.
Render exactly these Chinese strings in the modal:
Title, centered in warm gold: "正在恢复连接"
First body line, centered in cream: "暂时与茶馆失去联系。"
Second body line, centered in cream, smaller but readable: "恢复后将继续当前对局，请勿关闭页面。"
One single centered parchment button below the body: "立即重试"
No other modal text or controls. No close X. No return-home or abandon-match actions inside modal. Do not copy image 2's old error text or its two-button structure. No fake countdown, timer numerals, progress percentage, progress bar or claim of success. Remove the gameplay countdown circle/hourglass/28秒 beneath the dark overlay so the reconnect state shows no fake countdown. Keep existing background navigation as dimmed artwork only, not as modal actions.
Preserve image 1's overall composition and positions of portraits, table and cards. Do not add full-height character illustrations from image 2. This is a pending reconnect state, not successful recovery. Original raster hand-painted game artwork, no SVG/CSS depiction, no watermarks.
```

Visual inspection: all three requested copy lines and the single retry label are legible and correct. Centered midnight-blue gold modal over dimmed game, with no countdown, percentage or success claim. The generated background omits the selected-hand gold glow and confirm-play control; this is a design-state difference from the base gameplay reference, not evidence of runtime behavior.
