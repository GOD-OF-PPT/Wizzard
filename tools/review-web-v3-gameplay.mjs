// Assemble the currently captured Chrome gameplay states with immutable sources.
// Image-only QA tool: no browser control and no source modification.
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
const [sharpPath, iteration = "before", date = "20261019"] = process.argv.slice(2);
if (!sharpPath) throw new Error("Provide installed sharp module path");
const sources = {
  gameplay: "05-gameplay-final.png", bid: "10-bid.png", chooser: "11-chooser.png",
  "gameplay-notimer": "14-gameplay-notimer.png", reconnecting: "15-reconnecting.png", "session-ended": "16-session-ended-v2.png",
};
const reports = [];
for (const profile of ["landscape", "portrait"]) for (const [state, sourceFile] of Object.entries(sources)) {
  const isPortrait = profile === "portrait";
  const name = isPortrait && state === "gameplay" ? "05-gameplay-safe-v2.png"
    : isPortrait && state === "gameplay-notimer" ? "14-gameplay-notimer-safe-v3.png" : sourceFile;
  const source = `art/mockups/web-v3/${isPortrait ? "portrait/" : ""}${name}`;
  const prefix = `art/review/web-v3/26-${state}-${profile}-${iteration}-${date}`;
  const focus = state === "gameplay" || state === "gameplay-notimer" ? isPortrait ? "25,300,360,385" : "525,300,630,600"
    : isPortrait ? "45,180,330,440" : "350,210,1000,540";
  const result = spawnSync(process.execPath, ["tools/compare-web-design.mjs", source, `${prefix}.jpg`, prefix, sharpPath,
    isPortrait ? "390" : "1672", isPortrait ? "694" : "941", focus], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${prefix}: ${result.stderr}`);
  reports.push({ state, profile, ...JSON.parse(result.stdout) });
}
await writeFile(`art/review/web-v3/26-${iteration}-${date}.json`, JSON.stringify({ status: "human-review-required", reports }, null, 2) + "\n");
console.log(JSON.stringify({ comparisons: reports.length, iteration }));
