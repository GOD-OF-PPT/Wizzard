import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, "dist");

async function bytes(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    total += entry.isDirectory() ? await bytes(target) : (await stat(target)).size;
  }
  return total;
}

const report = {
  generatedAt: new Date().toISOString(),
  runtime: "react-web-internal",
  anonymousSessions: true,
  wechatRequired: false,
  cocosRequired: false,
  transport: { kind: "websocket", target: "/ws", localFallback: "ws://host:8787/ws" },
  packageBytes: await bytes(dist),
};
await writeFile(path.join(dist, "web-build-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Web build report written to ${path.join(dist, "web-build-report.json")}.`);
