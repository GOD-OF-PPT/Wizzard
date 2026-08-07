# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable Project Decisions

- The current product is a friends-only, non-commercial WeChat card-game experience.
- The game is landscape-first at a 16:9 design reference; do not redesign it as portrait without an explicit decision change.
- The selected visual direction is option 2, “Enchanted Teahouse / 奇术茶馆”, stored at `public/assets/selected-art-direction.png`.
- Preserve the warm lacquer, paper-card, lantern, ink-wash, animal-traveler visual language of the selected reference.
- The source game mechanics may be reproduced, but all names, symbols, card art, copy, branding, avatars, and decorative compositions must be original.
- Platform-specific code must not leak into the pure rules engine. The final WeChat Mini Program vs Mini Game choice is documented in `docs/04-platform-decision.md`.
- The default player experience is a 3–6 seat friend room with optional AI fill. Public matchmaking, monetization, chat, progression, and live operations are out of scope.
- Generated art masters, runtime-ready crops, screen mockups, and resource keys live under `art/`; read `art/README.md` and `art/asset-manifest.json` before implementing visible UI.
- Do not replace the generated lacquer, parchment, avatar, card, or UI assets with CSS drawings, inline SVG, emoji, text glyphs, generic placeholders, or unrelated icon packs.
- `packages/game-core` is the only rules/state-machine source. Web, Cocos, and future Node services must consume `@wizzard/game-core`; do not recreate `src/game` or copy the rules into an engine asset folder.
- `cocos-client/` is the formal Cocos Creator 3.8.x WeChat Mini Game client. React/Vite remains a visual and interaction validation tool only.
- Cocos-visible assets must be regenerated with `tools/sync-cocos-assets.mjs` / `npm run cocos:sync`; never hand-edit `AssetAddresses.generated.ts` or treat copied filenames as component APIs.

### Latest Visual QA Decisions (2026-08-05)

- On extra-wide landscape devices, use a scene-derived continuous home master; never mirror a screen crop or duplicate baked UI at the sides.
- The home-screen rules/settings hit target must stay inside the visible plaque and outside the WeChat system capsule safe area.
- The rules/settings header hierarchy is fixed as three readable levels: title scroll, tab row, then chapter navigation; chapter navigation must not overlap the content cards.

### Latest Visual QA Decisions (2026-08-06)

- Do not scale `scene.teahouse.table` above the 16:9 design size on the friend-room/home flow; scaling it made a second scene peek from under `screen.home` and created hard side seams on ultra-wide devices.
- Superseded on 2026-08-07: do not use separate home side-extension sprites; ultra-wide home now uses one continuous Mini Game master.
- Rules/settings hierarchy remains title scroll → tab row → chapter navigation → content cards; chapter buttons must stay compact and fully above the content cards, never overlapping body text.
- Do not stretch small plaque assets across nearly full panel width for footers or settings rows; keep readable mid widths so nine-slice corners stay intact.
- Rules-page chapter buttons use an even compact grid with intentional breathing room from the content cards and outer lacquer frame; title scrolls and page indicators must remain optically centered and inset from the frame.
- Keep rules/settings header, content, footer, and pager in explicit non-overlapping layout bands covered by `RulesSettingsLayout.test.ts`; do not fix visual collisions by repeatedly shrinking isolated controls.
- Browser rendering is only a rapid layout feedback loop. Final rules/settings visual acceptance must use the Cocos `wechatgame` build in WeChat DevTools or on a device.
- The shipping carrier is the WeChat Mini Game, not the web build. Web previews may diagnose layout quickly, but no screen or interaction is visually accepted until the Cocos `wechatgame` build is checked in WeChat DevTools or on a real device, including safe areas, the system capsule, texture scaling, and touch hit targets.

### Latest Visual QA Decisions (2026-08-07)

- Screenshot fixes are accepted against the WeChat Mini Game carrier only. A passing Web preview is diagnostic evidence, never final visual acceptance.
- Regenerated full-screen art must not replace the selected mock when it changes unrelated text, character placement, button geometry, or composition; screenshot-art fixes must stay local to the marked defect.
- The home screen no longer stitches left/right extension sprites at runtime. Standard 16:9 devices use `screen.home`; ultra-wide WeChat Mini Game devices use the single continuous `screen.home.wechat.ultrawide` master and center-crop it.
- Rules/settings uses a dedicated full-size lacquer backdrop rendered as one SIMPLE sprite; never nine-slice `ui.panel.primary` into a screen frame.
- Long parchment rows and compact plaques must preserve their authored height and extend only through a quiet horizontal center band; do not compress nine-slice top/bottom caps to fit shorter controls.
- Gameplay prediction/won HUD uses dedicated final-proportion SIMPLE sprites; the round sign must keep its authored aspect ratio and never be flattened with nine-slice.
- Round results uses one dedicated full-size SIMPLE panel with baked empty title, header, six-row, and footer bands. Runtime text, avatars, scores, and actions remain dynamic, while flowers stay outside the content-safe columns.
- Rules/settings text cards, visual-example cards, and settings rows use purpose-built final-aspect SIMPLE assets with decoration-free content safe areas; do not reuse ornate general-purpose panels for dense copy or card diagrams.
- Gameplay seats for 3–6 players must follow a wide, even oval around the table. Keep avatars at their authored size; compact secondary stats/card-count furniture before crowding adjacent players.
- The round sign, opponent seat cores, timer, central trick, trump status, and local hand each own explicit non-overlapping safety bands covered by `GameplayLayout.test.ts`.
- A result primary button must fill its authored final-proportion bitmap vertically. Do not rely on transparent ornament padding to make a short lacquer plaque appear tall enough at runtime.
- The gameplay trump status is a single-line compact band: dynamic suit icon plus one readable label must stay inside the authored `gameplay-stat-paper` content-safe area. Do not use the generic baked-sun `ui.trumpTile` for other suits.
- The round `ui.turnButton` keeps its authored 343:328 proportion and one shared position for both “你的\n回合” and “确认\n出牌”; both labels remain two-line compositions.
- When a shipped Mini Game bitmap is materially replaced, give the runtime path and semantic asset key a new version instead of reusing the prior UUID path; this prevents WeChat preview/device caches from retaining the old texture.
- Round-results action labels must stay inside each button's authored content-safe rect. Paper and green actions share a 32px design font and the same optical text baseline.
- The center trump status remains the primary HUD. Only while the local prediction modal is open, render a read-only duplicate above that modal in the bottom-right shared action lane; hide the duplicate in normal play so it never competes with turn actions.
- Round-results paper and green action plaques share a 100px visual height. Preserve their authored 2.4:1 and 3:1 proportions instead of shrinking the primary action independently.
- Round-results footer visuals must stay inside the baked parchment footer frame, not merely the panel bounds. Keep the action row centered at `y=-306`, exclude the rounded end caps from the visual safe area, and retain at least 10px outer and 20px inter-item design gaps.
- Shipping Cocos single-player practice uses a fresh session seed on every entry and local rematch. Fixed seeds remain injectable only for deterministic tests and bug replay; do not restore a hard-coded runtime practice seed.
- Quick mode exposes only one card in its opening round, so shipping practice also bounded-rerolls an immediately repeated visible opening hand. Explicit fixed-seed replay opts out by default unless the caller deliberately enables the guard.
