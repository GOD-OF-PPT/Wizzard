// Lossless extraction from the selected ImageGen designs. These are authored
// control crops, not new drawings or regenerated screen truth. Preserve source
// RGB and the quiet 1-3px surround; the existing pill clip owns the mask.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const sharp = createRequire(import.meta.url)(process.argv[2] ?? "sharp");
const directory = "art/runtime/web-v3/switches";
await mkdir(directory, { recursive: true });
const jobs = [
  { family: "entry", profile: "landscape", source: "art/mockups/web-v3/02-create.png", on: [1070,474,94,54], off: [1070,570,94,54] },
  { family: "entry", profile: "portrait", source: "art/mockups/web-v3/portrait/02-create.png", on: [566,841,106,60], off: [566,978,106,60] },
  { family: "settings", profile: "landscape", source: "art/mockups/web-v3/08-settings.png", on: [1018,498,99,49], off: [1018,588,99,49] },
  { family: "settings", profile: "portrait", source: "art/mockups/web-v3/portrait/08-settings.png", on: [382,996,137,74], off: [382,1145,137,74] },
];
const records = [];
for (const job of jobs) {
  const sourceHash = createHash("sha256").update(await readFile(job.source)).digest("hex");
  for (const state of ["on", "off"]) {
    const [left,top,width,height] = job[state];
    const region = { left, top, width, height };
    const output = `${directory}/${job.family}-${job.profile}-${state}-v1.png`;
    const png = await sharp(job.source).extract(region).png().toBuffer();
    await writeFile(output, png);
    const expected = await sharp(job.source).extract(region).removeAlpha().raw().toBuffer();
    const actual = await sharp(png).removeAlpha().raw().toBuffer();
    if (!expected.equals(actual)) throw new Error("Crop changed source pixels");
    records.push({ ...job, on: undefined, off: undefined, state, region, output, sourceSha256:sourceHash,
      outputSha256:createHash("sha256").update(png).digest("hex"), changedSourcePixels:0 });
  }
}
await writeFile("art/review/web-v3/52-switch-source-crops-20261021.json", JSON.stringify({
  generator:"Existing selected built-in ImageGen designs; lossless crop, no color edit or redraw",
  status:"runtime-extraction-not-browser-acceptance", records,
},null,2)+"\n");
console.log(JSON.stringify({crops:records.length,changedSourcePixels:0}));
