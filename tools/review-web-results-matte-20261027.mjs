import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const modulePath=process.argv[2]??'sharp',batch=Number(process.argv[3]??174),sharp=createRequire(import.meta.url)(modulePath),root='art/review/web-v3',folder=root+'/results-avatar-matte-20261027'+(batch===173?'/before-173':'');
await mkdir(folder,{recursive:true});
const previous=await readFile(folder+'/coverage.json','utf8').then(JSON.parse).catch(()=>null);
if(previous&&previous.batch!==batch){await mkdir(folder+'/history-'+previous.batch,{recursive:true});for(const f of await readdir(folder,{withFileTypes:true}))if(f.isFile())await copyFile(folder+'/'+f.name,folder+'/history-'+previous.batch+'/'+f.name,1).catch(e=>{if(e.code!=='EEXIST')throw e;});}
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),reports=[];
for(const profile of ['landscape','portrait'])for(const state of profile==='landscape'?['ranking3','ranking4','ranking5','results','ranking']:['ranking4','results']){
 const tall=profile==='portrait',count=/ranking[345]/.test(state)?Number(state.at(-1)):6,width=tall?390:1672,height=tall?694:941,prefix=`${batch}-matte-${state}-${profile}-20261027`,record=JSON.parse(await readFile(root+'/'+prefix+'.json','utf8'));
 if(record.rows.length!==count||!record.images||record.fonts!=='loaded')throw Error('Wrong current matte state '+prefix);
 const source=`art/mockups/web-v3/${tall?'portrait/':''}${count<6?`${35+count}-ranking-${count}-players-v1.png`:state==='results'?'06-results.png':'07-ranking.png'}`,capture=`${folder}/${state}-${profile}-chrome.png`,out=`${folder}/${state}-${profile}`;
 for(const args of [['tools/stitch-web-chrome-tiles.mjs',root+'/'+prefix+'.json',capture,modulePath],['tools/compare-web-design.mjs',source,capture,out,modulePath,String(width),String(height)]]){const p=spawnSync(process.execPath,args,{encoding:'utf8'});if(p.status)throw Error(p.stderr||p.stdout);}
 await sharp(out+'-comparison.png').jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(out+'-comparison.jpg');
 const inputs=[await sharp(source).resize(width,height,{fit:'fill'}).png().toBuffer(),await readFile(capture)],layers=[],cw=tall?941:1672,ch=tall?1672:941;
 const boxes=tall?(state==='results'?[[115,525,230,610],[110,1070,260,120]]:[[315,550,300,480],[315,870,300,130]]):state==='results'?[[338,259,270,460],[338,465,125,250]]:[[620,280,345,460],[620,count<6?({3:420,4:495,5:570})[count]:495,130,235]];
 for(const[n,[x,y,w,h]]of boxes.entries()){const rect={left:Math.round(x/cw*width),top:Math.round(y/ch*height),width:Math.round(w/cw*width),height:Math.round(h/ch*height)};for(const[i,input]of inputs.entries())layers.push({input:await sharp(input).extract(rect).resize(540,460,{fit:'contain',background:'#10151d'}).png().toBuffer(),left:i*548,top:n*468});}
 await sharp({create:{width:1096,height:936,channels:3,background:'#10151d'}}).composite(layers).png().toFile(out+'-focus.png');
 reports.push({profile,state,count,batch,source,sourceSha256:await sha(source),capture,captureSha256:await sha(capture),comparison:`${state}-${profile}-comparison.jpg`,focus:`${state}-${profile}-focus.png`,record,status:'review-required'});
}
await writeFile(folder+'/coverage.json',JSON.stringify({batch,status:'review-required',reports},null,2)+'\n');
if(!previous||previous.batch!==batch)for(const f of ['manual-review.json','verification.json'])await writeFile(folder+'/'+f,JSON.stringify({batch,status:'awaiting-current-review',finalResult:'blocked'},null,2)+'\n');
await writeFile(folder+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>结算头像下缘</title><style>body{padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}img{width:100%}a{color:inherit}figure{margin:0}</style><h1>结算头像下缘 · ${batch}批${reports.length}组</h1><p>左原设计，右Chrome。原图/透明裁片检查不代替本页面同态对照，当前需审视。</p><p><a href="${batch===173?'../../../../../':'../../../../'}docs/73-web-v3-results-avatar-lower-alpha.md">报告</a> · <a href="manual-review.json">人工记录</a></p><main>${reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左设计右Chrome"></a><p><a href="${r.focus}">头像及末位下缘局部</a></p></figure>`).join('')}</main></html>`);
console.log({folder,comparisons:reports.length});
