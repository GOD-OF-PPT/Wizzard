import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),batch=Number(process.argv[3]??203),root='art/review/web-v3',folder=root+'/results-long-name-20261027';
await mkdir(folder,{recursive:true});const reports=[];
for(const profile of ['landscape','portrait'])for(const[state,sourceName]of Object.entries({'results-long-name':'42-results-long-name-v1','current-ranking-long-name':'43-current-ranking-long-name-v1','ranking-long-name':'44-ranking-long-name-v1','results-name-dialog':'45-results-name-dialog-v1'})){
 const prefix=`${batch}-${state}-${profile}`,record=JSON.parse(await readFile(`${root}/${prefix}.json`,'utf8')),capture=`${folder}/${state}-${profile}-chrome.png`,source=`art/mockups/web-v3/${profile==='portrait'?'portrait/':''}${sourceName}.png`;
 const receipt=spawnSync(process.execPath,['tools/stitch-web-chrome-tiles.mjs',`${root}/${prefix}.json`,capture,process.argv[2]],{encoding:'utf8'});if(receipt.status)throw Error(receipt.stderr||receipt.stdout);
 const[w,h]=record.viewport,normalized=`${folder}/${state}-${profile}-source.png`,sourceBuffer=await sharp(source).resize(w,h,{fit:'fill'}).png().toBuffer();await writeFile(normalized,sourceBuffer);
 const full=`${folder}/${state}-${profile}-pair.png`;await sharp({create:{width:w*2,height:h,channels:3,background:'#000'}}).composite([{input:sourceBuffer,left:0,top:0},{input:await readFile(capture),left:w,top:0}]).png().toFile(full);
 const rect=state==='results-name-dialog'?(profile==='landscape'?[480,295,712,350]:[20,247,350,194]):profile==='landscape'?(state==='results-long-name'?[425,270,280,75]:[725,290,450,70]):state==='results-long-name'?[92,221,95,42]:[178,230,129,47];
 const[left,top,width,height]=rect,a=await sharp(sourceBuffer).extract({left,top,width,height}).png().toBuffer(),b=await sharp(capture).extract({left,top,width,height}).png().toBuffer(),focus=`${folder}/${state}-${profile}-focus.png`;
 await sharp({create:{width:width*2,height,channels:3,background:'#000'}}).composite([{input:a,left:0,top:0},{input:b,left:width,top:0}]).resize(width*4,height*2,{kernel:'nearest'}).png().toFile(focus);
 const target=record.names[0].target;if(!target||target.width<44||target.height<44)throw Error('Missing44px name target');
 reports.push({profile,state,source,capture,full,focus,record,sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),captureSha256:createHash('sha256').update(await readFile(capture)).digest('hex')});
}
await writeFile(folder+'/coverage.json',JSON.stringify({batch,reports,finalResult:'blocked',note:'Fresh same-viewport Chrome pairs. Manual visual judgment and remaining typography gaps must be recorded separately.'},null,2)+'\n');
await writeFile(folder+'/index.html',`<!doctype html><meta charset="utf-8"><title>结算长昵称与名签对照</title><style>body{background:#251910;color:#f7e4bd;font-family:serif;margin:20px}img{max-width:100%;height:auto}section{margin:36px 0}a{color:#ffdc8d}</style><h1>结算长昵称与名签 · 202</h1><p>左：保存设计稿；右：Chrome当前同态。目录数量不等于通过数量。</p>${reports.map(r=>`<section><h2>${r.state} / ${r.profile}</h2><img src="${r.full.split('/').at(-1)}"><img src="${r.focus.split('/').at(-1)}"></section>`).join('')}`);
console.log({pairs:reports.length,folder});
