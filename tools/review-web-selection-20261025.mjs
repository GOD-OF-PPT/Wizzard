// Assemble only saved Chrome evidence and immutable source images.
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {mkdir,readFile,writeFile,copyFile} from "node:fs/promises";
const sharpPath=process.argv[2]??"sharp",sharp=createRequire(import.meta.url)(sharpPath);
const root="art/review/web-v3",folder=`${root}/selection-calibration-20261025`;
await mkdir(folder,{recursive:true});
const raw=JSON.parse(await readFile(`${root}/63-selection-capture-records-20261025.json`,"utf8"));
const states=[["idle","25-gameplay-selection-idle-v2.png"],["complete","26-gameplay-selection-complete-v2.png"],["notimer","14-gameplay-notimer-selection-v4.png"],["pending","19-play-pending-selection-v2.png"]];
const reports=[];
const hash=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
for(const profile of ["landscape","portrait"])for(const[state,file]of states){
 const tall=profile==="portrait",width=tall?390:1672,height=tall?694:941;
 const original=`63-selection-${state}-${profile}-20261025.png`,record=raw.records.find(r=>r.name===original);
 if(!record||record.rejected||record.viewport[0]!==width||Math.abs(record.viewport[1]-height)>1||Math.abs(record.dpr-1)>.001)throw Error("Wrong captured viewport: "+original);
 const capture=`${folder}/${state}-${profile}-chrome.png`;
 await copyFile(`${root}/${original}`,capture);
 const metadata=await sharp(capture).metadata();if(metadata.width!==width||metadata.height!==height)throw Error("Wrong saved pixel size");
 const design=`art/mockups/web-v3/${tall?"portrait/":""}${file}`,prefix=`${root}/63-selection-${state}-${profile}-20261025`;
 const result=spawnSync(process.execPath,["tools/compare-web-design.mjs",design,capture,prefix,sharpPath,String(width),String(height),tall?"42,505,275,130":"515,640,655,265"],{encoding:"utf8"});
 if(result.status!==0)throw Error(result.stderr);
 const comparison=`${state}-${profile}-comparison.jpg`,focus=`${state}-${profile}-focus.png`;
 await sharp(`${prefix}-comparison.png`).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(`${folder}/${comparison}`);
 await copyFile(`${prefix}-focus.png`,`${folder}/${focus}`);
 if(state==="idle"||state==="complete")await copyFile(`${root}/58-selection-${state}-${profile}-before-20261025.png`,`${folder}/${state}-${profile}-before.png`);
 reports.push({state,profile,design,capture,comparison,focus,sourceSha256:await hash(design),captureSha256:await hash(capture),record,status:"blocked-art-and-typography-P2",metrics:JSON.parse(result.stdout)});
}
const diagnostics=["61-native-selection-inputs-20261025.json","61-neighbor-audits-20261025.json","62-live-selection-motion-20261025.json","62-live-selection-settled-20261025.png","63-selection-capture-records-20261025.json"];
for(const mode of ["mouse","touch"])for(const profile of ["landscape","portrait"])diagnostics.push(`61-eight-${mode}-${profile}-20261025.png`);
for(const profile of ["landscape","portrait"])diagnostics.push(`61-eight-middle-${profile}-20261025.png`);
for(const file of diagnostics)await copyFile(`${root}/${file}`,`${folder}/${file}`);
const rejected=raw.records.filter(r=>r.rejected);
for(const r of rejected)await copyFile(`${root}/${r.name}`,`${folder}/${r.name}`);
await writeFile(`${folder}/coverage.json`,JSON.stringify({status:"blocked-not-a-pass",browser:"Chrome 3",scope:"Four hand states, two profiles; only the 63 batch is current",rejected,diagnostics,geometryAudit:"geometry-audit.json",reports},null,2)+"\n");
const items=reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左设计稿，右Chrome"></a><p><a href="${r.focus}">无损手牌对照</a> · <a href="${r.capture.split('/').at(-1)}">Chrome原图</a> · <a href="../../../mockups/web-v3/${r.profile==="portrait"?"portrait/":""}${r.design.split('/').at(-1)}">状态源稿</a></p></figure>`).join("\n");
await writeFile(`${folder}/index.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>奇术茶馆 · 选牌完成帧校准 2026-10-25</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}figure{margin:0}img{display:block;width:100%}a{color:inherit}</style><h1>选牌成对状态 · 源坐标与Chrome</h1><p>左：ImageGen局部修补与原稿卡面几何合成的独立源稿；右：63批次Chrome。未选、选中完成、无计时、提交中共八组。卡框中心、12/9/8端点已核对；144个原生输入点与真实练习140ms/560ms记录另存，不能替代整页艺术/字体或真实联网验收。动态字形、卡面笔触、头像/HUD仍有P2，整体未通过。两张错误视口截图明确作废并保留。</p><main>${items}</main><h2>分层证据</h2><p><a href="geometry-audit.json">几何审计</a> · <a href="61-native-selection-inputs-20261025.json">144项原生输入</a> · <a href="62-live-selection-motion-20261025.json">真实练习动效</a> · <a href="62-live-selection-settled-20261025.png">真实两牌练习截图（非四牌设计比较）</a></p></html>`);
console.log(JSON.stringify({folder,comparisons:reports.length,rejected:rejected.length,status:"blocked"}));
