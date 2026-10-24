// Current Chrome captures only. No browser automation or source modifications.
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
const [sharpPath, date = "20261019"] = process.argv.slice(2);
if (!sharpPath) throw new Error("Provide installed sharp module path");
const sources = [
  ["home", "01-home.png"], ["create", "02-create.png"], ["join", "03-join.png"],
  ["lobby", "04-lobby-waiting-v2.png"], ["lobby-ready", "04-lobby-ready-v2.png"],
  ["gameplay", "05-gameplay-final.png"], ["results", "06-results.png"], ["ranking", "07-ranking.png"],
  ["rules", "08-rules.png"], ["rules-trump", "08-rules-trump.png"], ["rules-play", "08-rules-play.png"],
  ["rules-scoring", "08-rules-scoring.png"], ["settings", "08-settings.png"], ["confirm", "09-confirm.png"],
  ["bid", "10-bid.png"], ["chooser", "11-chooser.png"], ["connection-error", "12-connection-error.png"],
  ["connecting", "13-connecting.png"], ["gameplay-notimer", "14-gameplay-notimer.png"],
  ["reconnecting", "15-reconnecting.png"], ["session-ended", "16-session-ended-v2.png"],
];
const reports = [];
for (const profile of ["landscape", "portrait"]) for (const [state, file] of sources) {
  const portrait = profile === "portrait";
  const source = `art/mockups/web-v3/${portrait ? "portrait/" : ""}${portrait && state === "gameplay" ? "05-gameplay-safe-v2.png" : portrait && state === "gameplay-notimer" ? "14-gameplay-notimer-safe-v3.png" : file}`;
  const prefix = `art/review/web-v3/26-${state}-${profile}-after-${date}`;
  const focus = state === "home" ? portrait ? "30,150,330,370" : "80,280,680,570"
    : ["gameplay", "gameplay-notimer"].includes(state) ? portrait ? "25,300,360,385" : "525,300,630,600"
      : portrait ? "25,170,340,450" : "350,210,1000,540";
  const result = spawnSync(process.execPath, ["tools/compare-web-design.mjs", source, `${prefix}.jpg`, prefix, sharpPath,
    portrait ? "390" : "1672", portrait ? "694" : "941", focus], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${prefix}: ${result.stderr}`);
  reports.push({ state, profile, prefix, ...JSON.parse(result.stdout) });
}
const root = "art/review/web-v3/";
await writeFile(`${root}audit-${date}-index.json`, JSON.stringify({ status: "review-required-not-a-pass", reports }, null, 2) + "\n");
await writeFile(`${root}audit-${date}-index.html`, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Web v3 当前Chrome对照 · ${date}</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.5 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,560px),1fr));gap:24px}figure{margin:0}img{width:100%;display:block}a{color:inherit}</style><h1>Web v3 当前Chrome对照 · ${date}</h1><p>左为不可变ImageGen设计，右为本轮Chrome当前实现。42组页面/状态，含规则全部章节。排版夹具与真实网络证据分开，图片数量和诊断指标不表示验收通过。结论见design-qa.md。</p><main>${reports.map(r => { const key = r.prefix.slice(root.length); return `<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${key}-comparison.png"><img loading="lazy" src="${key}-comparison.png" alt="左设计稿，右Chrome实现"></a><p><a href="${key}-focus.png">聚焦比较</a> · <a href="${key}.jpg">Chrome原截图</a></p></figure>`; }).join("\n")}</main></html>`);
console.log(JSON.stringify({ comparisons: reports.length, index: `${root}audit-${date}-index.html` }));
