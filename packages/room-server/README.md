# @wizzard/room-server

Node.js authoritative friend-room service for Wizzard. It exposes `GET /healthz`
and a versioned text WebSocket endpoint at `/ws`.

The gateway authenticates one room session per socket. Clients submit intents;
`@wizzard/game-core` remains the only rules engine. Every update is projected
separately for its viewer, so another player's hand and the authoritative deck
never enter the wire payload.

The default runtime uses `MemoryRoomRepository`. Set `WIZZARD_REDIS_URL` to use
the revision-CAS Redis repository. Redis stores room JSON and indexes with the
same TTL; sockets are never persisted.

The checked-in runtime is intentionally single-active-instance. Horizontal
scaling still requires a distributed room lease plus Redis pub/sub so timers
and broadcasts have one owner.

New Mini Game rooms send `room.create.turnTimerEnabled:false` by default, so
human trump selection, bidding, and card-play turns have no deadline. AI turns,
trick-result display, and round advancement remain timed by the server. Older
clients omit this optional field and retain the established 30-second human
deadline. A disconnected current player receives a hidden 30-second reconnect
grace; resuming cancels it, while expiry prevents an abandoned room from
deadlocking. Deploy the accepting server before a client that sends the new key.

Useful workspace commands:

```text
npm run room:dev
npm run room:start
npm run typecheck --workspace @wizzard/room-server
npm run test --workspace @wizzard/room-server
```

The shipping Mini Game does not expose this service as public `wss://`. It uses
the current AppID's private WeChat Cloud Hosting transport described below.
Keep logs free of invite/resume tokens, RNG keys, authoritative state, and
private hands. Leave `WIZZARD_ALLOWED_ORIGINS` unset until the actual private
transport headers have been captured in WeChat DevTools and on a real device;
guessing an Origin can reject the shipping client.

## AppID-bound WeChat Cloud Hosting

The repository root `Dockerfile` builds only `game-core`, `room-protocol`, and
this service. It runs as the non-root Node user, reads Cloud Hosting's injected
`PORT`, exposes `GET /healthz`, and upgrades WebSocket requests only at `/ws`.

Build the same image locally with:

```text
npm run room:docker:build
```

The active deployment settings are:

- Mini Game AppID: `wx4376a5b67a747d28`;
- Cloud Hosting environment: `prod-d9g3qr6rqdbba6605`;
- service name: `wizzard-room-server`;
- container port: `8080`;
- health check: `GET /healthz`;
- minimum instances: `1`;
- maximum instances: `1`;
- public service access: disabled;
- Mini Game transport: `wx.cloud.connectContainer({ path: "/ws" })`.

The client passes the environment and service explicitly:

```ts
await wx.cloud.init({ traceUser: true });
const { socketTask } = await wx.cloud.connectContainer({
  config: { env: "prod-d9g3qr6rqdbba6605" },
  service: "wizzard-room-server",
  path: "/ws",
});
```

Because the Mini Game and Cloud Hosting service belong to the same AppID, this
route does not require a public IP, Cloudflare/custom domain, ICP filing, or a
Socket legal-domain entry. `connectContainer` requires WeChat base library
2.21.1 or newer; this project fixes its generated Mini Game configuration at
2.23.0.

Cloud Hosting's private debugger has returned HTTP 200 from `GET /healthz`.
That proves the container health contract only; the WebSocket upgrade,
heartbeat, reconnect, session resume, and two-player game flow still require
manual testing through the WeChat Mini Game carrier. Web or generic WebSocket
tests do not replace that release acceptance.

The matching Mini Game release build now declares the `resources` ordinary
subpackage and passes the repository's automated 4 MiB main-package / 30 MiB
total-package gates (2,211,407 B / 2.1090 MiB main, 28,514,601 B / 27.1936 MiB
resources, 30,726,008 B / 29.3026 MiB total). This removes the local upload-size
blocker but does not replace manual package analysis in WeChat DevTools or the
two-device private-transport test.

The current deployment intentionally leaves `WIZZARD_REDIS_URL` unset. A
container restart or new deployment therefore discards active rooms. Adding Redis
improves persistence but does not make horizontal scaling safe: distributed
room leases and pub/sub are still required before increasing the maximum
instance count. Keep the service at exactly one minimum and one maximum
instance until that work is complete.

The legacy Tencent Cloud CloudBase trial environment
`mini-pro-d9gbcemh17af17f1b` and its unrelated cloud functions belong to other
projects. Do not edit, redeploy, rename, or delete them, and do not restore the
old public `sh.run.tcloudbase.com` endpoint in a shipping build. See
`docs/12-cloudbase-room-deployment.md` for the full deployment and verification
record.
