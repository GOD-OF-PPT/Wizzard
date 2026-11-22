// Preserve authored scroll, 第/轮/每人/张 and separator; clean two live digits.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),folder='art/source/web-v3/hud-clock-v1',runtime='art/runtime/web-v3/hud-clock-v1';
await mkdir(folder,{recursive:true});await mkdir(runtime,{recursive:true});
const profiles={landscape:{canvas:[1672,941],frame:[8,90,217,164],rois:[[91,42,32,40],[109,96,21,29]],round:{x:83,y:37,width:48,height:48,font:46},hand:{x:103.5,y:94.5,width:32,height:31,font:31}},portrait:{canvas:[941,1672],frame:[6,108,258,181],rois:[[110,44,36,47],[132,109,23,31]],round:{x:100,y:39,width:56,height:57,font:55},hand:{x:124.5,y:107,width:38,height:35,font:33}}};
const clean=JSON.parse(await readFile('art/source/web-v3/hud-source-v1/trump-provenance-v1.json','utf8'));
const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)]??0,sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),reports=[];
for(const [profile,p]of Object.entries(profiles)){
 const paper=clean.reports.find(r=>r.profile===profile&&r.candidate),[pl,pt,pw,ph]=paper.strip;
 const texture=await sharp(paper.candidate).extract({left:pl,top:pt,width:pw,height:ph}).resize(331,75,{fit:'fill'}).extract({left:100,top:20,width:120,height:35}).png().toBuffer();
 for(const variant of ['normal','dense']){
  const source=`art/mockups/web-v3/${profile==='portrait'?'portrait/':''}${variant==='dense'?'27-dense-hand-idle-v4.png':'25-gameplay-selection-idle-v2.png'}`,[left,top,w,h]=p.frame,before=await sharp(source).extract({left,top,width:w,height:h}).removeAlpha().raw().toBuffer(),after=Buffer.from(before),ink=[];
  for(const [l,t,rw,rh]of p.rois){
   const fill=await sharp(texture).resize(rw,rh,{fit:'fill'}).removeAlpha().raw().toBuffer(),quiet=[];
   for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const i=((t+y)*w+l+x)*3;if(before[i]>165&&before[i+1]>125)quiet.push([x,y]);else if(before[i]<80&&before[i+1]<65)ink.push([...before.subarray(i,i+3)]);}
   const shifts=[0,1,2].map(c=>median(quiet.map(([x,y])=>before[((y+t)*w+x+l)*3+c]-fill[(y*rw+x)*3+c])));
   for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const i=((y+t)*w+x+l)*3,j=(y*rw+x)*3,a=Math.max(0,Math.min(1,x/2,y/2,(rw-1-x)/2,(rh-1-y)/2));for(let c=0;c<3;c++)after[i+c]=Math.round(before[i+c]*(1-a)+Math.max(0,Math.min(255,fill[j+c]+shifts[c]))*a);}
  }
  const rgba=Buffer.alloc(w*h*4);let changedOutside=0,changed=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*3,j=(y*w+x)*4;for(let c=0;c<3;c++)rgba[j+c]=after[i+c];rgba[j+3]=Math.round(Math.max(0,Math.min(1,x/2,y/2,(w-1-x)/2,(h-1-y)/2))*255);if([0,1,2].some(c=>before[i+c]!==after[i+c])){changed++;if(!p.rois.some(([l,t,ww,hh])=>x>=l&&x<l+ww&&y>=t&&y<t+hh))changedOutside++;}}
  if(changedOutside||!ink.length)throw Error('Missing source ink or protected change');
  const output=`${runtime}/${profile}-round-${variant}-v1.png`;await sharp(rgba,{raw:{width:w,height:h,channels:4}}).png().toFile(output);
  const reference=`${folder}/${profile}-round-${variant}-reference-v1.png`;await sharp(before,{raw:{width:w,height:h,channels:3}}).png().toFile(reference);
  const color=[0,1,2].map(c=>median(ink.map(v=>v[c])));reports.push({profile,variant,source,sourceSha256:await sha(source),frame:p.frame,rois:p.rois,candidate:paper.candidate,candidateSha256:await sha(paper.candidate),reference,referenceSha256:await sha(reference),output,sha256:await sha(output),color,changed,changedOutsideNumericROIs:changedOutside});
 }
}
await writeFile(`${runtime}/round-layout-v1.json`,JSON.stringify({profiles},null,2)+'\n');
await writeFile(`${folder}/round-provenance-v1.json`,JSON.stringify({method:'Original scroll frame, fixed Chinese and separator retained. Existing built-in ImageGen quiet paper supplies only two numeric ROIs, median-channel matched and2px feathered. Dynamic numbers use the licensed Tinos400 face with explicit Chrome bold synthesis. Normal and dense source scroll variants independent.',reports},null,2)+'\n');
console.log(reports.map(r=>({profile:r.profile,variant:r.variant,changed:r.changed,color:r.color,outside:r.changedOutsideNumericROIs})));
