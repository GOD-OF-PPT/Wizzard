export type RandomSource = () => number;

export type DealResult<T> = {
  hands: Record<string, T[]>;
  remainder: T[];
};

export function shuffleCards<T>(
  cards: readonly T[],
  random: RandomSource,
): T[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function dealCards<T>(
  cards: readonly T[],
  seatIds: readonly string[],
  handSize: number,
): DealResult<T> {
  if (cards.length < seatIds.length * handSize) {
    throw new Error("DECK_TOO_SMALL");
  }

  const hands = Object.fromEntries(
    seatIds.map((seatId) => [seatId, [] as T[]]),
  ) as Record<string, T[]>;
  let cursor = 0;

  for (let cardNumber = 0; cardNumber < handSize; cardNumber += 1) {
    for (const seatId of seatIds) {
      hands[seatId].push(cards[cursor]);
      cursor += 1;
    }
  }

  return {
    hands,
    remainder: cards.slice(cursor),
  };
}
