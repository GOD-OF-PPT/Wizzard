import type { AvatarKey } from "../game-assets";
import bambooCat from "../../art/runtime/web-v3/avatars/bamboo-cat.png";
import crane from "../../art/runtime/web-v3/avatars/wandering-crane.png";
import fox from "../../art/runtime/web-v3/avatars/flower-fox.png";
import panda from "../../art/runtime/web-v3/avatars/ink-panda.png";
import starCat from "../../art/runtime/web-v3/avatars/sleepy-star-cat.png";
import traveler from "../../art/runtime/web-v3/avatars/masked-traveler.png";
import lobbyTraveler from "../../art/runtime/web-v3/avatars/lobby-masked-traveler-v1.png";

// The browser's selected v3 references use this portrait treatment. Keep it
// separate from the versioned Mini Game expression atlas and its asset keys.
export const webAvatars: Record<AvatarKey, string> = {
  "bamboo-cat": bambooCat,
  "wandering-crane": crane,
  "flower-fox": fox,
  "ink-panda": panda,
  "sleepy-star-cat": starCat,
  "masked-traveler": traveler,
};

export function webAvatar(key: string): string {
  return webAvatars[key as AvatarKey] ?? traveler;
}

// The selected lobby reference authors this animal traveler; the ranking
// illustration uses a different portrait. Do not substitute a human in lobby QA.
export function webLobbyAvatar(key: string): string {
  return key === "masked-traveler" ? lobbyTraveler : webAvatar(key);
}
