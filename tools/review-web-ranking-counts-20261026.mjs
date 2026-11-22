import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const modulePath=process.argv[2]??'sharp',batch=Number(process.argv[3]??169),before=batch===168;
const sharp=createRequire(import.meta.url)(modulePath),root='art/review/web-v3',folder=root+'/ranking-counts-calibration-20261026'+(before?'/before-168':'');
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');await mkdir(folder,{recursive:true});
const previous=await readFile(folder+'/coverage.json','utf8').then(JSON.parse).catch(()=>null);
if(previous&&previous.batch!==batch){await mkdir(folder+'/history-'+previous.batch,{recursive:true});for(const f of await readdir(folder,{withFileTypes:true}))if(f.isFile())await copyFile(folder+'/'+f.name,folder+'/history-'+previous.batch+'/'+f.name,1).catch(e=>{if(e.code!=='EEXIST')throw e;});}
const reports=[];
for(const profile of ['landscape','portrait'])for(const count of before?[3]:[3,4,5]){
 const tall=profile==='portrait',width=tall?390:1672,height=tall?694:941,prefix=`${batch}-ranking-${count}-${profile}-20261026`,record=JSON.parse(await readFile(root+'/'+prefix+'.json','utf8'));
 if(!record.images||record.fonts!=='loaded'||record.rows.length!==count||!record.rank)throw Error('Wrong current count state '+prefix);
 const source=`art/mockups/web-v3/${tall?'portrait/':''}${35+count}-ranking-${count}-players-v1.png`,out=`${folder}/ranking-${count}-${profile}`,capture=out+'-chrome.png';
 for(const args of [['tools/stitch-web-chrome-tiles.mjs',root+'/'+prefix+'.json',capture,modulePath],['tools/compare-web-design.mjs',source,capture,out,modulePath,String(width),String(height)]]){const p=spawnSync(process.execPath,args,{encoding:'utf8'});if(p.status)throw Error(p.stderr||p.stdout);}
 await sharp(out+'-comparison.png').jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(out+'-comparison.jpg');
 const boxes=tall?[[205,552,545,325],[190,875,590,340],[175,1330,600,265]]:[[462,282,742,250],[450,515,780,225],[447,737,780,117]],inputs=[await sharp(source).resize(width,height,{fit:'fill'}).png().toBuffer(),await readFile(capture)],layers=[];
 for(const[n,[x,y,w,h]]of boxes.entries()){const cw=tall?941:1672,ch=tall?1672:941,rect={left:Math.round(x/cw*width),top:Math.round(y/ch*height),width:Math.round(w/cw*width),height:Math.round(h/ch*height)};for(const[i,input]of inputs.entries())layers.push({input:await sharp(input).extract(rect).resize(650,220,{fit:'contain',background:'#10151d'}).png().toBuffer(),left:i*658,top:n*228});}
 await sharp({create:{width:1316,height:684,channels:3,background:'#10151d'}}).composite(layers).png().toFile(out+'-focus.png');
 reports.push({profile,count,batch,source,sourceSha256:await sha(source),capture,captureSha256:await sha(capture),comparison:`ranking-${count}-${profile}-comparison.jpg`,focus:`ranking-${count}-${profile}-focus.png`,record,status:'review-required'});
}
await writeFile(folder+'/coverage.json',JSON.stringify({batch,status:'review-required',reports},null,2)+'\n');
if(!previous||previous.batch!==batch)for(const f of ['manual-review.json','verification.json'])await writeFile(folder+'/'+f,JSON.stringify({batch,status:'awaiting-current-review',finalResult:'blocked'},null,2)+'\n');
await writeFile(folder+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>三至五人总榜</title><style>body{padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}img{width:100%}a{color:inherit}figure{margin:0}</style><h1>三至五人总榜 · ${batch}批${reports.length}组</h1><p>左设计右Chrome，当前需人工审视。DEV并列/负分样例，不是实际比赛回包。</p><p><a href="../../../../docs/72-web-v3-ranking-counts-ties-and-negatives.md">合同/报告</a> · <a href="manual-review.json">人工记录</a></p><main>${reports.map(r=>`<figure><figcaption>${r.count}人 · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左设计右Chrome"></a><p><a href="${r.focus}">数据/空名次/动作局部</a></p></figure>`).join('')}</main></html>`);
console.log({folder,reports:reports.length});
