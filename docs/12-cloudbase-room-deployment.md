# CloudBase friend-room deployment

Status: **container image and local smoke test verified; CloudBase service activation and deployment are environment operations.**

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
| Health check | `GET /healthz` |
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

After deployment, verify:

1. `https://<service-domain>/healthz` returns
   `{ "service": "wizzard-room", "status": "ok" }`;
2. `wss://<service-domain>/ws` emits `connection.ready`;
3. the connection remains open for more than 70 seconds;
4. creating and joining a room affects only `wizzard-room-server` and leaves
   every pre-existing CloudBase function unchanged.
