import type { CSSProperties } from "react";
import sourceLayout from "../../art/runtime/web-v3/gameplay-seats-v1/layout-v2.json";
import assets from "./gameplay-seat-assets.generated";

type SourceSeat = {
  slot: number; key: string; portrait: number[]; name: number[]; stats: number[];
  you?: number[]; halo: number[]; portraitRuntime: string; nameRuntime: string;
  statsRuntime: string; youRuntime?: string; nameFont: number; statsFont: number; youFont: number; nameShift: number; statsShift: number;
};
type Profile = "landscape" | "portrait";
const layout: { profiles: Record<Profile, { canvas: number[]; activeHaloRuntime: string; seats: SourceSeat[] }> } = sourceLayout;

export function gameplaySeatPortrait(key: string): Record<Profile, string> {
  return Object.fromEntries(Object.entries(layout.profiles).map(([profile, p]) => {
    const seat = p.seats.find(s => s.key === key) ?? p.seats.find(s => s.key === "masked-traveler")!;
    return [profile, assets[seat.portraitRuntime]];
  })) as Record<Profile, string>;
}

export const gameplaySeatHalo = {
  landscape: assets[layout.profiles.landscape.activeHaloRuntime],
  portrait: assets[layout.profiles.portrait.activeHaloRuntime],
};

export function gameplaySeatStyle(slot: number): CSSProperties {
  const entries: [string, string][] = [["--seat-tall-bid-offset", `${sourceLayout.localBidPortraitShift.y / sourceLayout.localBidPortraitShift.canvas[1] * 100}%`]];
  for (const [profile, p] of Object.entries(layout.profiles)) {
    const seat = p.seats.find(s => s.slot === slot) ?? p.seats[0];
    const prefix = profile === "portrait" ? "--seat-tall" : "--seat-wide";
    for (const part of ["portrait", "name", "stats", "you", "halo"] as const) {
      const box = seat[part];
      if (!box) continue;
      const [x, y, width, height] = box;
      entries.push([`${prefix}-${part}-left`, `${x / p.canvas[0] * 100}%`], [`${prefix}-${part}-top`, `${y / p.canvas[1] * 100}%`], [`${prefix}-${part}-width`, `${width / p.canvas[0] * 100}%`], [`${prefix}-${part}-height`, `${height / p.canvas[1] * 100}%`]);
    }
    for (const part of ["name", "stats", "you"] as const) {
      const path = seat[`${part}Runtime`];
      if (path) entries.push([`${prefix}-${part}-art`, `url("${assets[path]}")`]);
      entries.push([`${prefix}-${part}-font`, `${seat[`${part}Font`] / p.canvas[0] * 100}cqw`]);
    }
    entries.push([`${prefix}-name-shift`, `${seat.nameShift / p.canvas[0] * 100}cqw`], [`${prefix}-stats-shift`, `${seat.statsShift / p.canvas[0] * 100}cqw`]);
  }
  return Object.fromEntries(entries) as CSSProperties;
}
