// Export a text-only variant from the existing ImageGen paper master.
// Keep the current source plaque's frame and alpha byte-for-byte.
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const sharp = createRequire(import.meta.url)(process.argv[2] ?? "sharp");
const sourceRoot = "art/source/web-v3/hud-source-v1";
const runtimeRoot = "art/runtime/web-v3/hud-source-v1";
const provenance = JSON.parse(await readFile(`${sourceRoot}/trump-provenance-v1.json`, "utf8"));
const reports = [];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

for (const profile of ["landscape", "portrait"]) {
  const source = provenance.reports.find(report => report.profile === profile && report.strip);
  const [width, height] = source.crop.slice(2);
  const [left, top, cropWidth, cropHeight] = source.strip;
  const originalBytes = await readFile(source.output);
  const original = await sharp(originalBytes).ensureAlpha().raw().toBuffer();
  const blankBytes = await readFile(source.candidate);
  const blank = await sharp(blankBytes)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(width, height, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const output = Buffer.from(original);
  const region = profile === "landscape" ? [96, 18, 139, 38] : [104, 18, 144, 41];
  const [x0, y0, regionWidth, regionHeight] = region;
  let changedPixels = 0;
  for (let y = y0; y < y0 + regionHeight; y++) {
    for (let x = x0; x < x0 + regionWidth; x++) {
      const pixel = y * width + x;
      const blend = Math.max(0, Math.min(1, (x - x0) / 3, (y - y0) / 3,
        (x0 + regionWidth - 1 - x) / 3, (y0 + regionHeight - 1 - y) / 3));
      for (let channel = 0; channel < 3; channel++) {
        const paper = Math.max(0, Math.min(255, blank[pixel * 3 + channel] + source.delta[channel]));
        output[pixel * 4 + channel] = Math.round(original[pixel * 4 + channel] * (1 - blend) + paper * blend);
      }
      if (output.subarray(pixel * 4, pixel * 4 + 3).some((value, channel) => value !== original[pixel * 4 + channel])) changedPixels++;
    }
  }
  const path = `${runtimeRoot}/${profile}-trump-text-panel-v1.png`;
  const bytes = await sharp(output, { raw: { width, height, channels: 4 } }).png().toBuffer();
  await writeFile(path, bytes);
  reports.push({ profile, source: source.output, sourceSha256: hash(originalBytes),
    generatedPaper: source.candidate, generatedPaperSha256: hash(blankBytes), region, changedPixels,
    changedOutsideRegion: 0, alphaChanges: 0, path, sha256: hash(bytes) });
}
await writeFile(`${sourceRoot}/trump-text-panel-provenance-v1.json`, JSON.stringify({
  method: "Existing ImageGen blank master registered using the original export recipe; only the fixed-prefix interior replaced. Original border, side ornaments, and alpha retained. No new generation.", reports,
}, null, 2) + "\n");
console.log(JSON.stringify(reports.map(({ profile, changedPixels, path }) => ({ profile, changedPixels, path }))));
