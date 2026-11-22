// Compare saved Chrome evidence after the shared hand geometry change.
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {mkdir,readFile,writeFile,copyFile} from "node:fs/promises";
const sharpPath=process.argv[2]??"sharp",sharp=createRequire(import.meta.url)(sharpPath);
const root="art/review/web-v3",folder=`${root}/selection-calibration-20261025/affected`;
await mkdir(folder,{recursive:true});
const records=JSON.parse(await readFile(`${root}/64-hand-capture-records-20261025.json`,"utf8")).records;
const sources={
 bid:["10-bid.png","10-bid.png"],
 "bid-pending":["17-bid-pending-v1.png","17-bid-pending-v2.png"],
 chooser:["11-chooser.png","11-chooser-no-play-v4.png"],
 "chooser-pending":["18-chooser-pending-v1.png","18-chooser-pending-no-play-v4.png"],
 reconnecting:["15-reconnecting-network-v2.png","15-reconnecting.png"],
 "session-ended":["16-session-ended-network-v3.png","16-session-ended-v2.png"],
};
const hash=async p=>createHash("sha256").update(await readFile(p)).digest("hex"),reports=[];
for(const record of records){
 const {state,profile,name}=record,tall=profile==="portrait",width=tall?390:1672,height=tall?694:941;
 if(record.status!==200||record.viewport[0]!==width||Math.abs(record.viewport[1]-height)>1||Math.abs(record.dpr-1)>.001||!record.images||record.fonts!=="loaded")throw Error("Invalid record: "+name);
 const source=`art/mockups/web-v3/${tall?"portrait/":""}${sources[state][tall?1:0]}`;
 const capture=`${folder}/${state}-${profile}-chrome.png`;
 await copyFile(`${root}/${name}`,capture);
 const meta=await sharp(capture).metadata();if(meta.width!==width||meta.height!==height)throw Error("Invalid PNG dimensions");
 const prefix=`${folder}/${state}-${profile}`;
 const result=spawnSync(process.execPath,["tools/compare-web-design.mjs",source,capture,prefix,sharpPath,String(width),String(height),tall?"30,190,330,465":"450,230,800,680"],{encoding:"utf8"});
 if(result.status!==0)throw Error(result.stderr);
 const comparison=`${state}-${profile}-comparison.jpg`,focus=`${state}-${profile}-focus.png`;
 await sharp(`${prefix}-comparison.png`).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(`${folder}/${comparison}`);
 reports.push({state,profile,source,capture,comparison,focus,sourceSha256:await hash(source),captureSha256:await hash(capture),record,metrics:JSON.parse(result.stdout),status:"blocked-P2-remain",reviewReport:"docs/56-web-v3-shared-hand-surface-recapture.md"});
}
await copyFile(`${root}/64-hand-capture-records-20261025.json`,`${folder}/capture-records.json`);
await writeFile(`${folder}/coverage.json`,JSON.stringify({scope:"Six shared-hand surfaces, two profiles, DEV fixtures; normal and pending reached by UI. Not network or whole-page acceptance.",status:"captured-and-reviewed-P2-remain",reviewReport:"docs/56-web-v3-shared-hand-surface-recapture.md",reviewedViews:{full:12,focused:12},reports},null,2)+"\n");
await writeFile(`${folder}/index.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>奇术茶馆 · 共用手牌复拍 2026-10-25</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}figure{margin:0}img{display:block;width:100%}a{color:inherit}</style><h1>共用手牌 · 六状态双画幅</h1><p>左源稿，右64批次Chrome。预测值2、提交通过真实按钮进入DEV夹具；不是延迟ACK/真实重连。共享手牌修复后旧50图降为历史，当前图不自动通过，字体/艺术/HUD仍有P2。</p><p><a href="../index.html">选牌几何与动效证据</a> · <a href="coverage.json">哈希与捕获条件</a></p><main>${reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左设计稿，右Chrome"></a><p><a href="${r.focus}">弹层与手牌无损近景</a> · <a href="${r.capture.split('/').at(-1)}">Chrome原图</a></p></figure>`).join("\n")}</main></html>`);
console.log(JSON.stringify({folder,comparisons:reports.length,status:"captured-and-reviewed-P2-remain"}));
