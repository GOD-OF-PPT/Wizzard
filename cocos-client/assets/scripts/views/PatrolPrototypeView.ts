import {
  Color,
  EventTouch,
  Label,
  Node,
  Sprite,
  Tween,
  UIOpacity,
  Vec3,
  tween,
  view,
} from "cc";
import type {
  PatrolEvent,
  PatrolPlayerState,
  PatrolRoute,
  PatrolState,
  TeaSpiritState,
} from "@wizzard/game-core";
import type {
  LocalPatrolAdapter,
  PatrolUpdate,
} from "../adapters/LocalPatrolAdapter";
import type { AssetKey } from "../assets/AssetAddresses.generated";
import { AssetRegistry } from "../assets/AssetRegistry";
import { getPatrolReviewActionVisibility } from "../bootstrap/PatrolReviewNavigation";
import {
  PATROL_PROTOTYPE_BRIDGE_POSITIONS,
  PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS,
  PATROL_PROTOTYPE_LAYOUT,
  PATROL_PROTOTYPE_ROUTE_ELLIPSES,
  getPatrolPrototypeFixedHeightContentScale,
  getPatrolPrototypeBridgePlacement,
  getPatrolPrototypeRoutePoint,
  type PatrolPrototypeRect,
} from "./PatrolPrototypeLayout";
import { getPatrolTravelerTransitionMode } from "./PatrolPrototypeMotion";
import {
  createButton,
  createContainer,
  createHorizontalSliceSprite,
  createSprite,
  createText,
  type ButtonStyle,
} from "./UiFactory";

type PatrolPrototypeViewOptions = Readonly<{
  onReturnHome: (() => void) | null;
}>;

type TravelerVisual = Readonly<{
  node: Node;
  sprite: Node;
  trail: Node;
}>;

type PlayerProgressVisual = Readonly<{
  count: Label;
}>;

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const PLAYER_IDS = ["traveler-you", "traveler-pine", "traveler-rain"] as const;
const PLAYER_TRAVELER_ASSETS: Record<string, AssetKey> = {
  "traveler-you": "patrol.traveler.bambooCat.v1",
  "traveler-pine": "patrol.traveler.wanderingCrane.v1",
  "traveler-rain": "patrol.traveler.flowerFox.v1",
};
const PLAYER_AVATAR_ASSETS: Record<string, AssetKey> = {
  "traveler-you": "avatar.bambooCat.normal",
  "traveler-pine": "avatar.wanderingCrane.normal",
  "traveler-rain": "avatar.flowerFox.normal",
};
const PLAYER_TRAIL_COLORS: Record<string, Color> = {
  "traveler-you": new Color(83, 224, 164, 255),
  "traveler-pine": new Color(108, 186, 255, 255),
  "traveler-rain": new Color(190, 118, 255, 255),
};
const PLAYER_TANGENT_OFFSETS: Record<string, number> = {
  "traveler-you": -30,
  "traveler-pine": 0,
  "traveler-rain": 30,
};
const PLAYER_RADIAL_OFFSETS: Record<string, number> = {
  "traveler-you": -50,
  "traveler-pine": 0,
  "traveler-rain": 50,
};
const PLAYER_PROGRESS_Y = [175, 5, -165] as const;

const PAPER_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.paper",
  fontKey: "font.display",
  fontSize: 34,
  outlineWidth: 0,
  textColor: new Color(77, 43, 24, 255),
};

const GREEN_BUTTON: ButtonStyle = {
  assetKey: "ui.results.button.green.v2",
  fontKey: "font.display",
  fontSize: 34,
  outlineWidth: 1,
  textColor: new Color(247, 236, 197, 255),
};

function requireLabel(node: Node): Label {
  const label = node.getComponent(Label);
  if (!label) {
    throw new Error(`PATROL_LABEL_NOT_CREATED:${node.name}`);
  }
  return label;
}

function setOpacity(node: Node, opacity: number): void {
  const component = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
  component.opacity = Math.max(0, Math.min(255, Math.round(opacity)));
}

function getFacingScale(position: number): number {
  const angle = Math.PI / 2 - (position / 60) * Math.PI * 2;
  return Math.sin(angle) >= 0 ? 1 : -1;
}

function getForwardDistance(start: number, destination: number): number {
  const distance = ((destination - start) % 60 + 60) % 60;
  return distance === 0 ? 60 : distance;
}

function getTravelerDisplayPoint(
  route: PatrolRoute,
  position: number,
  playerId: string,
): Readonly<{ x: number; y: number }> {
  const point = getPatrolPrototypeRoutePoint(route, position);
  const samplePosition = (position + 0.1) % 60;
  const sample = getPatrolPrototypeRoutePoint(route, samplePosition);
  const deltaX = sample.x - point.x;
  const deltaY = sample.y - point.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const tangentOffset = PLAYER_TANGENT_OFFSETS[playerId] ?? 0;
  const radialX = point.x - PATROL_PROTOTYPE_ROUTE_ELLIPSES[route].centerX;
  const radialY = point.y - PATROL_PROTOTYPE_ROUTE_ELLIPSES[route].centerY;
  const radialLength = Math.hypot(radialX, radialY) || 1;
  const radialOffset = PLAYER_RADIAL_OFFSETS[playerId] ?? 0;
  return {
    x:
      point.x +
      (deltaX / length) * tangentOffset +
      (radialX / radialLength) * radialOffset,
    y:
      point.y +
      (deltaY / length) * tangentOffset +
      (radialY / radialLength) * radialOffset,
  };
}

export class PatrolPrototypeView {
  private readonly actorRoot: Node;
  private bridgeCue: Node | null = null;
  private readonly controlLabels: Readonly<{
    accelerate: Label;
    decelerate: Label;
    prepareSwitch: Label;
  }>;
  private currentUpdate: PatrolUpdate | null = null;
  private elapsedSeconds = 0;
  private lastPhase: PatrolState["phase"] | null = null;
  private readonly lastPlayers = new Map<string, PatrolPlayerState>();
  private readonly options: PatrolPrototypeViewOptions;
  private readonly playerProgress = new Map<string, PlayerProgressVisual>();
  private phaseCountdownLabel: Label | null = null;
  private phaseOverlay: Node | null = null;
  private readonly remainingHeading: Label;
  private returnHomeButton: Node | null = null;
  private readonly spiritNodes = new Map<string, Node>();
  private speedCue: Node | null = null;
  private readonly statusValues: Readonly<{
    actual: Label;
    remaining: Label;
    target: Label;
  }>;
  private targetDraft = 4;
  private targetDraftLabel: Label | null = null;
  private readonly timerLabel: Label;
  private readonly travelerVisuals = new Map<string, TravelerVisual>();
  private readonly viewRoot: Node;

  public constructor(
    root: Node,
    private readonly assets: AssetRegistry,
    private readonly adapter: LocalPatrolAdapter,
    options: Partial<PatrolPrototypeViewOptions> = {},
  ) {
    this.options = { onReturnHome: options.onReturnHome ?? null };
    const frameSize = view.getFrameSize();
    const contentScale = getPatrolPrototypeFixedHeightContentScale(
      frameSize.width,
      frameSize.height,
    );
    this.viewRoot = createContainer(
      root,
      "PatrolPrototypeScene",
      DESIGN_WIDTH,
      DESIGN_HEIGHT,
    );
    this.viewRoot.setScale(contentScale, contentScale, 1);
    createSprite(
      this.viewRoot,
      assets,
      "scene.patrol.track.v1",
      DESIGN_WIDTH,
      DESIGN_HEIGHT,
    );
    this.actorRoot = createContainer(
      this.viewRoot,
      "PatrolActors",
      DESIGN_WIDTH,
      DESIGN_HEIGHT,
    );
    const hudRoot = createContainer(
      this.viewRoot,
      "PatrolHud",
      DESIGN_WIDTH,
      DESIGN_HEIGHT,
    );
    createHorizontalSliceSprite(
      hudRoot,
      assets,
      "ui.scoreRibbon",
      PATROL_PROTOTYPE_LAYOUT.roundScroll.width,
      PATROL_PROTOTYPE_LAYOUT.roundScroll.height,
      PATROL_PROTOTYPE_LAYOUT.roundScroll.x,
      PATROL_PROTOTYPE_LAYOUT.roundScroll.y,
    );
    createText(
      hudRoot,
      assets,
      "本巡",
      220,
      76,
      PATROL_PROTOTYPE_LAYOUT.roundScroll.x,
      PATROL_PROTOTYPE_LAYOUT.roundScroll.y,
      {
        color: new Color(72, 39, 22, 255),
        fontKey: "font.display",
        fontSize: 52,
        outlineWidth: 0,
      },
    );

    const timer = PATROL_PROTOTYPE_LAYOUT.timer;
    createSprite(
      hudRoot,
      assets,
      "ui.countdownRing",
      164,
      164,
      timer.x,
      timer.y,
    );
    this.timerLabel = requireLabel(
      createText(hudRoot, assets, "剩余\n60\n秒", 118, 126, timer.x, timer.y, {
        color: new Color(247, 225, 169, 255),
        fontKey: "font.display",
        fontSize: 34,
        lineHeight: 38,
        outlineColor: new Color(32, 18, 14, 255),
        outlineWidth: 2,
      }),
    );

    const targetHud = PATROL_PROTOTYPE_LAYOUT.targetHud;
    createSprite(
      hudRoot,
      assets,
      "ui.match.stat.paper",
      500,
      140,
      targetHud.x,
      targetHud.y,
    );
    const statusColumns = [targetHud.x - 160, targetHud.x, targetHud.x + 160];
    ["目标", "已接"].forEach((text, index) => {
      createText(hudRoot, assets, text, 120, 36, statusColumns[index], 482, {
        color: new Color(91, 55, 31, 255),
        fontKey: "font.interface",
        fontSize: 28,
        outlineWidth: 0,
      });
    });
    this.remainingHeading = requireLabel(
      createText(hudRoot, assets, "还差", 120, 36, statusColumns[2], 482, {
        color: new Color(91, 55, 31, 255),
        fontKey: "font.interface",
        fontSize: 28,
        outlineWidth: 0,
      }),
    );
    this.statusValues = {
      target: requireLabel(
        createText(hudRoot, assets, "—", 120, 64, statusColumns[0], 438, {
          color: new Color(69, 37, 21, 255),
          fontKey: "font.display",
          fontSize: 52,
          outlineWidth: 0,
        }),
      ),
      actual: requireLabel(
        createText(hudRoot, assets, "0", 120, 64, statusColumns[1], 438, {
          color: new Color(55, 92, 46, 255),
          fontKey: "font.display",
          fontSize: 52,
          outlineWidth: 0,
        }),
      ),
      remaining: requireLabel(
        createText(hudRoot, assets, "—", 120, 64, statusColumns[2], 438, {
          color: new Color(111, 48, 35, 255),
          fontKey: "font.display",
          fontSize: 52,
          outlineWidth: 0,
        }),
      ),
    };

    createSprite(
      hudRoot,
      assets,
      "ui.patrol.controlRail.v1",
      PATROL_PROTOTYPE_LAYOUT.controlRail.width,
      PATROL_PROTOTYPE_LAYOUT.controlRail.height,
      PATROL_PROTOTYPE_LAYOUT.controlRail.x,
      PATROL_PROTOTYPE_LAYOUT.controlRail.y,
    );
    this.controlLabels = {
      decelerate: this.createControl(
        hudRoot,
        PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS.decelerate,
        "减速",
        () => this.adapter.slow(),
      ),
      prepareSwitch: this.createControl(
        hudRoot,
        PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS.prepareSwitch,
        "预备换轨",
        () => this.adapter.queueSwitch(),
      ),
      accelerate: this.createControl(
        hudRoot,
        PATROL_PROTOTYPE_CONTROL_TOUCH_TARGETS.accelerate,
        "加速",
        () => this.adapter.fast(),
      ),
    };

    this.speedCue = createSprite(
      hudRoot,
      assets,
      "fx.patrol.motionTrail.v1",
      76,
      42,
      -442,
      -418,
    );
    const speedCueSprite = this.speedCue.getComponent(Sprite);
    if (speedCueSprite) {
      speedCueSprite.color = new Color(255, 101, 45, 255);
    }
    this.bridgeCue = createSprite(
      this.actorRoot,
      assets,
      "ui.countdownRing",
      76,
      76,
    );
    this.bridgeCue.active = false;

    if (this.options.onReturnHome) {
      this.returnHomeButton = createButton(
        hudRoot,
        assets,
        "返回首页",
        144,
        60,
        PATROL_PROTOTYPE_LAYOUT.returnHomeTouch.x,
        PATROL_PROTOTYPE_LAYOUT.returnHomeTouch.y,
        this.options.onReturnHome,
        true,
        {
          assetKey: "ui.results.button.paper",
          fontKey: "font.interface",
          fontSize: 28,
          hitHeight: PATROL_PROTOTYPE_LAYOUT.returnHomeTouch.height,
          hitWidth: PATROL_PROTOTYPE_LAYOUT.returnHomeTouch.width,
          outlineWidth: 0,
          textColor: new Color(77, 43, 24, 255),
        },
      );
    }
  }

  public dispose(): void {
    this.viewRoot.destroy();
  }

  public render(update: PatrolUpdate): void {
    const previousPhase = this.lastPhase;
    this.currentUpdate = update;
    this.ensureSpiritNodes(update.state.spirits);
    this.ensureTravelerNodes(update.state.players);
    this.ensurePlayerProgress(update.state.players);
    this.updateSpirits(update.state.spirits);
    this.updateTravelers(update.state.players, update.events, previousPhase);
    this.updateHud(update);
    this.renderPhaseOverlay(update, previousPhase !== update.state.phase);
    if (this.returnHomeButton) {
      this.returnHomeButton.active = getPatrolReviewActionVisibility(
        update.state.phase,
        true,
      ).showPersistentReturn;
    }
    this.lastPhase = update.state.phase;

    this.lastPlayers.clear();
    for (const player of update.state.players) {
      this.lastPlayers.set(player.id, { ...player });
    }
  }

  public update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return;
    }

    this.elapsedSeconds += deltaSeconds;
    const pulse = 0.97 + Math.sin(this.elapsedSeconds * 3.4) * 0.035;
    for (const node of this.spiritNodes.values()) {
      if (node.active) {
        node.setScale(pulse, pulse, 1);
      }
    }
    if (this.bridgeCue?.active) {
      const cuePulse = 0.94 + Math.sin(this.elapsedSeconds * 5) * 0.08;
      this.bridgeCue.setScale(cuePulse, cuePulse, 1);
    }
  }

  private createControl(
    parent: Node,
    rect: PatrolPrototypeRect,
    labelText: string,
    onActivate: () => void,
  ): Label {
    const touch = createContainer(
      parent,
      `PatrolControl:${labelText}`,
      rect.width,
      rect.height,
      rect.x,
      rect.y,
    );
    touch.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
      event.propagationStopped = true;
      onActivate();
    });
    return requireLabel(
      createText(touch, this.assets, labelText, rect.width - 48, 86, 0, 0, {
        color: new Color(247, 235, 196, 255),
        fontKey: "font.display",
        fontSize: labelText.length > 2 ? 44 : 50,
        outlineColor: new Color(52, 25, 14, 255),
        outlineWidth: 2,
      }),
    );
  }

  private ensurePlayerProgress(players: readonly PatrolPlayerState[]): void {
    players.forEach((player, index) => {
      if (this.playerProgress.has(player.id)) {
        return;
      }
      const y = PLAYER_PROGRESS_Y[index] ?? -165;
      createSprite(
        this.actorRoot,
        this.assets,
        PLAYER_AVATAR_ASSETS[player.id],
        118,
        118,
        -850,
        y,
      );
      createSprite(
        this.actorRoot,
        this.assets,
        "ui.countdownRing",
        58,
        58,
        -772,
        y - 35,
      );
      const count = requireLabel(
        createText(
          this.actorRoot,
          this.assets,
          "0",
          44,
          44,
          -772,
          y - 35,
          {
            color: new Color(248, 229, 177, 255),
            fontKey: "font.display",
            fontSize: 34,
            outlineColor: new Color(31, 20, 16, 255),
            outlineWidth: 2,
          },
        ),
      );
      this.playerProgress.set(player.id, { count });
    });
  }

  private ensureSpiritNodes(spirits: readonly TeaSpiritState[]): void {
    for (const spirit of spirits) {
      if (this.spiritNodes.has(spirit.id)) {
        continue;
      }
      const point = getPatrolPrototypeRoutePoint(spirit.route, spirit.position);
      const node = createSprite(
        this.actorRoot,
        this.assets,
        "patrol.collectible.teaSpirit.v1",
        76,
        76,
        point.x,
        point.y + 18,
      );
      this.spiritNodes.set(spirit.id, node);
    }
  }

  private ensureTravelerNodes(players: readonly PatrolPlayerState[]): void {
    for (const player of players) {
      if (this.travelerVisuals.has(player.id)) {
        continue;
      }
      const point = getTravelerDisplayPoint(
        player.route,
        player.position,
        player.id,
      );
      const node = createContainer(
        this.actorRoot,
        `PatrolTraveler:${player.id}`,
        210,
        196,
        point.x,
        point.y + 20,
      );
      const trail = createSprite(
        node,
        this.assets,
        "fx.patrol.motionTrail.v1",
        210,
        52,
        -86,
        -12,
      );
      const trailSprite = trail.getComponent(Sprite);
      if (trailSprite) {
        trailSprite.color = PLAYER_TRAIL_COLORS[player.id];
      }
      const sprite = createSprite(
        node,
        this.assets,
        PLAYER_TRAVELER_ASSETS[player.id],
        174,
        174,
        0,
        18,
      );
      this.travelerVisuals.set(player.id, { node, sprite, trail });
    }
  }

  private renderPhaseOverlay(update: PatrolUpdate, phaseChanged: boolean): void {
    if (phaseChanged) {
      this.phaseOverlay?.destroy();
      this.phaseOverlay = null;
      this.phaseCountdownLabel = null;
      this.targetDraftLabel = null;

      if (update.state.phase === "observe") {
        this.renderObserveOverlay(update);
      } else if (update.state.phase === "target-select") {
        this.renderTargetSelectionOverlay(update);
      } else if (update.state.phase === "results") {
        this.renderResultsOverlay(update.state);
      }
    }

    if (update.state.phase === "observe" && this.phaseCountdownLabel) {
      this.phaseCountdownLabel.string = `观察倒计时 ${update.observeSecondsRemaining ?? 0} 秒`;
    } else if (
      update.state.phase === "target-select" &&
      this.phaseCountdownLabel
    ) {
      this.phaseCountdownLabel.string = `请在 ${update.targetSelectSecondsRemaining ?? 0} 秒内定标`;
    }
  }

  private renderObserveOverlay(update: PatrolUpdate): void {
    const panel = createSprite(
      this.viewRoot,
      this.assets,
      "ui.panel.secondary",
      660,
      160,
      40,
      20,
      true,
    );
    panel.name = "PatrolObserveOverlay";
    createText(panel, this.assets, "先看茶灵与六座桥", 560, 62, 0, 32, {
      color: new Color(247, 230, 185, 255),
      fontKey: "font.display",
      fontSize: 42,
      outlineWidth: 1,
    });
    this.phaseCountdownLabel = requireLabel(
      createText(
        panel,
        this.assets,
        `观察倒计时 ${update.observeSecondsRemaining ?? 5} 秒`,
        520,
        42,
        0,
        -34,
        {
          color: new Color(217, 193, 142, 255),
          fontKey: "font.interface",
          fontSize: 28,
          outlineWidth: 0,
        },
      ),
    );
    this.phaseOverlay = panel;
  }

  private renderTargetSelectionOverlay(update: PatrolUpdate): void {
    this.targetDraft = 4;
    const layout = PATROL_PROTOTYPE_LAYOUT.targetSelectionModal;
    const panel = createSprite(
      this.viewRoot,
      this.assets,
      "ui.panel.secondary",
      layout.width,
      layout.height,
      layout.x,
      layout.y,
      true,
    );
    panel.name = "PatrolTargetSelectionOverlay";
    createText(panel, this.assets, "本巡想接几枚茶灵？", 620, 72, 0, 172, {
      color: new Color(247, 229, 181, 255),
      fontKey: "font.display",
      fontSize: 46,
      outlineWidth: 1,
    });
    this.targetDraftLabel = requireLabel(
      createText(panel, this.assets, String(this.targetDraft), 220, 128, 0, 60, {
        color: new Color(255, 220, 126, 255),
        fontKey: "font.display",
        fontSize: 88,
        outlineColor: new Color(45, 23, 14, 255),
        outlineWidth: 2,
      }),
    );
    createButton(
      panel,
      this.assets,
      "少一个",
      190,
      82,
      -220,
      54,
      () => this.changeTargetDraft(-1),
      true,
      PAPER_BUTTON,
    );
    createButton(
      panel,
      this.assets,
      "多一个",
      190,
      82,
      220,
      54,
      () => this.changeTargetDraft(1),
      true,
      PAPER_BUTTON,
    );
    createButton(
      panel,
      this.assets,
      "确认目标",
      300,
      100,
      0,
      -116,
      () => this.adapter.selectTarget(this.targetDraft),
      true,
      GREEN_BUTTON,
    );
    this.phaseCountdownLabel = requireLabel(
      createText(
        panel,
        this.assets,
        `请在 ${update.targetSelectSecondsRemaining ?? 8} 秒内定标`,
        460,
        38,
        0,
        -190,
        {
          color: new Color(203, 185, 145, 255),
          fontKey: "font.interface",
          fontSize: 28,
          outlineWidth: 0,
        },
      ),
    );
    this.phaseOverlay = panel;
  }

  private renderResultsOverlay(state: PatrolState): void {
    const panel = createSprite(
      this.viewRoot,
      this.assets,
      "ui.results.panel",
      1180,
      635,
      PATROL_PROTOTYPE_LAYOUT.resultsModal.x,
      PATROL_PROTOTYPE_LAYOUT.resultsModal.y,
    );
    panel.name = "PatrolResultsOverlay";
    createText(panel, this.assets, "本巡结算", 420, 58, 0, 250, {
      color: new Color(76, 43, 25, 255),
      fontKey: "font.display",
      fontSize: 42,
      outlineWidth: 0,
    });
    const columns = [-335, -110, 55, 220, 365] as const;
    ["旅客", "目标", "实际", "偏差", "得分"].forEach((text, index) => {
      createText(panel, this.assets, text, 150, 40, columns[index], 158, {
        color: new Color(241, 226, 187, 255),
        fontKey: "font.interface",
        fontSize: 28,
        outlineWidth: 0,
      });
    });
    const resultByPlayer = new Map(
      state.results.map((result) => [result.playerId, result]),
    );
    state.players.forEach((player, index) => {
      const result = resultByPlayer.get(player.id);
      if (!result) {
        return;
      }
      const y = 72 - index * 88;
      createSprite(
        panel,
        this.assets,
        PLAYER_AVATAR_ASSETS[player.id],
        66,
        66,
        -450,
        y,
      );
      createText(panel, this.assets, player.name, 150, 46, -335, y, {
        color: new Color(75, 44, 27, 255),
        fontKey: "font.interface",
        fontSize: 30,
        outlineWidth: 0,
      });
      const values = [
        String(result.target),
        String(result.actual),
        result.difference === 0
          ? "准确"
          : `${result.difference > 0 ? "+" : ""}${result.difference}`,
        result.score > 0 ? `+${result.score}` : String(result.score),
      ];
      values.forEach((text, valueIndex) => {
        createText(
          panel,
          this.assets,
          text,
          140,
          46,
          columns[valueIndex + 1],
          y,
          {
            color:
              valueIndex === 3 && result.score > 0
                ? new Color(54, 112, 65, 255)
                : new Color(88, 52, 31, 255),
            fontKey: valueIndex === 3 ? "font.display" : "font.interface",
            fontSize: valueIndex === 3 ? 36 : 30,
            outlineWidth: 0,
          },
        );
      });
    });
    createButton(
      panel,
      this.assets,
      "再巡一局",
      300,
      100,
      170,
      -246,
      () => this.adapter.restart(),
      true,
      GREEN_BUTTON,
    );
    if (
      getPatrolReviewActionVisibility(
        state.phase,
        this.options.onReturnHome !== null,
      ).showResultReturn &&
      this.options.onReturnHome
    ) {
      createButton(
        panel,
        this.assets,
        "返回首页",
        240,
        100,
        -170,
        -246,
        this.options.onReturnHome,
        true,
        PAPER_BUTTON,
      );
    }
    const panelOpacity =
      panel.getComponent(UIOpacity) ?? panel.addComponent(UIOpacity);
    panelOpacity.opacity = 0;
    tween(panelOpacity)
      .delay(0.72)
      .to(0.24, { opacity: 255 }, { easing: "quadOut" })
      .start();
    this.phaseOverlay = panel;
  }

  private changeTargetDraft(delta: number): void {
    this.targetDraft = Math.max(0, Math.min(9, this.targetDraft + delta));
    this.adapter.setTargetDraft(this.targetDraft);
    if (this.targetDraftLabel) {
      this.targetDraftLabel.string = String(this.targetDraft);
    }
  }

  private updateHud(update: PatrolUpdate): void {
    const human = update.state.players.find((player) => player.isHuman);
    if (!human) {
      return;
    }
    const actual = human.collectedSpiritIds.length;
    const remaining = human.target === null ? null : human.target - actual;
    this.statusValues.target.string =
      human.target === null ? "—" : String(human.target);
    this.statusValues.actual.string = String(actual);
    this.statusValues.remaining.string =
      remaining === null
        ? "—"
        : remaining >= 0
          ? String(remaining)
          : String(Math.abs(remaining));
    this.remainingHeading.string =
      remaining === null || remaining > 0
        ? "还差"
        : remaining === 0
          ? "已达"
          : "超出";
    this.timerLabel.string = `剩余\n${Math.max(
      0,
      update.state.durationTicks - update.state.elapsedTicks,
    )}\n秒`;

    for (const player of update.state.players) {
      const progress = this.playerProgress.get(player.id);
      if (progress) {
        progress.count.string = String(player.collectedSpiritIds.length);
      }
    }

    const active = update.state.phase === "patrol";
    const activeColor = new Color(247, 235, 196, 255);
    const inactiveColor = new Color(151, 137, 112, 255);
    for (const label of Object.values(this.controlLabels)) {
      label.color = active ? activeColor : inactiveColor;
    }
    this.controlLabels.prepareSwitch.string = human.switchQueued
      ? "取消换轨"
      : "预备换轨";

    if (this.speedCue) {
      const speedX = { slow: -454, cruise: -405, fast: -356 }[human.speed];
      this.speedCue.setPosition(new Vec3(speedX, -418, 0));
      this.speedCue.active = active;
    }
    if (this.bridgeCue) {
      this.bridgeCue.active = active && human.switchQueued;
      if (this.bridgeCue.active) {
        const nextBridgeIndex = PATROL_PROTOTYPE_BRIDGE_POSITIONS.map(
          (position, index) => ({
            distance: getForwardDistance(human.position, position),
            index,
          }),
        ).sort((left, right) => left.distance - right.distance)[0]?.index;
        if (nextBridgeIndex !== undefined) {
          const bridge = getPatrolPrototypeBridgePlacement(
            nextBridgeIndex as 0 | 1 | 2 | 3 | 4 | 5,
          );
          this.bridgeCue.setPosition(
            new Vec3(bridge.center.x, bridge.center.y + 12, 0),
          );
        }
      }
    }
  }

  private updateSpirits(spirits: readonly TeaSpiritState[]): void {
    for (const spirit of spirits) {
      const node = this.spiritNodes.get(spirit.id);
      if (node) {
        node.active = spirit.collectedBy === null;
      }
    }
  }

  private updateTravelers(
    players: readonly PatrolPlayerState[],
    events: readonly PatrolEvent[],
    previousPhase: PatrolState["phase"] | null,
  ): void {
    for (const player of players) {
      const visual = this.travelerVisuals.get(player.id);
      if (!visual) {
        continue;
      }
      const previous = this.lastPlayers.get(player.id);
      const point = getTravelerDisplayPoint(
        player.route,
        player.position,
        player.id,
      );
      const target = new Vec3(point.x, point.y + 20, 0);
      const transitionMode = getPatrolTravelerTransitionMode(
        previous,
        player,
        previousPhase,
        this.currentUpdate?.state.phase ?? "observe",
      );
      if (transitionMode === "preserve") {
        // Speed and route-queue commands emit immediately without advancing the
        // logical position. Keep the current tick tween running so touching a
        // control cannot snap the traveler to that tick's destination.
      } else if (transitionMode === "snap") {
        Tween.stopAllByTarget(visual.node);
        visual.node.setPosition(target);
      } else {
        Tween.stopAllByTarget(visual.node);
        const routeSwitch = events.find(
          (
            event,
          ): event is Extract<PatrolEvent, { type: "route-switched" }> =>
            event.type === "route-switched" && event.playerId === player.id,
        );
        if (routeSwitch && previous) {
          const oldBridge = getTravelerDisplayPoint(
            previous.route,
            routeSwitch.bridge,
            player.id,
          );
          const newBridge = getTravelerDisplayPoint(
            routeSwitch.route,
            routeSwitch.bridge,
            player.id,
          );
          tween(visual.node)
            .to(0.32, {
              position: new Vec3(oldBridge.x, oldBridge.y + 20, 0),
            })
            .to(0.2, {
              position: new Vec3(newBridge.x, newBridge.y + 20, 0),
            })
            .to(0.46, { position: target }, { easing: "quadOut" })
            .start();
        } else {
          tween(visual.node)
            .to(0.98, { position: target }, { easing: "linear" })
            .start();
        }
      }

      const facingScale = getFacingScale(player.position);
      visual.node.setScale(facingScale, 1, 1);
      visual.trail.active = this.currentUpdate?.state.phase === "patrol";
      setOpacity(
        visual.trail,
        player.speed === "fast" ? 210 : player.speed === "cruise" ? 142 : 82,
      );
    }
  }
}
