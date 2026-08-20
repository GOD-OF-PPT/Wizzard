# Review Backlog

Compiled from three review subagent reports (game-core, room-protocol, room-server) during the Wizzard code-quality fix mission. Findings are organized by package and severity. Items marked **resolved** were addressed during the mission; all others are deferred for future triage.

---

## Severity Legend

| Severity | Meaning |
|----------|---------|
| **high** | Exploit risk or correctness issue that should be fixed before release |
| **medium** | Correctness, resource, or design concern worth scheduling |
| **low** | Minor issue, code smell, or hardening opportunity |
| **safe** | Reviewed and confirmed sound — no action needed |

---

## 1. game-core (`packages/game-core`)

### High

#### GC-05 — Authority leak through index.ts export

- **Severity:** high
- **Status:** Resolved (milestone m1, feature `authority-boundary`)
- **Files:** `packages/game-core/src/index.ts`, `packages/game-core/src/authority.ts`
- **Description:** `index.ts` previously had `export * from "./authority.js"`, leaking `advanceAuthoritativeMatch`, `applyMatchIntent`, `createMatch`, `createPlayerSnapshot`, and `getLegalCardIds` through the bare `@wizzard/game-core` specifier. Any consumer could import authority functions without going through the `/authority` subpath, undermining the public/private state separation. Fixed by removing the re-export and adding a vitest enforcement test that asserts authority symbols are `undefined` on the bare specifier. All consumers already used the `/authority` subpath, so no consumer changes were needed.

### Medium

#### GC-01 — Unbounded command cache

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/game-core/src/match.ts` (`acceptIntent`, `applyMatchIntent`, `AuthoritativeMatchState.commandEventCache`)
- **Description:** `AuthoritativeMatchState.commandEventCache` is a `Record<string, MatchEvent[]>` that grows without bound. Every accepted intent stores its cloned events under the `commandId` key. There is no eviction or size cap. Over a long match with many tricks and rounds, this cache accumulates every accepted intent's events for the entire match lifetime, consuming unbounded memory. The room-server's `commandHistory` is capped at 128 entries (`MAX_COMMAND_HISTORY`), but the match-state cache has no equivalent bound.

#### GC-02 — commandId cache bypasses validation

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/game-core/src/match.ts` (`applyMatchIntent`)
- **Description:** `applyMatchIntent` checks `state.commandEventCache[intent.commandId]` first and returns the cached events without any validation (version, phase, player, turn). A replayed commandId returns the same transition regardless of the current match state. While this provides idempotency, it means a cached commandId can be used to retrieve events even after the match has advanced to a completely different phase or version. The cache hit path skips all subsequent validation: version check, player existence, turn check, and phase-specific validation.

#### GC-07 — AI null-intent silent stall

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/game-core/src/ai.ts` (`chooseAiIntent`), `packages/game-core/src/match-driver.ts` (`executeMatchAction`)
- **Description:** `chooseAiIntent` returns `null` for any phase it does not explicitly handle (`trick-result`, `round-score`, `match-end`). When `executeMatchAction` receives a null intent, it returns `{ transition: { events: [], state } }` — no state change, no events. If the match-driver schedules a `turn` action for an unexpected phase (e.g., due to a race between scheduling and state transition), the `wake` path sees no state change, re-plans the deadline, and may loop without advancing the match. The server's `MatchScheduler.wake` handles this by re-planning, but the silent no-op makes diagnosis difficult.

### Low

#### GC-03 — Dead duplicate-command branch

- **Severity:** low
- **Status:** Open
- **Files:** `packages/game-core/src/match.ts` (`applyMatchIntent`)
- **Description:** After the `commandEventCache` check, `applyMatchIntent` checks `state.processedCommandIds.includes(intent.commandId)` and rejects with `DUPLICATE_COMMAND`. However, any command that was previously accepted would have been cached in `commandEventCache` and returned by the first check. The `processedCommandIds` array grows without bound but the `DUPLICATE_COMMAND` rejection path is effectively unreachable for previously accepted commands — the cache hit always fires first. The `processedCommandIds` field and the duplicate-check branch are dead code that should be removed or the two idempotency mechanisms should be consolidated.

#### GC-04 — Validation-order info leak

- **Severity:** low
- **Status:** Open
- **Files:** `packages/game-core/src/match.ts` (`applyMatchIntent`)
- **Description:** The validation order in `applyMatchIntent` reveals match state through distinct rejection codes. The order is: cache → duplicate → version (`STALE_VERSION`) → player (`PLAYER_NOT_FOUND`) → turn (`NOT_YOUR_TURN`) → phase-specific (`WRONG_PHASE`, `INVALID_TRUMP`, `BID_OUT_OF_RANGE`, `CARD_NOT_LEGAL`). A client can probe whether it is the current player's turn by observing whether it gets `NOT_YOUR_TURN` vs `WRONG_PHASE`, and can determine the current version by observing `STALE_VERSION`. While the match is friends-only and the information is not highly sensitive, the ordering could be hardened to avoid leaking state details to rejected intents.

#### GC-06 — No first-dealer draw ritual

- **Severity:** low
- **Status:** Open
- **Files:** `packages/game-core/src/match.ts` (`createMatch`)
- **Description:** `createMatch` always sets `dealerIndex` to 0 (or the configured `dealerIndex` value, defaulting to 0). There is no "draw for first dealer" ritual — the first dealer is always seat 0. The dealer rotates by one seat between rounds (`(state.dealerIndex + 1) % players.length`), but the initial dealer is deterministic. Some card-game traditions draw for the first dealer. This is a design choice, not a bug, but it means the player at seat 0 always deals the first round.

---

## 2. room-protocol (`packages/room-protocol`)

### Medium

#### F5 — Frame-size limit unit mismatch

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/room-protocol/src/validation.ts` (`MAX_FRAME_CHARACTERS`, `parseJson`), `packages/room-server/src/config.ts` (`maxFrameBytes`)
- **Description:** The protocol-level frame limit `MAX_FRAME_CHARACTERS = 16_384` counts UTF-16 code units (JavaScript string `.length`), while the WebSocket-level limit `maxFrameBytes = 16 * 1_024` (16,384) counts bytes. For multi-byte UTF-8 content (e.g., Chinese characters at 3 bytes each), 16,384 characters can produce up to ~49,152 bytes — far exceeding the 16,384-byte WebSocket limit. The gateway's `Buffer.byteLength(raw, "utf8") > this.config.maxFrameBytes` check catches this at the transport layer, but the protocol-level check uses a different unit, creating an inconsistency. A message with 10,000 Chinese characters would pass the character check (10,000 < 16,384) but fail the byte check (30,000 > 16,384).

#### F6 — Display-name bidi/spoofing gap

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/room-protocol/src/validation.ts` (`parseDisplayName`)
- **Description:** `parseDisplayName` validates length (1–16 characters after trim) and rejects ASCII control characters (`[\u0000-\u001f\u007f]`), but does not check for Unicode bidi override characters (U+202A–U+202E, U+2066–U+2069) or other spoofing primitives. A player could set a display name containing RIGHT-TO-LEFT OVERRIDE (U+202E) to render their name backwards, or use visually confusable characters to impersonate another player. In a friends-only context this is low-risk, but it could cause confusing or misleading UI rendering.

#### F7 — Room-code entropy ambiguity

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/room-protocol/src/messages.ts` (`ROOM_CODE_LENGTH`), `packages/room-server/src/identity/tokens.ts` (`generateRoomCode`)
- **Description:** New room codes are 6 digits drawn from `{2,3,4,5,6,7,8,9}` (8 possible digits), yielding `8^6 = 262,144` possible codes (~18 bits of entropy). The generation uses `node:crypto.randomInt` (cryptographically secure), but the small alphabet means the code space is enumerable in ~262K attempts. The separate invite token provides high-entropy access, but the room-code join path (F4 in room-server) accepts this low-entropy code directly. The entropy should be documented and the join-by-code path should be rate-limited (see room-server F4).

### Low

#### F1 — Legacy room-code no kill-switch

- **Severity:** low
- **Status:** Open
- **Files:** `packages/room-protocol/src/validation.ts` (`LEGACY_ROOM_CODE_PATTERN`, `isRoomCode`)
- **Description:** `isRoomCode` accepts both the new numeric format (`^[0-9]{6}$`) and the legacy safe-alphabet format (`^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$`). Per AGENTS.md, the legacy format is accepted "only for short-lived deployment compatibility," but there is no kill-switch, feature flag, or sunset date to disable it after the migration completes. The legacy pattern will remain accepted indefinitely unless explicitly removed.

#### F2 — avatarKey guard asymmetry

- **Severity:** low
- **Status:** Open
- **Files:** `packages/room-protocol/src/validation.ts` (`isAvatarKey`), `packages/room-protocol/src/game-validation.ts` (`isMatchPlayer`)
- **Description:** The protocol-level `isAvatarKey` guard checks the value against the `AVATAR_KEYS` constant (6 specific strings), but the game-validation `isMatchPlayer` guard uses `isBoundedString(value.avatarKey, 1, 128)` which accepts any 1–128 character string. This means the protocol rejects unknown avatar keys at the wire level, but the game-validation layer (used for server-to-client match snapshots) accepts any string. If a server ever sends a match snapshot with an avatar key not in `AVATAR_KEYS`, the protocol validation would reject the server message but the game-validation would accept it.

#### F3 — Unbounded ping clientTime

- **Severity:** low
- **Status:** Open
- **Files:** `packages/room-protocol/src/validation.ts` (`isServerTime`, `connection.ping` validation)
- **Description:** The `connection.ping` payload's `clientTime` field is validated with `isServerTime`, which only checks `Number.isFinite(value) && value >= 0`. There is no upper bound. A client can send an arbitrarily large `clientTime` (e.g., `Number.MAX_SAFE_INTEGER`). The server echoes it back in `connection.pong` without using it for any logic. While this is not a security vulnerability (the value is client-supplied and only echoed), it is an unbounded field that could be tightened with an upper bound (e.g., `now + 60_000`).

#### F4 — Magic-number 60 bid cap

- **Severity:** low
- **Status:** Open
- **Files:** `packages/room-protocol/src/game-validation.ts` (`parseMatchIntent`, `isMatchEvent`)
- **Description:** `parseMatchIntent` validates `value.bid <= 60` with a hardcoded magic number 60. This cap also appears in `isMatchEvent` for `bid-accepted` events. The number 60 is not derived from any constant or configuration — it appears to be a safe upper bound for the maximum possible bid (which is the hand size, at most 60 cards in a 6-player classic game). However, the game-core `validateBid` function already validates the bid against the actual `handSize`, so the protocol-level 60 is a redundant guard. If the game rules ever change to allow larger hands, this magic number would need to be updated independently.

### Safe

#### F8 — Prototype-pollution check safe

- **Severity:** safe
- **Status:** No action needed
- **Files:** `packages/room-protocol/src/guards.ts` (`hasOwn`, `hasOnlyKeys`)
- **Description:** `hasOwn` uses `Object.prototype.hasOwnProperty.call(value, key)`, which is safe against `__proto__` prototype pollution. `hasOnlyKeys` validates that every key on the object is in an explicit allowlist (required + optional keys), so `__proto__` and `constructor` keys are rejected. The `isRecord` guard excludes arrays and null. No prototype-pollution vector was found.

#### F9 — playerId server-authority safe

- **Severity:** safe
- **Status:** No action needed
- **Files:** `packages/room-server/src/room/SessionService.ts` (`createRoom`, `joinRoom`), `packages/room-protocol/src/validation.ts`
- **Description:** `playerId` is always generated by the server (`this.ctx.idFactory()` which defaults to `randomUUID`), never accepted from client input. The `room.create` and `room.join` payloads do not include a `playerId` field. The protocol's `isIdentifier` guard is used for server-to-client snapshot validation, not for client-to-server input. No client-supplied playerId path was found.

---

## 3. room-server (`packages/room-server`)

### High

#### F3 — No connection/room-creation caps

- **Severity:** high
- **Status:** Resolved (milestone m4, feature `rate-limiting`)
- **Files:** `packages/room-server/src/room/SessionService.ts` (`createRoom`), `packages/room-server/src/gateway/RoomWebSocketGateway.ts` (`consumeRoomCreationLimit`, `ConnectionContext`), `packages/room-server/src/config.ts` (`maxActiveRooms`, `maxRoomCreationsPerWindow`, `roomCreationWindowMs`)
- **Description:** Previously, there was no global active room cap and no per-socket room creation rate limit. An unauthenticated attacker could create unlimited rooms, exhausting server memory. Fixed by adding: (1) a global active room cap (`maxActiveRooms`, default 100) that rejects `room.create` with `ROOM_LIMIT_REACHED`, (2) a per-socket creation rate limit (`maxRoomCreationsPerWindow`, default 3 per `roomCreationWindowMs`, default 600,000ms) that rejects with `RATE_LIMITED`, and (3) calling `sweepExpired()` before checking the cap to reclaim expired rooms. `ROOM_LIMIT_REACHED` was added to `RequestErrorCode` and `REQUEST_ERROR_CODES`.

### Medium

#### F1 — TTL not sliding

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/room-server/src/room/room-shared.ts` (`expiryFor`)
- **Description:** `expiryFor` computes the match room TTL as `createdAt + matchRoomTtlMs` (a hard expiry from creation time), not a sliding window that extends on activity. A match that runs longer than `matchRoomTtlMs` (default 4 hours) will expire even while players are actively playing. The `offlineRoomTtlMs` (default 15 minutes) provides some sliding behavior for disconnected players (`Math.min(hardExpiry, expiresAt, now + offlineRoomTtlMs)`), but the hard cap `createdAt + matchRoomTtlMs` is always enforced. For very long matches, this could cause unexpected room expiration.

#### F2 — Unbounded match-state growth

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/game-core/src/match.ts` (`commandEventCache`, `processedCommandIds`), `packages/room-server/src/room/model.ts` (`RoomRecord.match`)
- **Description:** The `AuthoritativeMatchState` embedded in each `RoomRecord.match` contains two unbounded collections: `commandEventCache` (a `Record<string, MatchEvent[]>` keyed by commandId) and `processedCommandIds` (a `string[]`). Every accepted intent adds to both. The room-server's `commandHistory` is capped at 128 entries (`MAX_COMMAND_HISTORY`), but the match-state caches have no equivalent bound. For a long match, these grow without limit, increasing memory per room and the cost of `structuredClone` in `mutateRoom`.

#### F4 — Room-code-only join design

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/room-protocol/src/validation.ts` (`room.join` validation), `packages/room-server/src/room/SessionService.ts` (`locateJoinRoom`)
- **Description:** `room.join` accepts a 6-digit numeric room code (see room-protocol F7, ~262K possibilities) as a room locator. While the high-entropy invite token is the preferred locator, the room-code path allows brute-force enumeration. The server does not rate-limit join attempts by room code separately from the general 60-msg/10s rate limit. A client could attempt ~60 room codes per 10 seconds, enumerating the entire code space in ~12 hours. The `ROOM_LIMIT_REACHED` and per-socket creation rate limit (F3, resolved) do not apply to joins.

#### F5 — Single-attempt CAS

- **Severity:** medium
- **Status:** Open
- **Files:** `packages/room-server/src/room/SessionService.ts` (`saveOrThrow`, `joinRoom`, `resumeSession`)
- **Description:** `saveOrThrow` in `SessionService` performs a single `compareAndSwap` and throws `INTERNAL_ERROR` on conflict. Unlike `mutateRoom` (used by `execute` and `wake`), which retries CAS up to 4 times, the join and resume paths have no retry. Under concurrent join/resume attempts for the same room (e.g., two players joining simultaneously), one will fail with `INTERNAL_ERROR` even though the room state is valid. The `joinRoom` method runs inside a `RoomQueue.run` (per-room serialization), so concurrent joins to the same room are serialized, but the CAS conflict can still occur if a `wake` or `execute` modifies the room between the `loadById` and `compareAndSwap` in `joinRoom`.

### Low

#### F8 — Fixed-window rate limiter burst

- **Severity:** low
- **Status:** Open
- **Files:** `packages/room-server/src/gateway/RoomWebSocketGateway.ts` (`consumeRateLimit`)
- **Description:** `consumeRateLimit` uses a fixed-window algorithm: 60 messages per 10-second window. At the boundary of two windows, a client can send 120 messages in approximately 10 seconds (60 at the end of one window, 60 at the start of the next). A sliding window or token bucket algorithm would smooth the rate and prevent this burst. The same fixed-window pattern is used by `consumeRoomCreationLimit` (3 per 10 minutes), though the burst risk there is lower due to the smaller limit.

#### F9 — No periodic room sweep

- **Severity:** low
- **Status:** Open
- **Files:** `packages/room-server/src/room/SessionService.ts` (`createRoom`), `packages/room-server/src/persistence/MemoryRoomRepository.ts` (`sweepExpired`)
- **Description:** `sweepExpired()` is only called during `createRoom` (added in the rate-limiting feature), not on a periodic timer. Expired rooms linger in the `MemoryRoomRepository`'s in-memory map until a new room creation triggers the sweep. If no new rooms are created for a long time, expired rooms remain in memory. The `MemoryRoomRepository` does lazily prune expired rooms on access (`pruneRoom` in `getCurrent`, `loadById`, etc.), but the `countActive` method iterates all rooms including expired ones (though it filters by `expiresAt > now`). A periodic sweep timer would reclaim expired rooms more promptly and keep the `countActive` result accurate.

#### F10 — Idempotency history bounded by MAX_COMMAND_HISTORY

- **Severity:** low
- **Status:** Open
- **Files:** `packages/room-server/src/room/room-shared.ts` (`MAX_COMMAND_HISTORY`, `rememberRoomCommand`), `packages/room-server/src/room/RoomCoordinator.ts` (`execute`)
- **Description:** The room-level `commandHistory` is capped at 128 entries (`MAX_COMMAND_HISTORY`). When the cap is exceeded, the oldest entries are evicted (`splice(0, length - 128)`). If a client replays a command whose `commandKey` was evicted, the server treats it as a new command rather than a duplicate. This breaks the idempotency guarantee for room commands (set-ready, start, leave, etc.) after 128 distinct commands. In practice, 128 room commands is a high bar for a single match, but the eviction means the idempotency window is finite. The match-intent idempotency (`commandEventCache`) is separate and unbounded (see F2).

### Safe

#### F6 — Tokens/RNG/config sound

- **Severity:** safe
- **Status:** No action needed
- **Files:** `packages/room-server/src/identity/tokens.ts`, `packages/room-server/src/random/HmacCounterRandom.ts`, `packages/room-server/src/config.ts`
- **Description:** Token generation uses `node:crypto.randomBytes` (32 bytes, base64url-encoded) and `node:crypto.randomInt` for room codes — both cryptographically secure. Token verification uses `timingSafeEqual` for constant-time comparison, preventing timing attacks. The HMAC counter random state uses SHA-256 with a 32-byte key and a monotonically increasing counter, providing deterministic-but-unpredictable random values. Config values are validated as positive integers with safe fallbacks. No token, RNG, or config issues were found.

#### F7 — Projection leak-free

- **Severity:** safe
- **Status:** No action needed
- **Files:** `packages/room-server/src/room/projection.ts` (`createRoomUpdatePayload`, `createRoomSnapshot`, `createRoomPermissions`), `packages/game-core/src/match.ts` (`createPlayerSnapshot`)
- **Description:** `createPlayerSnapshot` destructures and excludes `commandEventCache`, `hands`, and `processedCommandIds` from the public state. The projection (`createRoomUpdatePayload`) only includes match data when the viewer is a player in the match (`room.match.players.some(p => p.id === viewerPlayerId)`). `createRoomSnapshot` exposes only public player fields (avatarKey, connected, isAi, joinedAt, name, playerId, ready) — no session tokens, resume token hashes, or join request fingerprints. No private data leak was found.

---

## 4. Test Infrastructure

### Medium

#### Item 7 — Vitest source-vs-dist aliasing

- **Severity:** medium
- **Status:** Noted, deferred
- **Files:** `vitest.config.ts`
- **Description:** `vitest.config.ts` aliases `@wizzard/game-core` to the TypeScript source (`./packages/game-core/src/index.ts`) instead of the compiled dist build (`./packages/game-core/dist/index.js`). The same aliasing applies to the `/contracts` and `/authority` subpaths. This means vitest tests run against the source, not the published package output. If the dist build has a different export structure, tree-shaking behavior, or compilation artifact (e.g., a missing re-export that the source has but the build drops), tests would pass against source but fail against dist. The `cocos:check` script (added in milestone m1) verifies that dist directories exist before the Cocos editor preview, but vitest itself never validates the dist output. This gap means the CI `typecheck-and-test` job (which uses vitest) does not catch dist-build regressions. The `build:wechat` job exercises the dist indirectly through the Cocos build, but only on the self-hosted runner. Consider adding a dist-alias test mode or a separate CI step that runs tests against the built dist to close this gap.

---

## Summary

| Package | High | Medium | Low | Safe | Total |
|---------|------|--------|-----|------|-------|
| game-core | 1 (resolved) | 3 | 3 | 0 | 7 |
| room-protocol | 0 | 3 | 4 | 2 | 9 |
| room-server | 1 (resolved) | 4 | 3 | 2 | 10 |
| Test infra | 0 | 1 | 0 | 0 | 1 |
| **Total** | **2** | **11** | **10** | **4** | **27** |

### Resolved during this mission

- **GC-05**: Authority leak through index.ts export (milestone m1)
- **F3 (room-server)**: No connection/room-creation caps (milestone m4)

### Safe — no action needed

- **F8 (room-protocol)**: Prototype-pollution check safe
- **F9 (room-protocol)**: playerId server-authority safe
- **F6 (room-server)**: Tokens/RNG/config sound
- **F7 (room-server)**: Projection leak-free

### Deferred for future triage

All remaining findings (GC-01, GC-02, GC-03, GC-04, GC-06, GC-07, protocol F1–F7, server F1, F2, F4, F5, F8, F9, F10, and the vitest aliasing note) are documented here for future prioritization. None block the current release.
