// Reference-only crops for ImageGen. Never consumed by the runtime: they still
// contain source numerals, perspective and bits of the neighbouring scene.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const sharp = createRequire(import.meta.url)(process.argv[2] ?? "sharp");
const source = "art/mockups/web-v3/05-gameplay-final.png";
const destination = "art/reference/web-v3/cards";
const boxes = {
  leaf: { left: 540, top: 668, width: 150, height: 213 },
  mountain: { left: 690, top: 670, width: 146, height: 204 },
  knot: { left: 837, top: 670, width: 145, height: 204 },
  sun: { left: 976, top: 674, width: 159, height: 211 },
};
await mkdir(destination, { recursive: true });
for (const [suit, box] of Object.entries(boxes)) {
  await sharp(source).extract(box).resize(box.width * 3, box.height * 3).png().toFile(`${destination}/${suit}-source-hand-v1.png`);
}
await writeFile(`${destination}/source-crops.json`, JSON.stringify({
  source, sourceSha256: createHash("sha256").update(await readFile(source)).digest("hex"),
  use: "ImageGen reference only, not runtime assets or new visual truth", boxes, magnification: 3,
}, null, 2) + "\n");
console.log(`Saved four reference-only crops to ${destination}`);
