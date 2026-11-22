import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameMusicPlayer } from "./music";

let paused: WeakMap<HTMLMediaElement, boolean>;
const players: GameMusicPlayer[] = [];
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const element = () => document.querySelector<HTMLAudioElement>("audio[data-game-music]")!;
function create(random = () => 0) {
  const player = new GameMusicPlayer(random);
  players.push(player);
  return player;
}

beforeEach(() => {
  vi.useFakeTimers();
  paused = new WeakMap();
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(function (this: HTMLMediaElement) { return paused.get(this) ?? true; });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) { paused.set(this, false); return Promise.resolve(); });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) { paused.set(this, true); });
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(function (this: HTMLMediaElement) { this.currentTime = 0; });
});
afterEach(() => {
  for (const player of players.splice(0)) player.dispose();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("streamed game music", () => {
  it("waits for a gesture, randomly selects either lobby track, and keeps the song across lobby redraws", async () => {
    const player = create(() => 0.99);
    player.setScene("lobby");
    expect(element()).toBeNull();
    player.unlock(); await settle(); await vi.advanceTimersByTimeAsync(600);
    const audio = element();
    expect(audio.dataset.trackId).toBe("lobby-02");
    expect(audio.volume).toBeCloseTo(0.35);
    audio.currentTime = 31;
    player.setScene("lobby"); player.unlock();
    expect(element()).toBe(audio);
    expect(audio.currentTime).toBe(31);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    player.dispose();
    const other = create(() => 0);
    other.setScene("lobby"); other.unlock(); await settle();
    expect(element().dataset.trackId).toBe("lobby-01");
  });

  it("advances the two-song lobby playlist without immediate repeats and loops the dedicated game song", async () => {
    const player = create(); player.setScene("lobby"); player.unlock(); await settle();
    const audio = element();
    paused.set(audio, true); audio.dispatchEvent(new Event("ended")); await settle();
    expect(audio.dataset.trackId).toBe("lobby-02");
    expect(audio.loop).toBe(false);
    paused.set(audio, true); audio.dispatchEvent(new Event("ended")); await settle();
    expect(audio.dataset.trackId).toBe("lobby-01");
    player.setScene("gameplay"); await vi.advanceTimersByTimeAsync(180); await settle();
    expect(audio.dataset.trackId).toBe("gameplay-v1");
    expect(audio.loop).toBe(true);
    expect(document.querySelectorAll("audio[data-game-music]")).toHaveLength(1);
  });

  it("cancels an obsolete scene transition and restores the old song's level without overlapping music", async () => {
    const player = create(); player.setScene("lobby"); player.unlock(); await settle(); await vi.advanceTimersByTimeAsync(600);
    const audio = element(); audio.currentTime = 12;
    player.setScene("gameplay"); await vi.advanceTimersByTimeAsync(60);
    player.setScene("lobby"); await vi.advanceTimersByTimeAsync(600);
    expect(audio.dataset.trackId).toBe("lobby-01");
    expect(audio.currentTime).toBe(12);
    expect(audio.volume).toBeCloseTo(0.35);
    player.setScene("gameplay"); await vi.advanceTimersByTimeAsync(180); await settle();
    expect(audio.dataset.musicScene).toBe("gameplay");
    expect(document.querySelectorAll("audio[data-game-music]")).toHaveLength(1);
  });

  it("silences pending playback on mute, preserves position, and requires a new gesture after a tab is hidden", async () => {
    let resolvePlay!: () => void;
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(function (this: HTMLMediaElement) {
      paused.set(this, false); return new Promise<void>(resolve => { resolvePlay = resolve; });
    });
    const player = create(); player.setScene("lobby"); player.unlock();
    const audio = element(); audio.currentTime = 24;
    player.setEnabled(false); resolvePlay(); await settle(); await vi.advanceTimersByTimeAsync(1000);
    expect(audio.paused).toBe(true); expect(audio.volume).toBe(0);
    player.setEnabled(true); await settle();
    expect(audio.paused).toBe(false); expect(audio.currentTime).toBe(24);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    player.suspend(); player.unlock();
    expect(audio.paused).toBe(true);
    hidden.mockReturnValue(false); player.setEnabled(true);
    // A gesture attempted while hidden cannot grant a later playback request.
    expect(audio.paused).toBe(true);
    player.unlock(); await settle();
    expect(audio.paused).toBe(false); expect(audio.currentTime).toBe(24);
    player.dispose();
    expect(element()).toBeNull();
  });

  it("can retry browser-blocked playback and falls back once if a lobby file fails", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException("Gesture required", "NotAllowedError"));
    const player = create(); player.setScene("lobby"); player.unlock(); await settle();
    const audio = element();
    expect(audio.paused).toBe(true);
    player.unlock(); await settle(); expect(audio.paused).toBe(false);
    audio.dispatchEvent(new Event("error")); await settle();
    expect(audio.dataset.trackId).toBe("lobby-02");
    audio.dispatchEvent(new Event("error")); await settle();
    expect(audio.paused).toBe(true);
    const attempts = vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length;
    player.unlock(); await settle();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(attempts);
  });
});
