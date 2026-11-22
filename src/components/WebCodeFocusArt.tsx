import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import geometry from "../../art/runtime/web-v3/join-code-focus-geometry-v1.json";
import wideTop from "../../art/runtime/web-v3/join-code-focus-landscape-top-v1.png";
import wideBottom from "../../art/runtime/web-v3/join-code-focus-landscape-bottom-v1.png";
import wideLeft from "../../art/runtime/web-v3/join-code-focus-landscape-left-v1.png";
import wideRight from "../../art/runtime/web-v3/join-code-focus-landscape-right-v1.png";
import tallTop from "../../art/runtime/web-v3/join-code-focus-portrait-top-v1.png";
import tallBottom from "../../art/runtime/web-v3/join-code-focus-portrait-bottom-v1.png";
import tallLeft from "../../art/runtime/web-v3/join-code-focus-portrait-left-v1.png";
import tallRight from "../../art/runtime/web-v3/join-code-focus-portrait-right-v1.png";

const artwork = { top: [wideTop, tallTop], bottom: [wideBottom, tallBottom], left: [wideLeft, tallLeft], right: [wideRight, tallRight] } as const;
const parts = ["top", "bottom", "left", "right"] as const;

/** The perimeter never paints inside a code cell or carries any code glyph. */
export function WebCodeFocusArt({ visible, onReady }: { visible: boolean; onReady: (ready: boolean) => void }) {
  const root = useRef<HTMLSpanElement>(null);
  const checkReady = useCallback(() => {
    const images = Array.from(root.current?.querySelectorAll("img") ?? []);
    onReady(images.length === parts.length && images.every(image => image.complete && image.naturalWidth > 0));
  }, [onReady]);
  useEffect(checkReady, [checkReady]);
  function coordinates(part: typeof parts[number]): CSSProperties {
    const values: Record<string, string> = {};
    for (const profile of ["landscape", "portrait"] as const) {
      const [width, height] = geometry[profile].canvas;
      const [x, y, w, h] = geometry[profile].parts[part];
      const prefix = profile === "portrait" ? "--code-focus-tall-" : "--code-focus-";
      Object.assign(values, { [`${prefix}x`]: `${x / width * 100}%`, [`${prefix}y`]: `${y / height * 100}%`, [`${prefix}w`]: `${w / width * 100}%`, [`${prefix}h`]: `${h / height * 100}%` });
    }
    return values as CSSProperties;
  }
  return <span ref={root} className="v3-code-focus-art" aria-hidden="true" hidden={!visible}>
    {parts.map(part => <picture className="v3-code-focus-part" key={part} style={coordinates(part)}>
      <source media="(orientation: portrait)" srcSet={artwork[part][1]} />
      <img src={artwork[part][0]} alt="" draggable={false} onLoad={checkReady} onError={() => onReady(false)} />
    </picture>)}
  </span>;
}
