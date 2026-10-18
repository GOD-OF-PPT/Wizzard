/** DEV-only visual benchmark. The mock's aggregate scores are illustrative,
 * not a legal replay or game authority. Real play always uses game-core. */
import type { Card, MatchPhase, PlayerMatchSnapshot, Suit } from "@wizzard/game-core/contracts";
import type { LocalMatchController } from "../hooks/useLocalMatch";

const names = ["青竹客", "云游鹤", "花间狐", "墨隐熊", "星眠猫", "AI旅人"];
const avatars = ["bamboo-cat", "wandering-crane", "flower-fox", "ink-panda", "sleepy-star-cat", "masked-traveler"];
const bids = [1, 3, 1, 2, 0, 1], won = [2, 2, 1, 1, 0, 1];
const referenceHand: Card[] = [
  { id: "review-leaf-5", kind: "number", suit: "leaf", rank: 5 },
  { id: "review-mountain-8", kind: "number", suit: "mountain", rank: 8 },
  { id: "review-knot-2", kind: "number", suit: "knot", rank: 2 },
  { id: "review-sun-6", kind: "number", suit: "sun", rank: 6 },
  { id: "review-leaf-11", kind: "number", suit: "leaf", rank: 11 },
  { id: "review-mountain-12", kind: "number", suit: "mountain", rank: 12 },
  { id: "review-highest", kind: "highest" },
  { id: "review-lowest", kind: "lowest" },
];
const table: Card[] = [
  { id: "review-leaf-7", kind: "number", suit: "leaf", rank: 7 },
  { id: "review-knot-3", kind: "number", suit: "knot", rank: 3 },
  { id: "review-sun-1", kind: "number", suit: "sun", rank: 1 },
  { id: "review-mountain-9", kind: "number", suit: "mountain", rank: 9 },
];

export function reviewMatchController(phase: MatchPhase, handCount = 4, timer = true, trump: Suit = "sun"): LocalMatchController {
  const hand = referenceHand.slice(0, handCount);
  const snapshot: PlayerMatchSnapshot = {
    privateState: { hand, legalCardIds: ["review-leaf-5", "review-leaf-11", "review-highest", "review-lowest"].filter(id => hand.some(card => card.id === id)), playerId: "review-player-0" },
    publicState: {
      completedTrick: null, currentPlayerId: "review-player-0", dealerIndex: 0,
      handSize: handCount, matchId: "design-gameplay-only", mode: "quick", phase,
      players: names.map((name, index) => ({
        avatarKey: avatars[index], bid: bids[index], tricksWon: won[index], id: `review-player-${index}`,
        isHuman: index === 0, name, roundScore: null, seatIndex: index, totalScore: 0,
      })),
      revealedCard: null, roundHandCounts: [1, 2, 3, 4, 5, 6, 7, 8], roundIndex: handCount - 1,
      scoreEntries: [], trump, version: 1,
      handCounts: Object.fromEntries(names.map((_, index) => [`review-player-${index}`, handCount])),
      trick: { leaderId: "review-player-1", number: 1, plays: phase === "trick-play" ? table.map((card, index) => ({ card, playerId: `review-player-${index + 1}` })) : [] },
    },
  };
  return { snapshot, advance: () => undefined, restart: () => undefined, sendIntent: () => undefined,
    connection: timer ? "local" : "connected", events: [], humanPlayerId: "review-player-0", turnSecondsRemaining: timer ? 28 : null };
}
