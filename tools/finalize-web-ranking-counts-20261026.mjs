// Inspect stored source/production/Chrome evidence; no match or UI simulation.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getRoundHandCounts} from '../packages/game-core/dist/index.js';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),root='art/review/web-v3',folder=root+'/ranking-counts-calibration-20261026';
const read=async p=>JSON.parse(await readFile(p,'utf8')),sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const checks=[],verify=(ok,why)=>{checks.push({ok,why});if(!ok)throw Error(why);},hash=async(p,h)=>verify(await sha(p)===h,'SHA '+p);
const provenance=await read('art/source/web-v3/ranking-counts-v1/provenance-v1.json'),coverage=await read(folder+'/coverage.json'),layout=await read('art/runtime/web-v3/results-source-v1/layout-v1.json');
verify(coverage.batch===169&&coverage.reports.length===6,'Six current count/profile comparisons169');
verify(provenance.reports.length===6&&provenance.runtimeReports.length===6,'Six independent source states and six runtime rank patches');
await mkdir(folder+'/raw',{recursive:true});
for(const r of provenance.reports){
 await hash(r.source,r.sourceSha256);await hash(r.candidate,r.candidateSha256);await hash(r.output,r.sha256);
 const {data:a,info}=await sharp(r.source).removeAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(r.output).removeAlpha().raw().toBuffer(),mask=new Uint8Array(info.width*info.height);
 for(const region of r.allowed){const[l,t,w,h]=region.rect;for(let y=t;y<t+h;y++)for(let x=l;x<l+w;x++)if(region.circle?Math.hypot(x-region.circle[0],y-region.circle[1])<region.circle[2]:x>l&&x<l+w-1&&y>t&&y<t+h-1)mask[y*info.width+x]=1;}
 let changed=0,outside=0;for(let p=0;p<mask.length;p++)if([0,1,2].some(c=>a[p*3+c]!==b[p*3+c])){changed++;if(!mask[p])outside++;}
 verify(!outside&&!r.changedOutsideDynamicMasks&&changed===r.changed,'Recomputed original RGB protection '+r.profile+' '+r.count);
}
for(const r of provenance.runtimeReports){
 await hash(r.output,r.sha256);const[l,t,w,h]=r.rect;
 verify(r.occupiedRankRects.every(([x,y,rw,rh])=>l+w<=x||x+rw<=l||t+h<=y||y+rh<=t),'Patch disjoint from every occupied badge '+r.profile+' '+r.count);
 const footer=layout.profiles[r.profile].ranking.secondary;verify(t+h<=footer[1],'Empty patch stays above action footer '+r.profile+' '+r.count);
 const {data:actual,info}=await sharp(r.output).ensureAlpha().raw().toBuffer({resolveWithObject:true}),expected=await sharp(r.source).extract({left:l,top:t,width:w,height:h}).ensureAlpha().raw().toBuffer();let opaqueChanges=0;
 for(let p=0;p<info.width*info.height;p++)if(actual[p*4+3]===255&&[0,1,2].some(c=>actual[p*4+c]!==expected[p*4+c]))opaqueChanges++;
 verify(!opaqueChanges,'Runtime opaque patch pixels from saved state '+r.profile+' '+r.count);
}
const totals={3:['60','-10','-30'],4:['120','80','80','-20'],5:['120','80','80','0','-30']},ranks={3:['1','2','3'],4:['1','2','2','4'],5:['1','2','2','4','5']};
let maxPatchGeometryError=0;
for(const r of coverage.reports){
 await hash(r.source,r.sourceSha256);await hash(r.capture,r.captureSha256);
 const rec=r.record,p=layout.profiles[r.profile],patch=provenance.runtimeReports.find(v=>v.profile===r.profile&&v.count===r.count),art=rec.geometry.furniture.find(v=>v.kind==='empty-ranks'),[l,t,w,h]=patch.rect,expected={x:rec.canvas.x+l/p.canvas[0]*rec.canvas.width,y:rec.canvas.y+t/p.canvas[1]*rec.canvas.height,width:w/p.canvas[0]*rec.canvas.width,height:h/p.canvas[0]*rec.canvas.width};
 verify(rec.rank&&rec.rows.length===r.count&&rec.images&&rec.fonts==='loaded'&&Math.abs(rec.dpr-1)<.001,'Actual current ready count/DPR1 '+r.profile+' '+r.count);
 verify(!rec.geometry.horizontalOverflow&&!rec.geometry.verticalOverflow,'No count-page overflow '+r.profile+' '+r.count);
 verify(JSON.stringify(rec.rows.map(row=>row.cells[0].text))===JSON.stringify(ranks[r.count]),'Correct live ranks/ties '+r.profile+' '+r.count);
 verify(JSON.stringify(rec.rows.map(row=>row.cells.at(-1).text))===JSON.stringify(totals[r.count]),'Correct live negative/zero totals '+r.profile+' '+r.count);
 verify(!!art&&art.src.includes(`after-${r.count}-v1.png`),'Count-specific patch loaded '+r.profile+' '+r.count);
 for(const k of ['x','y','width','height'])maxPatchGeometryError=Math.max(maxPatchGeometryError,Math.abs(art.rect[k]-expected[k]));
 verify(rec.buttons.length===2&&rec.buttons.every(b=>b.rect.height>=43.9),'44px action targets '+r.profile+' '+r.count);
 verify(JSON.stringify(rec.buttons.map(b=>b.label))===JSON.stringify(['返回首页','再来一局']),'Canonical final actions '+r.profile+' '+r.count);
 for(const a of rec.geometry.avatars)verify(Math.abs(a.picture.width-a.image.width)<.02&&Math.abs(a.picture.height-a.image.height)<.02,'Avatar image fills original rect '+r.profile+' '+r.count);
 await copyFile(root+'/'+rec.prefix+'.json',folder+'/raw/'+rec.prefix+'.json');
 for(const tile of rec.tiles){verify(tile.status===200,'Saved untouched Chrome tile '+tile.name);await copyFile(root+'/'+tile.name,folder+'/raw/'+tile.name);}
 r.status='empty-rank-fix-reviewed-live-glyph-P2-remain';r.rawRecord=folder+'/raw/'+rec.prefix+'.json';
}
verify(maxPatchGeometryError<.05,'Patch source-coordinate error '+maxPatchGeometryError);
const regression=[];
for(const profile of ['landscape','portrait']){
 const rec=await read(root+`/170-ranking-6-${profile}-20261026.json`);verify(rec.rows.length===6&&!rec.geometry.furniture.some(f=>f.kind==='empty-ranks'),'Six players never receive empty patch '+profile);
 const a=await sharp(root+'/results-calibration-20261026/ranking-'+profile+'-chrome.png').removeAlpha().raw().toBuffer(),b=await sharp(folder+'/regression-6-'+profile+'.png').removeAlpha().raw().toBuffer();let max=0,changed=0;
 for(let i=0;i<a.length;i+=3){let d=0;for(let c=0;c<3;c++)d=Math.max(d,Math.abs(a[i+c]-b[i+c]));if(d)changed++;max=Math.max(max,d);}
 verify(max<=(profile==='landscape'?0:2),'Six-player whole decoded-RGB regression '+profile+' '+max);regression.push({profile,changedPixels:changed,maxChannelDifference:max,scope:'Runtime170 vs previously reviewed163, no region excluded; not source fidelity threshold.',manuallyReopened:profile==='portrait'});
 await copyFile(root+'/'+rec.prefix+'.json',folder+'/raw/'+rec.prefix+'.json');for(const tile of rec.tiles)await copyFile(root+'/'+tile.name,folder+'/raw/'+tile.name);
}
const diagnostics=await read(root+'/170-ranking-count-diagnostics-20261026.json');
for(const r of diagnostics.variants){verify(r.subtitle===`${getRoundHandCounts(r.players,'classic').length}轮已毕 · 下回再会`,'Actual classic round count '+r.profile+' '+r.players);verify(r.record.geometry.furniture.some(f=>f.kind==='empty-ranks'&&f.src.includes(`after-${r.players}-v1.png`)),'Classic shares correct empty-rank geometry '+r.profile+' '+r.players);}
verify(!diagnostics.result.geometry.furniture.some(f=>f.kind==='empty-ranks')&&diagnostics.current.geometry.furniture.some(f=>f.kind==='empty-ranks')&&!diagnostics.back.geometry.furniture.some(f=>f.kind==='empty-ranks'),'Patch appears only in rank view during native current/Escape flow');
verify(JSON.stringify(diagnostics.result.rows.map(r=>[r.cells[0].text,r.cells.at(-1).text]))===JSON.stringify(diagnostics.current.rows.map(r=>[r.cells[1].text,r.cells.at(-1).text])),'Actual current view preserves DEV totals/names');
await copyFile(root+'/170-ranking-count-diagnostics-20261026.json',folder+'/170-ranking-count-diagnostics-20261026.json');
const baseline=await read(root+'/results-calibration-20261026/verification.json'),files=await readdir('dist/assets'),emitted=await Promise.all(files.map(async f=>({path:'dist/assets/'+f,sha256:await sha('dist/assets/'+f)}))),js=(await Promise.all(files.filter(f=>f.endsWith('.js')).map(f=>readFile('dist/assets/'+f,'utf8')))).join('\n'),inline=[...new Set(js.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g)??[])].map(s=>createHash('sha256').update(Buffer.from(s.split(',')[1],'base64')).digest('hex'));
const runtimePaths=[...new Set([...baseline.runtimeProof.map(r=>r.source),...provenance.runtimeReports.map(r=>r.output)])],runtimeProof=[];
verify(runtimePaths.filter(p=>p.endsWith('.png')).length===70,'70 active result/rank PNG sources');
for(const path of runtimePaths){const h=await sha(path),matches=emitted.filter(f=>f.sha256===h),inlines=inline.filter(v=>v===h);verify(matches.length+inlines.length===1,'One production byte match '+path);runtimeProof.push({source:path,sha256:h,production:matches[0]?.path??'inlinePNG'});}
verify(!/design-review|ranking-data|ranking-[345]-players-v1|ranking-[345]-candidate|source\/web-v3|\.ttf(?:["'?]|$)/.test(js),'No DEV data/full designs/candidates/TTFs in production JS');
const preview=await read(root+'/171-ranking-count-preview-20261026.json');verify(preview.metricsOverrideCleared&&preview.record.images&&preview.record.fonts==='loaded'&&!preview.logs.length,'Normal-window count preview ready without temporary metrics/errors');
for(const name of ['171-ranking-count-preview-20261026.json','171-ranking-count-preview-20261026.jpg'])await copyFile(root+'/'+name,folder+'/'+name);
await copyFile('dist/web-build-report.json',folder+'/web-build-report.json');
await mkdir(folder+'/before-168/raw',{recursive:true});for(const f of (await readdir(root)).filter(f=>f.startsWith('168-ranking-3-')))await copyFile(root+'/'+f,folder+'/before-168/raw/'+f);
const reviews=[];for(const r of coverage.reports)reviews.push({profile:r.profile,count:r.count,fullOpened:true,focusOpened:true,fullSha256:await sha(folder+'/'+r.comparison),focusSha256:await sha(folder+'/'+r.focus),sourceSha256:r.sourceSha256,captureSha256:r.captureSha256,status:r.status,notes:['Unused badges removed, occupied badge/row/frame/avatars/actions remain original anatomy.','Tie2/2, zero and negative values are live DOM, DEV comparison data only.','Source type shapes, ink weights, alpha/GPU sampling and local paper texture still differ.']});
await writeFile(folder+'/manual-review.json',JSON.stringify({batch:169,reviewedViews:{countStatesFull:6,countStatesFocused:6,sixPlayerFullAndFocus:1},typography:'Fixed title/action source; live nickname/score/rank differences remain P2.',layout:'Unused badges closed; patch disjoint from occupied ranks and footer. Original row/column/avatar/action geometry unchanged.',color:'Original source RGB outside explicit masks unchanged; local paper cleanup differs.',imagery:'Independent ImageGen3/4/5states plus only empty-rank runtime patches. Original occupied identities retained; alpha/GPU edge P2.',content:'Native tied ranks and negative/zero totals; no fixed runtime scores. Classical/current combinations are integration diagnostics, not independent design acceptance.',reviews,finalResult:'blocked'},null,2)+'\n');
await writeFile(folder+'/verification.json',JSON.stringify({batch:169,scope:'Source/production/Chrome geometry and DEV value/state diagnostics only. No new actual match/network proof or pixel pass.',engineeringPassed:true,checks,maxPatchGeometryError,runtimeSourcePNGs:70,runtimeNumericFonts:2,runtimeProof,regression},null,2)+'\n');
coverage.status='empty-rank-fix-reviewed-live-glyph-P2-remain';coverage.reviewedViews={full:6,focused:6};coverage.report='docs/72-web-v3-ranking-counts-ties-and-negatives.md';await writeFile(folder+'/coverage.json',JSON.stringify(coverage,null,2)+'\n');
await writeFile(folder+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>三至五人总榜</title><style>body{padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}img{width:100%}a{color:inherit}figure{margin:0}</style><h1>三至五人总榜 · 169批六组同态对照</h1><p>左独立ImageGen设计，右Chrome。六全景/六局部已逐组打开，空名次框已修；动态字形/纸纹/采样仍未通过。DEV比分样例不冒充实际比赛。</p><p><a href="../../../../docs/72-web-v3-ranking-counts-ties-and-negatives.md">合同/报告</a> · <a href="manual-review.json">人工记录</a> · <a href="verification.json">工程核对</a> · <a href="before-168/index.html">修改前三人</a></p><main>${coverage.reports.map(r=>`<figure><figcaption>${r.count}人 · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左设计右Chrome"></a><p><a href="${r.focus}">数据/空名次/动作局部</a></p></figure>`).join('')}</main></html>`);
console.log({checks:checks.length,runtimePNGs:70,sourceDesigns:6,patches:6,maxPatchGeometryError,regression,engineeringPassed:true,finalResult:'blocked'});
