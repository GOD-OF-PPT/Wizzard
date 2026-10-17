type FieldRect = readonly [x: number, y: number, width: number, height: number, paper?: boolean];

// Only editable content may use the ImageGen cleanup layer. Everything outside
// these authored rectangles retains the selected design's original pixels.
const createWide: FieldRect[] = [
  [724, 232, 502, 54], [633, 360, 621, 71],
  [1066, 464, 185, 79], [1066, 565, 185, 70],
];
const createTall: FieldRect[] = [
  [365, 437, 370, 76], [188, 667, 574, 97],
  [558, 829, 197, 84], [558, 969, 197, 78],
];
const joinWide: FieldRect[] = [
  [765, 334, 425, 54, true],
  ...Array.from({ length: 6 }, (_, index): FieldRect => [632 + index * 99, 491, 74, 79, true]),
];
const joinTall: FieldRect[] = [
  [335, 700, 275, 61, true],
  ...[178, 280, 381, 484, 586, 687].map((x): FieldRect => [x, 951, 77, 88, true]),
];

export function FormArtMasks({ mode, landscape, portrait }: { mode: "create" | "join"; landscape: string; portrait: string }) {
  function layer(src: string, rects: FieldRect[], width: number, height: number, profile: string) {
    return rects.map(([x, y, w, h, paper], index) => <img
      key={`${profile}-${index}`} src={src} alt="" aria-hidden="true" draggable={false}
      className={`v3-art-clean-patch v3-art-clean-patch--${profile}`}
      style={{
        clipPath: `inset(${y / height * 100}% ${(width - x - w) / width * 100}% ${(height - y - h) / height * 100}% ${x / width * 100}%)`,
        backgroundColor: paper ? "#f3e0b9" : "#0b1b2c",
      }}
    />);
  }
  return <>{layer(landscape, mode === "create" ? createWide : joinWide, 1672, 941, "landscape")}{layer(portrait, mode === "create" ? createTall : joinTall, 941, 1672, "portrait")}</>;
}
