// Verify the saved source/capture/production chain. Does not grant visual QA.
import {readFile,writeFile,readdir,copyFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='art/review/web-v3',folder=root+'/recovery-source-calibration-20261025';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const checks=[];
async function check(path,expected){const actual=await sha(path);if(actual!==expected)throw Error('Hash mismatch '+path);checks.push({path,sha256:actual});}
const panels=await read('art/source/web-v3/recovery-source-v1/provenance-v3.json');
const focus=await read('art/source/web-v3/recovery-source-v1/focus-provenance-v2.json');
const hand=await read('art/source/web-v3/recovery-source-v1/inactive-hand-provenance-v3.json');
const layout=await read('art/runtime/web-v3/recovery-source-v1/layout-v3.json');
if(panels.reports.length!==4||focus.reports.length!==4||hand.reports.length!==2)throw Error('Incomplete source set');
for(const r of panels.reports){await check(r.source,r.sourceSha256);await check(r.output,r.sha256);if(r.changedSourceRGB)throw Error('Original panel RGB changed');}
for(const r of focus.reports){for(const [p,key]of [[r.source,'sourceSha256'],[r.candidate,'candidateSha256'],[r.output,'sha256'],[r.design,'designSha256']])await check(p,r[key]);if(r.changedOutsideRing||r.actionPixelChanges)throw Error('Focus modified protected source');}
await check(hand.source,hand.sourceSha256);await check(hand.candidate,hand.candidateSha256);
for(const r of hand.reports){await check(r.base,r.baseSha256);await check(r.output,r.outputSha256);if(r.changedOutsideROI||r.changedProtectedPaper||r.changedPixels!==11304)throw Error('Hand source protection failed');}
await check(hand.sceneRepair.output,hand.sceneRepair.sha256);
await mkdir(folder+'/raw',{recursive:true});
const coverage=await read(folder+'/coverage.json');
if(coverage.batch!==117||coverage.reports.length!==8||new Set(coverage.reports.map(r=>[r.profile,r.state,r.mode].join('/'))).size!==8)throw Error('Expected final eight unique views');
const geometry=[];
for(const r of coverage.reports){
 await check(r.source,r.sourceSha256);await check(r.capture,r.captureSha256);
 const tiles=await read(r.capture.replace(/\.png$/,'.tiles.json'));
 if(tiles.sha256!==r.captureSha256)throw Error('Stitch changed');
 for(const t of tiles.tiles){await check(root+'/'+t.name,t.sha256);await copyFile(root+'/'+t.name,folder+'/raw/'+t.name);}
 await copyFile(root+'/'+r.record.prefix+'.json',folder+'/raw/'+r.record.prefix+'.json');
 r.rawRecord=folder+'/raw/'+r.record.prefix+'.json';
 const g=r.record,p=layout.profiles[r.profile];
 if(!g.images||g.fonts!=='loaded'||!g.inert||g.art.ready!=='true'||g.focus.visible!==(r.mode==='focus')||(g.art.display==='block')!==(r.mode==='focus'))throw Error('Wrong loaded/focus/underlay state');
 const [x,y,w,h]=p.roi,expected={x:g.dialog.x+x/p.canvas[0]*g.dialog.width,y:g.dialog.y+y/p.canvas[1]*g.dialog.height,width:w/p.canvas[0]*g.dialog.width,height:h/p.canvas[1]*g.dialog.height};
 const maximum=Math.max(...Object.keys(expected).map(k=>Math.abs(g.panel[k]-expected[k])));
 if(maximum>.08||r.profile==='portrait'&&g.action.height<43.99)throw Error('Panel geometry or hit target changed');
 geometry.push({profile:r.profile,state:r.state,mode:r.mode,maxPanelLayoutErrorCSSPx:maximum,viewport:g.viewport,stage:g.dialog,action:g.action});
 r.status='original-panel-and-focus-reviewed-full-page-P2-remain';
}
const copyRecords=['114-real-recovery-progress-20261025.json','114-real-recovery-recovered-20261025.json','114-real-recovery-offline-20261025.jpg','115-real-recovery-terminal-20261025.json','115-real-recovery-terminal-20261025.jpg','115-real-recovery-cleared-20261025.json','118-recovery-focus-fallback-20261025.json','119-recovery-browser-final-20261025.json','119-recovery-home-20261025.jpg'];
for(const name of copyRecords){const bytes=await readFile(root+'/'+name);if(name.endsWith('.json')&&/"(?:resumeToken|inviteToken|roomSecret)"\s*:/.test(bytes.toString()))throw Error('Unexpected secret field');await copyFile(root+'/'+name,folder+'/'+name);checks.push({path:folder+'/'+name,sha256:await sha(folder+'/'+name)});}
const recovered=await read(folder+'/114-real-recovery-recovered-20261025.json'),cleared=await read(folder+'/115-real-recovery-cleared-20261025.json'),fallback=await read(folder+'/118-recovery-focus-fallback-20261025.json');
if(!recovered.sameIdentity||recovered.recovered.connection!=='已连接'||!cleared.cleared.home||cleared.cleared.hasSession||cleared.cleared.hasLease||!cleared.afterReload.title)throw Error('Real lobby receipt mismatch');
if(fallback.cases.length!==3||fallback.cases.slice(0,2).some(c=>c.record.art.ready!=='false'||c.record.art.display!=='none'||c.record.fallback.outlineStyle!=='solid'||!c.record.fallback.visible)||fallback.cases[2].record.art.display!=='block'||fallback.restored.fetchPatterns.length||fallback.restored.blockedURLs.length||fallback.restored.cacheDisabled)throw Error('Fallback/restore receipt mismatch');
const browser=await read(folder+'/119-recovery-browser-final-20261025.json');
if(!browser.home.state.home||!browser.home.state.images||browser.home.state.recovery||browser.gallery.state.figures!==8||browser.gallery.state.images.some(i=>!i.loaded)||browser.home.logs.length||browser.gallery.logs.length)throw Error('Final browser page not ready');
for(const t of fallback.tiles)await copyFile(root+'/'+t.name,folder+'/raw/'+t.name);
await copyFile(root+'/118-recovery-focus-fallback-landscape-20261025-x600-y300.png',folder+'/focus-fallback-button-chrome.png');
coverage.status='original-panel-and-focus-reviewed-full-page-P2-remain';coverage.reviewedViews={full:8,focused:8};coverage.reviewReport='docs/63-web-v3-recovery-source-panels.md';coverage.limitations=['Avatar/nameplates/HUD/rank/card-sampling P2 remain','Focus ring corner P3 remains in both source and implementation','34 saved states across two profiles is not 68 passes or complete required coverage','Real network proof is lobby only; no active-match/pending/lostACK/end/rematch claim'];
await writeFile(folder+'/coverage.json',JSON.stringify(coverage,null,2)+'\n');
const files=await readdir('dist/assets'),scripts=files.filter(n=>/\.(js|css)$/.test(n));
const markers=['design-review','review-leaf-5','DesignReview','reviewMatchController','trick-count','candidate.png','WebV3Rank-Tinos','Review Tinos'],matches=[];
for(const file of scripts){const body=await readFile('dist/assets/'+file,'utf8');for(const marker of markers)if(body.includes(marker))matches.push({file,marker});}
const forbidden=files.filter(n=>/candidate|provenance|measurement|reference|Tinos|WebV3Rank|reconnecting-panel|session-ended-panel|mask-proof|(?:reconnecting|session-ended)-focus-v1-|(?:reconnecting|session-ended)-v[12]-/i.test(n));
const production=[];
for(const path of [...panels.reports.map(r=>r.output),...focus.reports.map(r=>r.output),hand.sceneRepair.output]){const stem=path.split('/').at(-1).replace(/\.png$/,''),names=files.filter(n=>n.startsWith(stem+'-')&&n.endsWith('.png'));if(names.length!==1)throw Error('Missing/duplicate production raster '+stem);await check('dist/assets/'+names[0],await sha(path));production.push({source:path,file:names[0],bytes:(await stat('dist/assets/'+names[0])).size,sha256:await sha(path)});}
if(matches.length||forbidden.length||production.length!==9)throw Error('Production scan failed '+JSON.stringify({matches,forbidden}));
const diff=spawnSync('git',['diff','--check'],{encoding:'utf8'});if(diff.status)throw Error(diff.stdout+diff.stderr);
const manifest=await read('art/web-v3-manifest.json');if(manifest.version!==12||manifest.recoveryPanelRevision.batch!==117||manifest.recoveryPanelRevision.designStateCount!==34)throw Error('Manifest stale');
await writeFile(folder+'/verification.json',JSON.stringify({at:new Date().toISOString(),hashChecks:checks.length,checks,geometry,sourcePanelRGBChanges:0,focusOutsideRingChanges:0,focusActionRGBChanges:0,handOutsideROIChanges:0,handProtectedPaperChanges:0,reviewedViews:{full:8,focused:8},realNetworkScope:'Temporary loopback lobby only',fallbackScope:'Two image failures and one restored image; failure clips DPR1.25, no visual comparison pass',overallVisualResult:'blocked'},null,2)+'\n');
await writeFile(folder+'/build.json',JSON.stringify({typescript:{command:'npx tsc --noEmit',exitCode:0},webBuild:{command:'npm run web:build',exitCode:0,...await read('dist/web-build-report.json')},productionScan:{scripts:await Promise.all(scripts.map(async file=>({file,sha256:await sha('dist/assets/'+file)}))),markers,matches,forbidden,rasters:production},sources:await Promise.all(['src/components/RecoveryDialog.tsx','src/web-v3.css','art/runtime/web-v3/recovery-source-v1/layout-v3.json','art/runtime/web-v3/recovery-source-v1/focus-layout-v2.json'].map(async path=>({path,sha256:await sha(path)}))),diffCheck:{command:'git diff --check',exitCode:0},scope:'Engineering/source integrity only; not visual acceptance'},null,2)+'\n');
console.log({hashChecks:checks.length,comparisons:8,productionRasters:production.length,productionLeaks:matches.length,visualResult:'blocked'});
