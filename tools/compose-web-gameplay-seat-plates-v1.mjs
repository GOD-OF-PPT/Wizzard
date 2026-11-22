// ImageGen supplies only text-free interior texture. Original borders, studs,
// source coordinates and every pixel outside the glyph mask stay fixed.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp');
const folder='art/source/web-v3/gameplay-seats-v1',runtime='art/runtime/web-v3/gameplay-seats-v1';
const layout=JSON.parse(await readFile(`${runtime}/layout-v1.json`,'utf8'));
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)]??0;
function largest(w,h,predicate){const seen=new Uint8Array(w*h),groups=[];for(let i=0;i<seen.length;i++){if(seen[i]||!predicate(i))continue;seen[i]=1;const q=[i];for(let k=0;k<q.length;k++){const n=q[k],x=n%w,y=Math.floor(n/w);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&xx<w&&yy>=0&&yy<h){const j=yy*w+xx;if(!seen[j]&&predicate(j)){seen[j]=1;q.push(j);}}}groups.push(q);}groups.sort((a,b)=>b.length-a.length);const out=new Uint8Array(w*h);for(const i of groups[0]??[])out[i]=1;return out;}
function fillHoles(mask,w,h){const seen=new Uint8Array(w*h),q=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)if((!x||x===w-1||!y||y===h-1)&&!mask[y*w+x]&&!seen[y*w+x]){seen[y*w+x]=1;q.push(y*w+x);}for(let k=0;k<q.length;k++){const i=q[k],x=i%w,y=Math.floor(i/w);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&xx<w&&yy>=0&&yy<h){const j=yy*w+xx;if(!seen[j]&&!mask[j]){seen[j]=1;q.push(j);}}}return mask.map((v,i)=>v||!seen[i]?1:0);}
function dilate(mask,w,h,r){return Uint8Array.from(mask,(_,i)=>{const x=i%w,y=Math.floor(i/w);for(let yy=Math.max(0,y-r);yy<=Math.min(h-1,y+r);yy++)for(let xx=Math.max(0,x-r);xx<=Math.min(w-1,x+r);xx++)if(mask[yy*w+xx])return 1;return 0;});}
const reports=[];
for(const [profile,p]of Object.entries(layout.profiles)){
 const tall=profile==='portrait',source=`art/mockups/web-v3/${tall?'portrait/':''}25-gameplay-selection-idle-v2.png`,candidate=`${folder}/${profile}-name-stats-blank-candidate-v1.png`,meta=await sharp(candidate).metadata();
 const ref=tall?[14,1052,202,89]:[78,563,198,86],normalized=await sharp(candidate).resize(ref[2],ref[3],{fit:'fill'}).removeAlpha().raw().toBuffer(),master=tall?{name:[4,5,196,48],stats:[6,50,192,39]}:{name:[4,5,191,43],stats:[7,47,181,36]};
 for(const seat of p.seats)for(const kind of ['name','stats',...(seat.you?['you']:[])]){
  const [left,top,w,h]=seat[kind],before=await sharp(source).extract({left,top,width:w,height:h}).removeAlpha().raw().toBuffer(),after=Buffer.from(before),green=kind==='name';
  const body=fillHoles(largest(w,h,i=>{const [r,g,b]=before.subarray(i*3,i*3+3);return green?g>r*.83&&g>b*1.05&&r<105&&g<135:r>g*1.05&&g>b*1.05&&r<100&&g<78;}),w,h);
  const near=dilate(body,w,h,3),rim=dilate(body,w,h,6),alpha=new Uint8Array(w*h),glyph=new Uint8Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x,[r,g,b]=before.subarray(i*3,i*3+3),gold=r>90&&g>55&&b<r*.85&&g>b*1.08;
   alpha[i]=body[i]||near[i]||rim[i]&&gold?255:0;
   if(kind!=='you'&&x>18&&x<w-18&&y>5&&y<h-5&&body[i]&&r>110&&g>95&&b>65&&b>r*.35)glyph[i]=1;
  }
  // Protect source rim: all changed glyph/shadow pixels must remain strictly
  // inside the filled interior. Two pixel expansion includes the ink shadow.
  const expanded=dilate(glyph,w,h,4),quietROI=green?[21,6,w-42,h-12]:[12,4,w-24,h-8];
  const [ql,qt,qw,qh]=quietROI,mask=body.map((v,i)=>v&&i%w>=ql&&i%w<ql+qw&&Math.floor(i/w)>=qt&&Math.floor(i/w)<qt+qh?1:0);
  let changedPixels=0,changedOutsideMask=0,changedProtectedRim=0;
  if(kind!=='you'){
   const [mx,my,mw,mh]=master[kind],texture=await sharp(normalized,{raw:{width:ref[2],height:ref[3],channels:3}}).extract({left:mx,top:my,width:mw,height:mh}).resize(w,h,{fit:'fill'}).raw().toBuffer();
   const shifts=[0,1,2].map(c=>{const a=[];for(let i=0;i<w*h;i++)if(body[i]&&!expanded[i])a.push(before[i*3+c]-texture[i*3+c]);return median(a);});
   for(let i=0;i<w*h;i++)if(mask[i])for(let c=0;c<3;c++)after[i*3+c]=Math.max(0,Math.min(255,Math.round(texture[i*3+c]+shifts[c])));
  }
  const rgba=Buffer.alloc(w*h*4);for(let i=0;i<w*h;i++){if([0,1,2].some(c=>before[i*3+c]!==after[i*3+c])){changedPixels++;if(!mask[i])changedOutsideMask++;if(!body[i])changedProtectedRim++;}if(!alpha[i])continue;for(let c=0;c<3;c++)rgba[i*4+c]=after[i*3+c];rgba[i*4+3]=alpha[i];}
  const output=`${runtime}/${profile}-slot${seat.slot}-${kind}-v2.png`;await sharp(rgba,{raw:{width:w,height:h,channels:4}}).png().toFile(output);seat[kind+'Runtime']=output;
  seat.nameFont=tall?(seat.slot===0?28.5:seat.slot===5?27.5:27):(seat.slot===0?27:seat.slot===5?26:23.5);seat.statsFont=tall?(seat.slot===0?25:24):(seat.slot===0?21:19);seat.youFont=tall?32:28;
  seat.nameShift=tall?(seat.slot===0?-2:-1.5):[-2,-1.5,-2,-3.5,-2.5,-1.5][seat.slot];seat.statsShift=tall?-1.5:seat.slot===0?-.5:-1;
  reports.push({profile,slot:seat.slot,kind,source,sourceSha256:await sha(source),candidate:kind==='you'?null:candidate,candidateSha256:kind==='you'?null:await sha(candidate),candidateSize:[meta.width,meta.height],reference:ref,crop:[left,top,w,h],quietROI,output,sha256:await sha(output),glyphPixels:glyph.reduce((a,b)=>a+b,0),changedPixels,changedOutsideMask,changedProtectedRim});
  if(changedOutsideMask||changedProtectedRim||kind!=='you'&&changedPixels<50)throw Error('Invalid protected clean '+output);
 }
}
await writeFile(`${folder}/plate-provenance-v2.json`,JSON.stringify({method:'Builtin ImageGen blank texture normalized to source crop; bounded quiet interior ROI replaces glyphs and all shadows, median channel shift from quiet original interior. All source rim/studs/outside-mask RGB invariant. Source silhouette extracted from interior + adjacent original rim, no generated outline used. V1 isolated glyph replacement retained as history: residual texture followed the old glyph shapes.',reports},null,2)+'\n');
layout.localBidPortraitShift={y:148,canvas:[941,1672],source:'art/mockups/web-v3/portrait/10-bid-timer-v3.png',pending:'art/mockups/web-v3/portrait/17-bid-pending-timer-v3.png',scope:'Only local seat0 during local human bid normal/pending; source places it below the central modal. Other seats and other phases retain their independent source positions.'};
await writeFile(`${folder}/bid-position-v1.json`,JSON.stringify({...layout.localBidPortraitShift,sourceSha256:await sha(layout.localBidPortraitShift.source),pendingSha256:await sha(layout.localBidPortraitShift.pending),baseSource:'art/mockups/web-v3/portrait/25-gameplay-selection-idle-v2.png',parts:layout.profiles.portrait.seats[0]},null,2)+'\n');
await writeFile(`${runtime}/layout-v2.json`,JSON.stringify(layout,null,2)+'\n');
console.log(reports.map(r=>({profile:r.profile,slot:r.slot,kind:r.kind,changed:r.changedPixels,rim:r.changedProtectedRim})));
