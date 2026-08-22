import type { PatrolState } from "@wizzard/game-core";
import type { AppRuntimeConfig } from "../config/MatchRuntimeConfig";

export type PatrolReviewActionVisibility = Readonly<{
  showPersistentReturn: boolean;
  showResultReturn: boolean;
  showReplay: boolean;
}>;

export function isStandalonePatrolReviewConfig(
  config: AppRuntimeConfig,
): boolean {
  return config.startup === "patrol" && config.friendRoom === null;
}

export function getPatrolReviewActionVisibility(
  phase: PatrolState["phase"],
  canReturnHome: boolean,
): PatrolReviewActionVisibility {
  const showingResults = phase === "results";
  return {
    showPersistentReturn: canReturnHome && !showingResults,
    showResultReturn: canReturnHome && showingResults,
    showReplay: showingResults,
  };
}
