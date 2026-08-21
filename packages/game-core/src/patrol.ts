export const PATROL_DURATION_TICKS = 60;
export const PATROL_ROUTE_LENGTH = 60;
export const PATROL_BRIDGES = [0, 10, 20, 30, 40, 50] as const;

export type PatrolPhase = "observe" | "target-select" | "patrol" | "results";
export type PatrolRoute = "inner" | "outer";
export type PatrolSpeed = "slow" | "cruise" | "fast";

export type PatrolPlayerState = {
  collectedSpiritIds: string[];
  id: string;
  isHuman: boolean;
  name: string;
  position: number;
  route: PatrolRoute;
  score: number | null;
  seatIndex: number;
  speed: PatrolSpeed;
  switchQueued: boolean;
  target: number | null;
};

export type TeaSpiritState = {
  collectedAt: number | null;
  collectedBy: string | null;
  id: string;
  kind: "tea-spirit";
  position: number;
  route: PatrolRoute;
};

export type PatrolResult = {
  actual: number;
  /** Signed difference: positive is over target, negative is under target. */
  difference: number;
  playerId: string;
  score: number;
  target: number;
};

export type PatrolState = {
  bridges: number[];
  durationTicks: number;
  elapsedTicks: number;
  phase: PatrolPhase;
  players: PatrolPlayerState[];
  results: PatrolResult[];
  routeLength: number;
  spirits: TeaSpiritState[];
  version: number;
};

export type PatrolIntent =
  | { type: "finish-observe" }
  | { target: number; type: "select-target" }
  | { type: "slow" }
  | { type: "queue-switch" }
  | { type: "fast" }
  /** Advance every traveler by exactly one simulated second. */
  | { type: "tick" };

export type PatrolErrorCode = "INVALID_TARGET" | "WRONG_PHASE";

export type PatrolEvent =
  | { phase: PatrolPhase; type: "phase-changed" }
  | { playerId: string; target: number; type: "target-selected" }
  | { playerId: string; speed: PatrolSpeed; type: "speed-changed" }
  | {
      playerId: string;
      queued: boolean;
      type: "route-switch-queued";
    }
  | {
      bridge: number;
      playerId: string;
      route: PatrolRoute;
      type: "route-switched";
    }
  | {
      collectedAt: number;
      playerId: string;
      spiritId: string;
      type: "spirit-collected";
    }
  | { elapsedTicks: number; type: "tick-advanced" }
  | { results: PatrolResult[]; type: "patrol-completed" }
  | {
      code: PatrolErrorCode;
      intentType: PatrolIntent["type"];
      type: "intent-rejected";
    };

export type PatrolTransition = {
  events: PatrolEvent[];
  state: PatrolState;
};

const DEFAULT_SPIRIT_POSITIONS: Readonly<
  Record<PatrolRoute, readonly number[]>
> = {
  inner: [5, 9, 15, 19, 25, 29, 35, 39, 45],
  outer: [3, 7, 13, 17, 23, 27, 33, 37, 43],
};

const SPEED_LEVELS: readonly PatrolSpeed[] = ["slow", "cruise", "fast"];
const SPEED_DISTANCE: Readonly<Record<PatrolSpeed, number>> = {
  slow: 0.5,
  cruise: 1,
  fast: 1.5,
};

type MovementPlan = {
  crossedBridge: number | null;
  distance: number;
  position: number;
  route: PatrolRoute;
  segments: MovementSegment[];
  switchQueued: boolean;
};

type MovementSegment = {
  distance: number;
  offsetDistance: number;
  route: PatrolRoute;
  start: number;
};

type SpiritClaim = {
  collectedAt: number;
  playerId: string;
  seatIndex: number;
  spiritId: string;
};

function normalizePosition(position: number, routeLength: number): number {
  return ((position % routeLength) + routeLength) % routeLength;
}

function forwardDistance(
  start: number,
  destination: number,
  routeLength: number,
): number {
  const distance = normalizePosition(destination - start, routeLength);

  return distance === 0 ? routeLength : distance;
}

function planMovement(
  state: PatrolState,
  player: PatrolPlayerState,
): MovementPlan {
  const distance = SPEED_DISTANCE[player.speed];

  if (!player.switchQueued) {
    return {
      crossedBridge: null,
      distance,
      position: normalizePosition(player.position + distance, state.routeLength),
      route: player.route,
      segments: [
        {
          distance,
          offsetDistance: 0,
          route: player.route,
          start: player.position,
        },
      ],
      switchQueued: false,
    };
  }

  const nextBridge = state.bridges
    .map((bridge) => ({
      bridge,
      distance: forwardDistance(
        player.position,
        bridge,
        state.routeLength,
      ),
    }))
    .sort((left, right) => left.distance - right.distance)[0];

  if (!nextBridge || nextBridge.distance > distance) {
    return {
      crossedBridge: null,
      distance,
      position: normalizePosition(player.position + distance, state.routeLength),
      route: player.route,
      segments: [
        {
          distance,
          offsetDistance: 0,
          route: player.route,
          start: player.position,
        },
      ],
      switchQueued: true,
    };
  }

  const nextRoute = player.route === "inner" ? "outer" : "inner";
  const remainingDistance = distance - nextBridge.distance;

  return {
    crossedBridge: nextBridge.bridge,
    distance,
    position: normalizePosition(player.position + distance, state.routeLength),
    route: nextRoute,
    segments: [
      {
        distance: nextBridge.distance,
        offsetDistance: 0,
        route: player.route,
        start: player.position,
      },
      {
        distance: remainingDistance,
        offsetDistance: nextBridge.distance,
        route: nextRoute,
        start: nextBridge.bridge,
      },
    ],
    switchQueued: false,
  };
}

function getCrossingOffset(
  state: PatrolState,
  plan: MovementPlan,
  spirit: TeaSpiritState,
): number | null {
  for (const segment of plan.segments) {
    if (segment.route !== spirit.route || segment.distance <= 0) {
      continue;
    }

    const distance = forwardDistance(
      segment.start,
      spirit.position,
      state.routeLength,
    );

    if (distance <= segment.distance) {
      return (segment.offsetDistance + distance) / plan.distance;
    }
  }

  return null;
}

function claimCrossedSpirits(
  state: PatrolState,
  players: readonly PatrolPlayerState[],
  plans: ReadonlyMap<string, MovementPlan>,
): SpiritClaim[] {
  const claims: SpiritClaim[] = [];

  for (const spirit of state.spirits) {
    if (spirit.collectedBy !== null) {
      continue;
    }

    const candidates = players.flatMap((player) => {
      const plan = plans.get(player.id);
      const crossingOffset = plan
        ? getCrossingOffset(state, plan, spirit)
        : null;

      return crossingOffset === null
        ? []
        : [
            {
              collectedAt: state.elapsedTicks + crossingOffset,
              playerId: player.id,
              seatIndex: player.seatIndex,
              spiritId: spirit.id,
            },
          ];
    });

    candidates.sort(
      (left, right) =>
        left.collectedAt - right.collectedAt ||
        left.seatIndex - right.seatIndex,
    );

    if (candidates[0]) {
      claims.push(candidates[0]);
    }
  }

  return claims.sort(
    (left, right) =>
      left.collectedAt - right.collectedAt ||
      left.spiritId.localeCompare(right.spiritId),
  );
}

function createSpirits(): TeaSpiritState[] {
  return (["inner", "outer"] as const).flatMap((route) =>
    DEFAULT_SPIRIT_POSITIONS[route].map((position, index) => ({
      collectedAt: null,
      collectedBy: null,
      id: `${route}-tea-spirit-${index + 1}`,
      kind: "tea-spirit" as const,
      position,
      route,
    })),
  );
}

export function scorePatrolTarget(target: number, actual: number): number {
  return target === actual ? 20 : -5 * Math.abs(target - actual);
}

export function createPatrolPrototype(): PatrolState {
  return {
    bridges: [...PATROL_BRIDGES],
    durationTicks: PATROL_DURATION_TICKS,
    elapsedTicks: 0,
    phase: "observe",
    players: [
      {
        collectedSpiritIds: [],
        id: "traveler-you",
        isHuman: true,
        name: "你",
        position: 0,
        route: "outer",
        score: null,
        seatIndex: 0,
        speed: "cruise",
        switchQueued: false,
        target: null,
      },
      {
        collectedSpiritIds: [],
        id: "traveler-pine",
        isHuman: false,
        name: "松墨",
        position: 20,
        route: "inner",
        score: null,
        seatIndex: 1,
        speed: "cruise",
        switchQueued: false,
        target: null,
      },
      {
        collectedSpiritIds: [],
        id: "traveler-rain",
        isHuman: false,
        name: "苇雨",
        position: 59,
        route: "outer",
        score: null,
        seatIndex: 2,
        speed: "cruise",
        switchQueued: false,
        target: null,
      },
    ],
    results: [],
    routeLength: PATROL_ROUTE_LENGTH,
    spirits: createSpirits(),
    version: 0,
  };
}

function rejectIntent(
  state: PatrolState,
  intent: PatrolIntent,
  code: PatrolErrorCode,
): PatrolTransition {
  return {
    events: [
      { code, intentType: intent.type, type: "intent-rejected" },
    ],
    state,
  };
}

export function applyPatrolIntent(
  state: PatrolState,
  intent: PatrolIntent,
): PatrolTransition {
  if (intent.type === "finish-observe") {
    if (state.phase !== "observe") {
      return rejectIntent(state, intent, "WRONG_PHASE");
    }

    return {
      events: [{ phase: "target-select", type: "phase-changed" }],
      state: {
        ...state,
        phase: "target-select",
        version: state.version + 1,
      },
    };
  }

  if (intent.type === "select-target") {
    if (state.phase !== "target-select") {
      return rejectIntent(state, intent, "WRONG_PHASE");
    }

    if (
      !Number.isInteger(intent.target) ||
      intent.target < 0 ||
      intent.target > state.spirits.length
    ) {
      return rejectIntent(state, intent, "INVALID_TARGET");
    }

    const aiTargets = [4, 5];
    let aiIndex = 0;
    const players = state.players.map((player) => {
      const target = player.isHuman ? intent.target : aiTargets[aiIndex++];

      return { ...player, target };
    });

    return {
      events: [
        ...players.map<PatrolEvent>((player) => ({
          playerId: player.id,
          target: player.target ?? 0,
          type: "target-selected",
        })),
        { phase: "patrol", type: "phase-changed" },
      ],
      state: {
        ...state,
        phase: "patrol",
        players,
        version: state.version + 1,
      },
    };
  }

  if (
    intent.type === "slow" ||
    intent.type === "fast" ||
    intent.type === "queue-switch"
  ) {
    if (state.phase !== "patrol") {
      return rejectIntent(state, intent, "WRONG_PHASE");
    }

    const human = state.players.find((player) => player.isHuman);

    if (!human) {
      throw new Error("PATROL_HUMAN_NOT_FOUND");
    }

    if (intent.type === "queue-switch") {
      const queued = !human.switchQueued;

      return {
        events: [
          {
            playerId: human.id,
            queued,
            type: "route-switch-queued",
          },
        ],
        state: {
          ...state,
          players: state.players.map((player) =>
            player.id === human.id
              ? { ...player, switchQueued: queued }
              : player,
          ),
          version: state.version + 1,
        },
      };
    }

    const currentSpeedIndex = SPEED_LEVELS.indexOf(human.speed);
    const direction = intent.type === "fast" ? 1 : -1;
    const nextSpeedIndex = Math.max(
      0,
      Math.min(SPEED_LEVELS.length - 1, currentSpeedIndex + direction),
    );
    const speed = SPEED_LEVELS[nextSpeedIndex];

    return {
      events: [{ playerId: human.id, speed, type: "speed-changed" }],
      state: {
        ...state,
        players: state.players.map((player) =>
          player.id === human.id ? { ...player, speed } : player,
        ),
        version: state.version + 1,
      },
    };
  }

  if (intent.type === "tick") {
    if (state.phase !== "patrol") {
      return rejectIntent(state, intent, "WRONG_PHASE");
    }

    const events: PatrolEvent[] = [];
    const movingPlayers = state.players.map<PatrolPlayerState>((player) => {
      if (player.isHuman) {
        return player;
      }

      const speed =
        player.collectedSpiritIds.length < (player.target ?? 0)
          ? "fast"
          : "slow";

      if (speed !== player.speed) {
        events.push({ playerId: player.id, speed, type: "speed-changed" });
      }

      return { ...player, speed };
    });
    const plans = new Map(
      movingPlayers.map((player) => [
        player.id,
        planMovement(state, player),
      ]),
    );
    const movedPlayers = movingPlayers.map((player) => {
      const plan = plans.get(player.id);

      if (!plan) {
        throw new Error(`PATROL_MOVEMENT_PLAN_NOT_FOUND:${player.id}`);
      }

      if (plan.crossedBridge !== null) {
        events.push({
          bridge: plan.crossedBridge,
          playerId: player.id,
          route: plan.route,
          type: "route-switched",
        });
      }

      return {
        ...player,
        position: plan.position,
        route: plan.route,
        switchQueued: plan.switchQueued,
      };
    });
    const claims = claimCrossedSpirits(state, movingPlayers, plans);
    const claimsByPlayer = new Map<string, string[]>();

    for (const claim of claims) {
      const playerClaims = claimsByPlayer.get(claim.playerId) ?? [];
      playerClaims.push(claim.spiritId);
      claimsByPlayer.set(claim.playerId, playerClaims);
      events.push({
        collectedAt: claim.collectedAt,
        playerId: claim.playerId,
        spiritId: claim.spiritId,
        type: "spirit-collected",
      });
    }

    const players = movedPlayers.map((player) => ({
      ...player,
      collectedSpiritIds: [
        ...player.collectedSpiritIds,
        ...(claimsByPlayer.get(player.id) ?? []),
      ],
    }));
    const claimBySpirit = new Map(
      claims.map((claim) => [claim.spiritId, claim]),
    );
    const spirits = state.spirits.map((spirit) => {
      const claim = claimBySpirit.get(spirit.id);

      return claim
        ? {
            ...spirit,
            collectedAt: claim.collectedAt,
            collectedBy: claim.playerId,
          }
        : spirit;
    });
    const elapsedTicks = state.elapsedTicks + 1;
    events.push({ elapsedTicks, type: "tick-advanced" });
    const patrolComplete = elapsedTicks >= state.durationTicks;
    const results = patrolComplete
      ? players.map<PatrolResult>((player) => {
          if (player.target === null) {
            throw new Error(`PATROL_TARGET_NOT_FOUND:${player.id}`);
          }

          const actual = player.collectedSpiritIds.length;

          return {
            actual,
            difference: actual - player.target,
            playerId: player.id,
            score: scorePatrolTarget(player.target, actual),
            target: player.target,
          };
        })
      : [];
    const scoreByPlayerId = new Map(
      results.map((result) => [result.playerId, result.score]),
    );
    const scoredPlayers = patrolComplete
      ? players.map((player) => ({
          ...player,
          score: scoreByPlayerId.get(player.id) ?? null,
        }))
      : players;

    if (patrolComplete) {
      events.push({ phase: "results", type: "phase-changed" });
      events.push({
        results: results.map((result) => ({ ...result })),
        type: "patrol-completed",
      });
    }

    return {
      events,
      state: {
        ...state,
        elapsedTicks,
        phase: patrolComplete ? "results" : "patrol",
        players: scoredPlayers,
        results,
        spirits,
        version: state.version + 1,
      },
    };
  }

  return rejectIntent(state, intent, "WRONG_PHASE");
}
