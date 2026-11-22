import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),folder='art/review/web-v3/hud-source-calibration-20261026',source='art/source/web-v3/hud-source-v1';
const read=async p=>JSON.parse(await readFile(p,'utf8')),sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),checks=[],verify=(ok,note)=>{checks.push({ok,note});if(!ok)throw Error(note);};
const coverage=await read(folder+'/coverage.json'),catalog=await read(source+'/catalog-v1.json'),actions=await read(source+'/action-provenance-v1.json'),trump=await read(source+'/trump-provenance-v1.json'),copy=await read(source+'/copy-correction-provenance-v1.json');
verify(coverage.batch===135&&coverage.reports.length===28,'28 current comparisons, revision135');
await mkdir(folder+'/raw',{recursive:true});
const hashCheck=async(p,expected)=>verify(await sha(p)===expected,'SHA '+p);
for(const r of actions.reports){
 await hashCheck(r.output,r.sha256);await hashCheck(r.source,r.sourceSha256);const reference=catalog.reports.find(v=>v.output===r.reference);verify(!!reference,'Cataloged original action reference');await hashCheck(r.reference,reference.sha256);
 const a=await sharp(r.reference).ensureAlpha().raw().toBuffer(),b=await sharp(r.output).ensureAlpha().raw().toBuffer();let changed=0;
 for(let i=0;i<b.length;i+=4)if(b[i+3]===255&&[0,1,2].some(c=>a[i+c]!==b[i+c]))changed++;
 verify(changed===0,'Original opaque action RGB '+r.profile+' '+r.state);
}
for(const r of trump.reports){await hashCheck(r.output,r.sha256);await hashCheck(r.source,r.sourceSha256);if(r.candidate)await hashCheck(r.candidate,r.candidateSha256);}
for(const r of copy.reports){
 await hashCheck(r.input,r.inputSha256);await hashCheck(r.output,r.sha256);await hashCheck(r.candidate,r.candidateSha256);
 const {data:a,info}=await sharp(r.input).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(r.output).ensureAlpha().raw().toBuffer(),[l,t,w,h]=r.rect;let changedOutside=0,alphaChanges=0;
 verify(a.length===b.length,'Preserved dimensions '+r.output);
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*4;if(a[i+3]!==b[i+3])alphaChanges++;if((x<l||x>=l+w||y<t||y>=t+h)&&[0,1,2].some(c=>a[i+c]!==b[i+c]))changedOutside++;}
 verify(!changedOutside&&!alphaChanges,'Only one glyph ROI; alpha invariant '+r.output);
}
let maxActionRectError=0;
for(const r of coverage.reports){
 await hashCheck(r.source,r.sourceSha256);await hashCheck(r.capture,r.captureSha256);
 const rec=r.record;
 verify(rec.images&&rec.fonts==='loaded'&&Math.abs(rec.dpr-1)<.001,'Decoded DPR1 '+r.state+' '+r.profile);
 if(r.state==='notimer')verify(rec.hasTimer==='false'&&rec.hand.filter(c=>c.selected).length===1&&rec.action.label==='确认出牌','No-timer selected, not idle '+r.profile);
 if(['selected','dense-selected','play-pending'].includes(r.state))verify(rec.hand.filter(c=>c.selected).length===1,'One selected card '+r.state+' '+r.profile);
 if(r.state.startsWith('bid'))verify(rec.bid==='2'&&!!rec.bidActionArt,'Native bid2 '+r.state+' '+r.profile);
 if(r.state.endsWith('pending'))verify(rec.pending&&rec.hand.every(c=>c.disabled),'Pending locks hand '+r.state+' '+r.profile);
 if(r.state.endsWith('-focus'))verify(rec.focusVisible===true&&!!rec.focus,'Native focus-visible '+r.state+' '+r.profile);
 if(!r.state.startsWith('chooser')&&!r.state.includes('connecting')&&!r.state.includes('session-ended')){
  const state=r.state.startsWith('bid')?r.state:r.state==='play-pending'?'pending':r.state==='notimer'||r.state==='selected'?'confirm':r.state==='dense-selected'?'dense-confirm':r.state==='dense-idle'?'dense-idle':'idle';
  const asset=actions.reports.find(v=>v.profile===r.profile&&v.state===state),art=state.startsWith('bid')?rec.bidActionArt:rec.actionArt;
  verify(!!asset&&!!art&&art.src.includes(asset.output.split('/').at(-1)),'Current action asset '+r.state+' '+r.profile);
  const [cw,ch]=r.profile==='portrait'?[941,1672]:[1672,941],[x,y,w,h]=asset.crop,expected=[rec.stage.x+x/cw*rec.stage.width,rec.stage.y+y/ch*rec.stage.height,w/cw*rec.stage.width,h/cw*rec.stage.width];
  for(const [i,key]of ['x','y','width','height'].entries())maxActionRectError=Math.max(maxActionRectError,Math.abs(art.rect[key]-expected[i]));
 }
 const recordPath=`art/review/web-v3/${rec.prefix}.json`;await copyFile(recordPath,folder+'/raw/'+rec.prefix+'.json');
 for(const tile of rec.tiles){verify(tile.status===200,'Stored Chrome tile '+tile.name);await copyFile('art/review/web-v3/'+tile.name,folder+'/raw/'+tile.name);await hashCheck(folder+'/raw/'+tile.name,await sha('art/review/web-v3/'+tile.name));}
}
verify(maxActionRectError<.08,'Action source rectangle error '+maxActionRectError+' CSS px');
const runtimePaths=new Set(actions.reports.map(r=>r.output));for(const r of trump.reports){runtimePaths.add(r.output);if(r.sun)runtimePaths.add(r.sun);}for(const p of ['landscape','portrait'])runtimePaths.add(`art/runtime/web-v3/hud-source-v1/${p}-trump-sun-name-v1.png`);for(const r of copy.reports.filter(r=>r.kind==='runtime-chooser'))runtimePaths.add(r.output);
verify(runtimePaths.size===26,'26 active runtime PNGs');
const productionFiles=await readdir('dist/assets'),runtimeProof=[];
const js=(await Promise.all(productionFiles.filter(f=>f.endsWith('.js')).map(f=>readFile('dist/assets/'+f,'utf8')))).join('\n');
const pngHashes=await Promise.all(productionFiles.filter(f=>f.endsWith('.png')).map(async f=>({path:'dist/assets/'+f,sha256:await sha('dist/assets/'+f)})));
const inlineHashes=[...new Set(js.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g)??[])].map(uri=>({sha256:createHash('sha256').update(Buffer.from(uri.split(',')[1],'base64')).digest('hex')}));
for(const p of runtimePaths){const sourceHash=await sha(p),match=pngHashes.filter(f=>f.sha256===sourceHash),inline=inlineHashes.filter(f=>f.sha256===sourceHash);verify(match.length+inline.length===1,'One emitted or inline content hash '+p);runtimeProof.push({source:p,production:match[0]?.path??'inline PNG in production JS',inline:!!inline.length,sha256:sourceHash});}
verify(!/design-review|reviewMatchController|corrected-candidate|source\/web-v3|LXGWWenKai-Regular\.ttf/.test(js),'No DEV / candidate / full-font source strings in production JS');
const real=await read('art/review/web-v3/134-hud-real-native-20261026.json'),selected=real.find(r=>r.event==='native-selected-legal-card'),played=real.find(r=>r.event==='native-confirm-play-acknowledged'),home=real.find(r=>r.event==='native-return-home');
verify(selected?.record.hand.some(c=>c.selected)&&selected.record.action.label==='确认出牌','Real native selection yields confirm');
verify(played?.card===selected.card&&played.record.hand.length===selected.record.hand.length-1&&!played.record.hand.some(c=>c.label===played.card),'Real native play removes selected card');
verify(home?.record.match===false&&home.record.dialogs===0&&home.snapshot.includes('茶馆入口'),'Actual home tree, no match/modal; selector home=false is not used as a home signal');
for(const name of ['134-hud-real-native-20261026.json','134-hud-real-post-play-20261026.json','134-hud-real-post-play-20261026.jpg'])await copyFile('art/review/web-v3/'+name,folder+'/'+name);
await copyFile('dist/web-build-report.json',folder+'/web-build-report.json');
const emittedFileRasters=new Set(runtimeProof.filter(r=>!r.inline).map(r=>r.production)).size,inlineRasterPayloads=new Set(runtimeProof.filter(r=>r.inline).map(r=>r.sha256)).size;
await writeFile(folder+'/verification.json',JSON.stringify({scope:'Source invariants, artifact integrity, state and rectangle contracts, real local interaction, production emission. Not a visual or networking pass.',batch:135,maxActionRectError,activeRuntimePNGs:26,emittedFileRasters,inlineRasterPayloads,runtimeProof,checks,passed:checks.every(c=>c.ok)},null,2)+'\n');
console.log({checks:checks.length,activeRuntimePNGs:runtimePaths.size,emittedFileRasters,inlineRasterPayloads,maxActionRectError,passed:true});
