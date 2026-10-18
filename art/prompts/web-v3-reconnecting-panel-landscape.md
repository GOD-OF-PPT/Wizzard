# Reconnecting modal extraction

Mode: built-in ImageGen, transparent background, background-extraction.

Input: `art/mockups/web-v3/15-reconnecting.png` (edit target).

Exact prompt:

Use case: background-extraction. Edit target: provided screenshot. Extract ONLY the complete central midnight-blue gold-framed reconnecting modal, approximately source x449–1223 y235–686. Preserve this exact modal as a single complete bitmap, retaining its original layout, proportions (visible subject approximately 774:451), gold frame, central top cloud crest, corners, dark blue subtle patterns, gold typography, decorative divider, lower floral linework and the entire parchment retry button including text. Preserve all Chinese text exactly: title “正在恢复连接”; first line “暂时与茶馆失去联系。”; second line “恢复后将继续当前对局，请勿关闭页面。”; button “立即重试”. Do NOT rearrange, restyle, redraw or simplify the modal. Background outside its outer gold frame and crest must be genuinely fully transparent, including rounded-corner cutouts; no tea house, characters, cards, table, dark backdrop/scrim pixels, shadows from surrounding scene or other UI. Modal interior remains fully opaque. Deliver a wide transparent PNG with only a small uniform transparent margin around the extracted frame. Preserve original Chinese glyph shapes and exact wording. This is one runtime UI component, NOT a new screen or redesign.

Output: `art/runtime/web-v3/reconnecting-panel-landscape-v1.png`. Generated alpha preserved; ImageMagick trim and a 12px transparent border normalize the canvas without redrawing content. Static text and retry button remain baked into this component; runtime requires only semantic hit targets.
