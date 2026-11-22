// Assemble actual Chrome bytes with independently saved ImageGen source edits.
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {readFile,writeFile,mkdir,copyFile} from "node:fs/promises";
const sharpPath=process.argv[2]??"sharp",sharp=createRequire(import.meta.url)(sharpPath);
const root="art/review/web-v3",folder=`${root}/semantic-state-calibration-20261025`;await mkdir(`${folder}/history`,{recursive:true});
const raw=JSON.parse(await readFile(`${root}/68-semantic-capture-records-20261025.json`,"utf8"));
const sources={bid:["10-bid.png","10-bid-timer-v3.png"],"bid-pending":["17-bid-pending-v1.png","17-bid-pending-timer-v3.png"],chooser:["11-chooser-inactive-hand-v5.png","11-chooser-inactive-hand-v5.png"],"chooser-pending":["18-chooser-pending-inactive-hand-v5.png","18-chooser-pending-inactive-hand-v5.png"]};
const hash=async p=>createHash("sha256").update(await readFile(p)).digest("hex"),reports=[];
for(const profile of ["landscape","portrait"])for(const state of Object.keys(sources)){
 const tall=profile==="portrait",width=tall?390:1672,height=tall?694:941,name=`68-${state}-${profile}-20261025.png`,record=raw.records.find(r=>r.name===name);
 if(!record||record.status!==200||record.viewport[0]!==width||Math.abs(record.viewport[1]-height)>1||Math.abs(record.dpr-1)>.001||!record.images||record.fonts!=="loaded")throw Error("Invalid capture "+name);
 const source=`art/mockups/web-v3/${tall?"portrait/":""}${sources[state][tall?1:0]}`,capture=`${folder}/${state}-${profile}-chrome.png`,prefix=`${folder}/${state}-${profile}`;
 await copyFile(`${root}/${name}`,capture);const meta=await sharp(capture).metadata();if(meta.width!==width||meta.height!==height)throw Error("Wrong PNG size");
 const focus=tall?(state.startsWith("bid")?"260,435,130,130":"42,510,275,130"):(state.startsWith("bid")?"450,230,800,680":"520,676,650,228");
 const result=spawnSync(process.execPath,["tools/compare-web-design.mjs",source,capture,prefix,sharpPath,String(width),String(height),focus],{encoding:"utf8"});if(result.status!==0)throw Error(result.stderr);
 const comparison=`${state}-${profile}-comparison.jpg`,focused=`${state}-${profile}-focus.png`;await sharp(`${prefix}-comparison.png`).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(`${folder}/${comparison}`);
 reports.push({state,profile,source,capture,comparison,focus:focused,sourceSha256:await hash(source),captureSha256:await hash(capture),record,metrics:JSON.parse(result.stdout),status:"review-required-not-pass"});
}
const history=[];for(const record of raw.records.filter(r=>!r.name.startsWith("68-"))){await copyFile(`${root}/${record.name}`,`${folder}/history/${record.name}`);history.push({...record,role:record.name.startsWith("66-")?"before-runtime-change":"intermediate-not-current"});}
await copyFile(`${root}/68-semantic-capture-records-20261025.json`,`${folder}/capture-records.json`);
await writeFile(`${folder}/coverage.json`,JSON.stringify({status:"blocked-review-required",scope:"Four states, two profiles; final68 only. DEV pending is not real ACK evidence.",reports,history},null,2)+"\n");
await writeFile(`${folder}/index.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>奇术茶馆 · 计时与禁用手牌 2026-10-25</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}figure{margin:0}img{display:block;width:100%}a{color:inherit}</style><h1>计时语义与禁用手牌 · 当前八组</h1><p>左：独立ImageGen局部修订稿；右：68批次Chrome。竖屏真人预测补齐计时器并使用独立空盘/动态数字；选择页底层禁用手牌原稿去掉旧选中光环。全页字体、卡面、头像、HUD与面板仍有P2；不作整体通过。66/67历史另存，提交来自DEV按钮，不能替代真实延迟ACK。</p><p><a href="coverage.json">捕获/哈希/来源</a> · <a href="../../../../docs/57-web-v3-timer-and-inactive-hand.md">本轮报告</a></p><main>${reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左设计，右Chrome"></a><p><a href="${r.focus}">无损局部对照</a> · <a href="${r.capture.split('/').at(-1)}">Chrome原图</a></p></figure>`).join("\n")}</main></html>`);
console.log(JSON.stringify({folder,comparisons:reports.length,history:history.length,status:"review-required"}));
