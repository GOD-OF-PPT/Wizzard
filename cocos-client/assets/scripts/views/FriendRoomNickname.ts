const NICKNAME_TONES = [
  "青",
  "流",
  "皎",
  "清",
  "闲",
  "远",
  "轻",
  "暖",
  "烟",
  "晚",
  "墨",
  "霜",
] as const;

const NICKNAME_MOTIFS = [
  "竹",
  "萤",
  "月",
  "松",
  "云",
  "星",
  "鸢",
  "茶",
  "雨",
  "灯",
  "羽",
  "叶",
] as const;

const NICKNAME_SUFFIXES = [
  "茶客",
  "旅人",
  "术士",
  "棋友",
  "听风",
  "掌灯",
  "拾花",
  "观星",
  "醉月",
  "藏书",
  "问月",
  "行舟",
] as const;

function pick<T>(values: readonly T[], random: () => number): T {
  const index = Math.min(
    values.length - 1,
    Math.max(0, Math.floor(random() * values.length)),
  );
  return values[index];
}

export function generateRandomFriendRoomNickname(
  random: () => number = Math.random,
): string {
  const tone = pick(NICKNAME_TONES, random);
  const motif = pick(NICKNAME_MOTIFS, random);
  const suffix = pick(NICKNAME_SUFFIXES, random);
  return `${tone}${motif}${suffix}`;
}
