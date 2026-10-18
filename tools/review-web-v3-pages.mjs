// Assemble same-state Chrome evidence. No browser actions or runtime mutation.
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

const [sharpPath = "sharp", date = "20261018"] = process.argv.slice(2);
const sharp = createRequire(import.meta.url)(sharpPath);
const folder = "art/review/web-v3";
const pages = [
  ["01", "home", "01-home.png", [80,280,680,570], [65,180,270,260]],
  ["02", "create", "02-create.png", [385,195,910,620], [55,155,280,400]],
  ["03", "join", "03-join.png", [430,280,825,490], [50,260,295,275]],
  ["04", "lobby", "04-lobby.png", [1080,500,550,405], [15,145,360,340]],
  ["05", "gameplay", "05-gameplay-final.png", [525,300,630,600], [25,300,360,385]],
  ["06", "results", "06-results.png", [340,240,1030,590], [40,205,315,430]],
  ["07", "ranking", "07-ranking.png", [440,240,830,590], [75,215,245,420]],
  ["08", "rules", "08-rules.png", [500,330,800,420], [35,315,325,310]],
  ["09", "confirm", "09-confirm.png", [395,200,885,525], [40,160,310,300]],
  ["10", "bid", "10-bid.png", [450,280,780,400], [50,240,305,250]],
  ["11", "chooser", "11-chooser.png", [320,240,1030,455], [50,195,305,360]],
  ["12", "connection-error", "12-connection-error.png", [400,250,880,450], [45,265,305,245]],
  ["13", "connecting", "13-connecting.png", [400,250,880,450], [45,265,305,245]],
  ["14", "gameplay-notimer", "14-gameplay-notimer.png", [1200,430,440,400], [255,440,130,245]],
  ["15", "reconnecting", "15-reconnecting.png", [440,220,800,490], [65,205,265,275]],
  ["16", "session-ended", "16-session-ended-v2.png", [440,220,800,490], [65,205,265,275]],
];
const reports = [];
for (const profile of ["landscape", "portrait"]) {
  const width = profile === "landscape" ? 1672 : 390, height = profile === "landscape" ? 941 : 694;
  for (const [number, state, sourceFile, wideFocus, tallFocus] of pages) {
    const sourceName = profile === "portrait" && number === "05" ? "05-gameplay-safe-v2.png" : profile === "portrait" && number === "14" ? "14-gameplay-notimer-safe-v3.png" : sourceFile;
    const source = `art/mockups/web-v3/${profile === "portrait" ? "portrait/" : ""}${sourceName}`;
    const prefix = `${folder}/audit-${number}-${state}-${profile}-${date}`;
    const capture = Number(number) < 12 ? `${prefix}.jpg` : `${folder}/${number}-${state}-${profile}${number === "12" || number === "13" ? "-live" : ""}-${date}.jpg`;
    const result = spawnSync(process.execPath, ["tools/compare-web-design.mjs", source, capture, prefix, sharpPath, String(width), String(height), (profile === "landscape" ? wideFocus : tallFocus).join(",")], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(`${prefix}: ${result.stderr}`);
    reports.push({ number, state, profile, prefix, ...JSON.parse(result.stdout) });
  }
}
for (const profile of ["landscape", "portrait"]) {
  const entries = reports.filter(report => report.profile === profile);
  const cellWidth = profile === "landscape" ? 840 : 398;
  const cellHeight = profile === "landscape" ? 235 : 347;
  const columns = profile === "landscape" ? 2 : 3;
  const gap = 16;
  const layers = await Promise.all(entries.map(async (report, index) => ({
    input: await sharp(`${report.prefix}-comparison.png`).resize(cellWidth, cellHeight, { fit: "fill" }).png().toBuffer(),
    left: index % columns * (cellWidth + gap), top: Math.floor(index / columns) * (cellHeight + gap),
  })));
  await sharp({ create: { width: columns * (cellWidth + gap) - gap, height: Math.ceil(entries.length / columns) * (cellHeight + gap) - gap, channels: 3, background: "#10151d" } }).composite(layers).jpeg({ quality: 94 }).toFile(`${folder}/audit-${profile}-overview-${date}.jpg`);
}
await writeFile(`${folder}/audit-${date}-index.json`, JSON.stringify({ status: "review-required-not-a-pass", note: "Frozen layout samples and real form inputs. Actual game/transport evidence is separate. Image metrics are diagnostic only.", reports }, null, 2) + "\n");
const figures = reports.map(report => { const name = report.prefix.slice(folder.length + 1); return `<figure><figcaption>${report.number} ${report.state} · ${report.profile}</figcaption><a href="${name}-comparison.png"><img loading="lazy" src="${name}-comparison.png" alt="Left design, right Chrome implementation"></a><p><a href="${name}-focus.png">Focused comparison</a> · <a href="${report.capture.slice(folder.length + 1)}">Chrome capture</a> · <a href="${name}-metrics.json">Geometry and diagnostic metrics</a></p></figure>`; }).join("\n");
await writeFile(`${folder}/audit-${date}-index.html`, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Web v3 当前逐页对照</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.5 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,560px),1fr));gap:24px}figure{margin:0}img{width:100%;display:block}a{color:inherit}</style><h1>Web v3 当前逐页对照 · ${date}</h1><p>左：不可变ImageGen设计；右：Chrome实现。16页/状态双画幅，不等于整体通过。冻结排版样例与真实流程证据分开；规则其他章节另有聚焦对照。</p><main>${figures}</main></html>`);
console.log(JSON.stringify({ comparisons: reports.length, index: `${folder}/audit-${date}-index.html`, status: "review-required-not-a-pass" }));
