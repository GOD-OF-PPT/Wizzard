import type { AvatarKey } from "../game-assets";
import bambooCat from "../../art/runtime/web-v3/avatars/bamboo-cat.png";
import crane from "../../art/runtime/web-v3/avatars/wandering-crane.png";
import fox from "../../art/runtime/web-v3/avatars/flower-fox.png";
import panda from "../../art/runtime/web-v3/avatars/ink-panda.png";
import starCat from "../../art/runtime/web-v3/avatars/sleepy-star-cat.png";
import traveler from "../../art/runtime/web-v3/avatars/masked-traveler.png";
import lobbyTraveler from "../../art/runtime/web-v3/avatars/lobby-masked-traveler-v1.png";
import gameplayTraveler from "../../art/runtime/web-v3/avatars/gameplay-masked-traveler-v1.png";
import gameplayStarCat from "../../art/runtime/web-v3/avatars/gameplay-sleepy-cat-v1.png";
import lobbyCat from "../../art/runtime/web-v3/avatars/lobby-bamboo-cat-v2.png";
import lobbyCrane from "../../art/runtime/web-v3/avatars/lobby-wandering-crane-v2.png";
import lobbyFox from "../../art/runtime/web-v3/avatars/lobby-flower-fox-v2.png";
import lobbyPanda from "../../art/runtime/web-v3/avatars/lobby-ink-panda-v2.png";

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
  if (key === "bamboo-cat") return lobbyCat;
  if (key === "wandering-crane") return lobbyCrane;
  if (key === "flower-fox") return lobbyFox;
  if (key === "ink-panda") return lobbyPanda;
  return key === "masked-traveler" ? lobbyTraveler : webAvatar(key);
}

// The round/results masters use the same small-eyed, half-body cat/crane/fox/
// panda portraits as the lobby. Keep their framing instead of ranking-closeups;
// the human traveler and sleepy cat retain their separate authored identities.
export function webResultsAvatar(key: string): string {
  return key === "masked-traveler" || key === "sleepy-star-cat" ? webAvatar(key) : webLobbyAvatar(key);
}

export function webGameplayAvatar(key: string): string {
  if (key === "sleepy-star-cat") return gameplayStarCat;
  return key === "masked-traveler" ? gameplayTraveler : webLobbyAvatar(key);
}
