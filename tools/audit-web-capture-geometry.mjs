// Read-only evidence inventory, plus one generated audit artifact. It never
// rewrites historical screenshots or their comparison metadata.
import { createRequire } from "node:module";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const [modulePath = "sharp", folder = "art/review/web-v3", output = `${folder}/20261018-capture-geometry-audit.json`, prefix = ""] = process.argv.slice(2);
const sharp = createRequire(import.meta.url)(modulePath);
const reports = [];
for (const name of (await readdir(folder)).filter(name => name.startsWith(prefix) && name.endsWith("-metrics.json")).sort()) {
  const metric = JSON.parse(await readFile(join(folder, name), "utf8"));
  try {
    const metadata = await sharp(metric.capture).metadata();
    const error = Math.abs((metadata.width / metadata.height) / (metric.viewport[0] / metric.viewport[1]) - 1);
    reports.push({ metric: join(folder, name), capture: metric.capture, originalSize: [metadata.width, metadata.height], target: metric.viewport, relativeAspectError: error, status: error <= 0.005 ? "geometry-compatible" : "invalid-crop-or-wrong-viewport" });
  } catch (error) {
    reports.push({ metric: join(folder, name), capture: metric.capture, status: "unreadable", reason: String(error) });
  }
}
const counts = Object.fromEntries(["geometry-compatible", "invalid-crop-or-wrong-viewport", "unreadable"].map(status => [status, reports.filter(report => report.status === status).length]));
await writeFile(output, JSON.stringify({ limitation: "Geometry compatibility is necessary, never a visual or interaction pass.", counts, reports }, null, 2) + "\n");
console.log(JSON.stringify({ output, counts }));
