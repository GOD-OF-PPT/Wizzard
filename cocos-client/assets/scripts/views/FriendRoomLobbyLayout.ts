export type FriendRoomLobbyRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export type FriendRoomLobbyPlayerCount = 3 | 4 | 5 | 6;

export const FRIEND_ROOM_LOBBY_SEAT_POSITIONS = [
  [-741, -11],
  [-432, 253],
  [7, 383],
  [444, 311],
  [734, 19],
  [9, -205],
] as const satisfies readonly (readonly [number, number])[];

export const FRIEND_ROOM_LOBBY_SLOT_MAPS = {
  3: [1, 2, 3],
  4: [1, 2, 3, 0],
  5: [1, 2, 3, 0, 4],
  6: [1, 2, 3, 0, 4, 5],
} as const satisfies Readonly<
  Record<FriendRoomLobbyPlayerCount, readonly number[]>
>;

export const FRIEND_ROOM_LOBBY_LAYOUT = {
  designViewport: { height: 1080, width: 1920, x: 0, y: 0 },
  aiAddButton: { height: 64, width: 192, x: -607, y: -386 },
  aiAddTouch: { height: 120, width: 192, x: -607, y: -386 },
  aiRemoveButton: { height: 64, width: 154, x: -792, y: -386 },
  aiRemoveTouch: { height: 120, width: 154, x: -792, y: -386 },
  aiAddSeatBadge: { height: 148, width: (148 * 215) / 169, x: 0, y: 34 },
  aiAddSeatTouch: { height: 240, width: 250, x: 9, y: -205 },
  inviteButton: { height: 125, width: 300, x: 420, y: -245 },
  leaveDialog: {
    body: { height: 108, width: 650, x: 0, y: 18 },
    cancelButton: { height: 100, width: 240, x: -170, y: -128 },
    confirmButton: { height: 100, width: 300, x: 170, y: -128 },
    panel: { height: 440, width: 820, x: 0, y: 0 },
    title: { height: 64, width: 500, x: 0, y: 126 },
  },
  notice: { height: 96, width: 680, x: 0, y: 40 },
  occupiedSeatStatus: { height: 70, width: 250, x: 0, y: -78 },
  readyButton: { height: 120, width: 300, x: 420, y: -430 },
  readyButtonGreenVisual: { height: 100, width: 300, x: 420, y: -430 },
  readyButtonPaperVisual: { height: 100, width: 240, x: 420, y: -430 },
  readyCount: { height: 75.6, width: 270, x: 740, y: -460 },
  returnHome: { height: 90, width: 216, x: -810, y: 250 },
  returnHomeTouch: { height: 120, width: 216, x: -810, y: 250 },
  roomModeLabel: { height: 46, width: 300, x: 0, y: -28 },
  roomTitle: { height: 150, width: 340, x: -760, y: 410 },
  roomTitleLabel: { height: 54, width: 300, x: 0, y: 28 },
  seat: { height: 254, width: 286, x: 0, y: 0 },
  settings: { height: 300, width: 486, x: -690, y: -338 },
  settingsStatus: { height: 36, width: 356, x: 0, y: 38 },
  settingsTitle: { height: 48, width: 340, x: 0, y: 98 },
  startButton: { height: 287, width: 300, x: 740, y: -260 },
} as const;

export function getFriendRoomLobbySeatRect(
  slot: number,
): FriendRoomLobbyRect {
  const position = FRIEND_ROOM_LOBBY_SEAT_POSITIONS[slot];
  if (!position) {
    throw new Error(`FRIEND_ROOM_LOBBY_SLOT_INVALID:${slot}`);
  }

  return {
    ...FRIEND_ROOM_LOBBY_LAYOUT.seat,
    x: position[0],
    y: position[1],
  };
}
