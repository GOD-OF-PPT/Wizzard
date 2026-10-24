// Contact sheets for human composition review. Inputs are the already saved
// source/Chrome comparisons; this utility neither captures nor approves UI.
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [coveragePath, sharpPath = "sharp"] = process.argv.slice(2);
if (!coveragePath) throw new Error("Provide a coverage JSON with explicit comparisons");
const sharp = createRequire(import.meta.url)(sharpPath);
const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
const directory = path.dirname(coveragePath);
const batch = path.basename(coveragePath).split("-coverage-")[0];
const sheets = [];
for (const profile of ["landscape", "portrait"]) {
  const reports = coverage.reports.filter(r => r.profile === profile && r.comparison);
  const width = profile === "portrait" ? 650 : 1000;
  const height = profile === "portrait" ? 567 : 280;
  for (let offset = 0; offset < reports.length; offset += 4) {
    const entries = reports.slice(offset, offset + 4);
    const layers = await Promise.all(entries.map(async (r, i) => ({
      left: (i % 2) * (width + 16), top: Math.floor(i / 2) * (height + 16),
      input: await sharp(r.comparison).resize(width, height, { fit: "fill" }).png().toBuffer(),
    })));
    const filename = `${batch}-overview-${profile}-${String(offset / 4 + 1).padStart(2, "0")}-${coverage.date}.png`;
    await sharp({ create: { width: width * 2 + 16, height: height * Math.ceil(entries.length / 2) + 16 * (Math.ceil(entries.length / 2) - 1), channels: 3, background: "#10151d" } })
      .composite(layers).png().toFile(path.join(directory, filename));
    sheets.push({ filename, profile, order: "row-major; each cell has source left, Chrome right", states: entries.map(r => r.state) });
  }
}
await writeFile(path.join(directory, `${batch}-contact-sheets-${coverage.date}.json`), JSON.stringify({ coveragePath, status: "manual-review-required", sheets }, null, 2) + "\n");
console.log(JSON.stringify({ sheets: sheets.length }));
