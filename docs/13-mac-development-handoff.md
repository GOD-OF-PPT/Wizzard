# Mac development handoff

Updated: 2026-08-10

This document is the cross-machine entry point for continuing Wizzard on macOS. Read `AGENTS.md` first; its durable product, visual, platform, asset, and WeChat Cloud Hosting decisions remain authoritative.

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
- The shipping Mini Game now uses the current AppID's private `wx.cloud.connectContainer` route instead of the rejected public CloudBase WSS domain.
- The WeChat release build now persists `resources` as an ordinary subpackage and automatically enforces 4 MiB main/30 MiB total limits. The current local result is 2.1090 MiB main and 29.3026 MiB total.
- New friend rooms default to no human turn countdown. The create dialog sends `turnTimerEnabled:false`; old clients that omit the optional field retain the 30-second path, so deploy the accepting Cloud Hosting server before the new Mini Game client.
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

The current Mini Game AppID owns WeChat Cloud Hosting environment `prod-d9g3qr6rqdbba6605` and dedicated single-instance service `wizzard-room-server`. The legacy Tencent Cloud CloudBase environment still contains unrelated project functions and must not be changed.

The deployed source revision includes the connected-two-human rule. It still uses `MemoryRoomRepository`; restarts discard rooms, and the service must remain at one minimum and one maximum instance until distributed ownership and pub/sub exist.

Recommended continuation order:

1. Pull this branch and rerun the checks above on macOS.
2. Build with AppID `wx4376a5b67a747d28`; confirm the generated template still contains the exact env/service/path `connectContainer` target and the build reports a passing `resources` subpackage/main/total package gate.
3. If server code changed, redeploy only `wizzard-room-server` in environment `prod-d9g3qr6rqdbba6605`; verify the private `GET /healthz` call and service status.
4. Keep minimum and maximum instances at `1`; do not enable distributed scaling before room ownership/pub-sub exists.
5. Import the `wechatgame` build into WeChat DevTools and manually verify package analysis, then test two-device create, join, ready, AI-fill, start, reconnect, and the repaired modal layout in the Mini Game carrier. No Socket legal-domain entry is required for this private route.
6. Capture the actual private-protocol request headers before configuring `WIZZARD_ALLOWED_ORIGINS`; do not guess and accidentally block the shipping client.

## Suggested skills

- `product-design:audit` for evidence-based Mini Game screenshot review.
- `diagnosing-bugs` for Cocos, `connectContainer`, WebSocket, or WeChat Cloud Hosting failures.
- `tdd` for protocol, room lifecycle, bot-fill, reconnect, or persistence changes.
- `github:yeet` for the next checked and publishable change set.
- `handoff` before another machine or session transfer.
