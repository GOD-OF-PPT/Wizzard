import {
  AVATAR_KEYS,
  MIN_HUMAN_PLAYERS,
} from "@wizzard/room-protocol";
import { createMatch } from "@wizzard/game-core/authority";
import { withHmacCounterRandom } from "../random/index.js";
import { RoomServiceError } from "./errors.js";
import type {
  RoomPlayerRecord,
  RoomRecord,
} from "./model.js";
import {
  firstOpenSeat,
  requireLifecycle,
  requirePlayer,
  type RoomContext,
} from "./room-shared.js";

/**
 * LobbyService — room lifecycle management extracted from RoomCoordinator.
 *
 * Owns the lobby lifecycle: ready toggling, AI count reconciliation, match
 * start, rematch (return-to-lobby), and player leave. All shared
 * infrastructure (RoomQueue, repository, config, clock, idFactory,
 * synchronizeMatch) is injected via RoomContext so the facade retains
 * ownership.
 */
export class LobbyService {
  public constructor(private readonly ctx: RoomContext) {}

  public setReady(
    room: RoomRecord,
    actor: RoomPlayerRecord,
    ready: boolean,
  ): void {
    requireLifecycle(room, "lobby");
    actor.ready = ready;
  }

  public setAiCount(
    room: RoomRecord,
    actorPlayerId: string,
    aiCount: number,
    now: number,
  ): void {
    requireLifecycle(room, "lobby");

    if (room.hostPlayerId !== actorPlayerId) {
      throw new RoomServiceError(
        "NOT_HOST",
        "Only the host can manage lobby AI players.",
      );
    }

    if (!Number.isSafeInteger(aiCount) || aiCount < 0) {
      throw new RoomServiceError(
        "COMMAND_REJECTED",
        "The requested AI count is invalid.",
      );
    }

    const humanCount = room.players.filter((player) => !player.isAi).length;
    const aiPlayers = room.players
      .filter((player) => player.isAi)
      .sort((left, right) => right.seatIndex - left.seatIndex);
    if (
      humanCount < MIN_HUMAN_PLAYERS &&
      aiCount > aiPlayers.length
    ) {
      throw new RoomServiceError(
        "NOT_ENOUGH_PLAYERS",
        `At least ${MIN_HUMAN_PLAYERS} human players are required before adding AI players.`,
      );
    }

    const maximumAiCount = room.maxPlayers - humanCount;
    if (aiCount > maximumAiCount) {
      throw new RoomServiceError(
        "COMMAND_REJECTED",
        "The requested AI count exceeds the remaining room capacity.",
      );
    }

    if (aiPlayers.length > aiCount) {
      const removedIds = new Set(
        aiPlayers
          .slice(0, aiPlayers.length - aiCount)
          .map((player) => player.playerId),
      );
      room.players = room.players.filter(
        (player) => !removedIds.has(player.playerId),
      );
    }

    while (room.players.filter((player) => player.isAi).length < aiCount) {
      const seatIndex = firstOpenSeat(room);
      room.players.push(this.createAiPlayer(seatIndex, now));
    }

    room.players.sort((left, right) => left.seatIndex - right.seatIndex);
  }

  public startMatch(
    room: RoomRecord,
    actorPlayerId: string,
    fillWithAi: boolean,
    now: number,
  ): void {
    requireLifecycle(room, "lobby");

    if (room.hostPlayerId !== actorPlayerId) {
      throw new RoomServiceError("NOT_HOST", "Only the host can start.");
    }

    const humans = room.players.filter((player) => !player.isAi);
    const connectedHumans = humans.filter((player) => player.connected);
    if (connectedHumans.length < MIN_HUMAN_PLAYERS) {
      throw new RoomServiceError(
        "NOT_ENOUGH_PLAYERS",
        `At least ${MIN_HUMAN_PLAYERS} connected human players are required before AI fill.`,
      );
    }

    if (!humans.every((player) => player.connected && player.ready)) {
      throw new RoomServiceError(
        "PLAYERS_NOT_READY",
        "Every human player must be connected and ready.",
      );
    }

    if (!fillWithAi && room.players.length !== room.maxPlayers) {
      throw new RoomServiceError(
        "NOT_ENOUGH_PLAYERS",
        "Fill every seat or enable AI fill.",
      );
    }

    while (fillWithAi && room.players.length < room.maxPlayers) {
      const seatIndex = firstOpenSeat(room);
      room.players.push(this.createAiPlayer(seatIndex, now));
    }

    if (room.players.length < 3) {
      throw new RoomServiceError(
        "NOT_ENOUGH_PLAYERS",
        "At least three seats are required.",
      );
    }

    room.players.sort((left, right) => left.seatIndex - right.seatIndex);
    const created = withHmacCounterRandom(room.randomState, (random) =>
      createMatch(
        {
          matchId: `match-${this.ctx.idFactory()}`,
          mode: room.mode,
          players: room.players.map((player) => ({
            avatarKey: player.avatarKey,
            id: player.playerId,
            isHuman: !player.isAi,
            name: player.name,
          })),
        },
        random,
      ),
    );
    room.randomState = created.state;
    room.match = created.result;
    room.lifecycle = "playing";
    this.ctx.synchronizeMatch(room, now, this.ctx.config);
  }

  public returnToLobby(room: RoomRecord, actorPlayerId: string): void {
    if (room.lifecycle !== "finished") {
      throw new RoomServiceError(
        "WRONG_ROOM_PHASE",
        "A rematch is only available after the match ends.",
      );
    }
    if (room.hostPlayerId !== actorPlayerId) {
      throw new RoomServiceError("NOT_HOST", "Only the host can rematch.");
    }

    room.players = room.players
      .filter((player) => !player.isAi && player.session)
      .map((player, seatIndex) => ({
        ...player,
        connected: player.connected,
        consecutiveTimeouts: 0,
        control: "human" as const,
        ready: false,
        seatIndex,
      }));
    room.lifecycle = "lobby";
    room.match = null;
    room.deadline = null;
  }

  public leaveRoom(
    room: RoomRecord,
    actorPlayerId: string,
    now: number,
  ): void {
    const actor = requirePlayer(room, actorPlayerId);
    actor.connected = false;
    actor.session = null;

    if (room.lifecycle === "lobby") {
      room.players = room.players.filter(
        (player) => player.playerId !== actorPlayerId,
      );
      room.players
        .sort((left, right) => left.seatIndex - right.seatIndex)
        .forEach((player, seatIndex) => {
          player.seatIndex = seatIndex;
        });
    } else {
      actor.control = "ai";
    }

    const remainingHumans = room.players.filter(
      (player) => !player.isAi && player.session,
    );
    if (remainingHumans.length === 0) {
      room.lifecycle = "closed";
      room.deadline = null;
      room.expiresAt = now + 5 * 60 * 1_000;
      room.hostPlayerId = "";
      return;
    }

    if (room.hostPlayerId === actorPlayerId) {
      room.hostPlayerId = [...remainingHumans].sort(
        (left, right) => left.seatIndex - right.seatIndex,
      )[0].playerId;
    }

    if (
      room.lifecycle === "playing" &&
      room.match?.currentPlayerId === actorPlayerId
    ) {
      this.ctx.synchronizeMatch(room, now, this.ctx.config);
    }
  }

  private createAiPlayer(seatIndex: number, now: number): RoomPlayerRecord {
    return {
      avatarKey: AVATAR_KEYS[seatIndex % AVATAR_KEYS.length],
      connected: true,
      consecutiveTimeouts: 0,
      control: "ai",
      isAi: true,
      joinedAt: now,
      name: `茶灵 ${seatIndex + 1}`,
      playerId: `ai-${this.ctx.idFactory()}`,
      ready: true,
      seatIndex,
      session: null,
    };
  }
}
