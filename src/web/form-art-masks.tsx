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
  // Four source pixels around each original glyph clear its antialiasing.
  // The surrounding authored paper/flowers stay on the immutable base.
  [647, 501, 42, 60, true], [747, 501, 42, 60, true],
  [846, 501, 42, 60, true], [945, 501, 41, 60, true],
  [1048, 501, 32, 59, true], [1141, 501, 40, 60, true],
];
const joinTall: FieldRect[] = [
  [335, 700, 275, 61, true],
  [194, 964, 45, 64, true], [297, 965, 44, 63, true],
  [399, 964, 43, 64, true], [501, 965, 43, 63, true],
  [607, 965, 35, 63, true], [704, 964, 43, 64, true],
];

// The mode field's frame stays in the original art. Cover only its baked quick-game
// text with quiet paper sampled from the same field, underneath the native select.
function modeInkPatch(src: string, profile: string, canvasW: number, canvasH: number,
  ink: readonly [number, number, number, number], donorX: number, donorW: number) {
  const [x, y, w, h] = ink;
  return <span aria-hidden="true" className={`v3-art-clean-patch v3-art-clean-patch--${profile}`} style={{
    left: `${100 * x / canvasW}%`, top: `${100 * y / canvasH}%`, width: `${100 * w / canvasW}%`, height: `${100 * h / canvasH}%`,
    backgroundImage: `url("${src}")`, backgroundSize: `${100 * canvasW / donorW}% ${100 * canvasH / h}%`,
    backgroundPosition: `${100 * donorX / (canvasW - donorW)}% ${100 * y / (canvasH - h)}%`,
  }} />;
}

export function FormArtMasks({ mode, landscape, portrait }: { mode: "create" | "join"; landscape: string; portrait: string }) {
  function layer(src: string, rects: FieldRect[], width: number, height: number, profile: string) {
    return rects.map(([x, y, w, h, paper], index) => <span
      key={`${profile}-${index}`} aria-hidden="true"
      className={`v3-art-clean-patch v3-art-clean-patch--${profile}`}
      style={{
        clipPath: `inset(${y / height * 100}% ${(width - x - w) / width * 100}% ${(height - y - h) / height * 100}% ${x / width * 100}%)`,
        backgroundImage: `url("${src}")`,
        backgroundColor: paper ? "#f3e0b9" : "#0b1b2c",
      }}
    />);
  }
  return <>{layer(landscape, mode === "create" ? createWide : joinWide, 1672, 941, "landscape")}{layer(portrait, mode === "create" ? createTall : joinTall, 941, 1672, "portrait")}
    {mode === "create" && <>
      {modeInkPatch(landscape, "landscape", 1672, 941, [890, 662, 190, 44], 764, 120)}
      {modeInkPatch(portrait, "portrait", 941, 1672, [357, 1170, 226, 61], 235, 111)}
    </>}
  </>;
}
