# Portrait chooser pending v2

- Tool: built-in ImageGen edit.
- Edit target: `art/mockups/web-v3/portrait/11-chooser.png` (941 × 1672).
- Raw output: `art/source/web-v3/chooser-pending-portrait-v2.png`.
- Purpose: a narrowly scoped asynchronous submission state, preserving the selected immutable chooser source.

## Exact prompt

Use case: precise-object-edit / ui-mockup.
Input image: edit target, the supplied 941 × 1672 portrait Enchanted Teahouse chooser screenshot.
Change only the small status region inside the red chooser panel and the disabled appearance of its four choice cards. Preserve exact canvas dimensions, all original geometry, the red panel, scene, avatars, title, subtitle, hand, timer, actions, every existing Chinese character, textures, colors and lighting elsewhere.
Keep the title “请选择本轮王牌” and subtitle “翻出至高牌，由发牌者选择。” exactly as shown. In the narrow empty horizontal gap below that subtitle and above the first choice-card row, place one centered single line: “正在提交选择…”. Its text should be approximately 22 pixels tall, warm muted gold, centered near image x = 471, y = 558. Keep at least 4 pixels of clear gap from the subtitle and from the choice cards starting around y = 577. Do not move or resize the choice cards. If the extra line cannot fit legibly within that gap, replace only the existing subtitle with “正在提交选择…” at its current position instead; never overlap text or move cards.
Make all four choice cards subtly disabled by slightly reducing saturation and contrast uniformly; retain every card's authored symbols, words, frame geometry, spacing, paper texture and current location. No selected card, spinner, progress bar, extra ornament, tooltip or other new content. Outside this exact local edit keep source pixels as unchanged as possible. Return the same full portrait image with no crop or added margins.
