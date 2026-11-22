// Narrow source/geometry/behavior/production audit for the results exit repair.
import {createRequire} from 'node:module';
import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),root='art/review/web-v3',folder=root+'/results-return-home-20261027';
const read=async p=>JSON.parse(await readFile(p,'utf8')),sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),checks=[],verify=(ok,note)=>{checks.push({ok,note});if(!ok)throw Error(note);};
const provenance=await read('art/source/web-v3/results-home-v2/provenance-v2.json'),coverage=await read(folder+'/coverage.json'),pixelProof=[];
verify(provenance.reports.length===8&&provenance.runtimeReports.length===4&&coverage.reports.length===8,'Eight revised sources/eight paired views/four runtime crops');
for(const r of provenance.reports){
 verify(await sha(r.source)===r.sourceSha256&&await sha(r.output)===r.sha256,'Source/output hashes '+r.profile+' '+r.view);
 const {data:a,info}=await sharp(r.source).removeAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(r.output).removeAlpha().raw().toBuffer(),[l,t,w,h]=r.allowed[0];let outside=0,changed=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*3;if([0,1,2].some(c=>a[i+c]!==b[i+c])){changed++;if(x<l||x>=l+w||y<t||y>=t+h)outside++;}}
 verify(changed>0&&!outside,'Only return-control ROI changed '+r.profile+' '+r.view);pixelProof.push({profile:r.profile,view:r.view,allowed:r.allowed[0],changedPixels:changed,changedOutsideROI:outside});
}
for(const r of provenance.runtimeReports)verify(await sha(r.output)===r.sha256,'Runtime crop hash '+r.output);
for(const r of coverage.reports){
 verify(await sha(r.source)===r.sourceSha256&&await sha(r.capture)===r.captureSha256,'Comparison hashes '+r.state+' '+r.profile);
 const rec=r.record,e=rec.exit??rec,button=(e.buttons??rec.buttons).find(b=>b.label==='返回首页'),canvas=e.canvas??rec.canvas;
 verify(!!button&&button.rect.height>=44&&button.rect.width>=44,'44px exit hit target '+r.profile+' '+r.state);
 verify(button.artRect.width<=button.rect.width+.1&&button.artRect.height<=button.rect.height+.1,'Authored art fits hit target '+r.profile+' '+r.state);
 const spec=provenance.profiles[r.profile],s=canvas.width/spec.canvas[0];
 verify(Math.abs(button.artRect.width-spec.rect[2]*s)<.1&&Math.abs(button.artRect.height-spec.rect[3]*s)<.1,'Return bitmap aspect preserved '+r.profile+' '+r.state);
 verify(Math.abs(button.artRect.x-(canvas.x+spec.rect[0]*s))<.2&&Math.abs(button.artRect.y-(canvas.y+spec.rect[1]/spec.canvas[1]*canvas.height))<.2,'Source return-control position '+r.profile+' '+r.state);
 const other=(e.buttons??rec.buttons).filter(b=>b!==button);verify(other.every(b=>button.rect.right<=b.rect.left||button.rect.left>=b.rect.right||button.rect.bottom<=b.rect.top||button.rect.top>=b.rect.bottom),'Return/footer hit targets disjoint '+r.profile+' '+r.state);
 verify(rec.fonts==='loaded'&&rec.images&&!rec.focusVisible&&rec.rows.length===6,'Ready six-row paired state without focus outline '+r.profile+' '+r.state);
}
const local=await read(root+'/177-results-exit-local-20261027.json'),sequence=local.steps.slice(0,8);
verify(JSON.stringify(sequence.map(s=>s.state.focus))===JSON.stringify(['继续下一轮','返回首页','查看总榜','继续下一轮','查看总榜','返回首页','继续下一轮','继续下一轮']),'Actual native Tab/Shift+Tab wrap and round Escape');
verify(sequence.every(s=>s.state.focusInDialog&&s.state.outerReturn===0),'Actual result focus contained and duplicate outer return absent');
verify(local.steps.find(s=>s.action==='Tab current ranking')?.state.focus==='返回首页'&&!local.steps.find(s=>s.action==='Escape current ranking')?.state.rank,'Actual current-ranking return/Escape');
const home=local.steps.at(-1).state;verify(home.home===1&&home.match===0&&home.results===0,'Local Enter disposes match and exposes one home');
const network=await read(root+'/179-results-exit-network-20261027.json'),cancel=network.steps.find(s=>s.action==='host cancel with Escape');
verify(cancel.state.focus==='返回首页'&&cancel.state.phase==='round-score'&&cancel.storage.keys.length===2,'Real network cancel restores trigger and retains room/session lease');
verify(network.batches.every(b=>!b.truncated&&!b.hasMore),'No buffered-event truncation in recorded round-exit batches');
for(const who of ['host','guest']){
 const sent=network.frames.filter(f=>f.who===who&&f.direction==='sent'&&f.type==='room.leave');verify(sent.length===1,'Exactly one actual confirmed leave '+who);
 verify(network.frames.some(f=>f.who===who&&f.direction==='received'&&f.ackCommandId===sent[0].requestId&&f.sequence>sent[0].sequence),'Matching authoritative leave ACK '+who);
 const last=network.steps.find(s=>s.action===(who==='host'?'host confirmed leave after response':'guest cleanup ACK observed'));
 verify(last.state.home===1&&last.state.match===0&&last.state.results===0&&!last.storage.keys.length,'One home and cleared persisted session/lease '+who);
}
const config=await read(root+'/network-round-result-exit-20261027/runtime.json');verify(config.config.roundScoreDelayMs===600000&&config.config.turnTimeoutMs===1200,'Accelerated isolated durations and result hold documented');
const output=[];for(const entry of await readdir('dist/assets',{withFileTypes:true}))if(entry.isFile())output.push({path:'dist/assets/'+entry.name,hash:await sha('dist/assets/'+entry.name)});
const js=(await Promise.all(output.filter(f=>f.path.endsWith('.js')).map(f=>readFile(f.path,'utf8')))).join('\n'),inline=[...js.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)].map(m=>createHash('sha256').update(Buffer.from(m[1],'base64')).digest('hex')),runtimeProof=[];
for(const r of provenance.runtimeReports){const hash=await sha(r.output),files=output.filter(f=>f.hash===hash).map(f=>f.path),inlined=inline.filter(h=>h===hash).length;verify(files.length+inlined>0,'Runtime bitmap emitted '+r.output);runtimeProof.push({source:r.output,sha256:hash,files,inlined});}
verify(!/results-home-v2\/(?:landscape|portrait)-(?:results|current-ranking)-candidate|design-review|result-exit=178/.test(js),'Generated candidates and DEV comparison routes excluded');
for(const f of ['177-results-exit-local-20261027.json','179-results-exit-network-20261027.json'])await copyFile(root+'/'+f,folder+'/'+f);
await copyFile('dist/web-build-report.json',folder+'/web-build-report.json');
await writeFile(folder+'/source-pixel-proof.json',JSON.stringify({method:'Independent decoded RGB comparison of original and revised source, all pixels audited',reports:pixelProof},null,2)+'\n');
await writeFile(folder+'/verification.json',JSON.stringify({scope:'Return-control source/geometry/native behavior/production only. Dynamic typography and overall fidelity remain open.',engineeringPassed:true,checks,runtimeProof,newRuntimeCrops:4,existingResultPNGs:70,activeResultPNGs:74,networkBoundary:network.captureBoundary},null,2)+'\n');
await writeFile(folder+'/manual-review.json',JSON.stringify({batch:178,reviewedViews:{full:8,focused:8},typography:'New return lettering is baked in the source bitmap; live nickname/score/round glyph differences remain open.',layout:'All eight source/Chrome pairs opened in small batches. Complete return plaque, authored aspect and source placement retained.44CSSpx hit area, footer disjointness verified.',color:'Original generated paper/gold retained. GPU texture sampling remains open.',imagery:'No avatar/scene redesign. Eight sources changed only inside measured return ROI; prior lower-alpha work stays wired.',content:'Round/current/final-round/current-final labels and data match. Real local/network return receipts separate from frozen fixtures.',captureBoundary:'Landscape CSS1672x942, raw clip/source1672x941; portrait390x694. Native click marker at canvas center retained in originals.',remaining:['live typography and texture/alpha sampling','complete focus/hover source artwork','other player counts/long names/recovery/timing source states','docs66 incomplete clock acceptance','new final-ranking full-match regression was not run'],finalResult:'blocked'},null,2)+'\n');
coverage.status='return-control-reviewed-keyboard-and-confirmed-leave-fixed-overall-P2-open';coverage.report='docs/74-web-v3-results-return-home-and-focus.md';await writeFile(folder+'/coverage.json',JSON.stringify(coverage,null,2)+'\n');
const manifest=await read('art/web-v3-manifest.json');manifest.version=Math.max(manifest.version,22);
const revisions=[['web.v3.results','06-results-home-v2.png'],['web.v3.portrait.results','portrait/06-results-home-v2.png'],['web.v3.currentRanking','33-current-ranking-home-v2.png','portrait/33-current-ranking-home-v2.png'],['web.v3.results.finalRound','34-results-final-round-home-v2.png','portrait/34-results-final-round-home-v2.png'],['web.v3.ranking.currentFinal','36-current-ranking-final-home-v2.png','portrait/36-current-ranking-final-home-v2.png']];
for(const[key,design,portraitDesign]of revisions){const a=manifest.assets[key];if(a.design!==design)a.previousDesign=a.design;a.design=design;if(portraitDesign){if(a.portraitDesign!==portraitDesign)a.previousPortraitDesign=a.portraitDesign;a.portraitDesign=portraitDesign;}}
manifest.assets['web.v3.results.returnHome']={design:'{06-results,33-current-ranking,34-results-final-round,36-current-ranking-final}-home-v2.png',portraitDesign:'portrait/{06-results,33-current-ranking,34-results-final-round,36-current-ranking-final}-home-v2.png',runtime:'results-home-v2/{profile}-{results,current-ranking}-back-v2.png',registry:'src/web/results-home-art.generated.ts',notes:'Inside nonterminal result dialog, live onExit;44px hit target and authored bitmap aspect. Final ranking uses existing footer.'};
manifest.resultsExitRevision={revision:178,report:coverage.report,comparisons:folder+'/coverage.json',provenance:'art/source/web-v3/results-home-v2/provenance-v2.json',sourceRevisions:8,newBusinessStates:0,savedDesignStateCount:manifest.savedDesignStateCount,profiles:2,countsAreCatalogOnly:true,newRuntimeCrops:4,existingResultPNGs:70,activeResultPNGs:74,localReceipt:folder+'/177-results-exit-local-20261027.json',networkReceipt:folder+'/179-results-exit-network-20261027.json',status:coverage.status,finalResult:'blocked'};
await writeFile('art/web-v3-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log({checks:checks.length,engineeringPassed:true,revisedSources:8,newRuntimeCrops:4,finalResult:'blocked'});
