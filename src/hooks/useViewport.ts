import { useEffect, useState } from "react";
import { BrowserViewportService, type ViewportSnapshot } from "../web/viewport";

export function useViewport(): ViewportSnapshot {
  const [service] = useState(() => new BrowserViewportService());
  const [snapshot, setSnapshot] = useState(service.getSnapshot());

  useEffect(() => {
    const unsubscribe = service.subscribe(setSnapshot);
    return () => {
      unsubscribe();
      service.dispose();
    };
  }, [service]);

  return snapshot;
}
