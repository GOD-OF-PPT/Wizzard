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

Useful workspace commands:

```text
npm run room:dev
npm run room:start
npm run typecheck --workspace @wizzard/room-server
npm run test --workspace @wizzard/room-server
```

Production deployments must terminate TLS as `wss://`, set an origin allowlist
with `WIZZARD_ALLOWED_ORIGINS` (or when constructing the service), use Redis,
and keep logs free of invite/resume
tokens, RNG keys, authoritative state, and private hands.

## CloudBase Run trial

The repository root `Dockerfile` builds only `game-core`, `room-protocol`, and
this service. It runs as the non-root Node user, reads CloudBase's injected
`PORT`, exposes `GET /healthz`, and upgrades WebSocket requests only at `/ws`.

Build the same image locally with:

```text
npm run room:docker:build
```

Use these CloudBase container settings:

- service name: `wizzard-room-server`;
- container port: `8080`;
- health check: `GET /healthz`;
- minimum instances: `1`;
- maximum instances: `1`;
- public WebSocket path: `wss://<service-domain>/ws`.

The first trial intentionally leaves `WIZZARD_REDIS_URL` unset. A container
restart or new deployment therefore discards active rooms. Adding Redis
improves persistence but does not make horizontal scaling safe: distributed
room leases and pub/sub are still required before increasing the maximum
instance count. Leave `WIZZARD_ALLOWED_ORIGINS` unset until the actual WeChat
Mini Game `Origin` behavior has been captured in DevTools and on a device.
