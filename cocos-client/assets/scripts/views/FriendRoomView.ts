import {
  Color,
  EditBox,
  EventTouch,
  Node,
  Sprite,
  UIOpacity,
  view,
} from "cc";
import {
  MIN_HUMAN_PLAYERS,
  ROOM_CODE_LENGTH,
  type AvatarKey,
  type FriendRoomSnapshot,
  type RoomPlayerSnapshot,
} from "@wizzard/room-protocol";
import type { AssetKey } from "../assets/AssetAddresses.generated";
import { getRoundHandCounts } from "@wizzard/game-core";
import { AssetRegistry } from "../assets/AssetRegistry";
import type { GamePreferences } from "../platform/GamePreferences";
import {
  FriendRoomController,
  type FriendRoomError,
  type FriendRoomState,
} from "../controllers/FriendRoomController";
import {
  createButton,
  createContainer,
  createHorizontalSliceSprite,
  createModalBackdrop,
  createSprite,
  createText,
  createTextInput,
  type ButtonStyle,
  type TextInputView,
} from "./UiFactory";
import {
  renderRulesSettingsView,
  type RulesSettingsTab,
} from "./RulesSettingsView";
import { getHomeBackgroundLayout } from "./HomeBackgroundLayout";
import {
  FRIEND_ROOM_CREATE_OPTION_TOUCHES,
  FRIEND_ROOM_DIALOG_LAYOUT,
  type FriendRoomDialogRect,
} from "./FriendRoomDialogLayout";
import {
  FRIEND_ROOM_LOBBY_LAYOUT,
  FRIEND_ROOM_LOBBY_SEAT_POSITIONS,
  FRIEND_ROOM_LOBBY_SLOT_MAPS,
} from "./FriendRoomLobbyLayout";
import { generateRandomFriendRoomNickname } from "./FriendRoomNickname";
import {
  reconcileFriendRoomEntryMode,
  type FriendRoomEntryMode,
} from "./FriendRoomNavigation";

const AVATARS: readonly AvatarKey[] = [
  "bamboo-cat",
  "wandering-crane",
  "flower-fox",
  "ink-panda",
  "sleepy-star-cat",
  "masked-traveler",
];

const AVATAR_ASSET_KEYS: Record<AvatarKey, AssetKey> = {
  "bamboo-cat": "avatar.bambooCat.normal",
  "flower-fox": "avatar.flowerFox.normal",
  "ink-panda": "avatar.inkPanda.normal",
  "masked-traveler": "avatar.maskedTraveler.normal",
  "sleepy-star-cat": "avatar.sleepyStarCat.normal",
  "wandering-crane": "avatar.wanderingCrane.normal",
};

const LACQUER_BUTTON: ButtonStyle = {
  assetKey: "ui.panel.primary",
  fontKey: "font.display",
  sliced: true,
  textColor: new Color(247, 226, 184, 255),
};

const BLUE_BUTTON: ButtonStyle = {
  assetKey: "ui.panel.secondary",
  fontKey: "font.display",
  sliced: true,
  textColor: new Color(247, 226, 184, 255),
};

const ENTRY_CONTROL_WIDTH = 700;
const ENTRY_CONTROL_X = 60;
const ENTRY_LABEL_WIDTH = 118;
const ENTRY_LABEL_X = -390;
const PAPER_BUTTON: ButtonStyle = {
  assetKey: "ui.plaque.small",
  fontKey: "font.display",
  outlineWidth: 0,
  sliced: true,
  textColor: new Color(70, 39, 21, 255),
};

const LOBBY_HOME_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.paper",
  fontKey: "font.display",
  fontSize: 25,
  hitHeight: FRIEND_ROOM_LOBBY_LAYOUT.returnHomeTouch.height,
  hitWidth: FRIEND_ROOM_LOBBY_LAYOUT.returnHomeTouch.width,
  labelHeight: 54,
  labelWidth: 164,
  outlineWidth: 0,
  textColor: new Color(70, 39, 21, 255),
};

const LOBBY_INVITE_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.paper",
  fontKey: "font.display",
  fontSize: 31,
  labelHeight: 72,
  labelWidth: 230,
  outlineWidth: 0,
  textColor: new Color(70, 39, 21, 255),
};

const LOBBY_READY_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.green.v2",
  fontKey: "font.display",
  fontSize: 32,
  hitHeight: FRIEND_ROOM_LOBBY_LAYOUT.readyButton.height,
  hitWidth: FRIEND_ROOM_LOBBY_LAYOUT.readyButton.width,
  labelHeight: 64,
  labelWidth: 240,
  outlineWidth: 0,
  textColor: new Color(245, 229, 188, 255),
};

const LOBBY_CANCEL_READY_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.paper",
  fontKey: "font.display",
  fontSize: 30,
  hitHeight: FRIEND_ROOM_LOBBY_LAYOUT.readyButton.height,
  hitWidth: FRIEND_ROOM_LOBBY_LAYOUT.readyButton.width,
  labelHeight: 64,
  labelWidth: 190,
  outlineWidth: 0,
  textColor: new Color(70, 39, 21, 255),
};

const LOBBY_AI_ADD_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.green.v2",
  disabledOpacity: 176,
  fontKey: "font.interface",
  fontSize: 21,
  hitHeight: FRIEND_ROOM_LOBBY_LAYOUT.aiAddTouch.height,
  hitWidth: FRIEND_ROOM_LOBBY_LAYOUT.aiAddTouch.width,
  labelHeight: 44,
  labelWidth: 154,
  outlineWidth: 0,
  textColor: new Color(245, 229, 188, 255),
};

const LOBBY_AI_REMOVE_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.paper",
  disabledOpacity: 176,
  fontKey: "font.interface",
  fontSize: 21,
  hitHeight: FRIEND_ROOM_LOBBY_LAYOUT.aiRemoveTouch.height,
  hitWidth: FRIEND_ROOM_LOBBY_LAYOUT.aiRemoveTouch.width,
  labelHeight: 44,
  labelWidth: 126,
  outlineWidth: 0,
  textColor: new Color(70, 39, 21, 255),
};

const LEAVE_CONFIRM_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.green.v2",
  fontKey: "font.display",
  fontSize: 31,
  hitHeight: 120,
  labelHeight: 58,
  labelWidth: 210,
  outlineWidth: 0,
  textColor: new Color(245, 229, 188, 255),
};

const LEAVE_CANCEL_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.paper",
  fontKey: "font.display",
  fontSize: 31,
  hitHeight: 120,
  labelHeight: 64,
  labelWidth: 160,
  outlineWidth: 0,
  textColor: new Color(72, 42, 24, 255),
};

export type FriendRoomViewOptions = {
  onInvite: (roomCode: string) => Promise<"copied" | "shared">;
  onPreferencesChange: (preferences: GamePreferences) => void;
  onPractice: () => void;
  preferences: GamePreferences;
};

function getErrorMessage(error: FriendRoomError): string {
  const messages: Partial<Record<FriendRoomError["code"], string>> = {
    AUTH_REQUIRED: "房间会话已失效，请重新加入",
    COMMAND_REJECTED: "当前操作未被房间接受",
    INTERNAL_ERROR: "茶馆暂时忙碌，请稍后重试",
    INVITE_TOKEN_INVALID: "邀请链接已失效",
    NAME_INVALID: "昵称需要 1 至 16 个字符",
    NOT_ENOUGH_PLAYERS: `至少需要 ${MIN_HUMAN_PLAYERS} 名在线真人，空位可由 AI 补齐`,
    NOT_HOST: "只有房主可以开始游戏",
    PLAYER_NOT_FOUND: "你的座位已不在房间中",
    PLAYERS_NOT_READY: "所有真人玩家准备后才能开始",
    PROTOCOL_ERROR: "客户端与房间服务版本不一致",
    RATE_LIMITED: "操作太快了，请稍候",
    ROOM_CODE_INVALID: `请输入 ${ROOM_CODE_LENGTH} 位数字房间码`,
    ROOM_FULL: "房间已经坐满",
    ROOM_NOT_FOUND: "没有找到这个好友房",
    ROOM_NOT_JOINABLE: "这局已经开始，暂时不能加入",
    SESSION_NOT_FOUND: "没有可恢复的好友房",
    TRANSPORT_ERROR: "无法连接好友房服务",
    WRONG_ROOM_PHASE: "当前房间阶段不能执行此操作",
  };
  return messages[error.code] ?? error.message;
}

function destroyChildren(node: Node): void {
  for (const child of [...node.children]) {
    child.destroy();
  }
}

function getModeLabel(
  mode: "classic" | "quick",
  playerCount: 3 | 4 | 5 | 6,
): string {
  const roundCount = getRoundHandCounts(playerCount, mode).length;
  return `${mode === "quick" ? "快速局" : "经典局"} · ${roundCount} 轮`;
}

export class FriendRoomView {
  private avatarKey: AvatarKey = "bamboo-cat";
  private readonly contentRoot: Node;
  private displayName = "";
  private disposed = false;
  private entryMode: FriendRoomEntryMode = "home";
  private fillWithAi = true;
  private latestState: FriendRoomState;
  private leaveConfirmationOpen = false;
  private maxPlayers: 3 | 4 | 5 | 6 = 6;
  private mode: "classic" | "quick" = "quick";
  private nameInput: TextInputView | null = null;
  private noTurnTimer = true;
  private notice: string | null = null;
  private preferences: GamePreferences;
  private roomCode = "";
  private roomCodeInput: TextInputView | null = null;
  private rulesNotice: string | null = null;
  private rulesPageIndex = 0;
  private rulesTab: RulesSettingsTab = "rules";
  private readonly unsubscribe: () => void;
  private readonly viewRoot: Node;

  public constructor(
    root: Node,
    private readonly assets: AssetRegistry,
    private readonly controller: FriendRoomController,
    private readonly options: FriendRoomViewOptions,
  ) {
    const visibleSize = view.getVisibleSize();
    this.viewRoot = createContainer(root, "FriendRoomFlow", 1920, 1080);
    // Keep the shared table backdrop at the 16:9 design size. Scaling it up on
    // ultra-wide phones made a second scene peek out from under the home art
    // and created hard side seams. Extra width is filled by home side
    // extensions (on the home screen) or the camera clear color elsewhere.
    createSprite(
      this.viewRoot,
      assets,
      "scene.teahouse.table",
      1920,
      1080,
    );
    this.contentRoot = createContainer(
      this.viewRoot,
      "FriendRoomContent",
      1920,
      1080,
    );
    const contentScale = Math.min(1, visibleSize.width / 1920);
    this.contentRoot.setScale(contentScale, contentScale, 1);
    this.preferences = options.preferences;
    this.latestState = controller.state;
    this.unsubscribe = controller.subscribe((state) => this.render(state));
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.unsubscribe();
    this.viewRoot.destroy();
  }

  public render(state: FriendRoomState): void {
    if (this.leaveConfirmationOpen && state.error) {
      this.leaveConfirmationOpen = false;
    }
    this.latestState = state;
    this.entryMode = reconcileFriendRoomEntryMode(
      this.entryMode,
      state.update !== null,
    );
    if (!state.update) {
      this.leaveConfirmationOpen = false;
    }
    this.nameInput = null;
    this.roomCodeInput = null;
    destroyChildren(this.contentRoot);

    if (state.update) {
      this.renderLobby(state, state.update.room);
    } else {
      this.renderEntry(state);
    }

    if (
      state.connection === "connecting" ||
      state.connection === "reconnecting"
    ) {
      this.renderConnectionOverlay(state.connection);
    }

    if (state.update && this.leaveConfirmationOpen) {
      this.renderLeaveConfirmation(state);
    }

    if (state.error) {
      this.renderError(state.error);
    } else if (this.notice) {
      this.renderNotice(this.notice);
    }
  }

  private activateAvatar(avatarKey: AvatarKey): void {
    this.captureInputs();
    this.avatarKey = avatarKey;
    this.controller.clearError();
    this.render(this.latestState);
  }

  private captureInputs(): void {
    this.displayName = this.nameInput?.editBox.string ?? this.displayName;
    this.roomCode = this.roomCodeInput?.editBox.string ?? this.roomCode;
  }

  private createRoom(): void {
    this.captureInputs();
    this.controller.createRoom({
      avatarKey: this.avatarKey,
      displayName: this.displayName,
      maxPlayers: this.maxPlayers,
      mode: this.mode,
      turnTimerEnabled: !this.noTurnTimer,
    });
  }

  private joinRoom(): void {
    this.captureInputs();
    this.controller.joinRoom({
      avatarKey: this.avatarKey,
      displayName: this.displayName,
      roomCode: this.roomCode,
    });
  }

  private invite(roomCode: string): void {
    void this.options
      .onInvite(roomCode)
      .then((result) => {
        if (this.disposed) {
          return;
        }

        this.notice =
          result === "shared"
            ? "已打开微信分享，可以直接发送给好友"
            : "房间码已复制，可以发给好友";
        this.render(this.latestState);
      })
      .catch(() => {
        if (this.disposed) {
          return;
        }

        this.notice = "房间码复制失败，请直接告诉好友";
        this.render(this.latestState);
      });
  }

  private openEntryDialog(mode: "create" | "join"): void {
    this.displayName = generateRandomFriendRoomNickname();
    if (mode === "create") {
      this.noTurnTimer = true;
    }
    this.entryMode = mode;
    this.controller.clearError();
    this.render(this.latestState);
  }

  private confirmLeaveRoom(): void {
    const previousEntryMode = this.entryMode;
    this.entryMode = "home";
    this.notice = null;
    if (!this.controller.leaveRoom()) {
      this.entryMode = previousEntryMode;
    }
  }

  private setLobbyAiCount(aiCount: number): void {
    const previousFillWithAi = this.fillWithAi;
    this.fillWithAi = false;
    if (!this.controller.setAiCount(aiCount)) {
      this.fillWithAi = previousFillWithAi;
      return;
    }
  }

  private openLeaveConfirmation(): void {
    if (
      this.latestState.connection !== "connected" ||
      this.latestState.pending.leave ||
      this.latestState.pending.ai ||
      this.latestState.pending.ready ||
      this.latestState.pending.start ||
      this.latestState.update?.room.phase !== "lobby"
    ) {
      return;
    }

    this.leaveConfirmationOpen = true;
    this.notice = null;
    this.controller.clearError();
    this.render(this.latestState);
  }

  private renderAvatarPicker(parent: Node, y: number): void {
    AVATARS.forEach((avatarKey, index) => {
      const x =
        (index - (AVATARS.length - 1) / 2) * 128 + ENTRY_CONTROL_X;
      const avatarRoot = createContainer(
        parent,
        `AvatarChoice:${avatarKey}`,
        116,
        116,
        x,
        y,
      );
      if (avatarKey === this.avatarKey) {
        createSprite(
          avatarRoot,
          this.assets,
          "fx.card.selected",
          134,
          134,
        );
      }
      createSprite(
        avatarRoot,
        this.assets,
        AVATAR_ASSET_KEYS[avatarKey],
        102,
        102,
      );
      avatarRoot.on(Node.EventType.TOUCH_END, () =>
        this.activateAvatar(avatarKey),
      );
    });
  }

  private renderEntryLabel(parent: Node, label: string, y: number): void {
    createText(
      parent,
      this.assets,
      label,
      ENTRY_LABEL_WIDTH,
      50,
      ENTRY_LABEL_X,
      y,
      {
        color: new Color(238, 216, 175, 255),
        fontKey: "font.interface",
        fontSize: 24,
        outlineColor: new Color(56, 28, 17, 255),
        outlineWidth: 1,
      },
    );
  }

  private renderConnectionOverlay(
    connection: "connecting" | "reconnecting",
  ): void {
    const overlay = createModalBackdrop(this.contentRoot);
    overlay.name = "FriendRoomConnectionOverlay";
    createSprite(
      overlay,
      this.assets,
      "ui.panel.secondary",
      660,
      250,
      0,
      0,
      true,
    );
    createSprite(
      overlay,
      this.assets,
      "fx.connection.reconnecting",
      96,
      96,
      0,
      36,
    );
    createText(
      overlay,
      this.assets,
      connection === "connecting"
        ? "正在进入好友房…"
        : "正在重新连接好友房…",
      560,
      54,
      0,
      -66,
      {
        fontKey: "font.interface",
        fontSize: 30,
        outlineColor: new Color(45, 23, 15, 255),
        outlineWidth: 2,
      },
    );
  }

  private renderEntry(state: FriendRoomState): void {
    this.renderHomeBase();

    if (this.entryMode === "rules") {
      renderRulesSettingsView(
        this.contentRoot,
        this.assets,
        {
          notice: this.rulesNotice,
          pageIndex: this.rulesPageIndex,
          preferences: this.preferences,
          tab: this.rulesTab,
        },
        {
          onClose: () => {
            this.entryMode = "home";
            this.rulesNotice = null;
            this.render(this.latestState);
          },
          onPageChange: (pageIndex) => {
            this.rulesPageIndex = pageIndex;
            this.rulesNotice = null;
            this.render(this.latestState);
          },
          onPreferencesChange: (preferences) => {
            this.preferences = preferences;
            this.options.onPreferencesChange(preferences);
            this.rulesNotice = "设置已保存到本机";
            this.render(this.latestState);
          },
          onTabChange: (tab) => {
            this.rulesTab = tab;
            this.rulesNotice = null;
            this.render(this.latestState);
          },
        },
      );
    } else if (this.entryMode !== "home") {
      this.renderEntryDialog(this.entryMode, state);
    }
  }

  private renderEntryDialog(
    mode: Exclude<FriendRoomEntryMode, "home" | "rules">,
    state: FriendRoomState,
  ): void {
    const layout = FRIEND_ROOM_DIALOG_LAYOUT[mode];
    const overlay = createModalBackdrop(this.contentRoot);
    overlay.name = mode === "create" ? "CreateRoomDialog" : "JoinRoomDialog";
    createSprite(
      overlay,
      this.assets,
      layout.panel.assetKey,
      layout.panel.width,
      layout.panel.height,
      layout.panel.x,
      layout.panel.y,
      layout.panel.sliced,
    );
    createText(
      overlay,
      this.assets,
      mode === "create" ? "创建好友房" : "加入好友房",
      layout.title.width,
      layout.title.height,
      layout.title.x,
      layout.title.y,
      {
        color: new Color(246, 224, 181, 255),
        fontKey: "font.display",
        fontSize: 44,
        outlineColor: new Color(56, 28, 17, 255),
        outlineWidth: 2,
      },
    );
    const avatarY = layout.avatars.y;
    const nameY = layout.name.y;
    this.renderEntryLabel(overlay, "选择形象", avatarY);
    this.renderAvatarPicker(overlay, avatarY);
    this.renderEntryLabel(overlay, "昵称", nameY);
    this.nameInput = createTextInput(
      overlay,
      this.assets,
      this.displayName,
      "输入昵称",
      ENTRY_CONTROL_WIDTH,
      layout.name.height,
      ENTRY_CONTROL_X,
      nameY,
      16,
      layout.name.assetKey,
    );

    if (mode === "create") {
      createText(
        overlay,
        this.assets,
        "桌位",
        ENTRY_LABEL_WIDTH,
        54,
        ENTRY_LABEL_X,
        layout.seats!.y,
        {
          color: new Color(238, 216, 175, 255),
          fontKey: "font.interface",
          fontSize: 25,
        },
      );
      ([3, 4, 5, 6] as const).forEach((count, index) => {
        const selected = this.maxPlayers === count;
        const button = createButton(
          overlay,
          this.assets,
          `${count} 人`,
          136,
          layout.seats!.height,
          -220 + index * 150,
          layout.seats!.y,
          () => {
            this.captureInputs();
            this.maxPlayers = count;
            this.render(this.latestState);
          },
          true,
          selected ? BLUE_BUTTON : PAPER_BUTTON,
        );
        if (!selected) {
          button.addComponent(UIOpacity).opacity = 210;
        }
      });
      createText(
        overlay,
        this.assets,
        "选项",
        ENTRY_LABEL_WIDTH,
        54,
        ENTRY_LABEL_X,
        layout.aiFill!.y,
        {
          color: new Color(238, 216, 175, 255),
          fontKey: "font.interface",
          fontSize: 25,
        },
      );
      createSprite(
        overlay,
        this.assets,
        layout.aiFill!.assetKey,
        layout.aiFill!.width,
        layout.aiFill!.height,
        layout.aiFill!.x,
        layout.aiFill!.y,
        layout.aiFill!.sliced,
      );
      const renderRoomOption = (
        name: string,
        label: string,
        enabled: boolean,
        bounds: FriendRoomDialogRect,
        onActivate: () => void,
      ): void => {
        const option = createContainer(
          overlay,
          `RoomOption:${name}`,
          bounds.width,
          bounds.height,
          bounds.x,
          bounds.y,
        );
        createText(
          option,
          this.assets,
          label,
          bounds.width - 12,
          bounds.height - 12,
          0,
          1,
          {
            color: new Color(247, 226, 184, 255),
            fontKey: "font.display",
            fontSize: 23,
            outlineColor: new Color(44, 21, 13, 255),
            outlineWidth: 1,
          },
        );
        if (!enabled) {
          option.addComponent(UIOpacity).opacity = 190;
        }
        option.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
          event.propagationStopped = true;
          onActivate();
        });
      };
      renderRoomOption(
        "AiFill",
        this.fillWithAi
          ? `AI 补位 · 开（${MIN_HUMAN_PLAYERS} 真人）`
          : "AI 补位 · 关",
        this.fillWithAi,
        FRIEND_ROOM_CREATE_OPTION_TOUCHES.aiFill,
        () => {
          this.captureInputs();
          this.fillWithAi = !this.fillWithAi;
          this.render(this.latestState);
        },
      );
      renderRoomOption(
        "NoTurnTimer",
        this.noTurnTimer ? "出牌不倒计时 · 开" : "出牌不倒计时 · 关",
        this.noTurnTimer,
        FRIEND_ROOM_CREATE_OPTION_TOUCHES.noTurnTimer,
        () => {
          this.captureInputs();
          this.noTurnTimer = !this.noTurnTimer;
          this.render(this.latestState);
        },
      );
      createText(
        overlay,
        this.assets,
        "局制",
        ENTRY_LABEL_WIDTH,
        54,
        ENTRY_LABEL_X,
        layout.mode!.y,
        {
          color: new Color(238, 216, 175, 255),
          fontKey: "font.interface",
          fontSize: 25,
        },
      );
      (["quick", "classic"] as const).forEach((gameMode, index) => {
        const selected = this.mode === gameMode;
        const button = createButton(
          overlay,
          this.assets,
          getModeLabel(gameMode, this.maxPlayers),
          286,
          layout.mode!.height,
          -106 + index * 306,
          layout.mode!.y,
          () => {
            this.captureInputs();
            this.mode = gameMode;
            this.render(this.latestState);
          },
          true,
          selected ? BLUE_BUTTON : PAPER_BUTTON,
        );
        if (!selected) {
          button.addComponent(UIOpacity).opacity = 210;
        }
      });
    } else {
      this.renderEntryLabel(overlay, "房间码", layout.roomCode!.y);
      this.roomCodeInput = createTextInput(
        overlay,
        this.assets,
        this.roomCode,
        `输入 ${ROOM_CODE_LENGTH} 位数字房间码`,
        ENTRY_CONTROL_WIDTH,
        layout.roomCode!.height,
        ENTRY_CONTROL_X,
        layout.roomCode!.y,
        ROOM_CODE_LENGTH,
        layout.roomCode!.assetKey,
        EditBox.InputMode.NUMERIC,
      );
      const codeLabel = this.roomCodeInput.editBox.textLabel;
      if (codeLabel) {
        codeLabel.spacingX = 5;
      }
    }

    const actionY = layout.actions.y;
    createButton(
      overlay,
      this.assets,
      "返回",
      240,
      94,
      -164,
      actionY,
      () => {
        this.captureInputs();
        this.entryMode = "home";
        this.controller.clearError();
        this.render(this.latestState);
      },
      state.pending.binding === null,
      BLUE_BUTTON,
    );
    createButton(
      overlay,
      this.assets,
      mode === "create" ? "确认创建" : "确认加入",
      320,
      layout.actions.height,
      176,
      actionY,
      () => (mode === "create" ? this.createRoom() : this.joinRoom()),
      state.pending.binding === null,
      LACQUER_BUTTON,
    );
  }

  private renderError(error: FriendRoomError): void {
    const layout = this.latestState.update
      ? FRIEND_ROOM_LOBBY_LAYOUT.notice
      : { height: 96, width: 680, x: 0, y: -450 };
    const notice = createHorizontalSliceSprite(
      this.contentRoot,
      this.assets,
      "ui.plaque.small",
      layout.width,
      layout.height,
      layout.x,
      layout.y,
    );
    notice.name = "FriendRoomError";
    createText(
      notice,
      this.assets,
      getErrorMessage(error),
      590,
      58,
      0,
      0,
      {
        color: new Color(91, 43, 28, 255),
        fontKey: "font.interface",
        fontSize: 25,
      },
    );
  }

  private renderHomeBase(): void {
    const visibleSize = view.getVisibleSize();
    // Mini Game home art is always one continuous sprite. Ultra-wide devices
    // use a dedicated 2560x1080 master instead of stitching side textures to
    // the 16:9 image, which removes both runtime seams and stripe artefacts.
    const homeBackground = getHomeBackgroundLayout(
      visibleSize.width,
      visibleSize.height,
    );
    createSprite(
      this.contentRoot,
      this.assets,
      homeBackground.assetKey,
      homeBackground.width,
      homeBackground.height,
    );

    const create = createContainer(
      this.contentRoot,
      "Button:创建房间",
      432,
      383,
      -274,
      -73,
    );
    create.on(Node.EventType.TOUCH_END, () => {
      this.openEntryDialog("create");
    });

    const join = createContainer(
      this.contentRoot,
      "Button:加入房间",
      419,
      167,
      200,
      -8,
    );
    join.on(Node.EventType.TOUCH_END, () => {
      this.openEntryDialog("join");
    });

    const practice = createContainer(
      this.contentRoot,
      "Button:单人练习",
      419,
      171,
      200,
      -195,
    );
    practice.on(Node.EventType.TOUCH_END, this.options.onPractice);

    const rules = createContainer(
      this.contentRoot,
      "Button:规则与设置",
      // The plaque is baked into the home background. Keep the hit target
      // inside the artwork and away from the WeChat capsule on extra-wide
      // landscape devices.
      290,
      94,
      740,
      455,
    );
    rules.on(Node.EventType.TOUCH_END, () => {
      this.entryMode = "rules";
      this.notice = null;
      this.render(this.latestState);
    });
  }

  private renderLeaveConfirmation(state: FriendRoomState): void {
    const layout = FRIEND_ROOM_LOBBY_LAYOUT.leaveDialog;
    const overlay = createModalBackdrop(this.contentRoot);
    overlay.name = "FriendRoomLeaveConfirmation";
    createSprite(
      overlay,
      this.assets,
      "ui.panel.secondary",
      layout.panel.width,
      layout.panel.height,
      layout.panel.x,
      layout.panel.y,
      true,
    );
    createText(
      overlay,
      this.assets,
      "返回首页",
      layout.title.width,
      layout.title.height,
      layout.title.x,
      layout.title.y,
      {
        fontKey: "font.display",
        fontSize: 42,
        outlineColor: new Color(43, 22, 14, 255),
        outlineWidth: 2,
      },
    );
    createText(
      overlay,
      this.assets,
      "确定离开好友房并返回首页吗？\n离开后需要重新输入房间码加入。",
      layout.body.width,
      layout.body.height,
      layout.body.x,
      layout.body.y,
      {
        color: new Color(239, 215, 166, 255),
        fontKey: "font.interface",
        fontSize: 28,
        lineHeight: 42,
        outlineColor: new Color(43, 22, 14, 255),
        outlineWidth: 1,
      },
    );
    createButton(
      overlay,
      this.assets,
      "继续等待",
      layout.cancelButton.width,
      layout.cancelButton.height,
      layout.cancelButton.x,
      layout.cancelButton.y,
      () => {
        this.leaveConfirmationOpen = false;
        this.render(this.latestState);
      },
      !state.pending.leave,
      LEAVE_CANCEL_BUTTON,
    );
    createButton(
      overlay,
      this.assets,
      state.pending.leave ? "正在离开" : "确认离开",
      layout.confirmButton.width,
      layout.confirmButton.height,
      layout.confirmButton.x,
      layout.confirmButton.y,
      () => this.confirmLeaveRoom(),
      state.connection === "connected" && !state.pending.leave,
      LEAVE_CONFIRM_BUTTON,
    );
  }

  private renderNotice(message: string): void {
    const layout = FRIEND_ROOM_LOBBY_LAYOUT.notice;
    const notice = createHorizontalSliceSprite(
      this.contentRoot,
      this.assets,
      "ui.plaque.small",
      layout.width,
      layout.height,
      layout.x,
      layout.y,
    );
    notice.name = "FriendRoomNotice";
    createText(notice, this.assets, message, 590, 58, 0, 0, {
      color: new Color(72, 75, 42, 255),
      fontKey: "font.interface",
      fontSize: 25,
    });
  }

  private renderLobby(state: FriendRoomState, room: FriendRoomSnapshot): void {
    const connected =
      state.connection === "connected" && !state.pending.leave;
    const isHost = room.hostPlayerId === room.selfPlayerId;
    const layout = FRIEND_ROOM_LOBBY_LAYOUT;
    const roomTitle = createHorizontalSliceSprite(
      this.contentRoot,
      this.assets,
      "ui.scoreRibbon",
      layout.roomTitle.width,
      layout.roomTitle.height,
      layout.roomTitle.x,
      layout.roomTitle.y,
    );
    createText(
      roomTitle,
      this.assets,
      `好友房 ${room.roomCode}`,
      layout.roomTitleLabel.width,
      layout.roomTitleLabel.height,
      layout.roomTitleLabel.x,
      layout.roomTitleLabel.y,
      {
        color: new Color(57, 34, 20, 255),
        fontKey: "font.display",
        fontSize: 28,
      },
    );
    createText(
      roomTitle,
      this.assets,
      getModeLabel(room.mode, room.maxPlayers),
      layout.roomModeLabel.width,
      layout.roomModeLabel.height,
      layout.roomModeLabel.x,
      layout.roomModeLabel.y,
      {
        color: new Color(72, 44, 27, 255),
        fontKey: "font.interface",
        fontSize: 22,
      },
    );

    createButton(
      this.contentRoot,
      this.assets,
      "返回首页",
      layout.returnHome.width,
      layout.returnHome.height,
      layout.returnHome.x,
      layout.returnHome.y,
      () => this.openLeaveConfirmation(),
      connected &&
        room.phase === "lobby" &&
        !state.pending.ai &&
        !state.pending.ready &&
        !state.pending.start,
      LOBBY_HOME_BUTTON,
    );

    const humans = room.players.filter((player) => !player.isAi);
    const connectedHumans = humans.filter((player) => player.connected);
    const aiCount = room.players.filter((player) => player.isAi).length;
    const readyHumans = humans.filter(
      (player) => player.connected && player.ready,
    ).length;
    const hasMinimumHumans = connectedHumans.length >= MIN_HUMAN_PLAYERS;
    const canManageAi =
      connected && isHost && room.phase === "lobby" && !state.pending.ai;
    const canAddAi =
      canManageAi &&
      hasMinimumHumans &&
      room.players.length < room.maxPlayers &&
      !state.pending.ready &&
      !state.pending.start;
    const canRemoveAi =
      canManageAi &&
      aiCount > 0 &&
      !state.pending.ready &&
      !state.pending.start;
    const orderedPlayers = this.getViewerRelativePlayers(room);
    const activeSlots = FRIEND_ROOM_LOBBY_SLOT_MAPS[room.maxPlayers];
    activeSlots.forEach((slotIndex, index) => {
      const [x, y] = FRIEND_ROOM_LOBBY_SEAT_POSITIONS[slotIndex];
      const player = orderedPlayers[index];
      if (player) {
        this.renderOccupiedSeat(player, room, x, y);
      } else {
        this.renderOpenSeat(
          index === activeSlots.length - 1 && canAddAi,
          x,
          y,
          () => this.setLobbyAiCount(aiCount + 1),
        );
      }
    });

    const settings = createSprite(
      this.contentRoot,
      this.assets,
      "ui.panel.secondary",
      layout.settings.width,
      layout.settings.height,
      layout.settings.x,
      layout.settings.y,
      true,
    );
    createText(
      settings,
      this.assets,
      `${room.maxPlayers} 人桌`,
      layout.settingsTitle.width,
      layout.settingsTitle.height,
      layout.settingsTitle.x,
      layout.settingsTitle.y,
      {
        fontKey: "font.display",
        fontSize: 28,
        outlineColor: new Color(34, 24, 24, 255),
        outlineWidth: 2,
      },
    );
    createText(
      settings,
      this.assets,
      state.pending.ai
        ? `开局补位 关 · ${aiCount}AI · 调整中`
        : isHost
          ? `开局补位 ${this.fillWithAi ? "开" : "关"} · ${humans.length}真人 · ${aiCount}AI`
          : `${humans.length}真人 · ${aiCount}AI · 房主管理`,
      layout.settingsStatus.width,
      layout.settingsStatus.height,
      layout.settingsStatus.x,
      layout.settingsStatus.y,
      {
        color: new Color(239, 215, 166, 255),
        fontKey: "font.interface",
        fontSize: 22,
      },
    );
    createButton(
      this.contentRoot,
      this.assets,
      "移除机器人",
      layout.aiRemoveButton.width,
      layout.aiRemoveButton.height,
      layout.aiRemoveButton.x,
      layout.aiRemoveButton.y,
      () => this.setLobbyAiCount(Math.max(0, aiCount - 1)),
      canRemoveAi,
      LOBBY_AI_REMOVE_BUTTON,
    );
    createButton(
      this.contentRoot,
      this.assets,
      "添加机器人",
      layout.aiAddButton.width,
      layout.aiAddButton.height,
      layout.aiAddButton.x,
      layout.aiAddButton.y,
      () => this.setLobbyAiCount(aiCount + 1),
      canAddAi,
      LOBBY_AI_ADD_BUTTON,
    );

    const self = room.players.find(
      (player) => player.playerId === room.selfPlayerId,
    );
    const canSetReady =
      connected &&
      room.phase === "lobby" &&
      state.update?.permissions.canSetReady === true &&
      !state.pending.ai &&
      !state.pending.start &&
      !state.pending.ready;
    const readyVisual = self?.ready
      ? layout.readyButtonPaperVisual
      : layout.readyButtonGreenVisual;
    createButton(
      this.contentRoot,
      this.assets,
      state.pending.ready ? "正在处理" : self?.ready ? "取消准备" : "准备",
      readyVisual.width,
      readyVisual.height,
      readyVisual.x,
      readyVisual.y,
      () => this.controller.setReady(!self?.ready),
      canSetReady,
      self?.ready ? LOBBY_CANCEL_READY_BUTTON : LOBBY_READY_BUTTON,
    );

    createButton(
      this.contentRoot,
      this.assets,
      "邀请好友",
      layout.inviteButton.width,
      layout.inviteButton.height,
      layout.inviteButton.x,
      layout.inviteButton.y,
      () => this.invite(room.roomCode),
      connected,
      LOBBY_INVITE_BUTTON,
    );

    const allHumansReady =
      hasMinimumHumans &&
      humans.every((player) => player.connected && player.ready);
    const hasEnoughSeats = this.fillWithAi
      ? hasMinimumHumans
      : room.players.length === room.maxPlayers;
    const canStart =
      connected &&
      isHost &&
      state.update?.permissions.canStart === true &&
      allHumansReady &&
      hasEnoughSeats &&
      !state.pending.ai &&
      !state.pending.ready &&
      !state.pending.start;
    const start = createSprite(
      this.contentRoot,
      this.assets,
      "ui.turnButton",
      layout.startButton.width,
      layout.startButton.height,
      layout.startButton.x,
      layout.startButton.y,
    );
    start.name = "Button:开始游戏";
    createText(
      start,
      this.assets,
      isHost
        ? state.pending.start
          ? "正在\n开局"
          : !hasMinimumHumans
            ? "等待\n好友"
            : !allHumansReady
              ? "等待\n准备"
              : !hasEnoughSeats
                ? `还差\n${room.maxPlayers - room.players.length}席`
                : "开始\n游戏"
        : "等待\n房主",
      210,
      94,
      0,
      2,
      {
        color: new Color(69, 38, 19, 255),
        fontKey: "font.display",
        fontSize: isHost ? 37 : 31,
      },
    );
    if (canStart) {
      start.on(Node.EventType.TOUCH_END, () =>
        this.controller.startRoom(this.fillWithAi),
      );
    } else {
      const startSprite = start.getComponent(Sprite);
      if (startSprite) {
        startSprite.color = new Color(255, 255, 255, 176);
      }
    }

    createSprite(
      this.contentRoot,
      this.assets,
      "ui.match.stat.paper",
      layout.readyCount.width,
      layout.readyCount.height,
      layout.readyCount.x,
      layout.readyCount.y,
    );
    createText(
      this.contentRoot,
      this.assets,
      `${readyHumans}/${humans.length} 真人已准备`,
      210,
      44,
      layout.readyCount.x,
      layout.readyCount.y,
      {
        color: allHumansReady
          ? new Color(40, 104, 57, 255)
          : new Color(72, 44, 27, 255),
        fontKey: "font.interface",
        fontSize: 24,
      },
    );

    if (room.phase === "playing" && state.update?.match) {
      createModalBackdrop(this.contentRoot);
      createText(
        this.contentRoot,
        this.assets,
        "牌局已开始，正在入席…",
        720,
        120,
        0,
        0,
        {
          fontKey: "font.display",
          fontSize: 40,
          outlineColor: new Color(43, 22, 14, 255),
          outlineWidth: 3,
        },
      );
    }
  }

  private renderOccupiedSeat(
    player: RoomPlayerSnapshot,
    room: FriendRoomSnapshot,
    x: number,
    y: number,
  ): void {
    const seat = createContainer(
      this.contentRoot,
      `LobbySeat:${player.playerId}`,
      286,
      254,
      x,
      y,
    );
    if (player.ready) {
      createSprite(seat, this.assets, "fx.card.legal", 208, 208, 0, 36);
    }
    createSprite(
      seat,
      this.assets,
      AVATAR_ASSET_KEYS[player.avatarKey],
      176,
      176,
      0,
      36,
    );
    const statusLayout = FRIEND_ROOM_LOBBY_LAYOUT.occupiedSeatStatus;
    const status = createSprite(
      seat,
      this.assets,
      player.ready ? "ui.match.stat.green" : "ui.match.stat.paper",
      statusLayout.width,
      statusLayout.height,
      statusLayout.x,
      statusLayout.y,
    );
    const statusTextX = player.ready ? 11 : 0;
    createText(status, this.assets, player.name, 184, 32, statusTextX, 12, {
      color: player.ready
        ? new Color(246, 229, 187, 255)
        : new Color(70, 39, 21, 255),
      fontKey: "font.display",
      fontSize: 25,
      outlineColor: new Color(35, 48, 30, 255),
      outlineWidth: player.ready ? 1 : 0,
    });
    createText(
      status,
      this.assets,
      player.connected ? (player.ready ? "已准备" : "未准备") : "离线",
      150,
      22,
      statusTextX,
      -17,
      {
        color: player.ready
          ? new Color(127, 206, 126, 255)
          : new Color(105, 70, 43, 255),
        fontKey: "font.interface",
        fontSize: 16,
        outlineColor: new Color(35, 35, 28, 255),
        outlineWidth: player.ready ? 1 : 0,
      },
    );
    if (player.isAi) {
      createSprite(seat, this.assets, "ui.badge.ai", 76, 50, 88, 92);
    }
    if (player.playerId === room.hostPlayerId) {
      createText(seat, this.assets, "房主", 68, 32, -92, 96, {
        color: new Color(239, 214, 157, 255),
        fontKey: "font.interface",
        fontSize: 18,
        outlineColor: new Color(56, 31, 18, 255),
        outlineWidth: 2,
      });
    }
    if (player.playerId === room.selfPlayerId) {
      createText(seat, this.assets, "你", 44, 32, 92, 95, {
        color: new Color(247, 224, 165, 255),
        fontKey: "font.interface",
        fontSize: 18,
        outlineColor: new Color(56, 31, 18, 255),
        outlineWidth: 2,
      });
    }
  }

  private renderOpenSeat(
    addAiTarget: boolean,
    x: number,
    y: number,
    onAddAi: () => void,
  ): void {
    const touchBounds = addAiTarget
      ? FRIEND_ROOM_LOBBY_LAYOUT.aiAddSeatTouch
      : FRIEND_ROOM_LOBBY_LAYOUT.seat;
    const seat = createContainer(
      this.contentRoot,
      addAiTarget ? "LobbySeat:AddAi" : "LobbySeat:Open",
      touchBounds.width,
      touchBounds.height,
      x,
      y,
    );
    createSprite(seat, this.assets, "fx.card.selected", 208, 208, 0, 34);
    if (addAiTarget) {
      const badge = FRIEND_ROOM_LOBBY_LAYOUT.aiAddSeatBadge;
      createSprite(
        seat,
        this.assets,
        "ui.badge.ai",
        badge.width,
        badge.height,
        badge.x,
        badge.y,
      );
      seat.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
        event.propagationStopped = true;
        onAddAi();
      });
    } else {
      const silhouette = createSprite(
        seat,
        this.assets,
        "avatar.bambooCat.normal",
        166,
        166,
        0,
        34,
      );
      // Empty seats should read as placeholders, not duplicate ready players.
      // Use the existing avatar art as a dark silhouette so the gold empty-seat
      // ring remains visible without exposing the character's face.
      silhouette.getComponent(Sprite)!.color = new Color(42, 46, 57, 255);
      silhouette.addComponent(UIOpacity).opacity = 176;
    }
    createHorizontalSliceSprite(
      seat,
      this.assets,
      "ui.plaque.small",
      246,
      82,
      0,
      -78,
    );
    createText(
      seat,
      this.assets,
      addAiTarget ? "添加机器人" : "等待好友",
      180,
      42,
      0,
      -78,
      {
        color: new Color(79, 47, 28, 255),
        fontKey: "font.display",
        fontSize: 26,
      },
    );
  }

  private getViewerRelativePlayers(
    room: FriendRoomSnapshot,
  ): RoomPlayerSnapshot[] {
    const selfIndex = room.players.findIndex(
      (player) => player.playerId === room.selfPlayerId,
    );
    if (selfIndex <= 0) {
      return [...room.players];
    }

    return room.players.map(
      (_, offset) => room.players[(selfIndex + offset) % room.players.length],
    );
  }
}
