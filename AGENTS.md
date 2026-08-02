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
