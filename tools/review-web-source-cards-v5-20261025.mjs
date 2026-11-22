// Assemble captured Chrome states against frozen design sources. Comparisons
// are review inputs, never an automatic visual pass.
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {readFile,writeFile,mkdir,copyFile} from "node:fs/promises";
const sharpPath=process.argv[2]??"sharp",sharp=createRequire(import.meta.url)(sharpPath),root="art/review/web-v3",folder=`${root}/source-card-calibration-20261025`;
await mkdir(`${folder}/history`,{recursive:true});
const raw=JSON.parse(await readFile(`${root}/82-card-current-capture-records-20261025.json`,"utf8"));
const sources={
 idle:["25-gameplay-selection-idle-v2.png"],complete:["26-gameplay-selection-complete-v2.png"],notimer:["14-gameplay-notimer-selection-v4.png"],"play-pending":["19-play-pending-selection-v2.png"],
 bid:["10-bid.png","10-bid-timer-v3.png"],"bid-pending":["17-bid-pending-v1.png","17-bid-pending-timer-v3.png"],chooser:["11-chooser-inactive-hand-v5.png"],"chooser-pending":["18-chooser-pending-inactive-hand-v5.png"],
 reconnecting:["15-reconnecting-network-v2.png","15-reconnecting.png"],"session-ended":["16-session-ended-network-v3.png","16-session-ended-v2.png"],
};
const sha=async p=>createHash("sha256").update(await readFile(p)).digest("hex"),reports=[];
for(const profile of ["landscape","portrait"])for(const state of Object.keys(sources)){
 const tall=profile==="portrait",w=tall?390:1672,h=tall?694:941,name=`82-card-${state}-${profile}-20261025.png`,record=raw.records.find(r=>r.name===name);
 if(!record||record.status!==200||record.viewport[0]!==w||Math.abs(record.viewport[1]-h)>1||Math.abs(record.dpr-1)>.001||!record.images||record.fonts!=="loaded"||record.nativeFont.ready!=="loaded")throw Error("Invalid current capture "+name);
 if(!record.cards.every(c=>c.asset.includes(`${profile}-`)&&c.asset.includes('-v5-native.png')))throw Error("Wrong profile face in "+name);
 const source=`art/mockups/web-v3/${tall?"portrait/":""}${sources[state][tall?1:0]??sources[state][0]}`,capture=`${folder}/${state}-${profile}-chrome.png`,prefix=`${root}/83-source-card-${state}-${profile}-20261025`;
 await copyFile(`${root}/${name}`,capture);const m=await sharp(capture).metadata();if(m.width!==w||m.height!==h)throw Error("Wrong pixel dimensions");
 const focus=tall?(state.startsWith('bid')?"30,250,330,390":state==='reconnecting'||state==='session-ended'?"40,205,310,430":"42,505,275,130"):(state.startsWith('bid')?"450,230,800,680":state==='reconnecting'||state==='session-ended'?"430,220,820,680":"515,640,655,265");
 const result=spawnSync(process.execPath,["tools/compare-web-design.mjs",source,capture,prefix,sharpPath,String(w),String(h),focus],{encoding:"utf8"});if(result.status!==0)throw Error(result.stderr);
 const comparison=`${state}-${profile}-comparison.jpg`,focused=`${state}-${profile}-focus.png`;
 await sharp(`${prefix}-comparison.png`).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(`${folder}/${comparison}`);await copyFile(`${prefix}-focus.png`,`${folder}/${focused}`);
 reports.push({state,profile,source,capture,comparison,focus:focused,sourceSha256:await sha(source),captureSha256:await sha(capture),record,metrics:JSON.parse(result.stdout),status:"review-required-not-a-pass"});
}
const history=JSON.parse(await readFile(`${root}/81-card-final-capture-records-20261025.json`,"utf8")).records;
for(const record of history)await copyFile(`${root}/${record.name}`,`${folder}/history/${record.name}`);
await writeFile(`${folder}/history/records.json`,JSON.stringify(history,null,2)+"\n");await copyFile(`${root}/82-card-current-capture-records-20261025.json`,`${folder}/capture-records.json`);
await writeFile(`${folder}/coverage.json`,JSON.stringify({status:"blocked-review-required",scope:"Ten shared-card states, two profiles; current82 only, frozen sources unchanged. DEV pending is not real ACK evidence.",reports,historyCount:history.length},null,2)+"\n");
await writeFile(`${folder}/index.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>奇术茶馆 · 原卡面v5与动态数字 2026-10-25</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}figure{margin:0}img{display:block;width:100%}a{color:inherit}</style><h1>原卡面v5与动态数字 · 当前二十组</h1><p>左冻结设计，右82批次Chrome。四花色双画幅由原卡面逆旋转提取，内置ImageGen只供清字纸纹；数字保持实时，仍用Noto Serif校准。原稿不随实现改写。完整逐页/网络验收未通过，字体/头像/HUD/面板等P2和交互边界继续保留。</p><p><a href="coverage.json">来源、哈希与捕获条件</a> · <a href="../../../../docs/59-web-v3-source-card-faces-and-ranks.md">本轮报告</a> · <a href="../countdown-first-frame-20261025/after.json">真实计时首帧修复</a></p><main>${reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左冻结设计，右Chrome"></a><p><a href="${r.focus}">无损局部对照</a> · <a href="${r.capture.split('/').at(-1)}">Chrome原图</a></p></figure>`).join("\n")}</main></html>`);
console.log(JSON.stringify({folder,comparisons:reports.length,history:history.length,status:"review-required"}));
