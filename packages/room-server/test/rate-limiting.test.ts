import { WebSocket } from "ws";
import {
  decodeServerMessage,
  encodeClientMessage,
  type ClientRoomMessage,
  type ServerRoomMessage,
} from "@wizzard/room-protocol";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  type RoomServiceConfig,
} from "../src/config.js";
import { createRoomService, type RoomService } from "../src/index.js";
import { MemoryRoomRepository } from "../src/persistence/index.js";
import {
  RoomCoordinator,
  type RoomRecord,
} from "../src/index.js";

// ─── Coordinator-level helpers ────────────────────────────────────────

function createMessage(name: string, requestId?: string) {
  return {
    payload: {
      avatarKey: "bamboo-cat" as const,
      displayName: name,
      maxPlayers: 3 as const,
      mode: "quick" as const,
    },
    requestId: requestId ?? `create-${name}`,
    type: "room.create" as const,
    v: 1 as const,
  };
}

// ─── Gateway-level helpers ───────────────────────────────────────────

class SocketProbe {
  private readonly messages: ServerRoomMessage[] = [];
  private readonly waiters = new Set<() => void>();

  private constructor(public readonly socket: WebSocket) {
    socket.on("message", (raw) => {
      const decoded = decodeServerMessage(raw.toString());
      if (!decoded.ok) {
        throw new Error(`Server sent an invalid frame: ${decoded.error}`);
      }
      this.messages.push(decoded.value);
      for (const notify of this.waiters) {
        notify();
      }
    });
  }

  public static async connect(url: string): Promise<SocketProbe> {
    const socket = new WebSocket(url);
    const probe = new SocketProbe(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once("open", () => resolve());
      socket.once("error", reject);
    });
    await probe.waitFor((message) => message.type === "connection.ready");
    return probe;
  }

  public send(message: ClientRoomMessage): void {
    this.socket.send(encodeClientMessage(message));
  }

  public async waitFor<TMessage extends ServerRoomMessage>(
    predicate: (message: ServerRoomMessage) => message is TMessage,
    timeoutMs?: number,
  ): Promise<TMessage>;
  public async waitFor(
    predicate: (message: ServerRoomMessage) => boolean,
    timeoutMs?: number,
  ): Promise<ServerRoomMessage>;
  public async waitFor(
    predicate: (message: ServerRoomMessage) => boolean,
    timeoutMs = 2_000,
  ): Promise<ServerRoomMessage> {
    const existing = this.messages.find(predicate);
    if (existing) {
      this.messages.splice(this.messages.indexOf(existing), 1);
      return existing;
    }

    return new Promise<ServerRoomMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiters.delete(check);
        reject(new Error("Timed out waiting for WebSocket message."));
      }, timeoutMs);
      const check = () => {
        const found = this.messages.find(predicate);
        if (!found) {
          return;
        }
        clearTimeout(timer);
        this.waiters.delete(check);
        this.messages.splice(this.messages.indexOf(found), 1);
        resolve(found);
      };
      this.waiters.add(check);
      check();
    });
  }

  public async close(): Promise<void> {
    if (this.socket.readyState === WebSocket.CLOSED) {
      return;
    }
    await new Promise<void>((resolve) => {
      this.socket.once("close", () => resolve());
      this.socket.close(1000, "test complete");
    });
  }
}

function wsCreateMessage(name: string, requestId: string) {
  return {
    payload: {
      avatarKey: "bamboo-cat" as const,
      displayName: name,
      maxPlayers: 3 as const,
      mode: "quick" as const,
    },
    requestId,
    type: "room.create" as const,
    v: 1 as const,
  };
}

function wsLeaveMessage(requestId: string) {
  return {
    payload: {},
    requestId,
    type: "room.leave" as const,
    v: 1 as const,
  };
}

function wsJoinMessage(name: string, inviteToken: string, requestId: string) {
  return {
    payload: {
      avatarKey: "flower-fox" as const,
      displayName: name,
      inviteToken,
    },
    requestId,
    type: "room.join" as const,
    v: 1 as const,
  };
}

// ─── Coordinator-level rate limiting tests ────────────────────────────

describe("room creation global cap (coordinator)", () => {
  it("rejects with ROOM_LIMIT_REACHED when active rooms reach the cap", async () => {
    let now = 1_000_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({
      clock: () => now,
      config: { maxActiveRooms: 2 },
      repository,
    });

    await coordinator.createRoom(createMessage("Host1"), now);
    await coordinator.createRoom(createMessage("Host2"), now);

    await expect(
      coordinator.createRoom(createMessage("Host3"), now),
    ).rejects.toMatchObject({ code: "ROOM_LIMIT_REACHED" });
  });

  it("allows room creation when under the cap", async () => {
    const now = 1_000_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({
      clock: () => now,
      config: { maxActiveRooms: 100 },
      repository,
    });

    const result = await coordinator.createRoom(createMessage("Host"), now);
    expect(result.grant.playerId).toBeTruthy();
    expect(result.grant.roomCode).toMatch(/^\d{6}$/);
  });

  it("calls sweepExpired before checking the room cap", async () => {
    let now = 1_000_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const sweepSpy = vi.spyOn(repository, "sweepExpired");
    const coordinator = new RoomCoordinator({
      clock: () => now,
      config: { maxActiveRooms: 2, lobbyRoomTtlMs: 5_000 },
      repository,
    });

    await coordinator.createRoom(createMessage("Host1"), now);
    await coordinator.createRoom(createMessage("Host2"), now);
    expect(sweepSpy).toHaveBeenCalledTimes(2);

    // Advance time past the lobby TTL so both rooms expire.
    now += 10_000;

    // The third creation should succeed because sweepExpired reclaims the
    // expired rooms before the cap check.
    const result = await coordinator.createRoom(createMessage("Host3"), now);
    expect(result.grant.playerId).toBeTruthy();
    expect(sweepSpy).toHaveBeenCalledTimes(3);
    expect(sweepSpy).toHaveBeenLastCalledWith(now);
  });

  it("does not count expired rooms toward the active room cap", async () => {
    let now = 1_000_000;
    const repository = new MemoryRoomRepository<RoomRecord>(() => now);
    const coordinator = new RoomCoordinator({
      clock: () => now,
      config: { maxActiveRooms: 2, lobbyRoomTtlMs: 5_000 },
      repository,
    });

    // Create 2 rooms (at the cap).
    await coordinator.createRoom(createMessage("Host1"), now);
    await coordinator.createRoom(createMessage("Host2"), now);

    // Advance time past the lobby TTL so both rooms expire.
    now += 10_000;

    // Two more rooms should be creatable because the expired ones are swept
    // and not counted toward the cap.
    await coordinator.createRoom(createMessage("Host3"), now);
    await coordinator.createRoom(createMessage("Host4"), now);

    // A fifth room should be rejected — the cap is 2 active rooms.
    await expect(
      coordinator.createRoom(createMessage("Host5"), now),
    ).rejects.toMatchObject({ code: "ROOM_LIMIT_REACHED" });
  });
});

// ─── Config defaults tests ────────────────────────────────────────────

describe("rate limiting config defaults", () => {
  it("sets maxActiveRooms default to 100", () => {
    expect(DEFAULT_ROOM_SERVICE_CONFIG.maxActiveRooms).toBe(100);
  });

  it("sets maxRoomCreationsPerWindow default to 3", () => {
    expect(DEFAULT_ROOM_SERVICE_CONFIG.maxRoomCreationsPerWindow).toBe(3);
  });

  it("sets roomCreationWindowMs default to 600000", () => {
    expect(DEFAULT_ROOM_SERVICE_CONFIG.roomCreationWindowMs).toBe(600_000);
  });
});

// ─── Gateway-level per-socket rate limiting tests ─────────────────────

describe("per-socket room creation rate limit (gateway)", () => {
  let service: RoomService | null = null;
  const probes: SocketProbe[] = [];

  afterEach(async () => {
    await Promise.all(probes.map((probe) => probe.close()));
    probes.length = 0;
    await service?.close();
    service = null;
  });

  it("rejects excess room creations from a single socket with RATE_LIMITED", async () => {
    const config: Partial<RoomServiceConfig> = {
      maxRoomCreationsPerWindow: 3,
      roomCreationWindowMs: 600_000,
      heartbeatIntervalMs: 60_000,
      idleConnectionTimeoutMs: 120_000,
    };
    service = createRoomService({ config });
    const address = await service.listen(0);
    const probe = await SocketProbe.connect(address.wsUrl);
    probes.push(probe);

    for (let i = 0; i < 3; i += 1) {
      probe.send(wsCreateMessage(`Host${i}`, `create-${i}`));
      await probe.waitFor(
        (m): m is Extract<ServerRoomMessage, { type: "session.established" }> =>
          m.type === "session.established",
      );

      probe.send(wsLeaveMessage(`leave-${i}`));
      await probe.waitFor(
        (m) => m.type === "room.update" && m.ackCommandId === `leave-${i}`,
      );
    }

    // 4th creation should be rejected.
    probe.send(wsCreateMessage("Host3", "create-3"));
    const error = await probe.waitFor(
      (m): m is Extract<ServerRoomMessage, { type: "request.error" }> =>
        m.type === "request.error",
    );
    expect(error.code).toBe("RATE_LIMITED");
  });

  it("does not block room join when the per-socket creation rate limit is exhausted", async () => {
    const config: Partial<RoomServiceConfig> = {
      maxRoomCreationsPerWindow: 3,
      roomCreationWindowMs: 600_000,
      heartbeatIntervalMs: 60_000,
      idleConnectionTimeoutMs: 120_000,
    };
    service = createRoomService({ config });
    const address = await service.listen(0);
    const probeA = await SocketProbe.connect(address.wsUrl);
    const probeB = await SocketProbe.connect(address.wsUrl);
    probes.push(probeA, probeB);

    // Exhaust creation quota on probeA.
    for (let i = 0; i < 3; i += 1) {
      probeA.send(wsCreateMessage(`Host${i}`, `create-a-${i}`));
      await probeA.waitFor(
        (m): m is Extract<ServerRoomMessage, { type: "session.established" }> =>
          m.type === "session.established",
      );

      probeA.send(wsLeaveMessage(`leave-a-${i}`));
      await probeA.waitFor(
        (m) => m.type === "room.update" && m.ackCommandId === `leave-a-${i}`,
      );
    }

    // 4th creation on probeA should be rejected.
    probeA.send(wsCreateMessage("Host3", "create-a-3"));
    const error = await probeA.waitFor(
      (m): m is Extract<ServerRoomMessage, { type: "request.error" }> =>
        m.type === "request.error",
    );
    expect(error.code).toBe("RATE_LIMITED");

    // probeB creates a room.
    probeB.send(wsCreateMessage("Creator", "create-b-0"));
    const established = await probeB.waitFor(
      (m): m is Extract<ServerRoomMessage, { type: "session.established" }> =>
        m.type === "session.established",
    );
    expect(established.session.inviteToken).toBeTruthy();

    // probeA joins the room — should succeed despite exhausted creation quota.
    probeA.send(
      wsJoinMessage("Guest", established.session.inviteToken!, "join-a-0"),
    );
    const joinResult = await probeA.waitFor(
      (m): m is Extract<ServerRoomMessage, { type: "session.established" }> =>
        m.type === "session.established",
    );
    expect(joinResult.session.playerId).not.toBe(
      established.session.playerId,
    );
  });

  it("allows room creation again after the rate limit window resets", async () => {
    const config: Partial<RoomServiceConfig> = {
      maxRoomCreationsPerWindow: 2,
      roomCreationWindowMs: 100,
      heartbeatIntervalMs: 60_000,
      idleConnectionTimeoutMs: 120_000,
    };
    service = createRoomService({ config });
    const address = await service.listen(0);
    const probe = await SocketProbe.connect(address.wsUrl);
    probes.push(probe);

    for (let i = 0; i < 2; i += 1) {
      probe.send(wsCreateMessage(`Host${i}`, `create-${i}`));
      await probe.waitFor(
        (m): m is Extract<ServerRoomMessage, { type: "session.established" }> =>
          m.type === "session.established",
      );

      probe.send(wsLeaveMessage(`leave-${i}`));
      await probe.waitFor(
        (m) => m.type === "room.update" && m.ackCommandId === `leave-${i}`,
      );
    }

    // 3rd creation should be rejected.
    probe.send(wsCreateMessage("Host2", "create-2"));
    const error = await probe.waitFor(
      (m): m is Extract<ServerRoomMessage, { type: "request.error" }> =>
        m.type === "request.error",
    );
    expect(error.code).toBe("RATE_LIMITED");

    // Wait for the rate limit window to reset.
    await new Promise<void>((resolve) => setTimeout(resolve, 150));

    // 4th creation should succeed.
    probe.send(wsCreateMessage("Host3", "create-3"));
    const established = await probe.waitFor(
      (m): m is Extract<ServerRoomMessage, { type: "session.established" }> =>
        m.type === "session.established",
    );
    expect(established.session.playerId).toBeTruthy();
  });
});
