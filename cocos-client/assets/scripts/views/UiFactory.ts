import {
  BlockInputEvents,
  Color,
  Graphics,
  Label,
  LabelOutline,
  Layers,
  Node,
  Sprite,
  UITransform,
  Vec3,
} from "cc";
import type { AssetKey } from "../assets/AssetAddresses.generated";
import { AssetRegistry } from "../assets/AssetRegistry";

export type TextStyle = {
  color?: Color;
  fontKey?: AssetKey;
  fontSize?: number;
  lineHeight?: number;
  outlineColor?: Color;
  outlineWidth?: number;
};

export function prepareUiNode(
  node: Node,
  width: number,
  height: number,
): UITransform {
  node.layer = Layers.Enum.UI_2D;
  const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
  transform.setContentSize(width, height);
  return transform;
}

export function createContainer(
  parent: Node,
  name: string,
  width = 0,
  height = 0,
  x = 0,
  y = 0,
): Node {
  const node = new Node(name);
  prepareUiNode(node, width, height);
  node.setPosition(new Vec3(x, y, 0));
  parent.addChild(node);
  return node;
}

export function createSprite(
  parent: Node,
  assets: AssetRegistry,
  key: AssetKey,
  width: number,
  height: number,
  x = 0,
  y = 0,
  sliced = false,
): Node {
  const node = createContainer(parent, key, width, height, x, y);
  const sprite = node.addComponent(Sprite);
  sprite.spriteFrame = assets.getSpriteFrame(key);
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  sprite.type = sliced ? Sprite.Type.SLICED : Sprite.Type.SIMPLE;
  return node;
}

export function createText(
  parent: Node,
  assets: AssetRegistry,
  text: string,
  width: number,
  height: number,
  x: number,
  y: number,
  style: TextStyle = {},
): Node {
  const node = createContainer(parent, `Text:${text}`, width, height, x, y);
  const label = node.addComponent(Label);
  label.string = text;
  label.fontSize = style.fontSize ?? 28;
  label.lineHeight = style.lineHeight ?? Math.ceil((style.fontSize ?? 28) * 1.25);
  label.horizontalAlign = Label.HorizontalAlign.CENTER;
  label.verticalAlign = Label.VerticalAlign.CENTER;
  label.overflow = Label.Overflow.SHRINK;
  label.color = style.color ?? new Color(246, 229, 187, 255);

  if (style.fontKey && assets.has(style.fontKey)) {
    label.font = assets.getFont(style.fontKey);
  }

  if ((style.outlineWidth ?? 0) > 0) {
    const outline = node.addComponent(LabelOutline);
    outline.width = style.outlineWidth ?? 2;
    outline.color = style.outlineColor ?? new Color(43, 22, 14, 255);
  }

  return node;
}

export function createButton(
  parent: Node,
  assets: AssetRegistry,
  label: string,
  width: number,
  height: number,
  x: number,
  y: number,
  onActivate: () => void,
): Node {
  const button = createSprite(
    parent,
    assets,
    "ui.turnButton" as AssetKey,
    width,
    height,
    x,
    y,
  );
  button.name = `Button:${label}`;
  createText(button, assets, label, width - 24, height - 16, 0, 2, {
    fontKey: "font.interface" as AssetKey,
    fontSize: Math.min(34, Math.floor(height * 0.36)),
    outlineColor: new Color(44, 21, 13, 255),
    outlineWidth: 2,
  });
  button.on(Node.EventType.TOUCH_END, onActivate);
  return button;
}

export function createModalBackdrop(parent: Node): Node {
  const node = createContainer(parent, "ModalBackdrop", 1920, 1080);
  const graphics = node.addComponent(Graphics);
  graphics.fillColor = new Color(7, 10, 13, 176);
  graphics.rect(-960, -540, 1920, 1080);
  graphics.fill();
  node.addComponent(BlockInputEvents);
  return node;
}
