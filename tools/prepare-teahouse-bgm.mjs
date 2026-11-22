import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const sourceRoot = "art/source/audio/teahouse-bgm-v1";
const runtimeRoot = "art/runtime/audio/teahouse-bgm-v1";
mkdirSync(runtimeRoot, { recursive: true });
const sha256 = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const probe = path => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=codec_name,sample_rate,channels", "-of", "json", path], { encoding: "utf8" }));
// spawnSync retains successful stderr without printing the entire FFmpeg log.
function measure(path) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", path, "-af", "loudnorm=I=-23:TP=-3:LRA=11:print_format=json", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 2e6 });
  if (result.error || result.status !== 0) throw new Error(`Cannot measure ${path}: ${result.error ?? result.stderr}`);
  const match = result.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
  if (!match) throw new Error(`Missing loudness report: ${path}`);
  const value = JSON.parse(match[0]);
  if (!Number.isFinite(Number(value.input_i))) throw new Error(`Silent input: ${path}`);
  return value;
}
const tracks = [];
for (const [id, scene, filename] of [
  ["lobby-01", "lobby", "lobby-01.mp3"],
  ["lobby-02", "lobby", "lobby-02.mp3"],
  ["gameplay-v1", "gameplay", "gameplay-v1.mp3"],
]) {
  const source = `${sourceRoot}/${filename}`;
  const runtime = `${runtimeRoot}/${filename}`;
  const metadata = probe(source);
  const duration = Number(metadata.format.duration);
  const measured = measure(source);
  const filter = [
    `loudnorm=I=-23:TP=-3:LRA=11:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`,
    "afade=t=in:d=0.45", `afade=t=out:st=${Math.max(0, duration - 1.2)}:d=1.2`,
  ].join(",");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", source, "-vn", "-af", filter, "-ac", "2", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "128k", "-map_metadata", "-1", runtime], { stdio: "pipe" });
  const output = measure(runtime);
  if (Number(output.input_tp) > -2) throw new Error(`Unexpected output peak: ${runtime}`);
  tracks.push({ id, scene, source, sourceSha256: sha256(source), sourceBytes: statSync(source).size,
    sourceDurationSeconds: duration, sourceLoudness: measured, runtime, sha256: sha256(runtime), bytes: statSync(runtime).size,
    output: probe(runtime), outputLoudness: output });
}
const manifest = {
  version: 1, theme: "enchanted-teahouse", source: "User-supplied music; original files preserved", tracks,
  processing: { targetLufs: -23, peakCeilingDbtp: -3, bitrate: 128000, channels: 2, sampleRate: 44100, fadeInSeconds: 0.45, fadeOutSeconds: 1.2, trims: false },
  playback: { lobby: "Random first track, then random choice excluding the previous track; home/entry/lobby share one uninterrupted playlist", gameplay: "One looping track for practice and network matches, including results", volume: 0.35, transitionFadeOutMs: 180, fadeInMs: 600, maxMusicElements: 1, preference: "soundEnabled", hidden: "Pause, preserve position, and wait for the next trusted gesture before resuming" },
};
writeFileSync("art/music-manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(tracks.map(track => ({ id: track.id, duration: track.output.format.duration, bytes: track.bytes, lufs: track.outputLoudness.input_i, peak: track.outputLoudness.input_tp }))));
