// Original rings, hourglasses and 秒 stay raster; only the two digit ROI clears.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),folder='art/source/web-v3/hud-clock-v1',runtime='art/runtime/web-v3/hud-clock-v1';
await mkdir(runtime,{recursive:true});
const jobs=[
 {profile:'landscape',variant:'normal',canvas:[1672,941],tile:[1340,462,224,195],reference:'art/source/web-v3/hud-source-v1/landscape-timer-reference-v1.png',roi:[87,96,45,34],circle:[125,92,92],value:{x:86,y:94,width:46,height:38,font:38}},
 {profile:'portrait',variant:'normal',canvas:[941,1672],tile:[723,1182,211,193],reference:'art/source/web-v3/hud-source-v1/portrait-timer-reference-v1.png',roi:[76,97,45,35],circle:[114,93,93],value:{x:75,y:95,width:46,height:38,font:38}},
 {profile:'portrait',variant:'bid',canvas:[941,1672],tile:[665,1078,241,230],reference:'art/source/web-v3/hud-source-v1/portrait-bidTimer-reference-v1.png',roi:[96,113,43,35],circle:[132,111,98],value:{x:94.5,y:111,width:46,height:38,font:38}},
 {profile:'portrait',variant:'dense',canvas:[941,1672],tile:[688,940,253,249],reference:`${folder}/portrait-dense-clock-reference-v1.png`,roi:[110,127,43,34],circle:[147,121,101],value:{x:109,y:124,width:46,height:38,font:38}},
];
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)]??0;
function plane(points){const a=[[0,0,0,0],[0,0,0,0],[0,0,0,0]];for(const [x,y,d]of points){const v=[1,x,y];for(let r=0;r<3;r++){for(let c=0;c<3;c++)a[r][c]+=v[r]*v[c];a[r][3]+=v[r]*d;}}for(let i=0;i<3;i++){const s=a[i][i]||1;for(let c=i;c<4;c++)a[i][c]/=s;for(let r=0;r<3;r++)if(r!==i){const f=a[r][i];for(let c=i;c<4;c++)a[r][c]-=f*a[i][c];}}return a.map(r=>r[3]);}
function dilate(mask,w,h,r){return Uint8Array.from(mask,(_,i)=>{const x=i%w,y=Math.floor(i/w);for(let yy=Math.max(0,y-r);yy<=Math.min(h-1,y+r);yy++)for(let xx=Math.max(0,x-r);xx<=Math.min(w-1,x+r);xx++)if(mask[yy*w+xx])return 1;return 0;});}
function largest(mask,w,h){const seen=new Uint8Array(w*h),groups=[];for(let i=0;i<seen.length;i++){if(!mask[i]||seen[i])continue;const q=[i];seen[i]=1;for(let n=0;n<q.length;n++){const p=q[n],x=p%w,y=Math.floor(p/w);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const j=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&mask[j]&&!seen[j]){seen[j]=1;q.push(j);}}}groups.push(q);}groups.sort((a,b)=>b.length-a.length);const out=new Uint8Array(w*h);for(const i of groups[0]??[])out[i]=1;return out;}
function fillHoles(mask,w,h){const seen=new Uint8Array(w*h),q=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)if((!x||!y||x===w-1||y===h-1)&&!mask[y*w+x]&&!seen[y*w+x]){seen[y*w+x]=1;q.push(y*w+x);}for(let n=0;n<q.length;n++){const p=q[n],x=p%w,y=Math.floor(p/w);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const j=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&!mask[j]&&!seen[j]){seen[j]=1;q.push(j);}}}return mask.map((v,i)=>v||!seen[i]?1:0);}
const reports=[],profiles={landscape:{},portrait:{}};
for(const p of jobs){
 const [,,w,h]=p.tile,[l,t,rw,rh]=p.roi,candidate=`${folder}/${p.profile}-clock-digits-blank-candidate-v1.png`,normal=jobs.find(v=>v.profile===p.profile&&v.variant==='normal');
 const before=await sharp(p.reference).removeAlpha().raw().toBuffer(),after=Buffer.from(before),normalizedCandidate=await sharp(candidate).resize(normal.tile[2],normal.tile[3],{fit:'fill'}).png().toBuffer(),clean=await sharp(normalizedCandidate).extract({left:normal.roi[0],top:normal.roi[1],width:normal.roi[2],height:normal.roi[3]}).resize(rw,rh,{fit:'fill'}).removeAlpha().raw().toBuffer(),quiet=[],bright=[];
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const i=((y+t)*w+x+l)*3;if(before[i]<120&&before[i+1]<110)quiet.push([x,y]);if(before[i]>165&&before[i+1]>140&&before[i+2]>65)bright.push([...before.subarray(i,i+3)]);}
 const shifts=[0,1,2].map(c=>plane(quiet.map(([x,y])=>[x/(rw-1)-.5,y/(rh-1)-.5,before[((y+t)*w+x+l)*3+c]-clean[(y*rw+x)*3+c]])));
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const i=((y+t)*w+x+l)*3,j=(y*rw+x)*3,a=Math.max(0,Math.min(1,x/2,y/2,(rw-1-x)/2,(rh-1-y)/2));for(let c=0;c<3;c++){const [o,sx,sy]=shifts[c],shift=o+sx*(x/(rw-1)-.5)+sy*(y/(rh-1)-.5);after[i+c]=Math.round(before[i+c]*(1-a)+Math.max(0,Math.min(255,clean[j+c]+shift))*a);}}
 const [cx,cy,r]=p.circle,body=Uint8Array.from({length:w*h},(_,i)=>Math.hypot(i%w-cx,Math.floor(i/w)-cy)<r?1:0),gold=body.map((v,i)=>{const [rr,g,b]=before.subarray(i*3,i*3+3);return v||rr>120&&g>75&&g>rr*.53&&b>rr*.2&&b<rr*.93?1:0;}),mask=fillHoles(largest(dilate(gold,w,h,2),w,h),w,h),rgba=Buffer.alloc(w*h*4);let changed=0,changedOutside=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*3,j=(y*w+x)*4;if(mask[y*w+x]){for(let c=0;c<3;c++)rgba[j+c]=after[i+c];rgba[j+3]=255;}if([0,1,2].some(c=>before[i+c]!==after[i+c])){changed++;if(x<l||x>=l+rw||y<t||y>=t+rh)changedOutside++;}}
 if(changedOutside||bright.length<100)throw Error('Clock numeric ROI or original bright ink invalid');
 const output=`${runtime}/${p.profile}-clock-${p.variant}-v1.png`;await sharp(rgba,{raw:{width:w,height:h,channels:4}}).png().toFile(output);
 const color=[0,1,2].map(c=>median(bright.map(v=>v[c])));profiles[p.profile][p.variant]={canvas:p.canvas,tile:p.tile,value:{...p.value,color}};
 reports.push({...p,candidate,candidateSha256:await sha(candidate),referenceSha256:await sha(p.reference),shifts,color,changed,changedOutsideDigitROI:changedOutside,output,sha256:await sha(output)});
}
profiles.landscape.bid=profiles.landscape.normal;profiles.landscape.dense=profiles.landscape.normal;
await writeFile(`${runtime}/clock-layout-v1.json`,JSON.stringify({profiles},null,2)+'\n');
await writeFile(`${folder}/clock-provenance-v1.json`,JSON.stringify({method:'Only numeric ROI uses built-in ImageGen quiet dark-face texture, normalized and fitted to original quiet pixels with a per-channel affine color plane. Original 秒, hourglass, ring, ticks, cloud and other RGB stay. Original circle/connected gold silhouette extracted with2px gap closure. Other portrait poses use the same cleaned dark interior as a color registered patch, not generated frames.',reports},null,2)+'\n');
console.log(reports.map(r=>({profile:r.profile,variant:r.variant,changed:r.changed,outside:r.changedOutsideDigitROI,color:r.color})));
