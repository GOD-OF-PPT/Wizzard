import {
  Color,
  EditBox,
  EventTouch,
  Graphics,
  HorizontalTextAlignment,
  Label,
  LabelOutline,
  Layers,
  Node,
  Sprite,
  UIOpacity,
  UITransform,
  Vec3,
  VerticalTextAlignment,
  Overflow,
  view,
} from "cc";
import type { AssetKey } from "../assets/AssetAddresses.generated";
import { AssetRegistry } from "../assets/AssetRegistry";

export type TextStyle = {
  color?: Color;
  fontKey?: AssetKey;
  fontSize?: number;
  horizontalAlign?: HorizontalTextAlignment;
  lineHeight?: number;
  outlineColor?: Color;
  outlineWidth?: number;
  overflow?: Overflow;
  verticalAlign?: VerticalTextAlignment;
};

export type TextInputView = {
  editBox: EditBox;
  node: Node;
};

export type ButtonStyle = {
  assetKey?: AssetKey;
  fontKey?: AssetKey;
  fontSize?: number;
  hitHeight?: number;
  hitWidth?: number;
  horizontalSlice?: boolean;
  labelHeight?: number;
  labelWidth?: number;
  outlineColor?: Color;
  outlineWidth?: number;
  sliced?: boolean;
  textColor?: Color;
  textOffsetX?: number;
  textOffsetY?: number;
  tint?: Color;
};

export function prepareUiNode(
  node: Node,
  width: number,
  height: number,
): UITransform {
  node.layer = Layers.Enum.UI_2D;
  const transform =
    node.getComponent(UITransform) ?? node.addComponent(UITransform);
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
  horizontalSlice = false,
): Node {
  if (sliced && horizontalSlice) {
    throw new Error(`SPRITE_CANNOT_USE_TWO_SLICE_MODES:${key}`);
  }

  const node = createContainer(parent, key, width, height, x, y);
  const sprite = node.addComponent(Sprite);
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  sprite.spriteFrame = horizontalSlice
    ? assets.createHorizontalSliceFrame(key, height)
    : assets.getSpriteFrame(key);
  if (
    horizontalSlice &&
    width <= sprite.spriteFrame.insetLeft + sprite.spriteFrame.insetRight
  ) {
    throw new Error(`HORIZONTAL_SLICE_TOO_NARROW:${key}:${width}x${height}`);
  }
  prepareUiNode(node, width, height);
  sprite.type =
    sliced || horizontalSlice ? Sprite.Type.SLICED : Sprite.Type.SIMPLE;
  return node;
}

export function createHorizontalSliceSprite(
  parent: Node,
  assets: AssetRegistry,
  key: AssetKey,
  width: number,
  height: number,
  x = 0,
  y = 0,
): Node {
  return createSprite(parent, assets, key, width, height, x, y, false, true);
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
  label.lineHeight =
    style.lineHeight ?? Math.ceil((style.fontSize ?? 28) * 1.25);
  label.horizontalAlign = style.horizontalAlign ?? Label.HorizontalAlign.CENTER;
  label.verticalAlign = style.verticalAlign ?? Label.VerticalAlign.CENTER;
  label.overflow = style.overflow ?? Label.Overflow.SHRINK;
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
  enabled = true,
  style: ButtonStyle = {},
): Node {
  const usesExpandedHitTarget =
    (style.hitWidth ?? width) !== width ||
    (style.hitHeight ?? height) !== height;
  const hitTarget = usesExpandedHitTarget
    ? createContainer(
        parent,
        `Button:${label}`,
        style.hitWidth ?? width,
        style.hitHeight ?? height,
        x,
        y,
      )
    : null;
  const button = createSprite(
    hitTarget ?? parent,
    assets,
    style.assetKey ?? ("ui.turnButton" as AssetKey),
    width,
    height,
    hitTarget ? 0 : x,
    hitTarget ? 0 : y,
    style.sliced ?? false,
    style.horizontalSlice ?? false,
  );
  const eventNode = hitTarget ?? button;
  eventNode.name = `Button:${label}`;
  if (hitTarget) {
    button.name = `ButtonVisual:${label}`;
  }
  const buttonSprite = button.getComponent(Sprite);
  if (style.tint && buttonSprite) {
    buttonSprite.color = style.tint;
  }
  createText(
    button,
    assets,
    label,
    style.labelWidth ?? width - 24,
    style.labelHeight ?? height - 16,
    style.textOffsetX ?? 0,
    style.textOffsetY ?? 2,
    {
      color: style.textColor,
      fontKey: style.fontKey ?? ("font.interface" as AssetKey),
      fontSize: style.fontSize ?? Math.min(34, Math.floor(height * 0.36)),
      outlineColor: style.outlineColor ?? new Color(44, 21, 13, 255),
      outlineWidth: style.outlineWidth ?? 2,
    },
  );
  if (enabled) {
    eventNode.on(Node.EventType.TOUCH_END, onActivate);
  } else {
    const opacity = eventNode.addComponent(UIOpacity);
    opacity.opacity = 112;
  }
  return eventNode;
}

export function createTextInput(
  parent: Node,
  assets: AssetRegistry,
  initialValue: string,
  placeholder: string,
  width: number,
  height: number,
  x: number,
  y: number,
  maxLength: number,
): TextInputView {
  const node = createSprite(
    parent,
    assets,
    "ui.panel.secondary" as AssetKey,
    width,
    height,
    x,
    y,
    true,
  );
  node.name = `Input:${placeholder}`;

  const textNode = createText(
    node,
    assets,
    initialValue,
    width - 72,
    height - 20,
    0,
    0,
    {
      color: new Color(247, 232, 197, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: Math.min(30, Math.floor(height * 0.4)),
    },
  );
  textNode.name = "TEXT_LABEL";
  textNode.getComponent(UITransform)?.setAnchorPoint(0, 1);
  const textLabel = textNode.getComponent(Label);
  if (!textLabel) {
    throw new Error("EDIT_BOX_TEXT_LABEL_NOT_CREATED");
  }
  textLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

  const placeholderNode = createText(
    node,
    assets,
    placeholder,
    width - 72,
    height - 20,
    0,
    0,
    {
      color: new Color(214, 198, 164, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: Math.min(28, Math.floor(height * 0.38)),
    },
  );
  placeholderNode.name = "PLACEHOLDER_LABEL";
  placeholderNode.getComponent(UITransform)?.setAnchorPoint(0, 1);
  const placeholderLabel = placeholderNode.getComponent(Label);
  if (!placeholderLabel) {
    throw new Error("EDIT_BOX_PLACEHOLDER_LABEL_NOT_CREATED");
  }
  placeholderLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

  const editBox = node.addComponent(EditBox);
  editBox.backgroundImage = assets.getSpriteFrame(
    "ui.panel.secondary" as AssetKey,
  );
  prepareUiNode(node, width, height);
  editBox.inputMode = EditBox.InputMode.SINGLE_LINE;
  textLabel.verticalAlign = Label.VerticalAlign.CENTER;
  placeholderLabel.verticalAlign = Label.VerticalAlign.CENTER;
  editBox.maxLength = maxLength;
  editBox.returnType = EditBox.KeyboardReturnType.DONE;
  editBox.textLabel = textLabel;
  editBox.placeholderLabel = placeholderLabel;
  editBox.placeholder = placeholder;
  editBox.string = initialValue;
  return { editBox, node };
}

export function createModalBackdrop(parent: Node, alpha = 176): Node {
  const visibleSize = view.getVisibleSize();
  const width = Math.max(1920, visibleSize.width);
  const height = Math.max(1080, visibleSize.height);
  const node = createContainer(parent, "ModalBackdrop", width, height);
  const graphics = node.addComponent(Graphics);
  graphics.fillColor = new Color(7, 10, 13, alpha);
  graphics.rect(-width / 2, -height / 2, width, height);
  graphics.fill();
  const stopPropagation = (event: EventTouch): void => {
    event.propagationStopped = true;
  };
  node.on(Node.EventType.TOUCH_START, stopPropagation);
  node.on(Node.EventType.TOUCH_END, stopPropagation);
  return node;
}
