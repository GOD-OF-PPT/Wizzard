import lobby01 from "../../../art/runtime/audio/teahouse-bgm-v1/lobby-01.mp3";
import lobby02 from "../../../art/runtime/audio/teahouse-bgm-v1/lobby-02.mp3";
import gameplay from "../../../art/runtime/audio/teahouse-bgm-v1/gameplay-v1.mp3";

export type MusicScene = "lobby" | "gameplay";
export type MusicTrack = { id: string; url: string };
export const musicTracks: { lobby: readonly MusicTrack[]; gameplay: MusicTrack } = {
  lobby: [{ id: "lobby-01", url: lobby01 }, { id: "lobby-02", url: lobby02 }],
  gameplay: { id: "gameplay-v1", url: gameplay },
};
