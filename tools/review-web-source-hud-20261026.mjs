import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const modulePath=process.argv[2]??'sharp',batch=Number(process.argv[3]??129),initial=process.argv[4]==='initial',partial=process.argv[4]==='partial',sharp=createRequire(import.meta.url)(modulePath),root='art/review/web-v3',folder=root+'/hud-source-calibration-20261026';
await mkdir(folder,{recursive:true});
const previous=JSON.parse(await readFile(root+'/gameplay-seats-calibration-20261026/coverage.json','utf8'));
const corrections=JSON.parse(await readFile('art/source/web-v3/hud-source-v1/copy-correction-provenance-v1.json','utf8'));
const reports=[],sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
for(const old of previous.reports){
 const {profile,state}=old;if(initial&&state!=='idle')continue;
 const tall=profile==='portrait',width=tall?390:1672,height=tall?694:941,actualBatch=batch>=135&&tall&&state.startsWith('bid')?135:batch>=133?(state==='notimer'?133:132):batch,prefix=`${actualBatch}-hud-${state}-${profile}-20261026`;
 const record=await readFile(`${root}/${prefix}.json`,'utf8').then(JSON.parse).catch(()=>null);if(!record){if(initial||partial)continue;throw Error('Missing capture '+prefix);}
 const correction=corrections.mapping.find(r=>r.profile===profile&&r.state===state);
 const source=correction?.output??old.source,capture=`${folder}/${state}-${profile}-chrome.png`,out=`${folder}/${state}-${profile}`;
 if(record.profile!==profile||record.viewport[0]!==width||Math.abs(record.viewport[1]-height)>1||!record.images||record.fonts!=='loaded')throw Error('Invalid capture '+prefix);
 for(const args of [['tools/stitch-web-chrome-tiles.mjs',`${root}/${prefix}.json`,capture,modulePath],['tools/compare-web-design.mjs',source,capture,out,modulePath,String(width),String(height)]]){const r=spawnSync(process.execPath,args,{encoding:'utf8'});if(r.status)throw Error(r.stderr||r.stdout);}
 await sharp(out+'-comparison.png').jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(out+'-comparison.jpg');
 const designW=tall?941:1672,designH=tall?1672:941;
 const boxes={trump:state.startsWith('chooser')?tall?[563,1102,101,58]:[1098,607,88,48]:tall?[294,918,367,90]:state.startsWith('bid')?[665,590,350,90]:[665,500,350,90],status:tall?[338,1003,270,62]:[657,591,365,73],action:tall?state.startsWith('dense')?[269,1067,405,112]:state.startsWith('bid')?[225,958,530,165]:[655,1490,286,160]:[1243,675,395,150]};
 const inputs=[await sharp(source).resize(width,height,{fit:'fill'}).png().toBuffer(),await readFile(capture)],layers=[],focusBoxes=[];
 for(const [n,[kind,rect]]of Object.entries(Object.entries(boxes))){const [x,y,w,h]=rect,region={left:Math.round(x/designW*width),top:Math.round(y/designH*height),width:Math.round(w/designW*width),height:Math.round(h/designH*height)};focusBoxes.push({kind,sourceRect:rect,captureRect:region});for(const [i,input]of inputs.entries())layers.push({input:await sharp(input).extract(region).resize(530,165,{fit:'contain',background:'#10151d'}).png().toBuffer(),left:i*538,top:Number(n)*173});}
 await sharp({create:{width:1068,height:519,channels:3,background:'#10151d'}}).composite(layers).png().toFile(out+'-focus.png');
 reports.push({profile,state,batch:actualBatch,source,sourceSha256:await sha(source),capture,captureSha256:await sha(capture),comparison:`${state}-${profile}-comparison.jpg`,focus:`${state}-${profile}-focus.png`,focusBoxes,record,status:'review-required-not-a-pass'});
}
await writeFile(folder+'/coverage.json',JSON.stringify({batch,scope:'Original fixed action art, original trump paper/prefix, dynamic suit state, local-turn furniture. Clock/round/mode/chooser and whole-page differences remain. Fixture evidence is not real network proof.',status:'review-required',reports},null,2)+'\n');
await writeFile(folder+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>原稿HUD与操作按钮</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}figure{margin:0}img{width:100%;display:block}a{color:inherit}</style><h1>原稿 HUD 与操作按钮 · ${reports.length}组</h1><p>左设计右Chrome。当前批次${batch}，全页仍未通过。局部从上到下：王牌、状态、动作；隐藏或遮挡区域不作视觉验收。原稿错误字与运行正确字暂有差异，具体见报告。</p><p><a href="coverage.json">来源及原生收据</a> · <a href="../../../../docs/65-web-v3-source-hud-and-actions.md">报告</a></p><main>${reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左设计右Chrome"></a><a href="${r.focus}">三个局部并排</a> · <a href="${r.capture.split('/').at(-1)}">Chrome原图</a></figure>`).join('')}</main></html>`);
console.log({folder,count:reports.length});
