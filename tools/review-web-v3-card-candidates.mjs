// Artwork-only comparison; not a Chrome implementation screenshot or QA pass.
import { createRequire } from "node:module";
import { access, writeFile } from "node:fs/promises";
const sharp = createRequire(import.meta.url)(process.argv[2] ?? "sharp");
const suits = ["leaf", "mountain", "knot", "sun"];
const columns = ["immutable source crop", "runtime v2", "ImageGen v3 candidate", "targeted retry candidate"];
const inputs = [];
const reports = [];
for (const [row, suit] of suits.entries()) {
  const paths = [
    `art/reference/web-v3/cards/${suit}-source-hand-v1.png`,
    `art/runtime/web-v3/cards/${suit}-v2.png`,
    `art/source/web-v3/cards/${suit}-v3.png`,
    `art/source/web-v3/cards/${suit}-v3-retry.png`,
  ];
  for (const [column, path] of paths.entries()) {
    try { await access(path); } catch { continue; }
    const metadata = await sharp(path).metadata();
    inputs.push({ input: await sharp(path).resize(150, 225, { fit: "contain", background: "#17202b" }).png().toBuffer(), left: column * 166 + 8, top: row * 241 + 8 });
    reports.push({ suit, column: columns[column], path, pixelSize: [metadata.width, metadata.height] });
  }
}
const output = "art/review/web-v3/25-number-face-candidates-20261018";
await sharp({ create: { width: 664, height: 964, channels: 3, background: "#17202b" } }).composite(inputs).png().toFile(`${output}.png`);
await writeFile(`${output}.json`, JSON.stringify({ status: "artwork-review-not-browser-QA", columns, rowOrder: suits, reports }, null, 2) + "\n");
console.log(`Saved ${reports.length} artwork inputs to ${output}`);
