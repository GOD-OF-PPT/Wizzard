import type { AssetKey } from "../assets/AssetAddresses.generated";

export type FriendRoomDialogMode = "create" | "join";

export type FriendRoomDialogRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

type FriendRoomDialogArtRect = FriendRoomDialogRect &
  Readonly<{
    assetKey: AssetKey;
    sliced: false;
  }>;

export type FriendRoomDialogLayout = Readonly<{
  actions: FriendRoomDialogRect;
  aiFill?: FriendRoomDialogArtRect;
  avatars: FriendRoomDialogRect;
  mode?: FriendRoomDialogRect;
  name: FriendRoomDialogArtRect;
  panel: FriendRoomDialogArtRect;
  roomCode?: FriendRoomDialogArtRect;
  safeArea: FriendRoomDialogRect;
  seats?: FriendRoomDialogRect;
  title: FriendRoomDialogRect;
}>;

export const FRIEND_ROOM_CREATE_OPTION_TOUCHES = {
  aiFill: { height: 76, width: 250, x: -75, y: -92 },
  noTurnTimer: { height: 76, width: 250, x: 195, y: -92 },
} as const satisfies Readonly<Record<string, FriendRoomDialogRect>>;

export const FRIEND_ROOM_DIALOG_LAYOUT: Readonly<
  Record<FriendRoomDialogMode, FriendRoomDialogLayout>
> = {
  create: {
    actions: { height: 112, width: 620, x: 26, y: -294 },
    aiFill: {
      assetKey: "ui.friendRoom.row.ai.v2",
      height: 76,
      sliced: false,
      width: 540,
      x: 60,
      y: -92,
    },
    avatars: { height: 116, width: 756, x: 60, y: 200 },
    mode: { height: 88, width: 700, x: 60, y: -184 },
    name: {
      assetKey: "ui.friendRoom.row.input.v2",
      height: 76,
      sliced: false,
      width: 700,
      x: 60,
      y: 92,
    },
    panel: {
      assetKey: "ui.friendRoom.panel.create.v2",
      height: 860,
      sliced: false,
      width: 1200,
      x: 0,
      y: -10,
    },
    safeArea: { height: 696, width: 1036, x: 0, y: -10 },
    seats: { height: 88, width: 700, x: 60, y: 0 },
    title: { height: 56, width: 620, x: 0, y: 294 },
  },
  join: {
    actions: { height: 112, width: 620, x: 26, y: -216 },
    avatars: { height: 116, width: 756, x: 60, y: 112 },
    name: {
      assetKey: "ui.friendRoom.row.input.v2",
      height: 76,
      sliced: false,
      width: 700,
      x: 60,
      y: -10,
    },
    panel: {
      assetKey: "ui.friendRoom.panel.join.v2",
      height: 650,
      sliced: false,
      width: 1060,
      x: 0,
      y: -10,
    },
    safeArea: { height: 528, width: 926, x: 0, y: -10 },
    roomCode: {
      assetKey: "ui.friendRoom.row.code.v2",
      height: 82,
      sliced: false,
      width: 700,
      x: 60,
      y: -104,
    },
    title: { height: 56, width: 620, x: 0, y: 206 },
  },
};
