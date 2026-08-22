import type { PatrolPlayerState, PatrolState } from "@wizzard/game-core";

export type PatrolTravelerTransitionMode = "animate" | "preserve" | "snap";

export function getPatrolTravelerTransitionMode(
  previous: PatrolPlayerState | undefined,
  current: PatrolPlayerState,
  previousPhase: PatrolState["phase"] | null,
  currentPhase: PatrolState["phase"],
): PatrolTravelerTransitionMode {
  const hasMoved =
    previous === undefined ||
    previous.position !== current.position ||
    previous.route !== current.route;

  if (
    previousPhase === "patrol" &&
    currentPhase === "patrol" &&
    previous !== undefined &&
    !hasMoved
  ) {
    return "preserve";
  }

  if (
    previousPhase === "patrol" &&
    (currentPhase === "patrol" || currentPhase === "results") &&
    hasMoved
  ) {
    return "animate";
  }

  return "snap";
}
