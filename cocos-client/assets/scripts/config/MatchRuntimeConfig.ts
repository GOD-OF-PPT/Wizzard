import type { RoomBinding } from "../network/RoomSocketClient";

export type MatchRuntimeConfig =
  | { mode: "local" }
  | {
      binding: RoomBinding;
      endpoint: string;
      mode: "network";
      protocol?: string;
    };

function readInjectedRuntimeConfig(): MatchRuntimeConfig | null {
  const injected = (
    globalThis as unknown as {
      __WIZZARD_MATCH_RUNTIME_CONFIG__?: unknown;
    }
  ).__WIZZARD_MATCH_RUNTIME_CONFIG__;

  if (typeof injected !== "object" || injected === null) {
    return null;
  }

  const candidate = injected as Partial<MatchRuntimeConfig>;

  if (candidate.mode === "local") {
    return { mode: "local" };
  }

  if (
    candidate.mode === "network" &&
    typeof candidate.endpoint === "string" &&
    typeof candidate.binding === "object" &&
    candidate.binding !== null
  ) {
    return candidate as MatchRuntimeConfig;
  }

  throw new Error("INVALID_MATCH_RUNTIME_CONFIG");
}

// The checked-in Creator project remains an explicit offline development build.
// Network builds inject this public, non-secret config before Boot.scene starts;
// a socket failure never silently falls back to a local authority.
export const MATCH_RUNTIME_CONFIG: MatchRuntimeConfig =
  readInjectedRuntimeConfig() ?? { mode: "local" };
