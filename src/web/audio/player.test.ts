import { afterEach, describe, expect, it, vi } from "vitest";
import { GameAudioPlayer } from "./player";

class TestSource {
  starts = 0; stopped = false; buffer: unknown; onended: (() => void) | null = null;
  connect() {} disconnect() {} start() { this.starts++; }
  stop() { this.stopped = true; }
}

class TestContext {
  static instances: TestContext[] = [];
  state = "running"; destination = {}; sources: TestSource[] = [];
  decode = Promise.resolve({} as AudioBuffer);
  constructor() { TestContext.instances.push(this); }
  resume() { return Promise.resolve(); }
  decodeAudioData() { return this.decode; }
  createBufferSource() { const source = new TestSource(); this.sources.push(source); return source; }
  createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
}

function setup() {
  TestContext.instances = [];
  vi.stubGlobal("AudioContext", TestContext);
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
  return new GameAudioPlayer();
}
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("browser audio lifetime", () => {
  it("requires gesture unlock and never replays cues consumed while muted", async () => {
    const player = setup();
    player.play({ id: "ui.tap", key: "before-gesture" }); await settle();
    expect(TestContext.instances).toHaveLength(0);
    player.unlock(); player.setEnabled(false);
    player.play({ id: "ui.confirm", key: "muted" });
    player.setEnabled(true); player.play({ id: "ui.confirm", key: "muted" }); await settle();
    expect(TestContext.instances[0].sources).toHaveLength(0);
    player.play({ id: "ui.confirm", key: "fresh" }); await settle();
    expect(TestContext.instances[0].sources[0].starts).toBe(1);
  });

  it("cancels delayed and in-flight decoded audio on mute", async () => {
    const player = setup(); player.unlock();
    const context = TestContext.instances[0];
    let decode!: (buffer: AudioBuffer) => void;
    context.decode = new Promise(resolve => { decode = resolve; });
    player.play({ id: "card.play" }); await settle();
    player.setEnabled(false); decode({} as AudioBuffer); await settle();
    expect(context.sources).toHaveLength(0);
    vi.useFakeTimers(); player.setEnabled(true);
    player.play({ id: "turn.yours", delayMs: 450 }); player.stop();
    await vi.advanceTimersByTimeAsync(500); await settle();
    expect(context.sources).toHaveLength(0);
  });

  it("limits voices to four and rejects hidden-tab cues", async () => {
    const player = setup(); player.unlock();
    for (const id of ["ui.tap", "ui.confirm", "ui.back", "card.select", "card.play"] as const) player.play({ id });
    await settle();
    expect(TestContext.instances[0].sources.filter(source => !source.stopped)).toHaveLength(4);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    player.play({ id: "match.victory" }); await settle();
    expect(TestContext.instances[0].sources).toHaveLength(5);
  });
});
