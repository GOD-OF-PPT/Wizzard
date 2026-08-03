import { describe, expect, it } from "vitest";

import {
  getLeadSuit,
  getLegalCards,
  resolveTrickWinner,
} from "@wizzard/game-core";
import type {
  Card,
  PlayedCard,
} from "@wizzard/game-core/contracts";

describe("getLeadSuit", () => {
  it("uses the first ordinary card as the lead suit", () => {
    const plays: PlayedCard[] = [
      {
        card: { id: "leaf-7", kind: "number", rank: 7, suit: "leaf" },
        playerId: "player-1",
      },
    ];

    expect(getLeadSuit(plays)).toBe("leaf");
  });

  it("does not let a lowest card establish the lead suit", () => {
    const plays: PlayedCard[] = [
      { card: { id: "lowest-1", kind: "lowest" }, playerId: "player-1" },
      {
        card: { id: "sun-4", kind: "number", rank: 4, suit: "sun" },
        playerId: "player-2",
      },
    ];

    expect(getLeadSuit(plays)).toBe("sun");
  });
});

describe("getLegalCards", () => {
  it("always allows highest and lowest cards", () => {
    const hand: Card[] = [
      { id: "highest-1", kind: "highest" },
      { id: "lowest-1", kind: "lowest" },
    ];
    const plays: PlayedCard[] = [
      {
        card: {
          id: "mountain-3",
          kind: "number",
          rank: 3,
          suit: "mountain",
        },
        playerId: "player-1",
      },
    ];

    expect(getLegalCards(hand, plays)).toEqual(hand);
  });

  it("requires ordinary cards to follow suit when the hand can", () => {
    const matchingCard: Card = {
      id: "mountain-9",
      kind: "number",
      rank: 9,
      suit: "mountain",
    };
    const highestCard: Card = { id: "highest-1", kind: "highest" };
    const hand: Card[] = [
      { id: "leaf-6", kind: "number", rank: 6, suit: "leaf" },
      matchingCard,
      highestCard,
    ];
    const plays: PlayedCard[] = [
      {
        card: {
          id: "mountain-3",
          kind: "number",
          rank: 3,
          suit: "mountain",
        },
        playerId: "player-1",
      },
    ];

    expect(getLegalCards(hand, plays)).toEqual([matchingCard, highestCard]);
  });

  it("allows any card when the hand cannot follow the lead suit", () => {
    const hand: Card[] = [
      { id: "leaf-6", kind: "number", rank: 6, suit: "leaf" },
      { id: "sun-8", kind: "number", rank: 8, suit: "sun" },
    ];
    const plays: PlayedCard[] = [
      {
        card: {
          id: "mountain-3",
          kind: "number",
          rank: 3,
          suit: "mountain",
        },
        playerId: "player-1",
      },
    ];

    expect(getLegalCards(hand, plays)).toEqual(hand);
  });

  it("allows any card after a highest-card lead locks the trick", () => {
    const hand: Card[] = [
      { id: "mountain-6", kind: "number", rank: 6, suit: "mountain" },
      { id: "leaf-8", kind: "number", rank: 8, suit: "leaf" },
    ];
    const plays: PlayedCard[] = [
      { card: { id: "highest-1", kind: "highest" }, playerId: "player-1" },
      {
        card: {
          id: "mountain-3",
          kind: "number",
          rank: 3,
          suit: "mountain",
        },
        playerId: "player-2",
      },
    ];

    expect(getLegalCards(hand, plays)).toEqual(hand);
  });
});

describe("resolveTrickWinner", () => {
  it("locks a highest-card leader as the winner immediately", () => {
    const leadingPlay: PlayedCard = {
      card: { id: "highest-1", kind: "highest" },
      playerId: "player-1",
    };

    expect(resolveTrickWinner([leadingPlay], null)).toBe(leadingPlay);
  });

  it("awards the trick to the first highest card played", () => {
    const firstHighestPlay: PlayedCard = {
      card: { id: "highest-1", kind: "highest" },
      playerId: "player-2",
    };
    const plays: PlayedCard[] = [
      {
        card: { id: "knot-11", kind: "number", rank: 11, suit: "knot" },
        playerId: "player-1",
      },
      firstHighestPlay,
      { card: { id: "highest-2", kind: "highest" }, playerId: "player-3" },
    ];

    expect(resolveTrickWinner(plays, "knot")).toBe(firstHighestPlay);
  });

  it("awards the trick to the highest-ranked trump card", () => {
    const winningPlay: PlayedCard = {
      card: { id: "sun-11", kind: "number", rank: 11, suit: "sun" },
      playerId: "player-3",
    };
    const plays: PlayedCard[] = [
      {
        card: { id: "leaf-13", kind: "number", rank: 13, suit: "leaf" },
        playerId: "player-1",
      },
      {
        card: { id: "sun-2", kind: "number", rank: 2, suit: "sun" },
        playerId: "player-2",
      },
      winningPlay,
      { card: { id: "lowest-1", kind: "lowest" }, playerId: "player-4" },
    ];

    expect(resolveTrickWinner(plays, "sun")).toBe(winningPlay);
  });

  it("otherwise awards the trick to the highest-ranked lead-suit card", () => {
    const winningPlay: PlayedCard = {
      card: { id: "leaf-9", kind: "number", rank: 9, suit: "leaf" },
      playerId: "player-3",
    };
    const plays: PlayedCard[] = [
      { card: { id: "lowest-1", kind: "lowest" }, playerId: "player-1" },
      {
        card: { id: "leaf-3", kind: "number", rank: 3, suit: "leaf" },
        playerId: "player-2",
      },
      winningPlay,
      {
        card: { id: "sun-13", kind: "number", rank: 13, suit: "sun" },
        playerId: "player-4",
      },
    ];

    expect(resolveTrickWinner(plays, null)).toBe(winningPlay);
  });

  it("awards an all-lowest trick to the first card played", () => {
    const firstPlay: PlayedCard = {
      card: { id: "lowest-1", kind: "lowest" },
      playerId: "player-1",
    };
    const plays: PlayedCard[] = [
      firstPlay,
      { card: { id: "lowest-2", kind: "lowest" }, playerId: "player-2" },
      { card: { id: "lowest-3", kind: "lowest" }, playerId: "player-3" },
    ];

    expect(resolveTrickWinner(plays, "mountain")).toBe(firstPlay);
  });
});
