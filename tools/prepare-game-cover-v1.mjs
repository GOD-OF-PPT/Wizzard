import { createRequire } from "node:module";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const [input, sharpModule = "sharp"] = process.argv.slice(2);
if (!input) throw new Error("Pass the selected built-in ImageGen output path.");
const sharp = createRequire(import.meta.url)(sharpModule);
const source = "art/source/covers/teahouse-game-cover-v1-master.png";
const output = "art/runtime/covers/teahouse-game-cover-1920x1080-v1.png";
const prompt = "art/prompts/game-cover-teahouse-v1.txt";
await mkdir("art/source/covers", { recursive: true });
await mkdir("art/runtime/covers", { recursive: true });
await copyFile(input, source);
const original = await sharp(source).metadata();
await sharp(source).resize(1920, 1080, { fit: "cover", position: "centre", kernel: "lanczos3" }).png().toFile(output);
const exported = await sharp(output).metadata();
if (exported.width !== 1920 || exported.height !== 1080) throw new Error("Incorrect cover dimensions.");
const hash = async path => createHash("sha256").update(await readFile(path)).digest("hex");
const report = {
  generator: "built-in image_gen", createdOn: "2026-10-29", prompt, promptSha256: await hash(prompt),
  source, sourceDimensions: [original.width, original.height], sourceSha256: await hash(source),
  output, outputDimensions: [exported.width, exported.height], sha256: await hash(output),
  export: "Aspect-preserving Lanczos3 resize with centered subpixel-edge crop to exact 16:9. No text, character, color, or layout edits. Native generated master preserved.",
};
await writeFile("art/source/covers/teahouse-game-cover-v1-provenance.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
