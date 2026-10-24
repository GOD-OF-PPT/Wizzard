// Evidence assembler only: browser captures must already exist. It never
// drives a browser, changes the references, or decides that a page passed.
import { spawnSync } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
const [sharpPath, date="20261020", recordsPath] = process.argv.slice(2);
if(!sharpPath)throw new Error("Provide installed sharp module path");
// A current batch must name its own browser records explicitly. Never infer
// freshness from timestamps or silently fill holes with historical captures.
const currentBatch = recordsPath ? JSON.parse(await readFile(recordsPath, "utf8")) : null;
if (currentBatch && currentBatch.browser !== "Chrome") throw new Error("Chrome capture records required");
const currentCaptures = new Map((currentBatch?.records ?? []).map(r => [`${r.key}:${r.profile}`, r]));
const indexPrefix = currentBatch ? "50" : "42";
const states=[
 ["home","01-home.png"],["create","02-create.png"],["join","03-join.png"],
 ["lobby","04-lobby-waiting-v2.png"],["lobby-ready","04-lobby-ready-v2.png"],
 ["gameplay","05-gameplay-final.png"],["results","06-results.png"],["ranking","07-ranking.png"],
 ["rules","08-rules.png"],["rules-trump","08-rules-trump.png"],["rules-play","08-rules-play.png"],
 ["rules-scoring","08-rules-scoring.png"],["settings","08-settings.png"],
 ["confirm","09-confirm.png"],["bid","10-bid.png"],["chooser","11-chooser.png"],
 ["connection-error","12-connection-error.png"],["connecting","13-connecting.png"],
 ["gameplay-notimer","14-gameplay-notimer.png"],["reconnecting","15-reconnecting.png"],
 ["session-ended","16-session-ended-v2.png"],["bid-pending","17-bid-pending-v1.png"],
 ["chooser-pending","18-chooser-pending-v1.png"],["play-pending","19-play-pending-v1.png"],
 ["tab-protection","20-tab-protection-v1.png"],
];
const folder="art/review/web-v3", reports=[];
for(const profile of ["landscape","portrait"])for(const [state,filename]of states){
 const portrait=profile==="portrait", width=portrait?390:1672, height=portrait?694:941;
 const sourceName=portrait ? ({gameplay:"05-gameplay-safe-v2.png","gameplay-notimer":"14-gameplay-notimer-safe-v3.png","bid-pending":"17-bid-pending-v2.png",chooser:"11-chooser-no-play-v4.png","chooser-pending":"18-chooser-pending-no-play-v4.png"}[state]??filename):({reconnecting:"15-reconnecting-network-v2.png","session-ended":"16-session-ended-network-v3.png"}[state]??filename);
 const design=`art/mockups/web-v3/${portrait?"portrait/":""}${sourceName}`;
 let prefix=`${folder}/42-${state}-${profile}-settled-${date}`;
 // 43 is the explicit post-fix batch. Never silently use other historical
 // screenshots or select by timestamp alone.
 const fixedPrefix=`${folder}/43-${state}-${profile}-${date}`;
 try{await access(`${fixedPrefix}.png`);prefix=fixedPrefix;}catch{}
 if(state === "confirm") prefix=`${folder}/44-confirm-idle-${profile}-${date}`;
 if(state === "tab-protection") prefix=`${folder}/45-tab-protection-${profile}-${date}`;
 // The responsive motion fix changes selected-card geometry. Keep the old
 // captures as history, but never present them as current after that fix.
 const motionChanged=["gameplay","gameplay-notimer","play-pending"].includes(state);
 const previousCapture=`${prefix}.png`;
 if(motionChanged) prefix=`${folder}/46-${state}-${profile}-${date}`;
 if (currentBatch) {
  const record = currentCaptures.get(`${state}:${profile}`);
  if (!record || !/^50-[a-z-]+-(landscape|portrait)-20261021\.png$/.test(record.filename)) throw new Error(`Missing explicit current capture: ${state}/${profile}`);
  if (record.frame?.[0] !== width || record.frame?.[1] !== height || record.fontStatus !== "loaded" || record.undecoded?.length) throw new Error(`Invalid current capture: ${state}/${profile}`);
  prefix = `${folder}/${record.filename.slice(0, -4)}`;
 }
 const capture=`${prefix}.png`;
 const focus=state==="home"?(portrait?"30,150,330,370":"80,280,680,570"):
  state.includes("play")&&state!=="rules-play"?(portrait?"15,300,370,390":"525,300,630,600"):
  portrait?"25,160,340,460":"320,205,1030,610";
 let report={state,profile,design,capture,viewport:[width,height],comparison:null,focus:null,status:"capture-missing",review:"See manual findings in docs/42-web-v3-current-acceptance.md; assembler assigns no pass",remaining:"Use the page-specific manual finding; metrics do not decide acceptance."};
 try{await access(capture);}catch{
  if(motionChanged) report={...report,status:"recapture-required",previousCapture,review:"Responsive selection motion changed; previous Chrome image is historical only. Fresh same-state capture required."};
  reports.push(report);continue;
 }
 const result=spawnSync(process.execPath,["tools/compare-web-design.mjs",design,capture,prefix,sharpPath,String(width),String(height),focus],{encoding:"utf8"});
 if(result.status!==0)throw new Error(`${prefix}: ${result.stderr}`);
 report={...report,comparison:`${prefix}-comparison.png`,focus:`${prefix}-focus.png`,status:"comparison-ready",diagnostic:JSON.parse(result.stdout)};
 reports.push(report);
}
await writeFile(`${folder}/${indexPrefix}-coverage-${date}.json`,JSON.stringify({date,status:"blocked",recordsPath:recordsPath??null,notCoveredByScreenshots:["Exact selected-card completion target","Transport delay/lost-ACK/reconnect ownership","Full real network ending/rematch"],reports},null,2)+"\n");
const figures=reports.map(r=>`<article><h2>${r.state} · ${r.profile}</h2><p>${r.status} / ${r.review}</p>${r.comparison?`<a href="${r.comparison.split('/').pop()}"><img loading="lazy" src="${r.comparison.split('/').pop()}" alt="左：ImageGen设计，右：Chrome当前实现"></a><p><a href="../../mockups/web-v3/${r.design.split('web-v3/')[1]}">原设计</a> · <a href="${r.focus.split('/').pop()}">聚焦对照</a> · <a href="${r.capture.split('/').pop()}">Chrome原图</a> · <a href="${r.capture.split('/').pop().replace(/\.png$/, '-overlay.png')}">50%叠图</a> · <a href="${r.capture.split('/').pop().replace(/\.png$/, '-metrics.json')}">诊断指标</a></p>`:`<p>当前实现未捕获；不得继承历史通过结论。</p>${r.previousCapture?`<a href="${r.previousCapture.split('/').pop()}">修复前历史截图（不作当前验收）</a>`:""}`}</article>`).join("\n");
await writeFile(`${folder}/${indexPrefix}-index-${date}.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Web v3 当前验收覆盖</title><style>body{margin:24px;background:#10151d;color:#f4e1b5;font:16px/1.5 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}img{width:100%}a{color:inherit}h2{font-size:18px}</style><h1>Web v3 当前验收覆盖 · ${date}</h1><p>${states.length}个页面/状态 × 双画幅。原稿与Chrome实拍联合比较；夹具不证明真实网络行为。每项人工结论见 docs/42-web-v3-current-acceptance.md，当前整体 blocked。缺失状态明确显示；捕获数量和诊断指标均不表示通过。</p><main>${figures}</main></html>`);
console.log(JSON.stringify({total:reports.length,captured:reports.filter(r=>r.comparison).length,missing:reports.filter(r=>!r.comparison).map(r=>[r.state,r.profile])}));
