# Mac development handoff

Updated: 2026-08-08

This document is the cross-machine entry point for continuing Wizzard on macOS. Read `AGENTS.md` first; its durable product, visual, platform, asset, and CloudBase decisions remain authoritative.

## Checkout

```bash
git clone https://github.com/GOD-OF-PPT/Wizzard.git
cd Wizzard
git switch codex/cocos-ui-practice-fixes
npm install
npm test
npm run typecheck
npm run cocos:build:wechat
```

Use Node.js 22 and Cocos Creator 3.8.8. Open `cocos-client/` as the Creator project. The shipping carrier is the landscape WeChat Mini Game; React/Vite and Cocos Web builds are diagnostic aids only.

## Current change set

- Friend-room create/join dialogs now use five dedicated, versioned, high-resolution SIMPLE assets instead of stretching the generic lacquer panel.
- `FriendRoomDialogLayout.ts` owns modal safe rectangles and non-overlapping title, avatar, field, option, and action bands.
- Create-room exposes an explicit AI-fill toggle. At least two connected real players, including the host, must be ready before bots may fill remaining seats.
- The shared `MIN_HUMAN_PLAYERS` constant is enforced by the Cocos lobby and authoritative room server. A ready player who disconnects no longer counts toward the minimum.
- Art manifests, Cocos resource addresses, layout/server tests, durable decisions, and design-QA evidence were updated with the implementation.

For detail, use these source-of-truth files rather than repeating their content here:

- `design-qa.md` — latest friend-room modal comparison and build evidence.
- `art/README.md` and `art/asset-manifest.json` — generated masters, runtime assets, semantic keys, and safe rectangles.
- `docs/09-friend-room-service.md` — WebSocket service and protocol behavior.
- `docs/12-cloudbase-room-deployment.md` — deployed service contract and limitations.
- `cocos-client/test/FriendRoomDialogLayout.test.ts` — modal geometry guardrails.
- `packages/room-server/test/RoomCoordinator.test.ts` — two-human/AI-fill authority tests.

## Verified before handoff

- Full Vitest suite and full TypeScript checks pass.
- `npm run cocos:build:wechat` succeeds and keeps `deviceOrientation=landscape`.
- The Mini Game resource bundle contains all five new `/texture` paths, with native PNG dimensions and hashes matching the synchronized sources.
- Create/join input, AI toggle, and navigation states were checked in the Cocos Web diagnostic build with no console errors.
- WeChat DevTools/device visual acceptance was intentionally not automated and remains manual.

## External state and next steps

CloudBase currently runs the dedicated single-instance service `wizzard-room-server`. Do not touch the environment's unrelated cloud functions.

The deployed revision predates the latest connected-two-human rule, so redeploy this service before treating that rule as live. It still uses `MemoryRoomRepository`; restarts discard rooms, and the service must remain at one minimum and one maximum instance until distributed ownership and pub/sub exist.

Recommended continuation order:

1. Pull this branch and rerun the checks above on macOS.
2. Redeploy only `wizzard-room-server`; verify `GET /healthz` and `/ws`.
3. Bind an ICP-compliant subdomain in CloudBase HTTP Gateway, associate `/` with path pass-through, and place the exact CloudBase-provided CNAME in Cloudflare as DNS-only initially.
4. Verify `https://<domain>/healthz` and `wss://<domain>/ws`.
5. Update `cocos-client/build-templates/wechatgame/game.js` and its compatibility test to the custom WSS endpoint, then rebuild.
6. Register the custom host as the WeChat Mini Game socket domain and manually verify two-device create, join, ready, AI-fill, start, reconnect, and the repaired modal layout.
7. Capture the actual WeChat `Origin` before configuring `WIZZARD_ALLOWED_ORIGINS`; do not guess and accidentally block the shipping client.

## Suggested skills

- `product-design:audit` for evidence-based Mini Game screenshot review.
- `diagnosing-bugs` for Cocos, TLS, WebSocket, or CloudBase gateway failures.
- `tdd` for protocol, room lifecycle, bot-fill, reconnect, or persistence changes.
- `github:yeet` for the next checked and publishable change set.
- `handoff` before another machine or session transfer.
