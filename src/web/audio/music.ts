import { musicTracks, type MusicScene, type MusicTrack } from "./music-assets";

/** One streamed music voice, independent of the short-effect WebAudio pool. */
export class GameMusicPlayer {
  private element: HTMLAudioElement | null = null;
  private scene: MusicScene | null = null;
  private track: MusicTrack | null = null;
  private loadedTrack: string | null = null;
  private enabled = true;
  private unlocked = false;
  private switching = false;
  private pendingPlay = false;
  private request = 0;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private failed = new Set<string>();

  constructor(private random: () => number = Math.random) {}

  setScene(scene: MusicScene): void {
    if (scene === this.scene) return;
    this.scene = scene;
    this.failed.clear();
    this.track = scene === "lobby" ? this.chooseLobby() : musicTracks.gameplay;
    this.cancelWork();
    this.reconcile();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.reconcile();
  }

  /** Called synchronously inside the existing trusted pointer/key listener. */
  unlock(): void {
    if (typeof document === "undefined" || document.hidden) return;
    this.unlocked = true;
    this.reconcile();
  }

  /** Preserve the position, but tab return alone must not restart music. */
  suspend(): void {
    this.unlocked = false;
    this.pause();
  }

  dispose(): void {
    this.suspend();
    if (this.element) {
      this.element.onended = null;
      this.element.onerror = null;
      this.element.removeAttribute("src");
      this.element.load();
      this.element.remove();
    }
    this.element = null;
    this.loadedTrack = null;
    this.scene = null;
    this.track = null;
    this.failed.clear();
  }

  private canPlay(): boolean {
    return this.enabled && this.unlocked && typeof document !== "undefined" && !document.hidden;
  }

  private chooseLobby(exclude?: string): MusicTrack | null {
    const choices = musicTracks.lobby.filter(track => track.id !== exclude && !this.failed.has(track.id));
    return choices.length ? choices[Math.min(choices.length - 1, Math.floor(this.random() * choices.length))] : null;
  }

  private audio(): HTMLAudioElement {
    if (!this.element) {
      const audio = document.createElement("audio");
      audio.hidden = true;
      audio.setAttribute("aria-hidden", "true");
      audio.dataset.gameMusic = "true";
      audio.preload = "metadata";
      audio.onended = () => {
        if (this.scene !== "lobby" || this.loadedTrack !== this.track?.id) return;
        this.track = this.chooseLobby(this.loadedTrack);
        this.cancelWork();
        this.reconcile();
      };
      audio.onerror = () => this.failCurrentTrack();
      document.body.append(audio);
      this.element = audio;
    }
    return this.element;
  }

  private reconcile(): void {
    if (!this.canPlay() || !this.track) { this.pause(); return; }
    const audio = this.audio();
    if (this.switching) return;
    if (this.loadedTrack !== this.track.id) {
      if (this.loadedTrack && !audio.paused) {
        this.switching = true;
        const request = this.request;
        this.fade(0, 180, () => {
          if (request !== this.request) return;
          this.switching = false;
          this.loadSelected();
        });
      } else this.loadSelected();
    } else if (audio.paused && !this.pendingPlay) this.start();
    else if (!this.pendingPlay && this.fadeTimer === null && audio.volume !== 0.35) this.fade(0.35, 600);
  }

  private loadSelected(): void {
    if (!this.canPlay() || !this.track) { this.pause(); return; }
    const audio = this.audio();
    audio.pause();
    audio.volume = 0;
    audio.loop = this.scene === "gameplay";
    audio.src = this.track.url;
    audio.dataset.musicScene = this.scene!;
    audio.dataset.trackId = this.track.id;
    this.loadedTrack = this.track.id;
    audio.load();
    this.start();
  }

  private start(): void {
    const audio = this.audio();
    const request = ++this.request;
    this.pendingPlay = true;
    audio.volume = 0;
    try {
      void Promise.resolve(audio.play()).then(() => {
        if (request !== this.request) return;
        this.pendingPlay = false;
        if (!this.canPlay()) { this.pause(); return; }
        this.fade(0.35, 600);
      }).catch(error => {
        if (request !== this.request) return;
        this.pendingPlay = false;
        if (error?.name === "NotAllowedError") this.suspend();
        else if (error?.name !== "AbortError") this.failCurrentTrack();
      });
    } catch { this.pendingPlay = false; this.failCurrentTrack(); }
  }

  private failCurrentTrack(): void {
    if (!this.canPlay() || !this.track || this.track.id !== this.loadedTrack) return;
    this.failed.add(this.track.id);
    this.track = this.scene === "lobby" ? this.chooseLobby(this.track.id) : null;
    this.pause();
    this.reconcile();
  }

  private fade(target: number, duration: number, done?: () => void): void {
    this.cancelFade();
    const audio = this.element;
    if (!audio) return;
    const initial = audio.volume;
    const steps = Math.ceil(duration / 30);
    let step = 0;
    this.fadeTimer = setInterval(() => {
      if (!this.canPlay()) { this.pause(); return; }
      audio.volume = initial + (target - initial) * Math.min(1, ++step / steps);
      if (step >= steps) { this.cancelFade(); done?.(); }
    }, 30);
  }

  private cancelFade(): void {
    if (this.fadeTimer !== null) clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }

  private cancelWork(): void {
    this.request++;
    if (this.pendingPlay) this.element?.pause();
    this.pendingPlay = false;
    this.switching = false;
    this.cancelFade();
  }

  private pause(): void {
    this.cancelWork();
    if (this.element) { this.element.pause(); this.element.volume = 0; }
  }
}

export const gameMusic = new GameMusicPlayer();
