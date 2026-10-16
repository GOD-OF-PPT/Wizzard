export interface FrameScheduler {
  now(): number;
  start(callback: (timestampMs: number) => void): () => void;
}

export class BrowserFrameScheduler implements FrameScheduler {
  public now(): number {
    return performance.now();
  }

  public start(callback: (timestampMs: number) => void): () => void {
    let frame = 0;
    const tick = (timestampMs: number) => {
      callback(timestampMs);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }
}
