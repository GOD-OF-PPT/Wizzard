import { useEffect, useRef, useState } from "react";
import { NetworkMatchAdapter } from "../web/shared/NetworkMatchAdapter";
import type { RoomSocketClient } from "../web/shared/RoomSocketClient";
import type {
  IMatchAdapter,
  MatchIntentDraft,
  MatchUpdate,
} from "../web/shared/IMatchAdapter";
import type { LocalMatchController } from "./useLocalMatch";
import { BrowserFrameScheduler } from "../web/frame";

export type NetworkMatchController = LocalMatchController;

export function useNetworkMatch(
  roomClient: RoomSocketClient | null,
): NetworkMatchController | null {
  const adapterRef = useRef<IMatchAdapter | null>(null);
  const schedulerRef = useRef(new BrowserFrameScheduler());
  const [update, setUpdate] = useState<MatchUpdate | null>(null);

  useEffect(() => {
    adapterRef.current?.dispose();
    adapterRef.current = null;
    setUpdate(null);
    if (!roomClient) return undefined;

    const adapter = new NetworkMatchAdapter(roomClient, false);
    adapterRef.current = adapter;
    adapter.start(setUpdate);
    let previous = schedulerRef.current.now();
    const tick = (timestamp: number) => {
      const delta = Math.min((timestamp - previous) / 1000, 0.25);
      previous = timestamp;
      adapter.update(delta);
    };
    const stop = schedulerRef.current.start(tick);

    return () => {
      stop();
      adapter.dispose();
      if (adapterRef.current === adapter) adapterRef.current = null;
    };
  }, [roomClient]);

  if (!update) return null;

  return {
    advance: () => adapterRef.current?.requestContinueRound(),
    connection: update.connection,
    controls: update.controls,
    events: [...update.events],
    humanPlayerId: update.snapshot.privateState.playerId,
    restart: () => adapterRef.current?.requestRematch(),
    sendIntent: (payload: MatchIntentDraft) =>
      adapterRef.current?.submitIntent(payload),
    snapshot: update.snapshot,
    turnSecondsRemaining: update.turnSecondsRemaining,
  };
}
