// Assemble native Chrome tiles and unchanged selected source at the same size.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const modulePath=process.argv[2]??'sharp',sharp=createRequire(import.meta.url)(modulePath),root='art/review/web-v3',folder=root+'/results-return-home-20261027';
await mkdir(folder,{recursive:true});
const sha=async path=>createHash('sha256').update(await readFile(path)).digest('hex'),reports=[];
const designs={results:'06-results-home-v2.png','current-ranking':'33-current-ranking-home-v2.png','final-round':'34-results-final-round-home-v2.png','current-final':'36-current-ranking-final-home-v2.png'};
for(const profile of ['landscape','portrait'])for(const[state,file]of Object.entries(designs)){
 const tall=profile==='portrait',width=tall?390:1672,height=tall?694:941,prefix=`178-results-exit-${state}-${profile}-20261027`,record=JSON.parse(await readFile(`${root}/${prefix}.json`)),source=`art/mockups/web-v3/${tall?'portrait/':''}${file}`,capture=`${folder}/${state}-${profile}-chrome.png`,out=`${folder}/${state}-${profile}`;
 if(!record.images||record.fonts!=='loaded'||record.rows.length!==6||record.rank!==state.startsWith('current')||record.focusVisible)throw Error('Wrong or focused state '+prefix);
 for(const args of [['tools/stitch-web-chrome-tiles.mjs',`${root}/${prefix}.json`,capture,modulePath],['tools/compare-web-design.mjs',source,capture,out,modulePath,String(width),String(height)]]){const p=spawnSync(process.execPath,args,{encoding:'utf8'});if(p.status)throw Error(p.stderr||p.stdout);}
 await sharp(out+'-comparison.png').jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(out+'-comparison.jpg');
 const inputs=[await sharp(source).resize(width,height,{fit:'fill'}).png().toBuffer(),await readFile(capture)],layers=[];
 const boxes=tall?[[10,15,280,115],[230,270,500,180],[145,1330,650,280]]:[[12,8,235,100],[640,68,440,148],[340,710,1080,150]];
 for(const[n,[x,y,w,h]]of boxes.entries()){const cw=tall?941:1672,ch=tall?1672:941,region={left:Math.round(x/cw*width),top:Math.round(y/ch*height),width:Math.round(w/cw*width),height:Math.round(h/ch*height)};for(const[i,input]of inputs.entries())layers.push({input:await sharp(input).extract(region).resize(650,200,{fit:'contain',background:'#10151d'}).png().toBuffer(),left:i*658,top:n*208});}
 await sharp({create:{width:1316,height:624,channels:3,background:'#10151d'}}).composite(layers).png().toFile(out+'-focus.png');
 reports.push({profile,state,source,sourceSha256:await sha(source),capture,captureSha256:await sha(capture),comparison:`${state}-${profile}-comparison.jpg`,focus:`${state}-${profile}-focus.png`,record,status:'review-required'});
}
await writeFile(folder+'/coverage.json',JSON.stringify({batch:178,reports,status:'review-required',actualCssBoundary:'Landscape requested1672x941 reports CSS1672x942. Raw clips1672x941 and source1672x941; stage/canvas recorded. Portrait390x694. No claim of whole-page pixel equality.'},null,2)+'\n');
await writeFile(folder+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>结算返回首页与焦点</title><style>body{padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}img{width:100%}a{color:inherit}figure{margin:0}</style><h1>结算返回首页 · 178批八组</h1><p>左修订源稿，右Chrome。局部入口与原有功能验证，整体字形/采样和缺稿仍待处理。</p><p><a href="../../../../docs/74-web-v3-results-return-home-and-focus.md">报告</a> · <a href="coverage.json">原生收据</a> · <a href="manual-review.json">人工审视</a></p><main>${reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左设计右Chrome"></a><p><a href="${r.focus}">入口、标题、页脚局部</a></p></figure>`).join('')}</main></html>`);
console.log({folder,groups:reports.length});
