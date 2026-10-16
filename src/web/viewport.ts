export type ViewportMode = "portrait" | "landscape";

export type ViewportSnapshot = Readonly<{
  cssHeight: number;
  cssWidth: number;
  devicePixelRatio: number;
  mode: ViewportMode;
  reducedMotion: boolean;
  safeInsets: { bottom: number; left: number; right: number; top: number };
  revision: number;
  visible: boolean;
}>;

export function getViewportMode(width: number, height: number): ViewportMode {
  return width / Math.max(1, height) >= 1.2 ? "landscape" : "portrait";
}

export function createViewportSnapshot(
  width: number,
  height: number,
  devicePixelRatio = 1,
  reducedMotion = false,
  visible = true,
  revision = 0,
): ViewportSnapshot {
  return {
    cssHeight: Math.max(0, height),
    cssWidth: Math.max(0, width),
    devicePixelRatio: Math.max(1, devicePixelRatio),
    mode: getViewportMode(width, height),
    reducedMotion,
    safeInsets: { bottom: 0, left: 0, right: 0, top: 0 },
    revision,
    visible,
  };
}

export interface ViewportService {
  getSnapshot(): ViewportSnapshot;
  subscribe(listener: (snapshot: ViewportSnapshot) => void): () => void;
}

export class BrowserViewportService implements ViewportService {
  private snapshot: ViewportSnapshot;
  private readonly listeners = new Set<(snapshot: ViewportSnapshot) => void>();
  private revision = 0;

  public constructor(private readonly root: Window = window) {
    this.snapshot = this.readSnapshot();
    root.addEventListener("resize", this.handleChange);
    root.addEventListener("orientationchange", this.handleChange);
    root.document.addEventListener("visibilitychange", this.handleChange);
    root.visualViewport?.addEventListener("resize", this.handleChange);
    root.visualViewport?.addEventListener("scroll", this.handleChange);
  }

  public dispose(): void {
    this.root.removeEventListener("resize", this.handleChange);
    this.root.removeEventListener("orientationchange", this.handleChange);
    this.root.document.removeEventListener("visibilitychange", this.handleChange);
    this.root.visualViewport?.removeEventListener("resize", this.handleChange);
    this.root.visualViewport?.removeEventListener("scroll", this.handleChange);
    this.listeners.clear();
  }

  public getSnapshot(): ViewportSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: (snapshot: ViewportSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  private readonly handleChange = (): void => {
    this.revision += 1;
    this.snapshot = this.readSnapshot();
    for (const listener of this.listeners) listener(this.snapshot);
  };

  private readSnapshot(): ViewportSnapshot {
    const visualViewport = this.root.visualViewport;
    const width = visualViewport?.width ?? this.root.innerWidth;
    const height = visualViewport?.height ?? this.root.innerHeight;
    const reducedMotion = this.root.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches ?? false;
    const safeInsets = {
      bottom: Number.parseFloat(getComputedStyle(this.root.document.documentElement).getPropertyValue("--safe-area-bottom")) || 0,
      left: Number.parseFloat(getComputedStyle(this.root.document.documentElement).getPropertyValue("--safe-area-left")) || 0,
      right: Number.parseFloat(getComputedStyle(this.root.document.documentElement).getPropertyValue("--safe-area-right")) || 0,
      top: Number.parseFloat(getComputedStyle(this.root.document.documentElement).getPropertyValue("--safe-area-top")) || 0,
    };
    return {
      ...createViewportSnapshot(
      width,
      height,
      this.root.devicePixelRatio,
      reducedMotion,
      this.root.document.visibilityState === "visible",
      this.revision,
      ),
      safeInsets,
    };
  }
}
