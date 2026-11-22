import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const modulePath=process.argv[2]??'sharp',sharp=createRequire(import.meta.url)(modulePath),root='art/review/web-v3',folder=root+'/dense-hand-calibration-20261025';await mkdir(folder,{recursive:true});
const batch=Number(process.argv[3]??90),sourceVersion=batch===86?'v1':'v4';
const previous=await readFile(folder+'/coverage.json','utf8').then(JSON.parse).catch(()=>null),previousBatch=previous?.batch??86;
if(previous&&(previousBatch!==batch||previous.sourceVersion!==sourceVersion)){const history=folder+'/history-'+previousBatch+'-'+(previous.sourceVersion??'v1');await mkdir(history,{recursive:true});for(const file of await readdir(folder,{withFileTypes:true})){if(!file.isFile()||file.name.startsWith('before-'))continue;await copyFile(folder+'/'+file.name,history+'/'+file.name,1).catch(e=>{if(e.code!=='EEXIST')throw e;});}}
const records=JSON.parse(await readFile(root+`/${batch}-dense-capture-records-20261025.json`,'utf8')),reports=[];
if(records.length!==4)throw Error('Exactly four current records required; never accept an empty capture manifest');
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
for(const record of records){
 const {state,profile,prefix}=record,tall=profile==='portrait',w=tall?390:1672,h=tall?694:941,output=folder+`/${state}-${profile}-chrome.png`;
 if(record.fonts!=='loaded'||!record.images||record.status!==200||record.viewport[0]!==w||Math.abs(record.viewport[1]-h)>1||Math.abs(record.dpr-1)>.001)throw Error('Capture mismatch');
 const stitch=spawnSync(process.execPath,['tools/stitch-web-chrome-tiles.mjs',root+'/'+prefix+'.json',output,modulePath],{encoding:'utf8'});if(stitch.status)throw Error(stitch.stderr);
 const source=`art/mockups/web-v3/${tall?'portrait/':''}${state==='selected'?'28':'27'}-dense-hand-${state}-${sourceVersion}.png`,comparisonPrefix=folder+`/${state}-${profile}`,focus=tall?'55,490,285,185':'230,650,1030,245';
 const compare=spawnSync(process.execPath,['tools/compare-web-design.mjs',source,output,comparisonPrefix,modulePath,String(w),String(h),focus],{encoding:'utf8'});if(compare.status)throw Error(compare.stderr);
 await sharp(comparisonPrefix+'-comparison.png').jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(comparisonPrefix+'-comparison.jpg');
 reports.push({state,profile,source,sourceSha256:await hash(source),capture:output,captureSha256:await hash(output),comparison:`${state}-${profile}-comparison.jpg`,focus:`${state}-${profile}-focus.png`,record,status:'review-required-not-a-pass'});
}
for(const profile of ['landscape','portrait'])await copyFile(`${root}/85-dense-before-${profile}-20261025.png`,`${folder}/before-${profile}.png`);
await writeFile(folder+'/coverage.json',JSON.stringify({batch,sourceVersion,scope:'Four frozen eight-card design/Chrome comparisons. Tiles are unscaled native Chrome PNG clips at one frozen reduced-motion state. No real game/ACK acceptance inferred.',status:'blocked-review-required',reports},null,2)+'\n');
await writeFile(folder+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>奇术茶馆 · 密集手牌校准</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}figure{margin:0}img{display:block;width:100%}a{color:inherit}</style><h1>八牌可读性 · 当前四组</h1><p>左独立ImageGen及源像素归一化设计，右${batch}批次Chrome。12/9/8为设计栅格值；真实字体、图像、viewport/stage/DPR、分块捕获哈希逐图保存。卡牌字号/纸边、头像、HUD、背景/面板等差异继续保留，完整目标未通过。</p><p><a href="coverage.json">来源与捕获记录</a> · <a href="../../../../docs/60-web-v3-dense-hand-readability.md">本轮报告</a> · <a href="before-landscape.png">横屏修复前</a> · <a href="before-portrait.png">竖屏修复前</a></p><main>${reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左源设计，右Chrome"></a><p><a href="${r.focus}">无损局部</a> · <a href="${r.capture.split('/').at(-1)}">Chrome原图</a></p></figure>`).join('')}</main></html>`);
console.log(JSON.stringify({folder,comparisons:reports.length,status:'review-required'}));
