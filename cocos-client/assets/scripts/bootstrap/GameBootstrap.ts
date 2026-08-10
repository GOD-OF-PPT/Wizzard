import {
  _decorator,
  Camera,
  Canvas,
  Color,
  Component,
  Label,
  Layers,
  macro,
  Node,
  ResolutionPolicy,
  UITransform,
  view,
} from "cc";
import { AssetRegistry } from "../assets/AssetRegistry";
import type { IMatchAdapter } from "../adapters/IMatchAdapter";
import {
  createLocalMatchAdapter,
  createNetworkMatchAdapter,
  createRoomSocketClient,
} from "../adapters/MatchAdapterFactory";
import { APP_RUNTIME_CONFIG } from "../config/MatchRuntimeConfig";
import {
  FriendRoomController,
  type FriendRoomState,
} from "../controllers/FriendRoomController";
import type { RoomBinding } from "../network/RoomSocketClient";
import {
  DEFAULT_GAME_PREFERENCES,
  type GamePreferences,
} from "../platform/GamePreferences";
import {
  createPlatformServices,
  type PlatformServices,
} from "../platform/PlatformServices";
import { FriendRoomView } from "../views/FriendRoomView";
import { MatchSceneView } from "../views/MatchSceneView";

const { ccclass } = _decorator;

type ActiveSurface = "boot" | "friend-room" | "network-match" | "practice";

@ccclass("GameBootstrap")
export class GameBootstrap extends Component {
  private activeSurface: ActiveSurface = "boot";
  private adapter: IMatchAdapter | null = null;
  private assets: AssetRegistry | null = null;
  private friendRoomController: FriendRoomController | null = null;
  private friendRoomRouteUnsubscribe: (() => void) | null = null;
  private friendRoomView: FriendRoomView | null = null;
  private loadingNode: Node | null = null;
  private matchView: MatchSceneView | null = null;
  private platformServices: PlatformServices | null = null;
  private preferences: GamePreferences = DEFAULT_GAME_PREFERENCES;
  private routeQueued = false;

  public start(): void {
    view.setOrientation(macro.ORIENTATION_LANDSCAPE);
    // Keep the 16:9 composition intact on ultrawide phones. The surrounding
    // surface becomes the safe-area background instead of cropping controls.
    view.setDesignResolutionSize(1920, 1080, ResolutionPolicy.FIXED_HEIGHT);
    view.resizeWithBrowserSize(true);
    // Set a neutral dark canvas background so any extra space beyond the
    // 16:9 design frame reads as a clean border rather than a visible seam.
    const canvas = this.node.scene?.getComponentInChildren(Canvas);
    if (canvas) {
      const camera = canvas.getComponentInChildren(Camera);
      if (camera) {
        camera.clearColor = new Color(8, 8, 12, 255);
      }
    }
    this.loadingNode = this.showMessage("正在准备奇术茶馆…");
    void this.boot();
  }

  public update(deltaTime: number): void {
    this.adapter?.update(deltaTime);
  }

  public onDestroy(): void {
    this.friendRoomRouteUnsubscribe?.();
    this.friendRoomRouteUnsubscribe = null;
    this.adapter?.dispose();
    this.matchView?.dispose();
    this.friendRoomView?.dispose();
    this.friendRoomController?.dispose();
    this.adapter = null;
    this.matchView = null;
    this.friendRoomView = null;
    this.friendRoomController = null;
    this.assets = null;
    this.platformServices = null;
  }

  private async boot(): Promise<void> {
    try {
      const assets = new AssetRegistry();
      await assets.preload();

      if (!this.isValid) {
        return;
      }

      this.assets = assets;
      this.platformServices = createPlatformServices();
      this.preferences = this.platformServices.preferenceStore.load();
      this.loadingNode?.destroy();
      this.loadingNode = null;

      if (APP_RUNTIME_CONFIG.startup === "practice") {
        this.startPractice();
      } else {
        this.startFriendRoomFlow();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.loadingNode?.destroy();
      this.loadingNode = this.showMessage(`资源加载失败\n${message}`);
    }
  }

  private connectInitialBinding(binding: RoomBinding): void {
    const controller = this.friendRoomController;
    if (!controller) {
      return;
    }

    if (binding.type === "create") {
      controller.createRoom(binding.payload);
    } else if (binding.type === "join") {
      if (binding.payload.roomCode) {
        controller.joinRoom({
          avatarKey: binding.payload.avatarKey,
          displayName: binding.payload.displayName,
          roomCode: binding.payload.roomCode,
        });
      } else if (binding.payload.inviteToken) {
        controller.joinRoomWithInvite({
          avatarKey: binding.payload.avatarKey,
          displayName: binding.payload.displayName,
          inviteToken: binding.payload.inviteToken,
        });
      }
    } else {
      controller.resumeRoom();
    }
  }

  private handleFriendRoomRoute(state: FriendRoomState): void {
    if (this.routeQueued) {
      return;
    }

    const shouldEnterMatch =
      (state.update?.room.phase === "playing" ||
        state.update?.room.phase === "finished") &&
      state.update.match !== null;
    const shouldReturnToLobby =
      state.update?.room.phase === "lobby" && state.update.match === null;
    const shouldReturnToEntry =
      state.update === null &&
      state.error !== null &&
      this.activeSurface === "network-match";

    if (
      (shouldEnterMatch && this.activeSurface !== "network-match") ||
      (shouldReturnToLobby && this.activeSurface === "network-match") ||
      shouldReturnToEntry
    ) {
      this.routeQueued = true;
      // RoomSocketClient synchronously dispatches updates. Route on a
      // microtask so lobby and match listeners are never swapped mid-emit.
      void Promise.resolve().then(() => {
        this.routeQueued = false;
        const latestState = this.friendRoomController?.state;
        const latest = latestState?.update;

        if (
          (latest?.room.phase === "playing" ||
            latest?.room.phase === "finished") &&
          latest.match &&
          this.activeSurface !== "network-match"
        ) {
          this.startNetworkMatch();
        } else if (
          latest?.room.phase === "lobby" &&
          !latest.match &&
          this.activeSurface === "network-match"
        ) {
          this.showFriendRoomSurface();
        } else if (
          !latest &&
          latestState?.error &&
          this.activeSurface === "network-match"
        ) {
          this.showFriendRoomSurface();
        }
      });
    }
  }

  private showFriendRoomSurface(): void {
    const assets = this.assets;
    const controller = this.friendRoomController;
    const platformServices = this.platformServices;
    if (!assets || !controller || !platformServices) {
      throw new Error("FRIEND_ROOM_FLOW_NOT_READY");
    }

    this.adapter?.dispose();
    this.matchView?.dispose();
    this.friendRoomView?.dispose();
    this.adapter = null;
    this.matchView = null;
    this.friendRoomView = new FriendRoomView(
      this.node,
      assets,
      controller,
      {
        onInvite: async (roomCode) =>
          platformServices.copyText(`奇术茶馆 6 位数字房间码：${roomCode}`),
        onPreferencesChange: (preferences) => {
          this.preferences = preferences;
          platformServices.preferenceStore.save(preferences);
        },
        onPractice: () => this.startPractice(),
        preferences: this.preferences,
      },
    );
    this.activeSurface = "friend-room";
  }

  private showMessage(message: string): Node {
    const node = new Node("BootMessage");
    node.layer = Layers.Enum.UI_2D;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(1200, 240);
    const label = node.addComponent(Label);
    label.string = message;
    label.fontSize = 42;
    label.lineHeight = 56;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.color = new Color(243, 226, 184, 255);
    this.node.addChild(node);
    return node;
  }

  private startFriendRoomFlow(connectInitialBinding = true): void {
    const friendRoomConfig = APP_RUNTIME_CONFIG.friendRoom;
    if (!friendRoomConfig) {
      this.startPractice();
      return;
    }

    const platformServices = this.platformServices;
    if (!platformServices) {
      throw new Error("PLATFORM_SERVICES_NOT_READY");
    }
    const controller = new FriendRoomController((binding) =>
      createRoomSocketClient(
        friendRoomConfig,
        binding,
        platformServices,
      ),
    );
    this.friendRoomController = controller;
    this.friendRoomRouteUnsubscribe = controller.subscribe((state) =>
      this.handleFriendRoomRoute(state),
    );
    this.showFriendRoomSurface();

    if (connectInitialBinding && friendRoomConfig.initialBinding) {
      this.connectInitialBinding(friendRoomConfig.initialBinding);
    }
  }

  private startNetworkMatch(): void {
    const assets = this.assets;
    const roomClient = this.friendRoomController?.getRoomClient();
    if (!assets || !roomClient) {
      throw new Error("NETWORK_MATCH_ROOM_CLIENT_NOT_READY");
    }

    this.friendRoomView?.dispose();
    this.friendRoomView = null;
    this.adapter?.dispose();
    this.matchView?.dispose();
    this.adapter = createNetworkMatchAdapter(roomClient, false);
    this.matchView = new MatchSceneView(this.node, assets, this.adapter, {
      onVibrate: () => this.platformServices?.vibrateShort() ?? Promise.resolve(),
      preferences: this.preferences,
    });
    this.activeSurface = "network-match";
    this.adapter.start((update) => this.matchView?.render(update));
  }

  private startPractice(): void {
    const assets = this.assets;
    if (!assets) {
      throw new Error("PRACTICE_ASSETS_NOT_READY");
    }

    this.friendRoomRouteUnsubscribe?.();
    this.friendRoomRouteUnsubscribe = null;
    this.friendRoomView?.dispose();
    this.friendRoomView = null;
    this.friendRoomController?.dispose();
    this.friendRoomController = null;
    this.adapter?.dispose();
    this.matchView?.dispose();
    this.adapter = createLocalMatchAdapter();
    this.matchView = new MatchSceneView(this.node, assets, this.adapter, {
      onReturnHome: APP_RUNTIME_CONFIG.friendRoom
        ? () => this.returnPracticeToHome()
        : null,
      onVibrate: () => this.platformServices?.vibrateShort() ?? Promise.resolve(),
      preferences: this.preferences,
    });
    this.activeSurface = "practice";
    this.adapter.start((update) => this.matchView?.render(update));
  }

  private returnPracticeToHome(): void {
    if (this.activeSurface !== "practice" || !APP_RUNTIME_CONFIG.friendRoom) {
      return;
    }

    // Guard against a second tap while the friend-room controller and view are
    // being recreated. showFriendRoomSurface owns the single disposal pass for
    // the local adapter and match view.
    this.activeSurface = "boot";
    this.startFriendRoomFlow(false);
  }
}
