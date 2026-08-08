# CloudBase friend-room deployment

Status: **deployed and protocol-verified in CloudBase on 2026-08-08.**

## Active trial deployment

| Setting | Value |
| --- | --- |
| CloudBase environment | `mini-pro-d9gbcemh17af17f1b` |
| Service | `wizzard-room-server` |
| Deployment | `001` |
| Source repository | `https://github.com/GOD-OF-PPT/Wizzard` |
| Source branch | `codex/cocos-ui-practice-fixes` |
| Default HTTPS origin | `https://wizzard-room-server-293680-4-1254409409.sh.run.tcloudbase.com` |
| WebSocket endpoint | `wss://wizzard-room-server-293680-4-1254409409.sh.run.tcloudbase.com/ws` |

The default CloudBase domain is suitable for this disposable trial but the
CloudBase console documents rate, feature, and stability limitations. Replace
it with a project-owned custom domain before a production release.

## Resource boundary

Deploy Wizzard only as the dedicated CloudBase Run service
`wizzard-room-server`. Existing CloudBase functions in the selected environment
belong to other projects and are outside this deployment's scope. Do not edit,
redeploy, rename, or delete them.

## Build contract

The root `Dockerfile` uses three stages:

1. install development dependencies and build `@wizzard/game-core`,
   `@wizzard/room-protocol`, and `@wizzard/room-server`;
2. install only the room server's production dependency graph;
3. run the compiled service as the non-root Node user.

`.dockerignore` allowlists only these three packages and their build inputs, so
Cocos assets, QA screenshots, local caches, existing `dist/` folders, and
workspace credentials never enter the build context.

The runtime contract is:

- `PORT`: CloudBase-injected listening port, preferred over
  `WIZZARD_ROOM_PORT`;
- `GET /healthz`: liveness endpoint;
- `/ws`: the only WebSocket upgrade path;
- `SIGTERM`: graceful gateway, HTTP server, and repository shutdown.

## CloudBase settings

| Setting | Value |
| --- | --- |
| Service name | `wizzard-room-server` |
| Deployment type | Container CloudBase Run |
| Container port | `8080` |
| Health endpoint | `GET /healthz` |
| Minimum instances | `1` |
| Maximum instances | `1` |
| Redis | Unset for the first disposable trial |
| Origin allowlist | Unset until WeChat runtime headers are verified |

CloudBase closes a WebSocket that transfers no data for about 60 seconds. The
gateway currently sends WebSocket control pings and application heartbeat
messages every 15 seconds, so active clients remain below that limit.

## State limitations

The initial deployment uses `MemoryRoomRepository`. Publishing a new version,
restarting the container, or platform migration discards active rooms. Setting
`WIZZARD_REDIS_URL` enables revision-CAS room persistence, but the service must
still remain single-instance because sockets, timers, and broadcasts do not yet
have a distributed owner or pub/sub channel.

## Verification

Before CloudBase deployment, run:

```powershell
npm test
npm run typecheck --workspace @wizzard/room-server
npm run room:docker:build
```

The 2026-08-08 CloudBase deployment passed these checks:

1. `GET /healthz` returned HTTP 200 with
   `{ "service": "wizzard-room", "status": "ok" }`;
2. `/ws` emitted protocol-v1 `connection.ready` with a 15-second heartbeat;
3. the public WebSocket remained open for 75.6 seconds and closed normally
   only when the verification client requested it;
4. deployment `001` was healthy, served 100% of traffic, and ran exactly one
   instance with the configured `1`-to-`1` instance range;
5. the pre-existing `get-room-view` and `execute-command` functions remained
   healthy and retained their prior 2026-08-01 modification timestamps.

`cocos-client/build-templates/wechatgame/game.js` injects the trial WebSocket
endpoint only when no earlier runtime configuration exists. Before device
testing, register the chosen `wss://` host as an allowed WeChat socket domain.
WeChat DevTools and real-device acceptance remain an explicit manual step.
