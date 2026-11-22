// Artifact verification for the source-background/Bold-face refinement.
// Screenshot geometry and byte checks are deliberately separate from visual QA.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),batch=Number(process.argv[3]??154),withStates=batch>=158,withModes=batch>=161;
const folder='art/review/web-v3/results-calibration-20261026';
const source='art/source/web-v3/results-source-v1';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const checks=[],verify=(ok,note)=>{checks.push({ok,note});if(!ok)throw Error(note);};
const hashCheck=async(p,h)=>verify(await sha(p)===h,'SHA '+p);
const coverage=await read(folder+'/coverage.json');
const original=await read(source+'/provenance-v1.json');
const current=await read(source+'/current-ranking-provenance-v1.json');
const backgrounds=await read(source+'/background-provenance-v1.json');
const layout=await read('art/runtime/web-v3/results-source-v1/layout-v1.json');
const font=await read('art/source/fonts/web-v3/results-bold-subset-v1.json');
const states=withStates?await read('art/source/web-v3/results-states-v1/provenance-v1.json'):{reports:[],runtimeReports:[]};
const modes=withModes?await read('art/source/web-v3/results-mode-states-v1/provenance-v1.json'):{reports:[],runtimeReports:[]};
const regular=withModes?(await read('art/source/fonts/web-v3/seat-subsets-v1.json')).reports.find(r=>r.family==='Tinos'):null;
verify(coverage.batch===batch&&coverage.reports.length===(withModes?14:withStates?10:6),'Current same-state comparison records '+batch);
verify(backgrounds.reports.length===4,'Four independently sourced backgrounds');
await mkdir(folder+'/raw',{recursive:true});
const backgroundChecks=[];
for(const r of backgrounds.reports){
  await hashCheck(r.source,r.sourceSha256);await hashCheck(r.donor,r.donorSha256);await hashCheck(r.output,r.sha256);
  const a=await sharp(r.source).removeAlpha().raw().toBuffer();
  const b=await sharp(r.output).removeAlpha().raw().toBuffer();
  const [w,h]=r.canvas,mask=new Uint8Array(w*h);
  for(const region of r.regions){
    const [l,t,rw,rh]=region.rect;
    for(let y=t;y<t+rh;y++)for(let x=l;x<l+rw;x++){
      const inside=region.circle?Math.hypot(x-region.circle[0],y-region.circle[1])<region.circle[2]:x>l&&x<l+rw-1&&y>t&&y<t+rh-1;
      if(inside)mask[y*w+x]=1;
    }
  }
  let changed=0,outside=0;
  for(let p=0;p<w*h;p++)if([0,1,2].some(c=>a[p*3+c]!==b[p*3+c])){changed++;if(!mask[p])outside++;}
  verify(outside===0&&r.changedOutsideDynamicMasks===0,'No changes outside dynamic masks '+r.profile+' '+r.view);
  verify(changed===r.changed,'Recomputed changed count '+r.profile+' '+r.view);
  const staticFraction=1-mask.reduce((a,b)=>a+b,0)/(w*h);
  verify(Math.abs(staticFraction-r.originalStaticFraction)<1e-12,'Recomputed original static fraction '+r.profile+' '+r.view);
  backgroundChecks.push({profile:r.profile,view:r.view,changed,outside,staticFraction});
}
for(const r of original.reports){await hashCheck(r.source,r.sourceSha256);await hashCheck(r.output,r.sha256);}
for(const r of current.runtimeReports)await hashCheck(r.output,r.sha256);
for(const r of [...states.reports,...modes.reports]){
  await hashCheck(r.source,r.sourceSha256);await hashCheck(r.candidate,r.candidateSha256);await hashCheck(r.output,r.sha256);
  const {data:a,info}=await sharp(r.source).removeAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(r.output).removeAlpha().raw().toBuffer();
  let outside=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*3;if([0,1,2].every(c=>a[i+c]===b[i+c]))continue;if(!r.allowed.some(([l,t,w,h])=>x>=l&&x<l+w&&y>=t&&y<t+h))outside++;}
  verify(outside===0&&r.changedOutsideROI===0,'New state original RGB outside approved ROIs '+r.profile+' '+r.state);
}
for(const r of [...states.runtimeReports,...modes.runtimeReports])await hashCheck(r.output,r.sha256);
await hashCheck(font.source,font.sourceSha256);await hashCheck(font.runtime,font.runtimeSha256);
await hashCheck(font.license,font.licenseSha256);await hashCheck(font.publicLicense,font.licenseSha256);
verify(font.weight===700&&font.postscript==='Tinos-Bold'&&font.codepoints===95,'Actual Bold ASCII face');
if(regular){await hashCheck(regular.runtime,regular.runtimeSha256);await hashCheck(regular.source,regular.sourceSha256);}
let maxAvatarRectError=0,maxColumnCenterError=0;
for(const r of coverage.reports){
  await hashCheck(r.source,r.sourceSha256);await hashCheck(r.capture,r.captureSha256);
  const rec=r.record,p=layout.profiles[r.profile],s=p[r.state==='results'||r.state==='final-round'?'results':'ranking'],scale=rec.canvas.width/p.canvas[0];
  verify(rec.rows.length===6&&rec.images&&rec.fonts==='loaded'&&Math.abs(rec.dpr-1)<.001,'Decoded six-row DPR1 '+r.state+' '+r.profile);
  verify(!rec.geometry.horizontalOverflow&&!rec.geometry.verticalOverflow,'No result/document overflow '+r.state+' '+r.profile);
  for(const n of rec.geometry.names)verify(n.scrollWidth<=n.clientWidth+1,'Reference nickname fits '+n.text+' '+r.profile);
  for(const a of rec.geometry.avatars){verify(a.src.includes('-v2.png'),'Current v2 avatar matte');for(const k of ['x','y','width','height'])maxAvatarRectError=Math.max(maxAvatarRectError,Math.abs(a.picture[k]-a.image[k]));}
  rec.rows.forEach((row,index)=>row.cells.filter(c=>c.text!==rec.geometry.names[index].text).forEach((c,i)=>maxColumnCenterError=Math.max(maxColumnCenterError,Math.abs(c.rect.x+c.rect.width/2-(rec.canvas.x+s.columns[i]*scale)))));
  verify(rec.buttons.length===2&&rec.buttons.every(b=>b.rect.height>=43.9),'Two44px actions '+r.state+' '+r.profile);
  const labels=r.state==='results'?['查看总榜','继续下一轮']:r.state==='ranking'||r.state==='classic-ranking'?['返回首页','再来一局']:r.state==='final-round'?['查看总榜','查看最终总榜']:r.state==='guest-waiting'?['离开房间','等待房主再开']:r.state==='current-final'?['返回结算','查看最终总榜']:['返回结算','继续下一轮'];
  verify(JSON.stringify(rec.buttons.map(b=>b.label))===JSON.stringify(labels),'Correct action labels '+r.state+' '+r.profile);
  if(r.state==='final-round'){
    verify(rec.title.text==='第 8 轮结算'&&rec.actionArt[1].source.includes('final-round-primary'),'Last-round live numeral and canonical art '+r.profile);
    const {scoreBid}=await import('../packages/game-core/dist/index.js');
    verify(rec.rows.reduce((n,row)=>n+Number(row.cells[2].text),0)===8,'Final-round design has eight actual won tricks '+r.profile);
    verify(rec.rows.every(row=>scoreBid(Number(row.cells[1].text),Number(row.cells[2].text))===Number(row.cells[3].text)),'Final-round design scores match shared engine '+r.profile);
  }
  if(r.state==='guest-waiting')verify(!rec.buttons[0].disabled&&rec.buttons[1].disabled&&rec.actionArt.every(a=>a.source.includes('guest-waiting')),'Guest leave/wait permissions and canonical art '+r.profile);
  if(r.state==='classic-ranking')verify(rec.title.text==='经典局总榜'&&rec.geometry.numberTitle.some(n=>n.text==='10')&&rec.geometry.furniture.filter(f=>f.kind==='title'||f.kind==='subtitle').every(f=>f.src.includes('classic-ranking')),'Classic fixed title/subtitle and live10 '+r.profile);
  if(r.state==='current-final')verify(rec.title.text==='当前总榜'&&rec.geometry.numberTitle.some(n=>n.text==='8')&&rec.actionArt[1].source.includes('current-final-primary'),'Current8 canonical action and actual count '+r.profile);
  await copyFile('art/review/web-v3/'+rec.prefix+'.json',folder+'/raw/'+rec.prefix+'.json');
  for(const tile of rec.tiles){verify(tile.status===200,'Stored current raw PNG '+tile.name);await copyFile('art/review/web-v3/'+tile.name,folder+'/raw/'+tile.name);await hashCheck(folder+'/raw/'+tile.name,await sha('art/review/web-v3/'+tile.name));}
}
verify(maxAvatarRectError<.02,'Avatar image/picture rectangles '+maxAvatarRectError);
verify(maxColumnCenterError<.05,'Numeric source-column centers '+maxColumnCenterError);
const files=await readdir('dist/assets');
const js=(await Promise.all(files.filter(f=>f.endsWith('.js')).map(f=>readFile('dist/assets/'+f,'utf8')))).join('\n');
const emitted=await Promise.all(files.map(async f=>({path:'dist/assets/'+f,hash:await sha('dist/assets/'+f)})));
const inline=[...new Set(js.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g)??[])].map(uri=>createHash('sha256').update(Buffer.from(uri.split(',')[1],'base64')).digest('hex'));
const runtimePaths=[...new Set([...original.reports,...current.runtimeReports,...backgrounds.reports,...states.runtimeReports,...modes.runtimeReports].map(r=>r.output))];
verify(runtimePaths.length===(withModes?64:withStates?58:52),'Current result PNG sources '+runtimePaths.length);
const runtimeProof=[];
for(const path of [...runtimePaths,font.runtime,...(regular?[regular.runtime]:[])]){
  const hash=await sha(path),matches=emitted.filter(e=>e.hash===hash),inlineMatches=inline.filter(h=>h===hash);
  verify(matches.length+inlineMatches.length===1,'One production byte match '+path);
  runtimeProof.push({source:path,sha256:hash,production:matches[0]?.path??'inlinePNG'});
}
for(const r of backgrounds.reports)verify(!emitted.some(e=>e.hash===r.donorSha256)&&!inline.includes(r.donorSha256),'Old full blank donor excluded '+r.donor);
verify(!/design-review|reviewMatchController|current-ranking-candidate|source\/web-v3|\.ttf(?:["'?]|$)/.test(js),'No DEV/candidate/fullTTF paths in production JS');
verify(!files.some(f=>/WebV3Rank-Tinos-Bold/.test(f)),'Rejected card-rank face is not emitted');
const native=await read('art/review/web-v3/156-results-font-native-20261026.json');
verify(native.probeStylesRemoved,'Temporary nickname-font probes removed');
verify(native.numbers.fonts.some(f=>f.postScriptName==='Tinos-Bold'&&f.isCustomFont),'Chrome actually renders Tinos-Bold digits');
verify(native.names.fonts.some(f=>f.postScriptName==='LXGWWenKai-Regular'),'Nickname family unchanged');
for(const state of ['results','ranking']){
  const prefix=`155-results-${state}-portrait-variants-20261026`,rec=await read('art/review/web-v3/'+prefix+'.json');
  verify(rec.rows.length===3&&rec.images&&rec.fonts==='loaded','Three-player decoded diagnostic '+state);
  verify(!rec.geometry.horizontalOverflow&&!rec.geometry.verticalOverflow,'Three-player no overflow '+state);
  if(state==='results')verify(rec.geometry.names[0].scrollWidth>rec.geometry.names[0].clientWidth,'Long nickname ellipsis is exercised');
  else verify(rec.title.text==='经典局总榜'&&rec.buttons[0].label==='离开房间'&&rec.buttons[1].disabled,'Classic guest disabled-rematch diagnostic');
  for(const suffix of ['.json','.png'])await copyFile('art/review/web-v3/'+prefix+suffix,folder+'/'+prefix+suffix);
}
for(const name of ['156-results-font-native-20261026.json','156-results-name-probes.json','156-results-name-probes-comparison-v2.png','156-results-name-runtime-baseline.png','156-results-name-regular-probe.png','156-results-name-medium-probe.png','156-results-name-zhenkai-probe.png'])await copyFile('art/review/web-v3/'+name,folder+'/'+name);
if(withStates){
  const real=await read('art/review/web-v3/159-results-real-terminal-flow-20261026.json'),proof=real.proof;
  const round=proof.find(r=>r.event==='round8'),middle=proof.find(r=>r.event==='current8'),back=proof.find(r=>r.event==='native-back-to-round8'),end=proof.find(r=>r.event==='final-ranking');
  verify(new Set(real.events.filter(e=>e.event==='round-score').map(e=>e.state.results)).size===8,'All eight actual random-practice score screens recorded');
  verify(round.record.title.text==='第 8 轮结算'&&middle.record.title.text==='当前总榜'&&end.record.title.text==='快速局总榜','Actual last-round/current/final headings');
  const totals=(r,isRank)=>r.rows.map(row=>[row.cells[isRank?1:0].text,row.cells.at(-1).text]);
  verify(JSON.stringify(totals(round.record,false))===JSON.stringify(totals(middle.record,true))&&JSON.stringify(totals(round.record,false))===JSON.stringify(totals(back.record,false))&&JSON.stringify(totals(middle.record,true))===JSON.stringify(totals(end.record,true)),'Actual final totals stable through current/back/terminal');
  verify(round.record.rows.reduce((n,row)=>n+Number(row.cells[2].text),0)===8,'Actual last round won-trick total8');
  verify(proof.find(r=>r.event==='native-rematch-round1').state.round==='第 1 轮'&&proof.find(r=>r.event==='native-rematch-round1').state.hand.length===1,'Actual rematch starts round1 with one card');
  verify(proof.find(r=>r.event==='native-return-home').snapshot.includes('茶馆入口'),'Actual rematch return-home action');
  verify(!new URL(real.events[0].state.url).searchParams.has('fast'),'Real practice has no fast query');
  const keyboard=await read('art/review/web-v3/160-results-guest-keyboard-20261026.json');
  verify(keyboard.length===2&&keyboard.every(r=>r.record.focus==='离开房间'&&r.record.buttons[1].disabled),'Guest initial/Tab focus stays on the only enabled action');
  const preview=await read('art/review/web-v3/160-results-final-preview-20261026.json');
  verify(preview.record.images&&preview.record.fonts==='loaded'&&preview.logs.length===0&&preview.metricsOverrideUsed===false,'Decoded normal-window preview without temporary metrics/errors');
  for(const name of ['159-results-real-terminal-flow-20261026.json','159-results-real-round8-20261026.jpg','159-results-real-current8-20261026.jpg','159-results-real-final-ranking-20261026.jpg','160-results-guest-keyboard-20261026.json','160-results-final-preview-20261026.json','160-results-final-preview-20261026.jpg'])await copyFile('art/review/web-v3/'+name,folder+'/'+name);
}
const freshView=r=>!withModes||['current-final','classic-ranking','current-ranking'].includes(r.state)||r.state==='final-round'&&r.profile==='portrait';
const pixelRegressions=[];
if(withModes){
 const previous=await read(folder+'/history-158/coverage.json'),diagnostics=await read('art/review/web-v3/164-results-mode-variants-20261026.json');
 const {getRoundHandCounts}=await import('../packages/game-core/dist/index.js');
 for(const r of diagnostics.variants){const expected=getRoundHandCounts(r.players,'classic').length;verify(r.number.text===String(expected)&&r.subtitle===`${expected}轮已毕 · 下回再会`&&r.number.weight==='400','Actual classic count slot '+r.profile+' '+r.players);}
 verify(diagnostics.nativeFont.fonts.some(f=>f.postScriptName==='Tinos-Regular'&&f.isCustomFont),'Native Regular subtitle numerals');
 verify(diagnostics.currentFinal.actionArt[1].source.includes('current-final-primary')&&diagnostics.escapeBack.title.text==='第 8 轮结算','Native Escape current8 back to round8');
 for(const r of coverage.reports.filter(r=>!['current-final','classic-ranking'].includes(r.state))){
  const old=previous.reports.find(o=>o.state===r.state&&o.profile===r.profile);verify(old.sourceSha256===r.sourceSha256,'Unchanged design for regression '+r.profile+' '+r.state);
  const a=await sharp(folder+'/history-158/'+r.state+'-'+r.profile+'-chrome.png').removeAlpha().raw().toBuffer(),b=await sharp(r.capture).removeAlpha().raw().toBuffer();let changed=0,max=0,sum=0;
  for(let i=0;i<a.length;i+=3){let d=0;for(let c=0;c<3;c++){const delta=Math.abs(a[i+c]-b[i+c]);sum+=delta;d=Math.max(d,delta);}if(d)changed++;max=Math.max(max,d);}
  verify(freshView(r)||max<=1,'Unreviewed regression is at most one RGB level '+r.profile+' '+r.state);
  pixelRegressions.push({profile:r.profile,state:r.state,changedPixels:changed,maxChannelDifference:max,meanChannelDifference:sum/a.length,reviewMethod:freshView(r)?'fresh-full-and-focus':'RGB-regression-against-opened158'});
 }
 await writeFile(folder+'/163-regression-pixels-vs-158.json',JSON.stringify({scope:'Full unscaled decoded RGB, no region excluded. Seven<=1level regressions carry forward158 existing differences; three larger cases and four new views freshly opened. Not source fidelity acceptance.',reports:pixelRegressions},null,2)+'\n');
 for(const b of [161,162]){const destination=folder+(b===161?'/before-161':'/history-162')+'/raw';await mkdir(destination,{recursive:true});for(const f of (await readdir('art/review/web-v3')).filter(f=>f.startsWith(b+'-results-')))await copyFile('art/review/web-v3/'+f,destination+'/'+f);}
 const preview=await read('art/review/web-v3/165-results-final-preview-20261026.json');verify(preview.metricsOverrideCleared&&preview.record.images&&preview.record.fonts==='loaded'&&!preview.logs.length,'Fresh normal-window classic preview');
 for(const name of ['164-results-mode-variants-20261026.json','164-classic-20-rounds-portrait-20261026.jpg','165-results-final-preview-20261026.json','165-results-final-preview-20261026.jpg'])await copyFile('art/review/web-v3/'+name,folder+'/'+name);
}
await copyFile('dist/web-build-report.json',folder+'/web-build-report.json');
for(const suffix of ['json','jpg'])await copyFile(`art/review/web-v3/157-results-final-preview-20261026.${suffix}`,`${folder}/157-results-final-preview-20261026.${suffix}`);
await writeFile(folder+'/verification.json',JSON.stringify({batch,scope:withModes?'Current163 source/production/geometry, new164 DEV count/font/Escape diagnostics and RGB regressions. Real159 practice is historical, mixed manual/timeout, no new actual match/network/visual pass.':'Current source/production/geometry and historical real159 practice; no actual network or visual pass.',checks,passed:true,backgroundChecks,maxAvatarRectError,maxColumnCenterError,runtimeSourcePNGs:runtimePaths.length,runtimeNumericFonts:withModes?2:1,runtimeProof,nativeFontReceipts:withModes?['156-results-font-native-20261026.json','164-results-mode-variants-20261026.json']:['156-results-font-native-20261026.json']},null,2)+'\n');
const reviews=[];
for(const r of coverage.reports){
  reviews.push({profile:r.profile,state:r.state,sourceSha256:r.sourceSha256,captureSha256:r.captureSha256,fullOpened:freshView(r),focusOpened:freshView(r),reviewMethod:freshView(r)?'fresh-full-and-focus':'whole-decoded-RGB-within1level-of-opened158',pixelRegression:pixelRegressions.find(p=>p.profile===r.profile&&p.state===r.state),fullSha256:await sha(folder+'/'+r.comparison),focusSha256:await sha(folder+'/'+r.focus),status:'source-mode-furniture-reviewed-live-glyph-P2-remain',notes:['Original source frame and independent source furniture retained; canonical fixed ink does not replace live values.','Classic numeric slot uses scoped Regular400; other result numerals retain Bold. Current8 action uses dedicated saved-state art.','Existing nickname/number/alpha/GPU differences remain; regression means no new visible change, not source-fidelity acceptance.']});
  r.status='background-drift-fixed-live-glyph-P2-remain';r.rawRecord=folder+'/raw/'+r.record.prefix+'.json';
}
const reviewedViews={full:reviews.filter(r=>r.fullOpened).length,focused:reviews.filter(r=>r.focusOpened).length,carriedByRgbRegression:reviews.filter(r=>!r.fullOpened).length,currentCaptureGroups:coverage.reports.length};
await writeFile(folder+'/manual-review.json',JSON.stringify({batch,reviewedViews,typography:'Classic title/subtitle and current8 canonical action now source-derived. Classic count Regular400 native164, ordinary numerals Bold native156. Dynamic glyph/sampling P2 remain.',layout:'Original layout and44px actions retained.162 classic count was too dark/high;163 scoped Regular and optical position correction reviewed. Other player counts are diagnostics without independent designs.',color:'Original source RGB invariant outside explicit ROIs; internal cleanup feather/texture still differs.',imagery:'Original v2 portraits and frame retained. Seven163 pairs freshly opened; seven<=1level full decoded-RGB regressions carry forward existing158 findings.',content:'Classic6/5/4/3player count10/12/15/20 stays live. Native current8 Escape back checked. Actual159 terminal/rematch is historical; actual network end/rematch/leave unverified.',diagnostics:withModes?['164-results-mode-variants-20261026.json','163-regression-pixels-vs-158.json']:['156-results-font-native-20261026.json'],reviews,finalResult:'blocked'},null,2)+'\n');
coverage.status='source-mode-furniture-reviewed-live-glyph-P2-remain';coverage.reviewedViews=reviewedViews;coverage.report=withModes?'docs/70-web-v3-current-final-and-classic-ranking.md':withStates?'docs/69-web-v3-results-final-and-guest-states.md':'docs/68-web-v3-results-background-and-font.md';
await writeFile(folder+'/coverage.json',JSON.stringify(coverage,null,2)+'\n');
await writeFile(folder+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>结算页与总榜校准</title><style>body{padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}img{width:100%}figure{margin:0}a{color:inherit}</style><h1>结算与关键状态 · ${batch}批${coverage.reports.length}组对照</h1><p>左原设计，右Chrome。${withModes?"7组本轮全景/局部审视，另7组与已审158整图RGB差异不超过1级并继承原差异。经典标题/实际轮数与末轮当前总榜新增独立设计，动态字形/采样/其他缺稿仍未通过。":"当前全景和局部均已逐组打开，动态字形/采样/缺稿仍未通过。"}</p><p><a href="../../../../${coverage.report}">当前报告</a> · <a href="manual-review.json">人工记录</a> · <a href="verification.json">工程核对</a> · <a href="history-${withModes?158:withStates?154:149}/index.html">历史</a></p><main>${coverage.reports.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左原设计右Chrome"></a><p><a href="${r.focus}">标题/首行/页脚局部</a></p></figure>`).join('')}</main><p>${withStates?'<a href="159-results-real-terminal-flow-20261026.json">真实终局/重开/回首页记录</a> · <a href="159-results-real-final-ranking-20261026.jpg">终局过渡帧（仅流程证据）</a> · ':''}<a href="155-results-results-portrait-variants-20261026.png">三人长昵称诊断</a> · <a href="155-results-ranking-portrait-variants-20261026.png">三人经典局非房主诊断</a> · <a href="156-results-name-probes-comparison-v2.png">字体对比</a></p></html>`);
console.log({batch,checks:checks.length,backgroundChecks,maxAvatarRectError,maxColumnCenterError,runtimePNGs:runtimePaths.length,runtimeNumericFonts:withModes?2:1,reviewedViews,engineeringPassed:true,finalResult:'blocked'});
