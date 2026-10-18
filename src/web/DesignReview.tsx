/** Development-only, frozen content for same-state comparison with ImageGen.
 * These records are typography/layout fixtures, never gameplay authority. */
import { useRef } from "react";
import type { MatchPlayerState } from "@wizzard/game-core/contracts";
import { WebResults } from "../components/WebResults";
import { WebRules, defaultWebPreferences } from "../components/WebRules";
import { LeaveDialog } from "../components/LeaveDialog";
import { WebLobby } from "../components/WebLobby";
import type { FriendRoomState } from "../hooks/useFriendRoom";
import { MatchScreen } from "../components/MatchScreen";
import { reviewMatchController } from "./review-match-fixture";
import { RecoveryDialog } from "../components/RecoveryDialog";

const names = ["青竹客", "云游鹤", "花间狐", "墨隐熊", "星眠猫", "AI旅人"];
const avatars = ["bamboo-cat", "wandering-crane", "flower-fox", "ink-panda", "sleepy-star-cat", "masked-traveler"];
const scoreRows = [[1, 1, 30, 80], [3, 2, -10, 60], [1, 1, 30, 50], [2, 1, -10, 40], [0, 0, 20, 20], [1, 2, -10, 10]];
const ignore = () => undefined;
const refuse = () => false;
const lobbyState: FriendRoomState = {
  connection: "connected", error: null, match: null,
  permissions: { canContinueRound: false, canRematch: false, canSetReady: true, canStart: false },
  room: {
    roomId: "design-lobby-only", roomCode: "628315", mode: "quick", phase: "lobby", maxPlayers: 6,
    createdAt: 0, updatedAt: 0, revision: 1, selfPlayerId: "design-0", hostPlayerId: "design-0",
    players: [0, 1, 2, 3, 5].map(index => ({
      playerId: `design-${index}`, name: names[index], avatarKey: index === 5 ? "masked-traveler" : (["bamboo-cat", "wandering-crane", "flower-fox", "ink-panda"] as const)[index],
      isAi: index === 5, connected: true, ready: index !== 3, joinedAt: index,
    })),
  },
};

export default function DesignReview({ state }: { state: string }) {
  const focus = useRef<HTMLButtonElement>(null);
  const params = new URLSearchParams(location.search);
  const requestedHand = Number(params.get("hand") ?? "4");
  const handCount = Number.isInteger(requestedHand) && requestedHand >= 1 && requestedHand <= 8 ? requestedHand : 4;
  const requestedSuit = params.get("suit");
  const trump = requestedSuit === "leaf" || requestedSuit === "mountain" || requestedSuit === "knot" ? requestedSuit : "sun";
  if (state === "reconnecting" || state === "session-ended") return <main className="game-prototype" data-reduced-motion="true" data-room-recovery="true" aria-label="设计验收样例，不连接房间服务">
    <div className="screen-layer" inert aria-hidden="true"><MatchScreen controller={{ ...reviewMatchController("trick-play"), connection: "reconnecting" }} showLegalHints={false} onExit={ignore} /></div>
    <RecoveryDialog terminal={state === "session-ended"} onRetry={ignore} onHome={ignore} />
  </main>;
  const players: MatchPlayerState[] = scoreRows.map(([bid, tricksWon, roundScore, totalScore], index) => ({
    bid, tricksWon, roundScore, totalScore: state === "ranking" ? [180,150,120,100,80,60][index] : totalScore,
    id: `design-${index}`, name: names[index], avatarKey: avatars[index], isHuman: index < 5, seatIndex: index,
  }));
  if (["gameplay", "bid", "chooser"].includes(state)) return <main className="game-prototype" data-reduced-motion="true" aria-label="设计验收样例，不连接房间服务">
    <MatchScreen controller={reviewMatchController(state === "bid" ? "bid" : state === "chooser" ? "trump-select" : "trick-play", handCount, params.get("timer") !== "off", trump)} showLegalHints={false} onExit={ignore} />
  </main>;
  return <main className="game-prototype" data-reduced-motion="true" aria-label="设计验收样例，不连接房间服务">
    {state === "lobby" ? <WebLobby controller={{ state: lobbyState, pendingCommand: null, setAiCount: refuse, setReady: refuse, startRoom: refuse }} fillAi={true} onManualAi={ignore} onExit={ignore} onInvite={ignore} /> : state === "confirm" ? <LeaveDialog pending={false} error={null} onCancel={ignore} onConfirm={ignore} /> : state === "rules" ? <WebRules onClose={ignore} returnFocusRef={focus} preferences={defaultWebPreferences} onPreferences={ignore} /> : <div className="screen-stage">
      <WebResults isMatchEnd={state === "ranking"} onContinue={ignore} onRestart={ignore} onExit={ignore} players={players} roundNumber={4} network={params.has("network")} canRestart={params.get("network") !== "guest"} />
    </div>}
  </main>;
}
