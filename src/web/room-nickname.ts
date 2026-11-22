const key = "wizzard.web.nickname.v1";
let lastName = "";
let storageWriteFailed = false;
const guestNames = ["茶客听雨", "竹下闲客", "月下煮茶", "灯下听风", "青山茶客", "松间来客", "花间问茶", "云归小馆"];

function validName(value: string | null): string {
  const name = value?.trim() ?? "";
  return name.length <= 16 && !/[\u0000-\u001f\u007f]/.test(name) ? name : "";
}

export function rememberedNickname(): string {
  if (storageWriteFailed) return lastName;
  try { return validName(localStorage.getItem(key)) || lastName; }
  catch { return lastName; }
}

export function initialRoomNickname(): string {
  return rememberedNickname() || guestNames[Math.floor(Math.random() * guestNames.length)];
}

export function rememberRoomNickname(value: string): void {
  const name = validName(value);
  if (!name) return;
  lastName = name;
  try {
    localStorage.setItem(key, name);
    storageWriteFailed = false;
  } catch {
    storageWriteFailed = true;
  }
}
