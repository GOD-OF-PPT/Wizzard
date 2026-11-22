/** Development-only, frozen content for same-state comparison with ImageGen.
 * These records are typography/layout fixtures, never gameplay authority. */
import { useRef, useState } from "react";
import type { MatchPlayerState } from "@wizzard/game-core/contracts";
import {getRoundHandCounts} from '@wizzard/game-core';
import { WebResults } from "../components/WebResults";
import { WebRules, defaultWebPreferences } from "../components/WebRules";
import { LeaveDialog } from "../components/LeaveDialog";
import { WebLobby } from "../components/WebLobby";
import type { FriendRoomState } from "../hooks/useFriendRoom";
import { MatchScreen } from "../components/MatchScreen";
import { reviewMatchController } from "./review-match-fixture";
import { RecoveryDialog } from "../components/RecoveryDialog";
import { RoomEntry } from "../components/RoomEntry";
import { WebHome } from "../components/WebHome";
// DEV serves the repository sources. Plain URLs keep experimental full TTFs
// out of production emission; the shipped rules use a separate 61KB WOFF2.
const wenkaiProof = "/art/source/fonts/web-v3/LXGWWenKai-Medium.ttf";
const zhenkaiProof = "/art/source/fonts/web-v3/LXGWZhenKaiSlabGB-Regular.ttf";

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

function lobbyLayoutSample(params: URLSearchParams): FriendRoomState {
  if (!lobbyState.room) return lobbyState;
  if (params.get("lobby-state") === "ready") return { ...lobbyState,
    permissions: { ...lobbyState.permissions!, canStart: true },
    room: { ...lobbyState.room, players: lobbyState.room.players.map(player => ({ ...player, ready: true })) },
  };
  if (!params.has("seats")) return lobbyState;
  const size = Number(params.get("seats"));
  const maxPlayers = size === 3 || size === 4 || size === 5 ? size : 6;
  const bounded = (key: string, fallback: number, minimum: number, maximum: number) => {
    const value = Number(params.get(key) ?? fallback);
    return Number.isInteger(value) ? Math.max(minimum, Math.min(maximum, value)) : fallback;
  };
  const humanCount = bounded("humans", 2, 1, maxPlayers);
  const ready = bounded("ready", humanCount, 0, humanCount);
  const aiCount = bounded("ai", Math.max(0, maxPlayers - humanCount), 0, maxPlayers - humanCount);
  const ai = lobbyState.room.players.find(player => player.isAi)!;
  const humans = [...lobbyState.room.players.filter(player => !player.isAi),
    { ...ai, playerId: "design-4", name: "星眠猫", avatarKey: "sleepy-star-cat" as const, isAi: false },
    { ...ai, isAi: false }];
  const players = [
    ...humans.slice(0, humanCount).map((player, index) => ({ ...player, ready: index < ready })),
    ...Array.from({ length: aiCount }, (_, index) => ({ ...ai, playerId: `design-ai-${index}`, name: `茶灵${index + 1}`, ready: true })),
  ];
  return { ...lobbyState,
    permissions: { ...lobbyState.permissions!, canStart: humanCount >= 2 && ready === humanCount },
    room: { ...lobbyState.room, maxPlayers, players },
  };
}

export default function DesignReview({ state }: { state: string }) {
  const focus = useRef<HTMLButtonElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [entryStatus, setEntryStatus] = useState<"editing" | "pending" | "error">("editing");
  const params = new URLSearchParams(location.search);
  const seatTypographyProof = params.get("seat-typeface") === "regular" ? <style>{`
    @font-face { font-family:"Review Seat Regular"; src:url("/art/source/fonts/web-v3/LXGWWenKai-Regular.ttf") format("truetype"); font-weight:400; font-display:block; unicode-range:U+2E80-9FFF,U+F900-FAFF; }
    @font-face { font-family:"Review Seat Latin"; src:url("/art/source/fonts/web-v3/Tinos-Regular.ttf") format("truetype"); font-weight:400; font-display:block; unicode-range:U+0020-007E; }
    .v3-match .player-seat.player-seat--source > strong,
    .v3-match .player-seat--source .player-seat__stats { font-family:"Review Seat Latin","Review Seat Regular","Noto Serif SC",serif; font-weight:400; }
  `}</style> : null;
  const requestedHand = Number(params.get("hand") ?? "4");
  const handCount = Number.isInteger(requestedHand) && requestedHand >= 1 && requestedHand <= 8 ? requestedHand : 4;
  const requestedTrickCount = Number(params.get("trick-count") ?? "4");
  const trickCount = Number.isInteger(requestedTrickCount) && requestedTrickCount >= 0 && requestedTrickCount <= 6 ? requestedTrickCount : 4;
  const requestedSuit = params.get("suit");
  const trump = requestedSuit === "none" ? null : requestedSuit === "leaf" || requestedSuit === "mountain" || requestedSuit === "knot" ? requestedSuit : "sun";
  const requestedTypeface = params.get("typeface");
  const typeface = requestedTypeface === "kai" || requestedTypeface === "wenkai" || requestedTypeface === "zhenkai" || requestedTypeface === "noto" ? requestedTypeface : "runtime";
  const proofFamily = typeface === "wenkai" ? '"Review WenKai"' : typeface === "zhenkai" ? '"Review ZhenKai"' : typeface === "kai" ? '"KaiTi"' : '"Noto Serif SC"';
  const typographyProof = typeface === "runtime" ? null : <style>{`
    @font-face { font-family:"Review WenKai"; src:url("${wenkaiProof}") format("truetype"); font-weight:500; font-display:block; }
    @font-face { font-family:"Review ZhenKai"; src:url("${zhenkaiProof}") format("truetype"); font-weight:700; font-display:block; }
    [data-review-typeface="${typeface}"] .v3-rules-body h3,
    [data-review-typeface="${typeface}"] .v3-rules-body p,
    [data-review-typeface="${typeface}"] .v3-rules-body li,
    [data-review-typeface="${typeface}"] .v3-results-player > span,
    [data-review-typeface="${typeface}"] .v3-results-title,
    [data-review-typeface="${typeface}"] .v3-ranking-subtitle,
    [data-review-typeface="${typeface}"] .v3-results-note,
    [data-review-typeface="${typeface}"] .v3-results-primary,
    [data-review-typeface="${typeface}"] .v3-results-secondary,
    [data-review-typeface="${typeface}"] .v3-lobby-title,
    [data-review-typeface="${typeface}"] .v3-lobby-seat,
    [data-review-typeface="${typeface}"] .v3-lobby-connection,
    [data-review-typeface="${typeface}"] .v3-lobby-status,
    [data-review-typeface="${typeface}"] .v3-lobby-status button,
    [data-review-typeface="${typeface}"] .v3-lobby-ready,
    [data-review-typeface="${typeface}"] .v3-lobby-start { font-family:${proofFamily},serif; font-weight:700; font-synthesis:weight; }
    ${typeface === "wenkai" && params.get("weight") === "500" ? '[data-review-typeface="wenkai"] .v3-rules-body p,[data-review-typeface="wenkai"] .v3-rules-body li {font-weight:500;font-synthesis:none;}' : ''}
    ${typeface === "wenkai" && params.get("weight") === "500" ? '[data-review-typeface="wenkai"] .v3-lobby-seat strong,[data-review-typeface="wenkai"] .v3-lobby-seat-state {font-weight:500;font-synthesis:none;}' : ''}
  `}</style>;
  if (state === "tab-protection") return <main className="game-prototype" data-reduced-motion="true" aria-label="设计验收样例，不连接房间服务">
    <WebHome roomEntryDisabled onCreateRoom={ignore} onJoinRoom={ignore} onPractice={ignore} onRules={ignore} rulesButtonRef={focus} />
  </main>;
  if (["create", "join", "connecting", "connection-error"].includes(state)) return <main className="game-prototype" data-reduced-motion="true" aria-label="设计验收样例，不连接房间服务">
    <RoomEntry mode={state === "create" ? "create" : "join"} pending={entryStatus === "pending"} error={entryStatus === "error" ? "设计验收连接失败样例" : null}
      onBack={ignore} onEditConnection={() => setEntryStatus("editing")}
      onSubmit={() => setEntryStatus(state === "connection-error" ? "error" : state === "connecting" ? "pending" : "editing")} />
  </main>;
  if (state === "reconnecting" || state === "session-ended") return <main className="game-prototype" data-reduced-motion="true" data-room-recovery="true" data-review-typeface={typeface} aria-label="设计验收样例，不连接房间服务">{typographyProof}
    <div className="screen-layer" inert aria-hidden="true"><MatchScreen controller={{ ...reviewMatchController("trick-play"), connection: state === "session-ended" ? "disconnected" : "reconnecting" }} showLegalHints={false} onExit={ignore} /></div>
    <RecoveryDialog terminal={state === "session-ended"} onRetry={ignore} onHome={ignore} />
  </main>;
  const requestedPlayers = Number(params.get("players") ?? "6");
  const finalRoundReview=params.get('result-state')==='final-round';
  const resultScoreRows=finalRoundReview?[[2,2,40,180],[3,1,-20,150],[1,2,-10,120],[1,1,30,100],[0,0,20,80],[1,2,-10,60]]:scoreRows;
  const playerCount = Number.isInteger(requestedPlayers) ? Math.min(6, Math.max(3, requestedPlayers)) : 6;
  const countTotals=params.get('ranking-data')==='negative-six'&&playerCount===6?[-10,-10,-30,-30,-60,-80]:params.get('ranking-data')==='counts'?({3:[60,-10,-30],4:[120,80,80,-20],5:[120,80,80,0,-30]}as Record<number,number[]>)[playerCount]:undefined;
  const nameCases:Record<string,string>={'wide-latin':'WWWWWWWWWWWWWWWW','narrow-latin':'iiiiiiiiiiiiiiii','mixed-wide':'茶WM漢éЖWＭ笙亭WWW雨W','long-max':'竹下听雨的第十二位茶客甲乙丙丁戊',long:'竹下听雨的第十二位茶客',rare:'漢笙亭茶客'};
  const players: MatchPlayerState[] = resultScoreRows.slice(0, playerCount).map(([bid, tricksWon, roundScore, totalScore], index) => ({
    bid, tricksWon, roundScore, totalScore: countTotals?.[index]??(state === "ranking" ? [180,150,120,100,80,60][index] : totalScore),
    id: `design-${index}`, name: params.get('label')==='all-max'?`竹下听雨的第十二位茶客甲乙丙丁${['一','二','三','四','五','六'][index]}`:params.get('label')==='all-long'?['竹下听雨的第一位茶客','云外听松的第二位茶客','花间品茗的第三位茶客','墨里藏香的第四位茶客','星河煮茶的第五位茶客','山中归来的第六位茶客'][index]:index===0?nameCases[params.get('label')??'']??names[index]:names[index], avatarKey: avatars[index], isHuman: index < 5, seatIndex: index,
  }));
  if (["gameplay", "bid", "chooser"].includes(state)) return <main className="game-prototype" data-reduced-motion="true" data-review-typeface={typeface} aria-label="设计验收样例，不连接房间服务">{typographyProof}
    {seatTypographyProof}<MatchScreen controller={{ ...reviewMatchController(state === "bid" ? "bid" : state === "chooser" ? "trump-select" : "trick-play", handCount, params.get("timer") !== "off", trump, trickCount), pendingIntent: params.get("pending") === "1" || submitted, sendIntent: params.get("pending") === "on-submit" ? () => setSubmitted(true) : ignore }} showLegalHints={false} onExit={ignore} />
  </main>;
  return <main className="game-prototype" data-reduced-motion="true" data-review-typeface={typeface} aria-label="设计验收样例，不连接房间服务">{typographyProof}
    {state === "lobby" ? <WebLobby controller={{ state: lobbyLayoutSample(params), pendingCommand: null, setAiCount: refuse, setReady: refuse, startRoom: refuse }} fillAi={true} onManualAi={ignore} onExit={ignore} onInvite={ignore} /> : state === "confirm" ? <LeaveDialog pending={false} error={null} onCancel={ignore} onConfirm={ignore} /> : state === "rules" ? <WebRules onClose={ignore} returnFocusRef={focus} preferences={defaultWebPreferences} onPreferences={ignore} /> : <div className="screen-stage">
      <WebResults isMatchEnd={state === "ranking"} isFinalRound={finalRoundReview} mode={params.get('mode')==='classic'?'classic':'quick'} onContinue={ignore} onRestart={ignore} onExit={ignore} players={players} roundNumber={state==='ranking'?getRoundHandCounts(playerCount as 3|4|5|6,params.get('mode')==='classic'?'classic':'quick').length:finalRoundReview?8:4} network={params.has("network")} canRestart={params.get("network") !== "guest"} nameAccess={params.get('name-access')==='list'?'list':'auto'}/>
    </div>}
  </main>;
}
