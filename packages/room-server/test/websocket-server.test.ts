import { WebSocket } from "ws";
import { chooseAiIntent } from "@wizzard/game-core";
import {
  decodeServerMessage,
  encodeClientMessage,
  type ClientRoomMessage,
  type ServerRoomMessage,
} from "@wizzard/room-protocol";
import { afterEach, describe, expect, it } from "vitest";
import { createRoomService, type RoomService } from "../src/index.js";

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

describe("friend-room WebSocket service", () => {
  let service: RoomService | null = null;
  const probes: SocketProbe[] = [];

  afterEach(async () => {
    await Promise.all(probes.map((probe) => probe.close()));
    probes.length = 0;
    await service?.close();
    service = null;
  });

  it("creates, joins, starts, privately syncs, and resumes a friend match", async () => {
    service = createRoomService({
      config: {
        aiActionDelayMs: 60_000,
        heartbeatIntervalMs: 60_000,
        idleConnectionTimeoutMs: 120_000,
        turnTimeoutMs: 60_000,
      },
    });
    const address = await service.listen(0);
    const health = await fetch(`${address.httpUrl}/healthz`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({
      service: "wizzard-room",
      status: "ok",
    });

    const host = await SocketProbe.connect(address.wsUrl);
    const guest = await SocketProbe.connect(address.wsUrl);
    probes.push(host, guest);

    host.send({
      payload: {
        avatarKey: "bamboo-cat",
        displayName: "Host",
        maxPlayers: 3,
        mode: "quick",
      },
      requestId: "create-room",
      type: "room.create",
      v: 1,
    });
    const hostEstablished = await host.waitFor(
      (message): message is Extract<
        ServerRoomMessage,
        { type: "session.established" }
      > => message.type === "session.established",
    );
    expect(hostEstablished.session.inviteToken).toBeTruthy();

    guest.send({
      payload: {
        avatarKey: "flower-fox",
        displayName: "Guest",
        inviteToken: hostEstablished.session.inviteToken!,
      },
      requestId: "join-room",
      type: "room.join",
      v: 1,
    });
    const guestEstablished = await guest.waitFor(
      (message): message is Extract<
        ServerRoomMessage,
        { type: "session.established" }
      > => message.type === "session.established",
    );
    expect(guestEstablished.session.playerId).not.toBe(
      hostEstablished.session.playerId,
    );

    host.send({
      payload: { ready: true },
      requestId: "host-ready",
      type: "room.set-ready",
      v: 1,
    });
    await host.waitFor(
      (message) =>
        message.type === "room.update" &&
        message.ackCommandId === "host-ready",
    );
    guest.send({
      payload: { ready: true },
      requestId: "guest-ready",
      type: "room.set-ready",
      v: 1,
    });
    await guest.waitFor(
      (message) =>
        message.type === "room.update" &&
        message.ackCommandId === "guest-ready",
    );

    host.send({
      payload: { fillWithAi: true },
      requestId: "start-room",
      type: "room.start",
      v: 1,
    });
    const hostStarted = await host.waitFor(
      (message): message is Extract<ServerRoomMessage, { type: "room.update" }> =>
        message.type === "room.update" &&
        message.ackCommandId === "start-room",
    );
    const guestStarted = await guest.waitFor(
      (message): message is Extract<ServerRoomMessage, { type: "room.update" }> =>
        message.type === "room.update" &&
        message.room.phase === "playing" &&
        message.match !== null,
    );
    expect(hostStarted.match?.snapshot.privateState.playerId).toBe(
      hostEstablished.session.playerId,
    );
    expect(guestStarted.match?.snapshot.privateState.playerId).toBe(
      guestEstablished.session.playerId,
    );
    expect(hostStarted.room.selfPlayerId).toBe(hostEstablished.session.playerId);
    expect(guestStarted.room.selfPlayerId).toBe(
      guestEstablished.session.playerId,
    );

    const publicState = hostStarted.match!.snapshot.publicState as Record<
      string,
      unknown
    >;
    expect(publicState).not.toHaveProperty("hands");
    expect(publicState).not.toHaveProperty("commandEventCache");
    expect(publicState).not.toHaveProperty("processedCommandIds");

    const guestHand = guestStarted.match!.snapshot.privateState.hand;
    await guest.close();
    const disconnected = await host.waitFor(
      (message): message is Extract<ServerRoomMessage, { type: "room.update" }> =>
        message.type === "room.update" &&
        message.room.players.some(
          (player) =>
            player.playerId === guestEstablished.session.playerId &&
            !player.connected,
        ),
    );
    expect(disconnected.room.phase).toBe("playing");

    const resumedGuest = await SocketProbe.connect(address.wsUrl);
    probes.push(resumedGuest);
    resumedGuest.send({
      payload: { resumeToken: guestEstablished.session.resumeToken },
      requestId: "resume-guest",
      type: "session.resume",
      v: 1,
    });
    const resumed = await resumedGuest.waitFor(
      (message): message is Extract<
        ServerRoomMessage,
        { type: "session.established" }
      > => message.type === "session.established",
    );
    expect(resumed.session.playerId).toBe(guestEstablished.session.playerId);
    expect(resumed.update.match?.snapshot.privateState.hand).toEqual(guestHand);
    expect(resumed.session.resumeToken).not.toBe(
      guestEstablished.session.resumeToken,
    );

    const staleGuest = await SocketProbe.connect(address.wsUrl);
    probes.push(staleGuest);
    staleGuest.send({
      payload: { resumeToken: guestEstablished.session.resumeToken },
      requestId: "resume-stale-token",
      type: "session.resume",
      v: 1,
    });
    const staleError = await staleGuest.waitFor(
      (message): message is Extract<
        ServerRoomMessage,
        { type: "request.error" }
      > => message.type === "request.error",
    );
    expect(staleError.code).toBe("SESSION_NOT_FOUND");
  });

  it("broadcasts host-managed lobby AI and starts with the explicit roster", async () => {
    service = createRoomService({
      config: {
        aiActionDelayMs: 60_000,
        heartbeatIntervalMs: 60_000,
        idleConnectionTimeoutMs: 120_000,
        turnTimeoutMs: 60_000,
      },
    });
    const address = await service.listen(0);
    const host = await SocketProbe.connect(address.wsUrl);
    const guest = await SocketProbe.connect(address.wsUrl);
    probes.push(host, guest);

    host.send({
      payload: {
        avatarKey: "bamboo-cat",
        displayName: "Host",
        maxPlayers: 3,
        mode: "quick",
      },
      requestId: "ai-room-create",
      type: "room.create",
      v: 1,
    });
    const created = await host.waitFor(
      (message): message is Extract<
        ServerRoomMessage,
        { type: "session.established" }
      > => message.type === "session.established",
    );
    guest.send({
      payload: {
        avatarKey: "flower-fox",
        displayName: "Guest",
        roomCode: created.session.roomCode,
      },
      requestId: "ai-room-join",
      type: "room.join",
      v: 1,
    });
    await guest.waitFor((message) => message.type === "session.established");

    host.send({
      payload: { aiCount: 1 },
      requestId: "host-set-ai-count",
      type: "room.set-ai-count",
      v: 1,
    });
    const hostAiUpdate = await host.waitFor(
      (message): message is Extract<ServerRoomMessage, { type: "room.update" }> =>
        message.type === "room.update" &&
        message.ackCommandId === "host-set-ai-count",
    );
    const guestAiUpdate = await guest.waitFor(
      (message): message is Extract<ServerRoomMessage, { type: "room.update" }> =>
        message.type === "room.update" &&
        message.room.players.some((player) => player.isAi),
    );
    expect(hostAiUpdate.room.players.filter((player) => player.isAi))
      .toHaveLength(1);
    expect(guestAiUpdate.room.players.filter((player) => player.isAi))
      .toHaveLength(1);

    guest.send({
      payload: { aiCount: 0 },
      requestId: "guest-set-ai-count",
      type: "room.set-ai-count",
      v: 1,
    });
    const guestRejected = await guest.waitFor(
      (message): message is Extract<
        ServerRoomMessage,
        { type: "request.error" }
      > =>
        message.type === "request.error" &&
        message.requestId === "guest-set-ai-count",
    );
    expect(guestRejected.code).toBe("NOT_HOST");

    for (const [probe, requestId] of [
      [host, "ai-room-host-ready"],
      [guest, "ai-room-guest-ready"],
    ] as const) {
      probe.send({
        payload: { ready: true },
        requestId,
        type: "room.set-ready",
        v: 1,
      });
      await probe.waitFor(
        (message) =>
          message.type === "room.update" &&
          message.ackCommandId === requestId,
      );
    }

    host.send({
      payload: { fillWithAi: false },
      requestId: "start-explicit-ai-roster",
      type: "room.start",
      v: 1,
    });
    const started = await host.waitFor(
      (message): message is Extract<ServerRoomMessage, { type: "room.update" }> =>
        message.type === "room.update" &&
        message.ackCommandId === "start-explicit-ai-roster",
    );
    expect(started.room.phase).toBe("playing");
    expect(started.match?.snapshot.publicState.players).toHaveLength(3);
  });

  it("acknowledges a lobby leave before removing the socket identity", async () => {
    service = createRoomService();
    const address = await service.listen(0);
    const host = await SocketProbe.connect(address.wsUrl);
    const guest = await SocketProbe.connect(address.wsUrl);
    probes.push(host, guest);

    host.send({
      payload: {
        avatarKey: "bamboo-cat",
        displayName: "Host",
        maxPlayers: 3,
        mode: "quick",
      },
      requestId: "create-for-leave",
      type: "room.create",
      v: 1,
    });
    const created = await host.waitFor(
      (message): message is Extract<
        ServerRoomMessage,
        { type: "session.established" }
      > => message.type === "session.established",
    );
    guest.send({
      payload: {
        avatarKey: "flower-fox",
        displayName: "Guest",
        roomCode: created.session.roomCode,
      },
      requestId: "join-for-leave",
      type: "room.join",
      v: 1,
    });
    await guest.waitFor(
      (message) => message.type === "session.established",
    );

    guest.send({
      payload: {},
      requestId: "leave-lobby",
      type: "room.leave",
      v: 1,
    });
    const leaveAck = await guest.waitFor(
      (message): message is Extract<ServerRoomMessage, { type: "room.update" }> =>
        message.type === "room.update" &&
        message.ackCommandId === "leave-lobby",
    );
    expect(leaveAck.room.players).toHaveLength(2);

    const remaining = await host.waitFor(
      (message): message is Extract<ServerRoomMessage, { type: "room.update" }> =>
        message.type === "room.update" && message.room.players.length === 1,
    );
    expect(remaining.room.players[0].playerId).toBe(created.session.playerId);
  });

  it("lets three authenticated sockets complete the first round", async () => {
    service = createRoomService({
      config: {
        heartbeatIntervalMs: 60_000,
        idleConnectionTimeoutMs: 120_000,
        roundScoreDelayMs: 60_000,
        trickResultDelayMs: 5,
        turnTimeoutMs: 500,
      },
    });
    const address = await service.listen(0);
    const players = await Promise.all([
      SocketProbe.connect(address.wsUrl),
      SocketProbe.connect(address.wsUrl),
      SocketProbe.connect(address.wsUrl),
    ]);
    probes.push(...players);
    const [host, second, third] = players;

    host.send({
      payload: {
        avatarKey: "bamboo-cat",
        displayName: "Host",
        maxPlayers: 3,
        mode: "quick",
      },
      requestId: "round-create",
      type: "room.create",
      v: 1,
    });
    const created = await host.waitFor(
      (message): message is Extract<
        ServerRoomMessage,
        { type: "session.established" }
      > => message.type === "session.established",
    );

    for (const [index, probe] of [second, third].entries()) {
      probe.send({
        payload: {
          avatarKey: index === 0 ? "flower-fox" : "wandering-crane",
          displayName: `Guest ${index + 1}`,
          inviteToken: created.session.inviteToken!,
        },
        requestId: `round-join-${index + 1}`,
        type: "room.join",
        v: 1,
      });
      await probe.waitFor((message) => message.type === "session.established");
    }

    for (const [index, probe] of players.entries()) {
      const requestId = `round-ready-${index}`;
      probe.send({
        payload: { ready: true },
        requestId,
        type: "room.set-ready",
        v: 1,
      });
      await probe.waitFor(
        (message) =>
          message.type === "room.update" &&
          message.ackCommandId === requestId,
      );
    }

    host.send({
      payload: { fillWithAi: false },
      requestId: "round-start",
      type: "room.start",
      v: 1,
    });
    let updates = await Promise.all(
      players.map((probe, index) =>
        probe.waitFor(
          (message): message is Extract<
            ServerRoomMessage,
            { type: "room.update" }
          > =>
            message.type === "room.update" &&
            message.match !== null &&
            message.room.phase === "playing" &&
            (index !== 0 || message.ackCommandId === "round-start"),
        ),
      ),
    );
    const timeoutVersion =
      updates[0].match!.snapshot.publicState.version + 1;
    updates = await Promise.all(
      players.map((probe) =>
        probe.waitFor(
          (message): message is Extract<
            ServerRoomMessage,
            { type: "room.update" }
          > =>
            message.type === "room.update" &&
            message.match?.snapshot.publicState.version === timeoutVersion,
          2_000,
        ),
      ),
    );
    expect(
      updates[0].match!.events.some(
        (event) =>
          event.type === "trump-selected" ||
          event.type === "bid-accepted" ||
          event.type === "card-played",
      ),
    ).toBe(true);
    let actionIndex = 0;

    while (updates[0].match!.snapshot.publicState.phase !== "round-score") {
      const publicState = updates[0].match!.snapshot.publicState;
      if (publicState.phase === "trick-result") {
        const nextVersion = publicState.version + 1;
        updates = await Promise.all(
          players.map((probe) =>
            probe.waitFor(
              (message): message is Extract<
                ServerRoomMessage,
                { type: "room.update" }
              > =>
                message.type === "room.update" &&
                message.match?.snapshot.publicState.version === nextVersion,
            ),
          ),
        );
        continue;
      }

      const actorIndex = updates.findIndex(
        (update) =>
          update.room.selfPlayerId === publicState.currentPlayerId,
      );
      expect(actorIndex).toBeGreaterThanOrEqual(0);
      const commandId =
        actionIndex < 2
          ? "same-wire-command"
          : `round-action-${actionIndex}`;
      const actorUpdate = updates[actorIndex];
      const intent = chooseAiIntent(actorUpdate.match!.snapshot, commandId);
      expect(intent).not.toBeNull();
      players[actorIndex].send({
        payload: { intent: intent! },
        requestId: commandId,
        type: "match.intent",
        v: 1,
      });
      const nextVersion = publicState.version + 1;
      updates = await Promise.all(
        players.map((probe) =>
          probe.waitFor(
            (message): message is Extract<
              ServerRoomMessage,
              { type: "room.update" }
            > =>
              message.type === "room.update" &&
              message.match?.snapshot.publicState.version === nextVersion,
          ),
        ),
      );
      expect(
        updates[actorIndex].match!.events.some(
          (event) => event.type === "intent-rejected",
        ),
      ).toBe(false);
      actionIndex += 1;
      expect(actionIndex).toBeLessThan(12);
    }

    expect(updates[0].match!.snapshot.publicState.roundIndex).toBe(0);
    expect(
      updates[0].match!.events.some((event) => event.type === "round-scored"),
    ).toBe(true);
  });
});
