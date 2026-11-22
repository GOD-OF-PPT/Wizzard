// Pixel/asset/geometry evidence audit. No approximation is called a page pass.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),root='art/review/web-v3',folder=root+'/results-avatar-matte-20261027';
const read=async p=>JSON.parse(await readFile(p,'utf8')),sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const checks=[],verify=(ok,note)=>{checks.push({ok,note});if(!ok)throw Error(note);},hash=async(p,h)=>verify(await sha(p)===h,'SHA '+p);
const provenance=await read('art/source/web-v3/results-avatar-matte-v3/provenance-v3.json'),before=await read(folder+'/before-173/coverage.json'),coverage=await read(folder+'/coverage.json');
verify(provenance.wired&&provenance.reports.length===24&&provenance.reports.filter(r=>r.eligible).length===10,'24 inspected avatars, ten scoped landscape replacements');
verify(coverage.batch===174&&coverage.reports.length===7&&before.batch===173&&before.reports.length===7,'Seven before173/after174 matching capture records');
const alphaProof=[],mapping=new Map();let totalAlphaChanges=0;
for(const r of provenance.reports){
 await hash(r.source,r.sourceSha256);await hash(r.previous,r.previousSha256);await hash(r.output,r.outputSha256);
 const {data:a,info}=await sharp(r.previous).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{data:b,info:out}=await sharp(r.output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 verify(info.width===out.width&&info.height===out.height,'Identical bitmap dimensions '+r.key+' '+r.profile+' '+r.state);
 let rgb=0,increased=0,protectedAlpha=0,changed=0,x0=info.width,y0=info.height,x1=-1,y1=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const i=(y*info.width+x)*4;for(let c=0;c<3;c++)if(a[i+c]!==b[i+c])rgb++;
  if(b[i+3]>a[i+3])increased++;
  if(a[i+3]!==b[i+3]){changed++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);if(y<info.height*.75)protectedAlpha++;}
 }
 verify(!rgb&&!increased&&!protectedAlpha,'Original RGB and entire upper75percent alpha invariant, no alpha growth '+r.profile+' '+r.state+' '+r.key);
 verify(changed===r.changedAlphaPixels,'Decoded alpha change count '+r.profile+' '+r.state+' '+r.key);
 verify(r.eligible?changed>0&&r.output.endsWith('-v3.png'):!changed&&r.output===r.previous,'Only ten intended assets versioned '+r.profile+' '+r.state+' '+r.key);
 const p={profile:r.profile,state:r.state,key:r.key,previous:r.previous,current:r.output,rgbByteChanges:rgb,protectedAlphaChanges:protectedAlpha,changedAlphaPixels:changed,changedRect:changed?[x0,y0,x1-x0+1,y1-y0+1]:null};
 alphaProof.push(p);mapping.set(r.previous,r.output);totalAlphaChanges+=changed;
}
await mkdir(folder+'/raw',{recursive:true});await mkdir(folder+'/before-173/raw',{recursive:true});
const pixels=[],reviews=[];
function geometry(r){return{canvas:r.canvas,rows:r.rows.map(row=>row.cells.map(c=>({text:c.text,rect:c.rect}))),buttons:r.buttons.map(b=>({label:b.label,disabled:b.disabled,rect:b.rect})),avatars:r.geometry.avatars.map(a=>({image:a.image,picture:a.picture})),names:r.geometry.names,numbers:r.geometry.numbers,furniture:r.geometry.furniture};}
for(const r of coverage.reports){
 const old=before.reports.find(o=>o.profile===r.profile&&o.state===r.state);await hash(r.source,r.sourceSha256);await hash(r.capture,r.captureSha256);await hash(old.capture,old.captureSha256);
 verify(old.sourceSha256===r.sourceSha256,'Same immutable design before/after '+r.profile+' '+r.state);
 verify(JSON.stringify(geometry(old.record))===JSON.stringify(geometry(r.record)),'All visible text/data/geometry and non-avatar art unchanged '+r.profile+' '+r.state);
 verify(r.record.images&&r.record.fonts==='loaded'&&Math.abs(r.record.dpr-1)<.001,'Ready current DPR1 '+r.profile+' '+r.state);
 const changedBoxes=[];
 for(const a of r.record.geometry.avatars){
  const path=new URL(a.src).pathname,p=alphaProof.find(p=>path.endsWith('/'+p.current.split('/').at(-1))),source=provenance.reports.find(v=>v.output===p?.current);
  verify(!!p,'Actual loaded avatar belongs to current registry '+a.src);
  if(!p.changedRect)continue;
  const[x,y,w,h]=p.changedRect,sw=a.image.width/source.rect[2],sh=a.image.height/source.rect[3];changedBoxes.push({left:a.image.x+x*sw-2,top:a.image.y+y*sh-2,right:a.image.x+(x+w)*sw+2,bottom:a.image.y+(y+h)*sh+2,key:p.key});
 }
 const {data:a,info}=await sharp(old.capture).removeAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(r.capture).removeAlpha().raw().toBuffer();let changed=0,max=0,outsideMax=0,outsideChanged=0,auxiliaryChanged=0;
 for(let i=0;i<info.width*info.height;i++){
  let d=0;for(let c=0;c<3;c++)d=Math.max(d,Math.abs(a[i*3+c]-b[i*3+c]));if(!d)continue;changed++;max=Math.max(max,d);
  const x=i%info.width,y=Math.floor(i/info.width),inCaps=changedBoxes.some(v=>x>=v.left&&x<=v.right&&y>=v.top&&y<=v.bottom);
  // Explicit non-product capture confounds retained in full-image statistics.
  const auxiliary=y===0||x<40&&y<40;
  if(auxiliary){auxiliaryChanged++;continue;}
  if(!inCaps){outsideChanged++;outsideMax=Math.max(outsideMax,d);}
 }
 verify(r.profile==='portrait'?changed===0:outsideMax<=1,'Native page change confined to lower caps outside declared pointer/top-edge capture regions '+r.profile+' '+r.state);
 pixels.push({profile:r.profile,state:r.state,fullImage:{changedPixels:changed,maxChannelDifference:max},outsideChangedAlphaRects:{changedPixels:outsideChanged,maxChannelDifference:outsideMax},auxiliaryChangedPixels:auxiliaryChanged,declaredAuxiliaryRegions:['topmost1pxrow','pointer rectangle x0..39/y0..39'],changedAlphaRects:changedBoxes,scope:'Full statistics include every pixel. Restricted statistic excludes only declared capture confounds, never a source-fidelity threshold.'});
 for(const pair of [[r.record,folder+'/raw'],[old.record,folder+'/before-173/raw']]){const[rec,destination]=pair;await copyFile(root+'/'+rec.prefix+'.json',destination+'/'+rec.prefix+'.json');for(const tile of rec.tiles){verify(tile.status===200,'Saved untouched Chrome tile '+tile.name);await copyFile(root+'/'+tile.name,destination+'/'+tile.name);}}
 const opened=r.profile==='landscape';reviews.push({profile:r.profile,state:r.state,fullOpened:opened,focusOpened:opened,reviewMethod:opened?'fresh-source-versus-Chrome full/focus':'entire decoded RGB identical before/after173',sourceSha256:r.sourceSha256,captureSha256:r.captureSha256,fullSha256:await sha(folder+'/'+r.comparison),focusSha256:await sha(folder+'/'+r.focus),status:'lower-neighbor-arc-fixed-other-P2-remain'});
 r.status='lower-neighbor-arc-fixed-other-P2-remain';r.rawRecord=folder+'/raw/'+r.record.prefix+'.json';
}
const prior=await read(root+'/ranking-counts-calibration-20261026/verification.json'),files=await readdir('dist/assets'),emitted=await Promise.all(files.map(async f=>({path:'dist/assets/'+f,sha256:await sha('dist/assets/'+f)}))),js=(await Promise.all(files.filter(f=>f.endsWith('.js')).map(f=>readFile('dist/assets/'+f,'utf8')))).join('\n'),inline=[...new Set(js.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g)??[])].map(v=>createHash('sha256').update(Buffer.from(v.split(',')[1],'base64')).digest('hex'));
const paths=[...new Set(prior.runtimeProof.map(r=>mapping.get(r.source)??r.source))],runtimeProof=[];
verify(paths.filter(p=>p.endsWith('.png')).length===70,'70 active result PNGs, replacements not additive');
for(const path of paths){const h=await sha(path),matches=emitted.filter(v=>v.sha256===h),inlines=inline.filter(v=>v===h);verify(matches.length+inlines.length===1,'Unique production content match '+path);runtimeProof.push({source:path,sha256:h,production:matches[0]?.path??'inlinePNG'});}
for(const r of provenance.reports.filter(r=>r.eligible))verify(!emitted.some(v=>v.sha256===r.previousSha256)&&!inline.includes(r.previousSha256),'Old contaminated v2 payload excluded '+r.previous);
verify(!/design-review|ranking-data|candidate-v3|source\/web-v3|\.ttf(?:["'?]|$)/.test(js),'No DEV/full candidates/source/TTF leakage');
const preview=await read(root+'/175-results-matte-preview-20261027.json');verify(preview.metricsOverrideCleared&&preview.record.images&&preview.record.fonts==='loaded'&&!preview.logs.length,'Normal-window preview ready after clearing metrics, no error/warn');
for(const f of ['175-results-matte-preview-20261027.json','175-results-matte-preview-20261027.jpg'])await copyFile(root+'/'+f,folder+'/'+f);await copyFile('dist/web-build-report.json',folder+'/web-build-report.json');
await writeFile(folder+'/alpha-pixel-proof.json',JSON.stringify({totalAlphaChanges,rgbByteChanges:0,upper75percentAlphaChanges:0,inspectedAvatars:24,replacedAvatars:10,unchangedAvatars:14,reports:alphaProof},null,2)+'\n');
await writeFile(folder+'/page-pixel-regression.json',JSON.stringify({beforeBatch:173,afterBatch:174,reports:pixels},null,2)+'\n');
await writeFile(folder+'/manual-review.json',JSON.stringify({batch:174,reviewedViews:{landscapeFull:5,landscapeFocused:5,portraitWholeRgbIdenticalRegression:2},typography:'Unchanged; live glyph/ink differences remain P2.',layout:'No geometry or data changes. Lower neighbor cap contamination removed; all fixed frame/action geometry retained.',color:'All avatarRGB unchanged; only lower-quarteralpha decreases. Pointer/topmostrow capture confounds explicitly separated in page proof.',imagery:'Ten final lower-only candidates reviewed against source/v2; upper-cap draft rejected before wiring to preserve ears/rim. Core/upperalpha retained. Source upper overlaps/GPU-edge differences not claimed closed.',content:'Same live DEV names/scores/ranks/actions before/after; no new actual game/network run or designs.',reviews,finalResult:'blocked'},null,2)+'\n');
await writeFile(folder+'/verification.json',JSON.stringify({batch:174,scope:'Alpha/source/production/native-page geometry and before/after pixel audit only; no overall design or actual gameplay acceptance.',engineeringPassed:true,checks,totalAlphaChanges,rgbByteChanges:0,upper75percentAlphaChanges:0,replacedAvatars:10,unchangedAvatars:14,runtimeSourcePNGs:70,runtimeNumericFonts:2,runtimeProof},null,2)+'\n');
coverage.status='lower-neighbor-arc-fixed-other-P2-remain';coverage.reviewedViews={landscapeFull:5,landscapeFocused:5,portraitRgbIdentical:2};coverage.report='docs/73-web-v3-results-avatar-lower-alpha.md';await writeFile(folder+'/coverage.json',JSON.stringify(coverage,null,2)+'\n');
await writeFile(folder+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>结算头像下缘</title><style>body{padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}img{width:100%}a{color:inherit}figure{margin:0}</style><h1>结算头像下缘 · 174批七组</h1><p>左原设计右Chrome。五横屏全景/局部已打开，二竖屏整图RGB完全不变。原RGB和上方75%alpha保护，下缘邻人弧线已修；动态字形/采样等P2仍未通过。</p><p><a href="../../../../docs/73-web-v3-results-avatar-lower-alpha.md">报告</a> · <a href="manual-review.json">人工记录</a> · <a href="alpha-pixel-proof.json">原像素保护</a> · <a href="page-pixel-regression.json">原生页面差异与光标/首行边界</a> · <a href="before-173/index.html">修改前</a></p><main>${coverage.reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左设计右Chrome"></a><p><a href="${r.focus}">头像与末位下缘局部</a></p></figure>`).join('')}</main></html>`);
console.log({checks:checks.length,totalAlphaChanges,rgbByteChanges:0,protectedAlphaChanges:0,replacedAvatars:10,unchangedAvatars:14,runtimePNGs:70,pagePixels:pixels.map(p=>({profile:p.profile,state:p.state,fullMax:p.fullImage.maxChannelDifference,outsideProductCapsMax:p.outsideChangedAlphaRects.maxChannelDifference})),engineeringPassed:true,finalResult:'blocked'});
