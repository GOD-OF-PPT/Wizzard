# Lobby invite parchment component

Built-in ImageGen with `transparent_background: true`. Inspected inputs: `art/mockups/web-v3/04-lobby.png` and `art/mockups/web-v3/portrait/04-lobby.png`.

Final prompt:

Create a transparent-background CUTOUT PNG of the central 邀请好友 button ONLY. Mandatory: zero alpha everywhere outside actual solid cloud-shaped paper button boundary. NO GLOW, NO HAZE, NO SHADOW, NO AMBIENT LIGHT, NO BACKDROP. Do not paint anything behind it. Warm cream paper rectangular stepped plaque with fine gold edges and small curled cloud wings extending left and right, dark brown two-human silhouette icon to left of exact black calligraphy 邀请好友. Entire button silhouette wide 3.3:1. Match source central button at x658–1002,y457–560 exactly, cloud wings remain SMALL. Keep lettering intact. Plain cutout isolated game UI sprite asset, small transparent border. Transparent exterior must immediately meet the gold rim with no halo transition. Interior entirely solid opaque. No other decoration or objects.

Earlier two attempts retained an exterior golden haze and were rejected. Third result selected. Output: `art/runtime/web-v3/lobby-invite-v1.png`. Trimmed generated alpha bounds and added 12px transparent border using ImageMagick. Lettering and pictogram remain baked in. Generated geometry is wider than the requested approximate 3.3:1 and needs source comparison before fidelity acceptance.
