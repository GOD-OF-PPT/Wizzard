import {
  _decorator,
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
import { createMatchAdapter } from "../adapters/MatchAdapterFactory";
import { MATCH_RUNTIME_CONFIG } from "../config/MatchRuntimeConfig";
import { MatchSceneView } from "../views/MatchSceneView";

const { ccclass } = _decorator;

@ccclass("GameBootstrap")
export class GameBootstrap extends Component {
  private adapter: IMatchAdapter | null = null;
  private loadingNode: Node | null = null;
  private matchView: MatchSceneView | null = null;

  public start(): void {
    view.setOrientation(macro.ORIENTATION_LANDSCAPE);
    view.setDesignResolutionSize(1920, 1080, ResolutionPolicy.FIXED_HEIGHT);
    view.resizeWithBrowserSize(true);
    this.loadingNode = this.showMessage("正在准备奇术茶馆…");
    void this.boot();
  }

  public update(deltaTime: number): void {
    this.adapter?.update(deltaTime);
  }

  public onDestroy(): void {
    this.adapter?.dispose();
    this.matchView?.dispose();
    this.adapter = null;
    this.matchView = null;
  }

  private async boot(): Promise<void> {
    try {
      const assets = new AssetRegistry();
      await assets.preload();

      if (!this.isValid) {
        return;
      }

      this.loadingNode?.destroy();
      this.loadingNode = null;
      this.adapter = createMatchAdapter(MATCH_RUNTIME_CONFIG);
      this.matchView = new MatchSceneView(this.node, assets, this.adapter);
      this.adapter.start((update) => this.matchView?.render(update));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.loadingNode?.destroy();
      this.loadingNode = this.showMessage(`资源加载失败\n${message}`);
    }
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
}
