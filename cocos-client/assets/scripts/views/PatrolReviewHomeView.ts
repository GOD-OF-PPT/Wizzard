import { Color, Node, view } from "cc";
import { AssetRegistry } from "../assets/AssetRegistry";
import { getPatrolPrototypeFixedHeightContentScale } from "./PatrolPrototypeLayout";
import {
  PATROL_REVIEW_HOME_ASSET_KEYS,
  PATROL_REVIEW_HOME_CONTENT,
} from "./PatrolReviewContent";
import {
  createButton,
  createContainer,
  createSprite,
  createText,
} from "./UiFactory";

type PatrolReviewHomeViewOptions = Readonly<{
  onStart: () => void;
}>;

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export class PatrolReviewHomeView {
  private readonly viewRoot: Node;

  public constructor(
    root: Node,
    assets: AssetRegistry,
    options: PatrolReviewHomeViewOptions,
  ) {
    const frameSize = view.getFrameSize();
    const contentScale = getPatrolPrototypeFixedHeightContentScale(
      frameSize.width,
      frameSize.height,
    );
    this.viewRoot = createContainer(
      root,
      "PatrolReviewHome",
      DESIGN_WIDTH,
      DESIGN_HEIGHT,
    );
    this.viewRoot.setScale(contentScale, contentScale, 1);

    createSprite(
      this.viewRoot,
      assets,
      PATROL_REVIEW_HOME_ASSET_KEYS[2],
      DESIGN_WIDTH,
      DESIGN_HEIGHT,
    );
    const panel = createSprite(
      this.viewRoot,
      assets,
      PATROL_REVIEW_HOME_ASSET_KEYS[3],
      920,
      650,
      0,
      0,
      true,
    );
    panel.name = "PatrolReviewHomePanel";

    createText(panel, assets, PATROL_REVIEW_HOME_CONTENT.title, 640, 96, 0, 224, {
      color: new Color(250, 226, 166, 255),
      fontKey: "font.display",
      fontSize: 64,
      outlineColor: new Color(45, 22, 14, 255),
      outlineWidth: 2,
    });
    createText(panel, assets, PATROL_REVIEW_HOME_CONTENT.subtitle, 720, 50, 0, 144, {
      color: new Color(222, 199, 150, 255),
      fontKey: "font.interface",
      fontSize: 30,
      outlineWidth: 0,
    });
    createText(
      panel,
      assets,
      PATROL_REVIEW_HOME_CONTENT.body,
      720,
      190,
      0,
      24,
      {
        color: new Color(245, 231, 193, 255),
        fontKey: "font.interface",
        fontSize: 34,
        lineHeight: 54,
        outlineColor: new Color(43, 22, 14, 255),
        outlineWidth: 1,
      },
    );
    createText(panel, assets, PATROL_REVIEW_HOME_CONTENT.note, 680, 42, 0, -104, {
      color: new Color(205, 185, 141, 255),
      fontKey: "font.interface",
      fontSize: 28,
      outlineWidth: 0,
    });
    createButton(
      panel,
      assets,
      PATROL_REVIEW_HOME_CONTENT.action,
      360,
      120,
      0,
      -224,
      options.onStart,
      true,
      {
        assetKey: "ui.results.button.green.v2",
        fontKey: "font.display",
        fontSize: 42,
        hitHeight: 144,
        hitWidth: 400,
        outlineWidth: 1,
        textColor: new Color(247, 236, 197, 255),
      },
    );
  }

  public dispose(): void {
    this.viewRoot.destroy();
  }
}
