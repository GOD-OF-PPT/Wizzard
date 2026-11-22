// Art slot IDs are not ordered around the table. Both aspect ratios use the
// same clockwise ring from the local seat: 0 → 5 → 1 → 2 → 3 → 4.
const clockwiseSlots: Record<number, readonly number[]> = {
  3: [0, 1, 4],
  4: [0, 5, 2, 4],
  5: [0, 5, 1, 3, 4],
  6: [0, 5, 1, 2, 3, 4],
};

export function tableSlotForSeat(count: number, localSeat: number, seat: number): number {
  return clockwiseSlots[count][(seat - localSeat + count) % count];
}
