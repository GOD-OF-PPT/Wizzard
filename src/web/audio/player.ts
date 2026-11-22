import { audioAssets, type AudioId } from "./assets";

export type AudioCue = { id: AudioId; key?: string; gain?: number; delayMs?: number; priority?: number };

/** Browser-only audio owner. It never receives room tokens or rules authority. */
export class GameAudioPlayer {
  private context: AudioContext | null = null;
  private enabled = true;
  private unlocked = false;
  private epoch = 0;
  private sources = new Map<AudioBufferSourceNode, { gain: GainNode; priority: number }>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private buffers = new Map<AudioId, Promise<AudioBuffer | null>>();
  private bytes = new Map<AudioId, Promise<ArrayBuffer | null>>();
  private seen = new Set<string>();
  private lastPlayed = new Map<AudioId, number>();

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  preload(): void {
    for (const id of Object.keys(audioAssets) as AudioId[]) this.loadBytes(id);
  }

  unlock(): void {
    if (typeof window === "undefined") return;
    try {
      this.context ??= new AudioContext();
      this.unlocked = true;
      void this.context.resume().catch(() => {});
    } catch { /* Unsupported/blocked audio must never interrupt play. */ }
  }

  /** Hidden/muted/unloaded cues are consumed, never queued for a later return. */
  play(cue: AudioCue): void {
    if (cue.key) {
      if (this.seen.has(cue.key)) return;
      this.seen.add(cue.key);
      if (this.seen.size > 1024) this.seen.delete(this.seen.values().next().value!);
    }
    if (!this.canPlay()) return;
    const epoch = this.epoch;
    const requestedAt = performance.now();
    const run = () => { void this.start(cue, epoch, requestedAt); };
    if (cue.delayMs) {
      const timer = setTimeout(() => { this.timers.delete(timer); run(); }, cue.delayMs);
      this.timers.add(timer);
    } else run();
  }

  stop(): void {
    this.epoch++;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    for (const source of this.sources.keys()) {
      try { source.stop(); } catch { /* Already ended. */ }
    }
    for (const [source, voice] of this.sources) { source.disconnect(); voice.gain.disconnect(); }
    this.sources.clear();
  }

  private canPlay(): boolean {
    return this.enabled && this.unlocked && !!this.context && this.context.state === "running" && !document.hidden;
  }

  private loadBytes(id: AudioId): Promise<ArrayBuffer | null> {
    if (!this.bytes.has(id)) this.bytes.set(id, fetch(audioAssets[id].url).then(response => response.ok ? response.arrayBuffer() : null).catch(() => null).then(bytes => { if (!bytes) this.bytes.delete(id); return bytes; }));
    return this.bytes.get(id)!;
  }

  private async start(cue: AudioCue, epoch: number, requestedAt: number): Promise<void> {
    const context = this.context;
    if (!context || !this.canPlay() || epoch !== this.epoch) return;
    if (!this.buffers.has(cue.id)) {
      this.buffers.set(cue.id, this.loadBytes(cue.id).then(bytes => bytes ? context.decodeAudioData(bytes.slice(0)).catch(() => null) : null));
    }
    const buffer = await this.buffers.get(cue.id);
    if (!buffer) this.buffers.delete(cue.id);
    if (!buffer || !this.canPlay() || epoch !== this.epoch || performance.now() - requestedAt > (cue.delayMs ?? 0) + 500) return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(cue.id) ?? -Infinity) < audioAssets[cue.id].cooldownMs) return;
    const priority = cue.priority ?? 1;
    if (this.sources.size >= 4) {
      const replace = [...this.sources].find(([, voice]) => voice.priority <= priority);
      if (!replace) return;
      replace[0].stop(); replace[0].disconnect(); replace[1].gain.disconnect(); this.sources.delete(replace[0]);
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.65 * (cue.gain ?? 1);
    source.connect(gain); gain.connect(context.destination);
    this.sources.set(source, { gain, priority });
    source.onended = () => { source.disconnect(); gain.disconnect(); this.sources.delete(source); };
    this.lastPlayed.set(cue.id, now);
    source.start();
  }
}

export const gameAudio = new GameAudioPlayer();
export function playCues(cues: readonly AudioCue[]): void { for (const cue of cues) gameAudio.play(cue); }
