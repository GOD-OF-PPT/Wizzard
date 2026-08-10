import {
  MAX_AI_PLAYERS,
  PROTOCOL_VERSION,
  ROOM_CODE_LENGTH,
  isNumericRoomCode,
  type CreateRoomMessage,
  type JoinRoomMessage,
  type LeaveRoomMessage,
  type RequestErrorCode,
  type RoomUpdatePayload,
  type SetAiCountMessage,
  type SetReadyMessage,
  type StartRoomMessage,
} from "@wizzard/room-protocol";
import {
  RoomSocketClient,
  type RoomBinding,
  type RoomSocketConnectionState,
  type RoomSocketEvent,
} from "../network/RoomSocketClient";

const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9._-]{16,512}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export type CreateFriendRoomInput = CreateRoomMessage["payload"];

export type JoinFriendRoomInput = {
  avatarKey: JoinRoomMessage["payload"]["avatarKey"];
  displayName: string;
  roomCode: string;
};

export type JoinFriendRoomInviteInput = {
  avatarKey: JoinRoomMessage["payload"]["avatarKey"];
  displayName: string;
  inviteToken: string;
};

export type FriendRoomBindingCommand = "create" | "join" | "resume";

export type FriendRoomPendingState = Readonly<{
  ai: boolean;
  binding: FriendRoomBindingCommand | null;
  leave: boolean;
  ready: boolean;
  start: boolean;
}>;

export type FriendRoomError = Extract<
  RoomSocketEvent,
  { type: "error" }
>;

export type FriendRoomState = Readonly<{
  connection: RoomSocketConnectionState;
  error: FriendRoomError | null;
  pending: FriendRoomPendingState;
  update: RoomUpdatePayload | null;
}>;

export type FriendRoomStateListener = (state: FriendRoomState) => void;
export type RoomClientFactory = (binding: RoomBinding) => RoomSocketClient;

function normalizeDisplayName(value: string): string | null {
  const displayName = value.trim();

  if (
    displayName.length < 1 ||
    displayName.length > 16 ||
    CONTROL_CHARACTER_PATTERN.test(displayName)
  ) {
    return null;
  }

  return displayName;
}

function normalizeRoomCode(value: string): string | null {
  const roomCode = value.trim();
  return isNumericRoomCode(roomCode) ? roomCode : null;
}

function isTerminalClientError(code: FriendRoomError["code"]): boolean {
  return (
    code === "AUTH_REQUIRED" ||
    code === "SESSION_NOT_FOUND" ||
    code === "ROOM_NOT_FOUND" ||
    code === "PLAYER_NOT_FOUND" ||
    code === "PROTOCOL_ERROR"
  );
}

export class FriendRoomController {
  private aiRequestId: string | null = null;
  private bindingCommand: FriendRoomBindingCommand | null = null;
  private connection: RoomSocketConnectionState = "disconnected";
  private disposed = false;
  private error: FriendRoomError | null = null;
  private leaveRequestId: string | null = null;
  private readonly listeners = new Set<FriendRoomStateListener>();
  private readyRequestId: string | null = null;
  private roomClient: RoomSocketClient | null = null;
  private startRequestId: string | null = null;
  private unsubscribeRoomClient: (() => void) | null = null;
  private update: RoomUpdatePayload | null = null;

  public constructor(private readonly roomClientFactory: RoomClientFactory) {}

  public get state(): FriendRoomState {
    return {
      connection: this.connection,
      error: this.error,
      pending: {
        ai: this.aiRequestId !== null,
        binding: this.bindingCommand,
        leave: this.leaveRequestId !== null,
        ready: this.readyRequestId !== null,
        start: this.startRequestId !== null,
      },
      update: this.update,
    };
  }

  public clearError(): void {
    if (!this.error) {
      return;
    }

    this.error = null;
    this.emitState();
  }

  public createRoom(input: CreateFriendRoomInput): boolean {
    const displayName = normalizeDisplayName(input.displayName);

    if (!displayName) {
      return this.rejectInput(
        "NAME_INVALID",
        "Display name must contain 1 to 16 characters.",
      );
    }

    return this.bindRoom("create", {
      payload: { ...input, displayName },
      type: "create",
    });
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.detachRoomClient(true);
    this.aiRequestId = null;
    this.bindingCommand = null;
    this.leaveRequestId = null;
    this.readyRequestId = null;
    this.startRequestId = null;
    this.connection = "disconnected";
    this.listeners.clear();
  }

  public getRoomClient(): RoomSocketClient | null {
    return this.roomClient;
  }

  public joinRoom(input: JoinFriendRoomInput): boolean {
    const displayName = normalizeDisplayName(input.displayName);

    if (!displayName) {
      return this.rejectInput(
        "NAME_INVALID",
        "Display name must contain 1 to 16 characters.",
      );
    }

    const roomCode = normalizeRoomCode(input.roomCode);

    if (!roomCode) {
      return this.rejectInput(
        "ROOM_CODE_INVALID",
        `Room code must contain exactly ${ROOM_CODE_LENGTH} digits.`,
      );
    }

    return this.bindRoom("join", {
      payload: {
        avatarKey: input.avatarKey,
        displayName,
        roomCode,
      },
      type: "join",
    });
  }

  public joinRoomWithInvite(input: JoinFriendRoomInviteInput): boolean {
    const displayName = normalizeDisplayName(input.displayName);

    if (!displayName) {
      return this.rejectInput(
        "NAME_INVALID",
        "Display name must contain 1 to 16 characters.",
      );
    }

    if (!INVITE_TOKEN_PATTERN.test(input.inviteToken)) {
      return this.rejectInput(
        "INVITE_TOKEN_INVALID",
        "Invite token is invalid.",
      );
    }

    return this.bindRoom("join", {
      payload: {
        avatarKey: input.avatarKey,
        displayName,
        inviteToken: input.inviteToken,
      },
      type: "join",
    });
  }

  public leaveRoom(): boolean {
    if (
      !this.canSendRoomCommand() ||
      this.update?.room.phase !== "lobby" ||
      this.hasPendingLobbyCommand()
    ) {
      return false;
    }

    const roomClient = this.roomClient;
    if (!roomClient) {
      return false;
    }

    const requestId = roomClient.nextRequestId();
    const message: LeaveRoomMessage = {
      payload: {},
      requestId,
      type: "room.leave",
      v: PROTOCOL_VERSION,
    };
    this.leaveRequestId = requestId;
    this.error = null;
    roomClient.sendTracked(message);
    this.emitState();
    return true;
  }

  public resumeRoom(): boolean {
    return this.bindRoom("resume", { type: "resume" });
  }

  public setAiCount(aiCount: number): boolean {
    const room = this.update?.room;
    const humanCount = room?.players.filter((player) => !player.isAi).length;
    const currentAiCount = room?.players.filter((player) => player.isAi).length;
    if (
      !this.canSendRoomCommand() ||
      !room ||
      room.phase !== "lobby" ||
      room.hostPlayerId !== room.selfPlayerId ||
      !Number.isInteger(aiCount) ||
      aiCount < 0 ||
      humanCount === undefined ||
      aiCount > Math.min(MAX_AI_PLAYERS, room.maxPlayers - humanCount) ||
      aiCount === currentAiCount ||
      this.hasPendingLobbyCommand()
    ) {
      return false;
    }

    const roomClient = this.roomClient;
    if (!roomClient) {
      return false;
    }

    const requestId = roomClient.nextRequestId();
    const message: SetAiCountMessage = {
      payload: { aiCount },
      requestId,
      type: "room.set-ai-count",
      v: PROTOCOL_VERSION,
    };
    this.aiRequestId = requestId;
    this.error = null;
    roomClient.sendTracked(message);
    this.emitState();
    return true;
  }

  public setReady(ready: boolean): boolean {
    if (
      !this.canSendRoomCommand() ||
      !this.update?.permissions.canSetReady ||
      this.update.room.phase !== "lobby" ||
      this.hasPendingLobbyCommand()
    ) {
      return false;
    }

    const roomClient = this.roomClient;
    if (!roomClient) {
      return false;
    }

    const requestId = roomClient.nextRequestId();
    const message: SetReadyMessage = {
      payload: { ready },
      requestId,
      type: "room.set-ready",
      v: PROTOCOL_VERSION,
    };
    this.readyRequestId = requestId;
    this.error = null;
    roomClient.sendTracked(message);
    this.emitState();
    return true;
  }

  public startRoom(fillWithAi: boolean): boolean {
    if (
      !this.canSendRoomCommand() ||
      !this.update?.permissions.canStart ||
      this.update.room.phase !== "lobby" ||
      this.hasPendingLobbyCommand()
    ) {
      return false;
    }

    const roomClient = this.roomClient;
    if (!roomClient) {
      return false;
    }

    const requestId = roomClient.nextRequestId();
    const message: StartRoomMessage = {
      payload: { fillWithAi },
      requestId,
      type: "room.start",
      v: PROTOCOL_VERSION,
    };
    this.startRequestId = requestId;
    this.error = null;
    roomClient.sendTracked(message);
    this.emitState();
    return true;
  }

  public subscribe(listener: FriendRoomStateListener): () => void {
    if (this.disposed) {
      listener(this.state);
      return () => undefined;
    }

    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private bindRoom(
    command: FriendRoomBindingCommand,
    binding: RoomBinding,
  ): boolean {
    if (this.disposed || this.roomClient || this.bindingCommand) {
      return false;
    }

    this.bindingCommand = command;
    this.connection = "disconnected";
    this.error = null;
    this.aiRequestId = null;
    this.leaveRequestId = null;
    this.readyRequestId = null;
    this.startRequestId = null;
    this.update = null;
    this.emitState();

    if (this.disposed || this.bindingCommand !== command) {
      return false;
    }

    let roomClient: RoomSocketClient;
    try {
      roomClient = this.roomClientFactory(binding);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.bindingCommand = null;
      this.error = {
        code: "TRANSPORT_ERROR",
        message,
        type: "error",
      };
      this.emitState();
      return false;
    }

    if (this.disposed || this.bindingCommand !== command) {
      roomClient.dispose();
      return false;
    }

    this.roomClient = roomClient;
    let subscriptionActive = true;
    let unsubscribe: (() => void) | null = null;
    this.unsubscribeRoomClient = () => {
      if (!subscriptionActive) {
        return;
      }

      subscriptionActive = false;
      unsubscribe?.();
    };
    unsubscribe = roomClient.subscribe((event) => {
      if (subscriptionActive && this.roomClient === roomClient) {
        this.handleRoomEvent(event);
      }
    });

    // subscribe() replays cached state synchronously. A listener may dispose
    // the controller during that replay, before the unsubscribe callback is
    // assigned, so close the just-created subscription after the fact too.
    if (!subscriptionActive) {
      unsubscribe();
      return false;
    }

    roomClient.start();
    return this.roomClient === roomClient;
  }

  private canSendRoomCommand(): boolean {
    return (
      !this.disposed &&
      this.connection === "connected" &&
      this.roomClient?.getConnectionState() === "connected"
    );
  }

  private hasPendingLobbyCommand(): boolean {
    return Boolean(
      this.aiRequestId ||
        this.leaveRequestId ||
        this.readyRequestId ||
        this.startRequestId,
    );
  }

  private detachRoomClient(disposeClient: boolean): void {
    const roomClient = this.roomClient;
    this.unsubscribeRoomClient?.();
    this.unsubscribeRoomClient = null;
    this.roomClient = null;

    if (disposeClient) {
      roomClient?.dispose();
    }
  }

  private emitState(): void {
    const state = this.state;
    for (const listener of Array.from(this.listeners)) {
      listener(state);
    }
  }

  private handleError(event: FriendRoomError): void {
    if (event.requestId === this.aiRequestId) {
      this.aiRequestId = null;
    }

    if (event.requestId === this.leaveRequestId) {
      this.leaveRequestId = null;
    }

    if (event.requestId === this.readyRequestId) {
      this.readyRequestId = null;
    }

    if (event.requestId === this.startRequestId) {
      this.startRequestId = null;
    }

    const bindingFailed =
      this.bindingCommand !== null && event.code !== "TRANSPORT_ERROR";
    if (bindingFailed) {
      this.bindingCommand = null;
    }

    this.error = event;

    if (bindingFailed || isTerminalClientError(event.code)) {
      this.connection = "disconnected";
      this.aiRequestId = null;
      this.bindingCommand = null;
      this.leaveRequestId = null;
      this.readyRequestId = null;
      this.startRequestId = null;
      this.update = null;
      this.detachRoomClient(true);
    }

    this.emitState();
  }

  private handleRoomEvent(event: RoomSocketEvent): void {
    if (this.disposed) {
      return;
    }

    if (event.type === "connection") {
      this.connection = event.state;
      if (
        event.state === "connected" &&
        this.error?.code === "TRANSPORT_ERROR"
      ) {
        this.error = null;
      }
      this.emitState();
      return;
    }

    if (event.type === "error") {
      this.handleError(event);
      return;
    }

    const ackCommandId = event.payload.ackCommandId;
    let acknowledged = false;

    if (ackCommandId && ackCommandId === this.aiRequestId) {
      this.aiRequestId = null;
      acknowledged = true;
    }

    if (ackCommandId && ackCommandId === this.leaveRequestId) {
      this.aiRequestId = null;
      this.leaveRequestId = null;
      this.bindingCommand = null;
      this.readyRequestId = null;
      this.startRequestId = null;
      this.connection = "disconnected";
      this.error = null;
      this.update = null;
      this.detachRoomClient(true);
      this.emitState();
      return;
    }

    if (ackCommandId && ackCommandId === this.readyRequestId) {
      this.readyRequestId = null;
      acknowledged = true;
    }

    if (ackCommandId && ackCommandId === this.startRequestId) {
      this.startRequestId = null;
      acknowledged = true;
    }

    if (this.bindingCommand) {
      this.bindingCommand = null;
      acknowledged = true;
    }

    if (acknowledged) {
      this.error = null;
    }

    this.update = event.payload;
    this.emitState();
  }

  private rejectInput(code: RequestErrorCode, message: string): false {
    if (this.disposed) {
      return false;
    }

    this.error = { code, message, type: "error" };
    this.emitState();
    return false;
  }
}
