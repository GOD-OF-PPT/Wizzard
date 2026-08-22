import type { AssetKey } from "../assets/AssetAddresses.generated";

export const PATROL_REVIEW_HOME_ASSET_KEYS = [
  "font.display",
  "font.interface",
  "scene.patrol.track.v1",
  "ui.panel.secondary",
  "ui.results.button.green.v2",
] as const satisfies readonly AssetKey[];

export const PATROL_REVIEW_HOME_CONTENT = {
  action: "开始巡游",
  body:
    "先观察茶灵分布，再定下本巡目标\n与两位旅客同时沿双环前进\n用减速、预备换轨、加速调整路线",
  note: "收集数量越接近目标，结算得分越高",
  subtitle: "双环拾灵 · 六座桥换轨 · 60 秒同步巡行",
  title: "漆环巡游",
} as const;
