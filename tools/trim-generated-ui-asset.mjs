// Mechanical canvas trim only. The generated artwork, colors and antialiasing
// remain untouched; no painting, alpha thresholding or rescaling of pixels.
import { createRequire } from "node:module";
import { access } from "node:fs/promises";
const [input, output, modulePath = "sharp"] = process.argv.slice(2);
if (!input || !output) throw new Error("Expected generated input and new runtime output");
try { await access(output); throw new Error(`Refusing to overwrite ${output}`); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const sharp = createRequire(import.meta.url)(modulePath);
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let left = info.width, top = info.height, right = -1, bottom = -1;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  if (data[(y * info.width + x) * info.channels + info.channels - 1] < 26) continue;
  left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
}
if (right < left) throw new Error("No visible generated artwork");
const pad = 12;
const crop = { left: Math.max(0, left - pad), top: Math.max(0, top - pad), width: 0, height: 0 };
crop.width = Math.min(info.width, right + pad + 1) - crop.left;
crop.height = Math.min(info.height, bottom + pad + 1) - crop.top;
await sharp(input).extract(crop).png().toFile(output);
console.log(JSON.stringify({ input, output, original: [info.width,info.height], visible: [right-left+1,bottom-top+1], crop, notes: "Alpha>=26 used for bounds only. Original RGBA pixels preserved." }));
