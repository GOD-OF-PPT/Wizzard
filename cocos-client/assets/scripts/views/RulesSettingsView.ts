import { Color, Label, Node, UIOpacity } from "cc";
import type { AssetKey } from "../assets/AssetAddresses.generated";
import { AssetRegistry } from "../assets/AssetRegistry";
import {
  DEFAULT_GAME_PREFERENCES,
  type GamePreferences,
} from "../platform/GamePreferences";
import {
  createButton,
  createContainer,
  createHorizontalSliceSprite,
  createModalBackdrop,
  createSprite,
  createText,
  type ButtonStyle,
} from "./UiFactory";
import {
  RULES_SETTINGS_ASSETS as A,
  RULES_SETTINGS_COPY as COPY,
  RULES_SETTINGS_LAYOUT as L,
  type LayoutRect,
} from "./RulesSettingsLayout";

export type RulesSettingsTab = "rules" | "settings";

export type RulesSettingsState = Readonly<{
  notice: string | null;
  pageIndex: number;
  preferences: GamePreferences;
  tab: RulesSettingsTab;
}>;

export type RulesSettingsActions = Readonly<{
  onClose: () => void;
  onPageChange: (pageIndex: number) => void;
  onPreferencesChange: (preferences: GamePreferences) => void;
  onTabChange: (tab: RulesSettingsTab) => void;
}>;

type RulePage = Readonly<{
  body: string;
  eyebrow: string;
  footer: string;
  title: string;
}>;

const RULE_PAGES: readonly RulePage[] = [
  {
    body:
      "每轮先预测赢墩数，再让实际结果刚好命中。\n\n" +
      "1  翻牌定王牌\n" +
      "2  从发牌者左侧开始依次预测\n" +
      "3  首墩由发牌者左侧领出\n" +
      "4  之后由上一墩赢家领出\n" +
      "5  手牌出完后按预测结果计分",
    eyebrow: "目标：说到做到",
    footer: "60 张牌 · 四种花色 1–13 · 至高牌 4 张 · 虚无牌 4 张",
    title: "本轮玩法",
  },
  {
    body:
      "翻开牌库顶牌，决定本轮王牌：\n\n" +
      "数字牌  该花色成为王牌\n" +
      "虚无牌  本轮没有王牌\n" +
      "至高牌  由发牌者选择山、结、叶或日\n\n" +
      "经典局末轮发完 60 张牌，不翻牌、无王牌；快速局每轮翻牌。",
    eyebrow: "王牌会压过领出花色",
    footer: "牌力：先出的至高牌 ＞ 最高数字王牌 ＞ 最高数字领出花色",
    title: "翻牌定王",
  },
  {
    body:
      "领出花色建立后，手中有该花色数字牌时必须跟色；没有时可出任意牌。\n\n" +
      "至高牌和虚无牌始终可出。至高牌领出时直接获胜，其余玩家可出任意牌，不再建立领出花色；多张至高牌时，第一张获胜。\n\n" +
      "虚无牌不建立领出花色；之后第一张数字牌建立花色。若整墩都是虚无牌，第一张获胜。",
    eyebrow: "先跟色，再比较牌力",
    footer: "第一墩由发牌者左侧领出；之后由上一墩赢家领出",
    title: "跟色与胜负",
  },
  {
    body:
      "预测命中\n" +
      "20 + 10 × 实际赢墩数\n" +
      "例：预测 3、实际 3，获得 +50 分。\n\n" +
      "预测未中\n" +
      "−10 × |实际赢墩数 − 预测数|\n" +
      "例：预测 3、实际 1，获得 −20 分。\n\n" +
      "分数可以为负；最高分相同则并列获胜。",
    eyebrow: "命中预测才有基础奖励",
    footer: "快速局 8 轮 · 经典局轮数：3人20 · 4人15 · 5人12 · 6人10",
    title: "命中与计分",
  },
];

const PAPER_BUTTON: ButtonStyle = {
  assetKey: "ui.plaque.small" as AssetKey,
  fontKey: "font.display" as AssetKey,
  horizontalSlice: true,
  outlineWidth: 0,
  textColor: new Color(74, 40, 22, 255),
};

const BLUE_BUTTON: ButtonStyle = {
  assetKey: "ui.panel.secondary" as AssetKey,
  fontKey: "font.display" as AssetKey,
  textColor: new Color(247, 226, 184, 255),
};

const SELECTED_PAPER_BUTTON: ButtonStyle = {
  ...PAPER_BUTTON,
  textColor: new Color(132, 48, 31, 255),
};

function renderRuleCards(parent: Node, assets: AssetRegistry): void {
  const cards: readonly [AssetKey, string][] = [
    ["card.face.mountain", "山"],
    ["card.face.knot", "结"],
    ["card.face.leaf", "叶"],
    ["card.face.sun", "日"],
  ];
  cards.forEach(([key, label], index) => {
    const x =
      L.ruleVisual.suitCard.startX + index * L.ruleVisual.suitCard.spacing;
    createSprite(
      parent,
      assets,
      key,
      L.ruleVisual.suitCard.width,
      L.ruleVisual.suitCard.height,
      x,
      L.ruleVisual.suitCard.y,
    );
    createText(
      parent,
      assets,
      label,
      L.ruleVisual.suitLabel.width,
      L.ruleVisual.suitLabel.height,
      x,
      L.ruleVisual.suitLabel.y,
      {
      color: new Color(241, 216, 166, 255),
      fontKey: "font.display" as AssetKey,
      fontSize: 20,
      },
    );
  });
  createSprite(
    parent,
    assets,
    "card.special.highest",
    L.ruleVisual.specialCard.width,
    L.ruleVisual.specialCard.height,
    -L.ruleVisual.specialCard.x,
    L.ruleVisual.specialCard.y,
  );
  createSprite(
    parent,
    assets,
    "card.special.lowest",
    L.ruleVisual.specialCard.width,
    L.ruleVisual.specialCard.height,
    L.ruleVisual.specialCard.x,
    L.ruleVisual.specialCard.y,
  );
  createText(
    parent,
    assets,
    "至高牌",
    L.ruleVisual.specialLabel.width,
    L.ruleVisual.specialLabel.height,
    -L.ruleVisual.specialLabel.x,
    L.ruleVisual.specialLabel.y,
    {
    fontKey: "font.interface" as AssetKey,
    fontSize: 17,
    },
  );
  createText(
    parent,
    assets,
    "虚无牌",
    L.ruleVisual.specialLabel.width,
    L.ruleVisual.specialLabel.height,
    L.ruleVisual.specialLabel.x,
    L.ruleVisual.specialLabel.y,
    {
    fontKey: "font.interface" as AssetKey,
    fontSize: 17,
    },
  );
}

function renderTrickPriority(parent: Node, assets: AssetRegistry): void {
  const cards: readonly [AssetKey, string, number][] = [
    ["card.special.highest", "先出的至高牌", -176],
    ["card.face.sun", "最高数字王牌", 0],
    ["card.face.leaf", "最高数字领出花色", 176],
  ];
  cards.forEach(([key, label, x], index) => {
    createSprite(parent, assets, key, 112, 168, x, 42);
    createText(parent, assets, label, 160, 38, x, -68, {
      fontKey: "font.interface" as AssetKey,
      fontSize: 18,
    });
    if (index < cards.length - 1) {
      createText(parent, assets, "＞", 42, 52, x + 88, 42, {
        color: new Color(238, 187, 88, 255),
        fontKey: "font.display" as AssetKey,
        fontSize: 36,
      });
    }
  });
  createHorizontalSliceSprite(
    parent,
    assets,
    "ui.plaque.small",
    460,
    48,
    0,
    -112,
  );
  createText(parent, assets, "至高牌、虚无牌始终可以打出", 410, 32, 0, -112, {
    color: new Color(78, 43, 23, 255),
    fontKey: "font.interface" as AssetKey,
    fontSize: 20,
  });
}

function renderScoreExample(parent: Node, assets: AssetRegistry): void {
  createSprite(parent, assets, "ui.scoreRibbon", 430, 88, 0, 92);
  createText(parent, assets, "预测 3 · 实际 3 · +50 分", 370, 34, 0, 92, {
    color: new Color(75, 42, 24, 255),
    fontKey: "font.display" as AssetKey,
    fontSize: 22,
  });
  createSprite(parent, assets, "ui.panel.secondary", 430, 120, 0, -18, true);
  createText(parent, assets, "命中：20 + 10 × 赢墩数", 370, 26, 0, -2, {
    fontKey: "font.interface" as AssetKey,
    fontSize: 20,
  });
  createText(parent, assets, "未中：−10 × |实际 − 预测|", 370, 26, 0, -34, {
    fontKey: "font.interface" as AssetKey,
    fontSize: 20,
  });
  createHorizontalSliceSprite(
    parent,
    assets,
    "ui.plaque.small",
    470,
    56,
    0,
    -112,
  );
  createText(parent, assets, "操作限时 30 秒，超时由茶馆代行", 390, 30, 0, -112, {
    color: new Color(78, 43, 23, 255),
    fontKey: "font.interface" as AssetKey,
    fontSize: 18,
  });
}

function renderRuleVisual(
  parent: Node,
  assets: AssetRegistry,
  pageIndex: number,
): void {
  // Right content card. Keep its top edge below the chapter-nav row so the
  // three header levels (title → tabs → chapters) stay readable and do not
  // collide with the body cards on landscape captures.
  const visual = createContainer(
    parent,
    "RuleVisual",
    L.visualCard.width,
    L.visualCard.height,
    L.visualCard.x,
    L.visualCard.y,
  );

  if (pageIndex === 0) {
    createSprite(visual, assets, "tutorial.ruleHint", 520, 308, 0, 0);
    return;
  }

  createSprite(
    visual,
    assets,
    A.visualCard,
    L.visualCard.width,
    L.visualCard.height,
    0,
    0,
  );

  if (pageIndex === 1) {
    renderRuleCards(visual, assets);
    return;
  }

  if (pageIndex === 2) {
    renderTrickPriority(visual, assets);
    return;
  }

  renderScoreExample(visual, assets);
}

function renderRules(
  panel: Node,
  assets: AssetRegistry,
  state: RulesSettingsState,
  actions: RulesSettingsActions,
): void {
  const pageIndex = Math.max(0, Math.min(RULE_PAGES.length - 1, state.pageIndex));
  const page = RULE_PAGES[pageIndex];
  const chapterLabels = ["快速上手", "王牌牌力", "出牌规则", "计分局制"];

  // Chapter navigation is the third header level. Its row and the content
  // cards use separate layout bands so decorative frames never overlap.
  chapterLabels.forEach((label, index) => {
    const selected = index === pageIndex;
    const button = createButton(
      panel,
      assets,
      label,
      L.chapter.width,
      L.chapter.height,
      L.chapter.startX + index * L.chapter.spacing,
      L.chapter.y,
      () => actions.onPageChange(index),
      true,
      {
        ...(selected ? SELECTED_PAPER_BUTTON : PAPER_BUTTON),
        fontSize: 22,
      },
    );
    if (!selected) {
      button.addComponent(UIOpacity).opacity = 202;
    }
  });

  const textPanel = createSprite(
    panel,
    assets,
    A.textCard,
    L.textCard.width,
    L.textCard.height,
    L.textCard.x,
    L.textCard.y,
  );
  createText(
    textPanel,
    assets,
    page.eyebrow,
    L.eyebrow.width,
    L.eyebrow.height,
    L.eyebrow.x,
    L.eyebrow.y,
    {
    color: new Color(218, 187, 119, 255),
    fontKey: "font.interface" as AssetKey,
    fontSize: 18,
    horizontalAlign: Label.HorizontalAlign.LEFT,
    },
  );
  createText(
    textPanel,
    assets,
    page.title,
    L.pageTitle.width,
    L.pageTitle.height,
    L.pageTitle.x,
    L.pageTitle.y,
    {
    fontKey: "font.display" as AssetKey,
    fontSize: 30,
    horizontalAlign: Label.HorizontalAlign.LEFT,
    },
  );
  createText(
    textPanel,
    assets,
    page.body,
    L.pageBody.width,
    L.pageBody.height,
    L.pageBody.x,
    L.pageBody.y,
    {
    color: new Color(244, 226, 185, 255),
    fontKey: "font.interface" as AssetKey,
    fontSize: 19,
    horizontalAlign: Label.HorizontalAlign.LEFT,
    lineHeight: 25,
    verticalAlign: Label.VerticalAlign.TOP,
    },
  );

  renderRuleVisual(panel, assets, pageIndex);

  // Footer ribbon: keep a readable center width instead of stretching the
  // small plaque asset across nearly the full panel.
  createHorizontalSliceSprite(
    panel,
    assets,
    "ui.scoreRibbon",
    L.footer.width,
    L.footer.height,
    L.footer.x,
    L.footer.y,
  );
  createText(panel, assets, page.footer, 900, 34, L.footer.x, L.footer.y, {
    color: new Color(78, 43, 23, 255),
    fontKey: "font.interface" as AssetKey,
    fontSize: 22,
  });
  const previous = createButton(
    panel,
    assets,
    "上一页",
    L.previousButton.width,
    L.previousButton.height,
    L.previousButton.x,
    L.previousButton.y,
    () => actions.onPageChange(pageIndex - 1),
    pageIndex > 0,
    {
      ...PAPER_BUTTON,
      fontSize: 21,
    },
  );
  if (pageIndex === 0) {
    previous.getComponent(UIOpacity)!.opacity = 170;
  }
  createHorizontalSliceSprite(
    panel,
    assets,
    "ui.plaque.small",
    L.pageIndicator.width,
    L.pageIndicator.height,
    L.pageIndicator.x,
    L.pageIndicator.y,
  );
  createText(
    panel,
    assets,
    `${pageIndex + 1} / ${RULE_PAGES.length}`,
    88,
    28,
    L.pageIndicator.x,
    L.pageIndicator.y,
    {
      color: new Color(78, 43, 23, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: 20,
    },
  );
  const next = createButton(
    panel,
    assets,
    "下一页",
    L.nextButton.width,
    L.nextButton.height,
    L.nextButton.x,
    L.nextButton.y,
    () => actions.onPageChange(pageIndex + 1),
    pageIndex < RULE_PAGES.length - 1,
    {
      ...PAPER_BUTTON,
      fontSize: 21,
    },
  );
  if (pageIndex === RULE_PAGES.length - 1) {
    next.getComponent(UIOpacity)!.opacity = 170;
  }
}

function renderSettingRow(
  parent: Node,
  assets: AssetRegistry,
  title: string,
  description: string,
  enabled: boolean,
  bounds: LayoutRect,
  onToggle: () => void,
): void {
  const row = createSprite(
    parent,
    assets,
    A.settingsRow,
    bounds.width,
    bounds.height,
    bounds.x,
    bounds.y,
  );
  createText(
    row,
    assets,
    title,
    L.settings.rowTitle.width,
    L.settings.rowTitle.height,
    L.settings.rowTitle.x,
    L.settings.rowTitle.y,
    {
    color: new Color(73, 40, 22, 255),
    fontKey: "font.display" as AssetKey,
    fontSize: 24,
    horizontalAlign: Label.HorizontalAlign.LEFT,
    },
  );
  createText(
    row,
    assets,
    description,
    L.settings.rowDescription.width,
    L.settings.rowDescription.height,
    L.settings.rowDescription.x,
    L.settings.rowDescription.y,
    {
    color: new Color(104, 66, 40, 255),
    fontKey: "font.interface" as AssetKey,
    fontSize: 16,
    horizontalAlign: Label.HorizontalAlign.LEFT,
    lineHeight: 21,
    },
  );
  createButton(
    row,
    assets,
    enabled ? "已开启" : "已关闭",
    L.settings.toggle.width,
    L.settings.toggle.height,
    L.settings.toggle.x,
    L.settings.toggle.y,
    onToggle,
    true,
    {
      ...(enabled ? BLUE_BUTTON : PAPER_BUTTON),
      fontSize: 20,
    },
  );
}

function renderSettings(
  panel: Node,
  assets: AssetRegistry,
  state: RulesSettingsState,
  actions: RulesSettingsActions,
): void {
  createText(
    panel,
    assets,
    "本机体验设置",
    L.settings.heading.width,
    L.settings.heading.height,
    L.settings.heading.x,
    L.settings.heading.y,
    {
    fontKey: "font.display" as AssetKey,
    fontSize: 30,
    },
  );
  createText(
    panel,
    assets,
    "这些选项只改变本机提示，不改变好友房规则与服务端判定。",
    L.settings.subtitle.width,
    L.settings.subtitle.height,
    L.settings.subtitle.x,
    L.settings.subtitle.y,
    {
      color: new Color(222, 194, 139, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: 18,
    },
  );

  renderSettingRow(
    panel,
    assets,
    "合法牌提示",
    "轮到你时，用金绿色光圈标出可以打出的手牌。",
    state.preferences.showLegalHints,
    L.settings.firstRow,
    () =>
      actions.onPreferencesChange({
        ...state.preferences,
        showLegalHints: !state.preferences.showLegalHints,
      }),
  );
  renderSettingRow(
    panel,
    assets,
    "轮到我时震动",
    "在支持震动的设备上，轮到你选择王牌、预测或出牌时轻震一次。",
    state.preferences.vibrationEnabled,
    L.settings.secondRow,
    () =>
      actions.onPreferencesChange({
        ...state.preferences,
        vibrationEnabled: !state.preferences.vibrationEnabled,
      }),
  );

  const timer = createSprite(
    panel,
    assets,
    A.settingsRow,
    L.settings.timerRow.width,
    L.settings.timerRow.height,
    L.settings.timerRow.x,
    L.settings.timerRow.y,
  );
  createText(
    timer,
    assets,
    "行动时限",
    L.settings.rowTitle.width,
    L.settings.rowTitle.height,
    L.settings.rowTitle.x,
    L.settings.rowTitle.y,
    {
    color: new Color(73, 40, 22, 255),
    fontKey: "font.display" as AssetKey,
    fontSize: 24,
    horizontalAlign: Label.HorizontalAlign.LEFT,
    },
  );
  createText(
    timer,
    assets,
    "每次选择王牌、预测或出牌限时 30 秒；超时由茶馆代行。",
    L.settings.timerDescription.width,
    L.settings.timerDescription.height,
    L.settings.timerDescription.x,
    L.settings.timerDescription.y,
    {
      color: new Color(104, 66, 40, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: 17,
      horizontalAlign: Label.HorizontalAlign.LEFT,
      lineHeight: 22,
    },
  );

  const resetX = state.notice
    ? L.settings.resetWithNoticeX
    : L.settings.reset.x;
  createButton(
    panel,
    assets,
    "恢复默认",
    L.settings.reset.width,
    L.settings.reset.height,
    resetX,
    L.settings.reset.y,
    () => actions.onPreferencesChange(DEFAULT_GAME_PREFERENCES),
    true,
    {
      ...PAPER_BUTTON,
      fontSize: 22,
    },
  );
  if (state.notice) {
    const notice = createHorizontalSliceSprite(
      panel,
      assets,
      "ui.plaque.small",
      L.settings.notice.width,
      L.settings.notice.height,
      L.settings.notice.x,
      L.settings.notice.y,
    );
    createText(notice, assets, state.notice, 240, 32, 0, 0, {
      color: new Color(78, 43, 23, 255),
      fontKey: "font.interface" as AssetKey,
      fontSize: 17,
    });
  }
}

export function renderRulesSettingsView(
  parent: Node,
  assets: AssetRegistry,
  state: RulesSettingsState,
  actions: RulesSettingsActions,
): void {
  const overlay = createModalBackdrop(parent, 210);
  overlay.name = "RulesSettingsView";
  const panel = createSprite(
    overlay,
    assets,
    A.frame,
    L.panel.width,
    L.panel.height,
    L.panel.x,
    L.panel.y,
  );
  createSprite(
    panel,
    assets,
    "ui.roundTitleScroll",
    L.title.width,
    L.title.height,
    L.title.x,
    L.title.y,
  );
  createText(
    panel,
    assets,
    COPY.title,
    L.titleLabel.width,
    L.titleLabel.height,
    L.titleLabel.x,
    L.titleLabel.y,
    {
      color: new Color(78, 43, 23, 255),
      fontKey: "font.display" as AssetKey,
      fontSize: L.titleLabel.fontSize,
      lineHeight: L.titleLabel.lineHeight,
    },
  );
  createButton(
    panel,
    assets,
    "返回首页",
    L.backButton.width,
    L.backButton.height,
    L.backButton.x,
    L.backButton.y,
    actions.onClose,
    true,
    {
      ...PAPER_BUTTON,
      fontSize: 22,
    },
  );

  const rulesTab = createButton(
    panel,
    assets,
    "玩法规则",
    L.rulesTab.width,
    L.rulesTab.height,
    L.rulesTab.x,
    L.rulesTab.y,
    () => actions.onTabChange("rules"),
    true,
    {
      ...(state.tab === "rules" ? BLUE_BUTTON : PAPER_BUTTON),
      fontSize: 24,
    },
  );
  const settingsTab = createButton(
    panel,
    assets,
    "体验设置",
    L.settingsTab.width,
    L.settingsTab.height,
    L.settingsTab.x,
    L.settingsTab.y,
    () => actions.onTabChange("settings"),
    true,
    {
      ...(state.tab === "settings" ? BLUE_BUTTON : PAPER_BUTTON),
      fontSize: 24,
    },
  );
  if (state.tab !== "rules") {
    rulesTab.addComponent(UIOpacity).opacity = 202;
  }
  if (state.tab !== "settings") {
    settingsTab.addComponent(UIOpacity).opacity = 202;
  }

  if (state.tab === "rules") {
    renderRules(panel, assets, state, actions);
  } else {
    renderSettings(panel, assets, state, actions);
  }
}
