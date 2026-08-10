export type FriendRoomEntryMode = "create" | "home" | "join" | "rules";

export function reconcileFriendRoomEntryMode(
  currentMode: FriendRoomEntryMode,
  hasActiveRoom: boolean,
): FriendRoomEntryMode {
  return hasActiveRoom ? "home" : currentMode;
}
