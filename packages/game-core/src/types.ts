export const SUITS = ["mountain", "knot", "leaf", "sun"] as const;

export type Suit = (typeof SUITS)[number];
export type GameMode = "classic" | "quick";
export type PlayerCount = 3 | 4 | 5 | 6;

export type NumberCard = {
  id: string;
  kind: "number";
  rank: number;
  suit: Suit;
};

export type HighestCard = {
  id: string;
  kind: "highest";
};

export type LowestCard = {
  id: string;
  kind: "lowest";
};

export type Card = NumberCard | HighestCard | LowestCard;

export type PlayedCard = {
  card: Card;
  playerId: string;
};

export type TrumpResolution =
  | { kind: "fixed"; trump: Suit | null }
  | { choices: readonly Suit[]; kind: "dealer-choice" };
