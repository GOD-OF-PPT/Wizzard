// One bounded ImageGen clock removal supplies two existing hand states.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),folder='art/source/web-v3/hud-clock-v1',runtime='art/runtime/web-v3/hud-clock-v1';
await mkdir(runtime,{recursive:true});
const profiles={landscape:{canvas:[1672,941],roi:[1320,450,270,225],modeRoi:[1453,8,200,65]},portrait:{canvas:[941,1672],roi:[688,940,253,249]}};
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),reports=[];
for(const [profile,p]of Object.entries(profiles)){
 const candidate=`${folder}/${profile}-dense-notimer-candidate-v1.png`,meta=await sharp(candidate).metadata();
 if(meta.width!==p.canvas[0]||meta.height!==p.canvas[1])throw Error('Unexpected candidate size');
 const [l,t,w,h]=p.roi,crop=await sharp(candidate).extract({left:l,top:t,width:w,height:h}).removeAlpha().raw().toBuffer(),rgba=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;for(let c=0;c<3;c++)rgba[i*4+c]=crop[i*3+c];rgba[i*4+3]=Math.round(255*Math.max(0,Math.min(1,x/6,y/6,(w-1-x)/6,(h-1-y)/6)));}
 const patch=`${runtime}/${profile}-dense-notimer-patch-v1.png`;await sharp(rgba,{raw:{width:w,height:h,channels:4}}).png().toFile(patch);
 for(const selected of [false,true]){
  const source=`art/mockups/web-v3/${profile==='portrait'?'portrait/':''}${selected?'28-dense-hand-selected-v4-copy-v1.png':'27-dense-hand-idle-v4-copy-v1.png'}`,before=await sharp(source).removeAlpha().raw().toBuffer(),after=Buffer.from(before),[cw,ch]=p.canvas;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=((y+t)*cw+x+l)*3,j=(y*w+x)*4,a=rgba[j+3]/255;for(let c=0;c<3;c++)after[i+c]=Math.round(before[i+c]*(1-a)+rgba[j+c]*a);}
  let modeSource=null,modeSourceSha256=null;
  if(p.modeRoi){modeSource='art/mockups/web-v3/14-gameplay-notimer-selection-v4-copy-v1.png';modeSourceSha256=await sha(modeSource);const [ml,mt,mw,mh]=p.modeRoi,mode=await sharp(modeSource).extract({left:ml,top:mt,width:mw,height:mh}).removeAlpha().raw().toBuffer();for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const i=((y+mt)*cw+x+ml)*3,j=(y*mw+x)*3;for(let c=0;c<3;c++)after[i+c]=mode[j+c];}}
  const allowed=[p.roi,...(p.modeRoi?[p.modeRoi]:[])];let changedOutside=0,changed=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const i=(y*cw+x)*3;if([0,1,2].every(c=>before[i+c]===after[i+c]))continue;changed++;if(!allowed.some(([l,t,w,h])=>x>=l&&x<l+w&&y>=t&&y<t+h))changedOutside++;}
  if(changedOutside)throw Error('Unrelated scene changed');
  const output=`art/mockups/web-v3/${profile==='portrait'?'portrait/':''}${selected?'32-dense-hand-notimer-selected-v1.png':'31-dense-hand-notimer-idle-v1.png'}`;await sharp(after,{raw:{width:cw,height:ch,channels:3}}).png().toFile(output);
  reports.push({profile,state:selected?'dense-notimer-selected':'dense-notimer-idle',source,sourceSha256:await sha(source),candidate,candidateSha256:await sha(candidate),canvas:p.canvas,roi:p.roi,allowed,modeSource,modeSourceSha256,patch,patchSha256:await sha(patch),output,sha256:await sha(output),changed,changedOutsideAllowedROIs:changedOutside,scope:'Clock and glow/cloud/shadow removal. Landscape uses original friend-mode badge from the existing no-timer source because timer=false fixture is a connected friend match, not local practice. Canonical sun/eight papers/selection/round/avatars/actions outside allowed ROIs preserved.'});
 }
}
await writeFile(`${runtime}/dense-notimer-layout-v1.json`,JSON.stringify({profiles},null,2)+'\n');
await writeFile(`${folder}/dense-notimer-provenance-v1.json`,JSON.stringify({method:'Built-in ImageGen local clock removal, exact canvas, bounded6px-feather patch. Shared clock ROI applies to previously independent idle/selected sources; unrelated generated paper/character/glyph drift rejected. Designs saved before runtime wiring.',reports},null,2)+'\n');
console.log(reports.map(r=>({profile:r.profile,state:r.state,changed:r.changed,outside:r.changedOutsideAllowedROIs})));
