# WeChat Cloud Hosting friend-room deployment

Status: **deployed for the current Mini Game AppID on 2026-08-10.**

The file name is retained for existing links, but the shipping transport is no
longer the public Tencent Cloud CloudBase trial endpoint.

## Active AppID-bound deployment

| Setting | Value |
| --- | --- |
| Mini Game AppID | `wx4376a5b67a747d28` |
| WeChat Cloud Hosting environment | `prod-d9g3qr6rqdbba6605` (`prod`, Shanghai) |
| Service | `wizzard-room-server` |
| Online version after instance configuration | `wizzard-room-server-002` |
| Source repository | `https://github.com/GOD-OF-PPT/Wizzard` |
| Source branch | `codex/cocos-ui-practice-fixes` |
| Build context / Dockerfile | repository root / `Dockerfile` |
| Container port | `8080` |
| Minimum / maximum instances | `1` / `1` |
| Public service access | disabled |
| Mini Game transport | `wx.cloud.connectContainer` to `/ws` |

The Mini Game calls the container through WeChat's private protocol:

```ts
await wx.cloud.init({ traceUser: true });
const { socketTask } = await wx.cloud.connectContainer({
  config: { env: "prod-d9g3qr6rqdbba6605" },
  service: "wizzard-room-server",
  path: "/ws",
});
```

This route is owned by the same AppID and does not require a public WSS domain,
Cloudflare DNS, ICP-compliant custom domain, or a Socket legal-domain entry.
`connectContainer` requires WeChat base library 2.21.1 or newer; 2.23.0 or newer
is preferred for device troubleshooting consistency.

## Verification evidence

The initial source deployment created version `wizzard-room-server-001`. Saving
the required one-minimum/one-maximum instance policy created
`wizzard-room-server-002`, which the console reports as healthy with one
instance.

Cloud Hosting's AppID-private debugger called `GET /healthz` and returned HTTP
200 with:

```json
{
  "service": "wizzard-room",
  "status": "ok"
}
```

The response included `X-Cloudbase-Upstream-Status-Code: 200` and a 9 ms
upstream time. The console's HTTP debugger does not prove the full WebSocket
upgrade; two-device `connectContainer` verification remains a manual Mini Game
acceptance task and must not be replaced by Web acceptance.

## Resource boundary

The legacy Tencent Cloud CloudBase environment
`mini-pro-d9gbcemh17af17f1b` and its unrelated cloud functions remain outside
this project's deployment scope. Do not edit, redeploy, rename, or delete those
functions. The old service and public origin
`wizzard-room-server-293680-4-1254409409.sh.run.tcloudbase.com` may be retained
temporarily for rollback diagnostics, but shipping builds must not connect to
it.

## Runtime contract

The root `Dockerfile` builds `@wizzard/game-core`,
`@wizzard/room-protocol`, and `@wizzard/room-server`, then runs the compiled
room server as the non-root Node user. Its Cloud Hosting contract is:

- `PORT`: platform-injected listening port, preferred over
  `WIZZARD_ROOM_PORT`;
- `GET /healthz`: liveness endpoint;
- `/ws`: the only WebSocket upgrade path;
- `SIGTERM`: graceful gateway, HTTP server, and repository shutdown.

Public and internal test domains are disabled. Public egress remains enabled so
future server integrations are not silently blocked. `WIZZARD_ALLOWED_ORIGINS`
remains unset until the actual private-protocol headers are captured on a real
device; guessing an Origin can lock out the Mini Game.

## State limitations

The current deployment uses `MemoryRoomRepository`. Publishing a new version or
restarting the container discards active rooms. The service must stay at one
application instance because sockets, timers, broadcasts, and room ownership
are process-local. Redis persistence alone does not make multi-instance routing
safe; distributed leases and pub/sub are required first.

Low-frequency Cloud Hosting environments may be frozen after prolonged
inactivity. Check service status before an external playtest and retain basic
usage/alerting reminders.

## Build and release checks

For the turn-timer rollout, first deploy a server version that accepts optional
`room.create.turnTimerEnabled`, verify its private health endpoint, and only
then upload the Mini Game client that sends `false` by default. Older clients
omit the field and continue to receive the established 30-second behavior; an
older strict server rejects the new payload key.

Before publishing a new version:

```powershell
npm test
npm run typecheck
npm run cocos:build:wechat
npm run room:docker:build
```

The WeChat build script verifies all of the following:

- landscape `game.json`;
- AppID `wx4376a5b67a747d28` in `project.config.json`;
- environment `prod-d9g3qr6rqdbba6605`;
- service `wizzard-room-server`;
- path `/ws`;
- `wechat-cloud-container` transport in the shipping template.
- compiled `connectContainer` transport in `assets/main/index.js`;
- the declared `resources` ordinary subpackage;
- the 4 MiB main-package and 30 MiB total-package limits.

The latest local release build measures 2,211,407 bytes in the main package,
28,514,601 bytes in the `resources` subpackage, and 30,726,008 bytes total.
These automated measurements remove the local size blocker but do not replace
WeChat DevTools package analysis.

After deployment, verify private `GET /healthz`, service health, one running
instance, and then manually test two-device create/join/ready/AI-fill/start,
heartbeat, reconnect, and session resume through the WeChat Mini Game carrier.
Verify one default room with no human countdown and one room with the option
disabled so the 30-second server takeover path is also covered.
