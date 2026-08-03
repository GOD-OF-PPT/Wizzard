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
