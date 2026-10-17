// Image-only QA utility. It never edits the immutable design or browser capture.
// Usage: node tools/compare-web-design.mjs <design> <capture> <output-prefix>
//        [sharp-module-path] [width=390] [height=694] [focus=x,y,w,h]
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";

const [design, capture, output, modulePath = "sharp", widthArg = "390", heightArg = "694", focusArg] = process.argv.slice(2);
if (!design || !capture || !output) throw new Error("Provide design, Chrome capture and output prefix.");
const sharp = createRequire(import.meta.url)(modulePath);
const width = Number(widthArg);
const height = Number(heightArg);
const normalize = path => sharp(path).resize(width, height, { fit: "fill" }).removeAlpha().png().toBuffer();
const [source, actual] = await Promise.all([normalize(design), normalize(capture)]);
await sharp({ create: { width: width * 2 + 16, height, channels: 3, background: "#10151d" } })
  .composite([{ input: source, left: 0, top: 0 }, { input: actual, left: width + 16, top: 0 }])
  .png().toFile(`${output}-comparison.png`);
let focus = null;
if (focusArg) {
  const [left, top, focusWidth, focusHeight] = focusArg.split(",").map(Number);
  focus = { left, top, width: focusWidth, height: focusHeight };
  const [sourceRegion, actualRegion] = await Promise.all([source, actual].map(input => sharp(input).extract(focus).png().toBuffer()));
  await sharp({ create: { width: focusWidth * 2 + 16, height: focusHeight, channels: 3, background: "#10151d" } })
    .composite([{ input: sourceRegion, left: 0, top: 0 }, { input: actualRegion, left: focusWidth + 16, top: 0 }])
    .png().toFile(`${output}-focus.png`);
}
const [a, b] = await Promise.all([sharp(source).raw().toBuffer(), sharp(actual).raw().toBuffer()]);
const overlay = Buffer.alloc(a.length);
let absolute = 0;
let changed = 0;
for (let index = 0; index < a.length; index += 3) {
  let maximum = 0;
  for (let channel = 0; channel < 3; channel++) {
    const offset = index + channel;
    const difference = Math.abs(a[offset] - b[offset]);
    absolute += difference;
    maximum = Math.max(maximum, difference);
    overlay[offset] = Math.round((a[offset] + b[offset]) / 2);
  }
  if (maximum > 24) changed++;
}
await sharp(overlay, { raw: { width, height, channels: 3 } }).png().toFile(`${output}-overlay.png`);
const report = {
  design, capture, viewport: [width, height], left: "immutable ImageGen design", right: "Chrome implementation",
  normalizedForComparison: true, focus, meanAbsoluteChannelDifference: absolute / a.length,
  fractionPixelsOver24: changed / (width * height),
  interpretation: "Diagnostic only, not an acceptance threshold. Antialiasing, JPEG capture, dynamic content and art differences all contribute. Inspect both full view and focused regions.",
};
await writeFile(`${output}-metrics.json`, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
