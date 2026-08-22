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
import { PATROL_REVIEW_ASSET_KEYS } from "../assets/AssetAddresses.generated";
import { isStandalonePatrolReviewConfig } from "./PatrolReviewNavigation";
import type { IMatchAdapter } from "../adapters/IMatchAdapter";
import { LocalPatrolAdapter } from "../adapters/LocalPatrolAdapter";
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
import { generateRandomFriendRoomNickname } from "../views/FriendRoomNickname";
import { MatchSceneView } from "../views/MatchSceneView";
import { PatrolPrototypeView } from "../views/PatrolPrototypeView";
import { PatrolReviewHomeView } from "../views/PatrolReviewHomeView";

const { ccclass } = _decorator;

type ActiveSurface =
  | "boot"
  | "friend-room"
  | "network-match"
  | "patrol"
  | "patrol-review-home"
  | "practice";

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
  private patrolAdapter: LocalPatrolAdapter | null = null;
  private patrolReviewHomeView: PatrolReviewHomeView | null = null;
  private patrolView: PatrolPrototypeView | null = null;
  private pendingRoomInviteToken: string | null = null;
  private platformServices: PlatformServices | null = null;
  private preferences: GamePreferences = DEFAULT_GAME_PREFERENCES;
  private resumeFallbackInviteToken: string | null = null;
  private unregisterSharing: (() => void) | null = null;
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
    this.loadingNode = this.showMessage(
      APP_RUNTIME_CONFIG.startup === "patrol" &&
        APP_RUNTIME_CONFIG.friendRoom === null
        ? "正在准备漆环巡游…"
        : "正在准备奇术茶馆…",
    );
    void this.boot();
  }

  public update(deltaTime: number): void {
    this.adapter?.update(deltaTime);
    this.patrolAdapter?.update(deltaTime);
    this.patrolView?.update(deltaTime);
  }

  public onDestroy(): void {
    console.info("[WIZZARD_SHARE_DIAG_8F21]", {
      activeSurface: this.activeSurface,
      hasRegistration: Boolean(this.unregisterSharing),
      isValid: this.isValid,
      stage: "unbind",
    });
    this.platformServices?.sharing.setRoomInvite(null);
    this.unregisterSharing?.();
    this.unregisterSharing = null;
    this.friendRoomRouteUnsubscribe?.();
    this.friendRoomRouteUnsubscribe = null;
    this.adapter?.dispose();
    this.matchView?.dispose();
    this.patrolAdapter?.dispose();
    this.patrolReviewHomeView?.dispose();
    this.patrolView?.dispose();
    this.friendRoomView?.dispose();
    this.friendRoomController?.dispose();
    this.adapter = null;
    this.matchView = null;
    this.patrolAdapter = null;
    this.patrolReviewHomeView = null;
    this.patrolView = null;
    this.friendRoomView = null;
    this.friendRoomController = null;
    this.assets = null;
    this.platformServices = null;
  }

  private async boot(): Promise<void> {
    try {
      this.platformServices = createPlatformServices();
      this.unregisterSharing?.();
      this.unregisterSharing = this.platformServices.sharing.register(
        (inviteToken) => this.receiveRoomInvite(inviteToken),
      );

      const assets = new AssetRegistry();
      const isStandalonePatrolReview =
        isStandalonePatrolReviewConfig(APP_RUNTIME_CONFIG);
      await assets.preload(
        isStandalonePatrolReview ? PATROL_REVIEW_ASSET_KEYS : undefined,
      );

      if (!this.isValid) {
        return;
      }

      this.assets = assets;
      this.preferences = this.platformServices.preferenceStore.load();
      this.loadingNode?.destroy();
      this.loadingNode = null;

      if (this.pendingRoomInviteToken && APP_RUNTIME_CONFIG.friendRoom) {
        this.startFriendRoomFlow(false);
      } else if (isStandalonePatrolReview) {
        this.showPatrolReviewHome();
      } else if (APP_RUNTIME_CONFIG.startup === "practice") {
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
      controller.createRoom({
        ...binding.payload,
        displayName: generateRandomFriendRoomNickname(),
      });
    } else if (binding.type === "join") {
      const displayName = generateRandomFriendRoomNickname();
      if (binding.payload.roomCode) {
        controller.joinRoom({
          avatarKey: binding.payload.avatarKey,
          displayName,
          roomCode: binding.payload.roomCode,
        });
      } else if (binding.payload.inviteToken) {
        controller.joinRoomWithInvite({
          avatarKey: binding.payload.avatarKey,
          displayName,
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

  private handleFriendRoomState(state: FriendRoomState): void {
    this.syncRoomShare(state);

    const fallbackToken = this.resumeFallbackInviteToken;
    const shouldRetryInvite =
      fallbackToken !== null &&
      state.update === null &&
      state.pending.binding === null &&
      (state.error?.code === "AUTH_REQUIRED" ||
        state.error?.code === "PLAYER_NOT_FOUND" ||
        state.error?.code === "ROOM_NOT_FOUND" ||
        state.error?.code === "SESSION_NOT_FOUND");

    if (state.update) {
      this.resumeFallbackInviteToken = null;
    } else if (shouldRetryInvite) {
      this.resumeFallbackInviteToken = null;
      const controller = this.friendRoomController;
      void Promise.resolve().then(() => {
        if (
          !controller ||
          controller !== this.friendRoomController ||
          controller.state.update ||
          controller.state.pending.binding
        ) {
          return;
        }
        controller.clearError();
        controller.joinRoomWithInvite({
          avatarKey: "bamboo-cat",
          displayName: generateRandomFriendRoomNickname(),
          inviteToken: fallbackToken,
        });
      });
    }

    this.handleFriendRoomRoute(state);
  }

  private receiveRoomInvite(inviteToken: string): void {
    const controller = this.friendRoomController;
    if (controller?.getInviteToken() === inviteToken) {
      return;
    }
    if (controller?.state.update || controller?.state.pending.binding) {
      return;
    }

    this.pendingRoomInviteToken = inviteToken;
    if (!this.assets || !this.platformServices || !APP_RUNTIME_CONFIG.friendRoom) {
      return;
    }

    if (this.activeSurface === "practice") {
      this.activeSurface = "boot";
      this.startFriendRoomFlow(false);
      return;
    }

    if (controller) {
      this.connectPendingRoomInvite(controller);
    }
  }

  private connectPendingRoomInvite(
    controller: FriendRoomController,
  ): boolean {
    const inviteToken = this.pendingRoomInviteToken;
    if (
      !inviteToken ||
      controller.state.update ||
      controller.state.pending.binding
    ) {
      return false;
    }

    this.pendingRoomInviteToken = null;
    controller.clearError();
    const storedSession = this.platformServices?.sessionStore.load();
    if (storedSession?.inviteToken === inviteToken) {
      this.resumeFallbackInviteToken = inviteToken;
      return controller.resumeRoom();
    }

    this.resumeFallbackInviteToken = null;
    return controller.joinRoomWithInvite({
      avatarKey: "bamboo-cat",
      displayName: generateRandomFriendRoomNickname(),
      inviteToken,
    });
  }

  private syncRoomShare(state: FriendRoomState): void {
    const sharing = this.platformServices?.sharing;
    const room = state.update?.room;
    const inviteToken = this.friendRoomController?.getInviteToken();
    if (sharing && room?.phase === "lobby" && inviteToken) {
      sharing.setRoomInvite({ inviteToken });
      return;
    }
    sharing?.setRoomInvite(null);
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
    this.patrolAdapter?.dispose();
    this.patrolReviewHomeView?.dispose();
    this.patrolView?.dispose();
    this.friendRoomView?.dispose();
    this.adapter = null;
    this.matchView = null;
    this.patrolAdapter = null;
    this.patrolReviewHomeView = null;
    this.patrolView = null;
    this.friendRoomView = new FriendRoomView(
      this.node,
      assets,
      controller,
      {
        onInvite: async (roomCode) => {
          if (platformServices.sharing.shareRoom()) {
            return "shared";
          }
          await platformServices.copyText(
            `奇术茶馆 6 位数字房间码：${roomCode}`,
          );
          return "copied";
        },
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
      this.handleFriendRoomState(state),
    );
    this.showFriendRoomSurface();

    if (this.connectPendingRoomInvite(controller)) {
      return;
    }
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
    this.patrolAdapter?.dispose();
    this.patrolReviewHomeView?.dispose();
    this.patrolView?.dispose();
    this.patrolAdapter = null;
    this.patrolReviewHomeView = null;
    this.patrolView = null;
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

    this.platformServices?.sharing.setRoomInvite(null);

    this.friendRoomRouteUnsubscribe?.();
    this.friendRoomRouteUnsubscribe = null;
    this.friendRoomView?.dispose();
    this.friendRoomView = null;
    this.friendRoomController?.dispose();
    this.friendRoomController = null;
    this.patrolAdapter?.dispose();
    this.patrolReviewHomeView?.dispose();
    this.patrolView?.dispose();
    this.patrolAdapter = null;
    this.patrolReviewHomeView = null;
    this.patrolView = null;
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

  private startPatrol(): void {
    const assets = this.assets;
    if (!assets) {
      throw new Error("PATROL_ASSETS_NOT_READY");
    }

    const isStandalonePatrolReview =
      isStandalonePatrolReviewConfig(APP_RUNTIME_CONFIG);

    this.platformServices?.sharing.setRoomInvite(null);
    this.friendRoomRouteUnsubscribe?.();
    this.friendRoomRouteUnsubscribe = null;
    this.friendRoomView?.dispose();
    this.friendRoomView = null;
    this.friendRoomController?.dispose();
    this.friendRoomController = null;
    this.adapter?.dispose();
    this.matchView?.dispose();
    this.adapter = null;
    this.matchView = null;
    this.patrolAdapter?.dispose();
    this.patrolReviewHomeView?.dispose();
    this.patrolView?.dispose();
    this.patrolReviewHomeView = null;

    const patrolAdapter = new LocalPatrolAdapter();
    const patrolView = new PatrolPrototypeView(
      this.node,
      assets,
      patrolAdapter,
      {
        onReturnHome: isStandalonePatrolReview
          ? () => this.returnPatrolReviewToHome()
          : null,
      },
    );
    this.patrolAdapter = patrolAdapter;
    this.patrolView = patrolView;
    this.activeSurface = "patrol";
    patrolAdapter.start((update) => this.patrolView?.render(update));
  }

  private showPatrolReviewHome(): void {
    const assets = this.assets;
    if (!assets) {
      throw new Error("PATROL_REVIEW_HOME_ASSETS_NOT_READY");
    }

    this.platformServices?.sharing.setRoomInvite(null);
    this.friendRoomRouteUnsubscribe?.();
    this.friendRoomRouteUnsubscribe = null;
    this.friendRoomView?.dispose();
    this.friendRoomView = null;
    this.friendRoomController?.dispose();
    this.friendRoomController = null;
    this.adapter?.dispose();
    this.matchView?.dispose();
    this.adapter = null;
    this.matchView = null;
    this.patrolAdapter?.dispose();
    this.patrolView?.dispose();
    this.patrolAdapter = null;
    this.patrolView = null;
    this.patrolReviewHomeView?.dispose();

    this.patrolReviewHomeView = new PatrolReviewHomeView(this.node, assets, {
      onStart: () => this.startPatrol(),
    });
    this.activeSurface = "patrol-review-home";
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

  private returnPatrolReviewToHome(): void {
    if (
      this.activeSurface !== "patrol" ||
      APP_RUNTIME_CONFIG.startup !== "patrol" ||
      APP_RUNTIME_CONFIG.friendRoom !== null
    ) {
      return;
    }

    this.activeSurface = "boot";
    this.showPatrolReviewHome();
  }
}
