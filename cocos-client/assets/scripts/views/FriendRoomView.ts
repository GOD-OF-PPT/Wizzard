import { Color, Node, Sprite, UIOpacity, view } from "cc";
import {
  MIN_HUMAN_PLAYERS,
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
import { FRIEND_ROOM_DIALOG_LAYOUT } from "./FriendRoomDialogLayout";

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

const SEAT_POSITIONS = [
  [-741, -11],
  [-432, 253],
  [7, 383],
  [444, 311],
  [734, 19],
  [9, -282],
] as const;

const SLOT_MAPS: Record<3 | 4 | 5 | 6, readonly number[]> = {
  3: [1, 2, 3],
  4: [1, 2, 3, 0],
  5: [1, 2, 3, 0, 4],
  6: [1, 2, 3, 0, 4, 5],
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

const GREEN_BUTTON: ButtonStyle = {
  assetKey: "ui.status.green",
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

const AI_FILL_BUTTON: ButtonStyle = {
  assetKey: "ui.friendRoom.row.ai.v2",
  fontKey: "font.display",
  fontSize: 25,
  outlineWidth: 1,
  textColor: new Color(247, 226, 184, 255),
};

type EntryMode = "create" | "home" | "join" | "rules";

export type FriendRoomViewOptions = {
  onInvite: (roomCode: string) => Promise<void>;
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
    ROOM_CODE_INVALID: "请输入正确的 6 位房间码",
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
  private displayName = "青竹客";
  private disposed = false;
  private entryMode: EntryMode = "home";
  private fillWithAi = true;
  private latestState: FriendRoomState;
  private maxPlayers: 3 | 4 | 5 | 6 = 6;
  private mode: "classic" | "quick" = "quick";
  private nameInput: TextInputView | null = null;
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
    this.latestState = state;
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
      .then(() => {
        if (this.disposed) {
          return;
        }

        this.notice = "房间码已复制，可以发给好友";
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
    mode: Exclude<EntryMode, "home" | "rules">,
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
        "机器人",
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
      const aiFillButton = createButton(
        overlay,
        this.assets,
        this.fillWithAi
          ? `开启 · 至少 ${MIN_HUMAN_PLAYERS} 真人后补位`
          : "关闭 · 不添加机器人",
        layout.aiFill!.width,
        layout.aiFill!.height,
        ENTRY_CONTROL_X,
        layout.aiFill!.y,
        () => {
          this.captureInputs();
          this.fillWithAi = !this.fillWithAi;
          this.render(this.latestState);
        },
        true,
        AI_FILL_BUTTON,
      );
      if (!this.fillWithAi) {
        aiFillButton.addComponent(UIOpacity).opacity = 200;
      }
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
        "输入 6 位房间码",
        ENTRY_CONTROL_WIDTH,
        layout.roomCode!.height,
        ENTRY_CONTROL_X,
        layout.roomCode!.y,
        6,
        layout.roomCode!.assetKey,
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
    const notice = createSprite(
      this.contentRoot,
      this.assets,
      "ui.plaque.small",
      680,
      96,
      0,
      -450,
      true,
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
      this.entryMode = "create";
      this.render(this.latestState);
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
      this.entryMode = "join";
      this.render(this.latestState);
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

  private renderNotice(message: string): void {
    const notice = createSprite(
      this.contentRoot,
      this.assets,
      "ui.plaque.small",
      680,
      96,
      0,
      -450,
      true,
    );
    notice.name = "FriendRoomNotice";
    createText(notice, this.assets, message, 590, 58, 0, 0, {
      color: new Color(72, 75, 42, 255),
      fontKey: "font.interface",
      fontSize: 25,
    });
  }

  private renderLobby(state: FriendRoomState, room: FriendRoomSnapshot): void {
    const connected = state.connection === "connected";
    const isHost = room.hostPlayerId === room.selfPlayerId;
    const roomTitle = createSprite(
      this.contentRoot,
      this.assets,
      "ui.scoreRibbon",
      470,
      190,
      -670,
      390,
      true,
    );
    createText(
      roomTitle,
      this.assets,
      `好友房 ${room.roomCode}`,
      390,
      64,
      0,
      32,
      {
        color: new Color(57, 34, 20, 255),
        fontKey: "font.display",
        fontSize: 32,
      },
    );
    createText(
      roomTitle,
      this.assets,
      getModeLabel(room.mode, room.maxPlayers),
      390,
      54,
      0,
      -36,
      {
        color: new Color(72, 44, 27, 255),
        fontKey: "font.interface",
        fontSize: 25,
      },
    );

    const orderedPlayers = this.getViewerRelativePlayers(room);
    const activeSlots = SLOT_MAPS[room.maxPlayers];
    activeSlots.forEach((slotIndex, index) => {
      const [x, y] = SEAT_POSITIONS[slotIndex];
      const player = orderedPlayers[index];
      if (player) {
        this.renderOccupiedSeat(player, room, x, y);
      } else {
        this.renderOpenSeat(
          index === activeSlots.length - 1 && this.fillWithAi,
          x,
          y,
        );
      }
    });

    const settings = createSprite(
      this.contentRoot,
      this.assets,
      "ui.panel.secondary",
      382,
      203,
      -723,
      -359,
      true,
    );
    createText(settings, this.assets, `${room.maxPlayers} 人桌`, 300, 58, 0, 43, {
      fontKey: "font.display",
      fontSize: 30,
      outlineColor: new Color(34, 24, 24, 255),
      outlineWidth: 2,
    });
    const aiToggle = createText(
      settings,
      this.assets,
      isHost
        ? `AI补位：${this.fillWithAi ? "开" : "关"} · 至少${MIN_HUMAN_PLAYERS}真人`
        : "空位由房主决定",
      310,
      58,
      0,
      -45,
      {
        color: new Color(239, 215, 166, 255),
        fontKey: "font.interface",
        fontSize: 27,
      },
    );
    if (isHost && connected) {
      aiToggle.on(Node.EventType.TOUCH_END, () => {
        this.fillWithAi = !this.fillWithAi;
        this.render(this.latestState);
      });
    }

    const self = room.players.find(
      (player) => player.playerId === room.selfPlayerId,
    );
    const canSetReady =
      connected &&
      room.phase === "lobby" &&
      state.update?.permissions.canSetReady === true &&
      !state.pending.ready;
    createButton(
      this.contentRoot,
      this.assets,
      self?.ready ? "取消准备" : "准备",
      270,
      118,
      260,
      -400,
      () => this.controller.setReady(!self?.ready),
      canSetReady,
      self?.ready ? BLUE_BUTTON : GREEN_BUTTON,
    );

    createButton(
      this.contentRoot,
      this.assets,
      "邀请好友",
      330,
      150,
      420,
      -295,
      () => this.invite(room.roomCode),
      connected,
      PAPER_BUTTON,
    );

    const humans = room.players.filter((player) => !player.isAi);
    const connectedHumans = humans.filter((player) => player.connected);
    const readyHumans = humans.filter(
      (player) => player.connected && player.ready,
    ).length;
    const hasMinimumHumans = connectedHumans.length >= MIN_HUMAN_PLAYERS;
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
      !state.pending.start;
    const start = createSprite(
      this.contentRoot,
      this.assets,
      "ui.turnButton",
      300,
      260,
      740,
      -240,
    );
    start.name = "Button:开始游戏";
    createText(
      start,
      this.assets,
      isHost ? (state.pending.start ? "正在开局" : "开始游戏") : "等待房主",
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
      start.addComponent(UIOpacity).opacity = 132;
    }

    createSprite(
      this.contentRoot,
      this.assets,
      "ui.plaque.small",
      270,
      68,
      740,
      -420,
      true,
    );
    createText(
      this.contentRoot,
      this.assets,
      `${readyHumans}/${room.maxPlayers} 已准备`,
      220,
      44,
      740,
      -420,
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
    createSprite(
      seat,
      this.assets,
      "ui.status.green",
      246,
      82,
      0,
      -78,
      true,
    );
    createText(seat, this.assets, player.name, 200, 42, 0, -71, {
      fontSize: 28,
      outlineColor: new Color(35, 48, 30, 255),
      outlineWidth: 2,
    });
    createText(
      seat,
      this.assets,
      player.connected ? (player.ready ? "已准备" : "未准备") : "离线",
      150,
      30,
      0,
      -105,
      {
        color: player.ready
          ? new Color(127, 206, 126, 255)
          : new Color(222, 193, 139, 255),
        fontKey: "font.interface",
        fontSize: 18,
        outlineColor: new Color(35, 35, 28, 255),
        outlineWidth: 1,
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

  private renderOpenSeat(aiStandby: boolean, x: number, y: number): void {
    const seat = createContainer(
      this.contentRoot,
      aiStandby ? "LobbySeat:AiStandby" : "LobbySeat:Open",
      286,
      254,
      x,
      y,
    );
    createSprite(seat, this.assets, "fx.card.selected", 208, 208, 0, 34);
    if (aiStandby) {
      createSprite(seat, this.assets, "ui.badge.ai", 148, 148, 0, 34);
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
    createSprite(
      seat,
      this.assets,
      "ui.plaque.small",
      246,
      82,
      0,
      -78,
      true,
    );
    createText(
      seat,
      this.assets,
      aiStandby ? "AI 待命" : "等待好友",
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
