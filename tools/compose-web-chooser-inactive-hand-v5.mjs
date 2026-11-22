// Bounded composition of built-in ImageGen glow removal. Original paper,
// ranks, art, neighboring cards and the modal retain their exact source pixels.
import {createRequire} from "node:module";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
const sharp=createRequire(import.meta.url)(process.argv[2]??"sharp");
const folder="art/source/web-v3/chooser-inactive-hand-v5";
await mkdir(folder,{recursive:true});
const hash=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function hull(points){const p=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),lo=[],hi=[];for(const v of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),v)<=0)lo.pop();lo.push(v);}for(const v of p.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),v)<=0)hi.pop();hi.push(v);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
function distance(poly,x,y){let inside=true,d=Infinity;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1];if(dx*(y-a[1])-dy*(x-a[0])<0)inside=false;const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return inside?d:-d;}
const jobs={
 landscape:{source:"art/mockups/web-v3/11-chooser.png",pending:"art/mockups/web-v3/18-chooser-pending-v1.png",candidate:"art/source/web-v3/chooser-no-selected-glow-landscape-v1-candidate.png",canvas:[1672,941],measure:[510,690,680,211],roi:[528,690,176,207]},
 portrait:{source:"art/mockups/web-v3/portrait/11-chooser-no-play-v4.png",pending:"art/mockups/web-v3/portrait/18-chooser-pending-no-play-v4.png",candidate:"art/source/web-v3/chooser-no-selected-glow-portrait-v1-candidate.png",canvas:[941,1672],measure:[112,1240,635,275],roi:[122,1250,170,240]},
};
const reports=[];
for(const [profile,job]of Object.entries(jobs)){
 const [w,h]=job.canvas;
 const [source,candidate]=await Promise.all([job.source,job.candidate].map(p=>sharp(p).removeAlpha().raw().toBuffer()));
 if(source.length!==w*h*3||candidate.length!==source.length)throw Error("Dimensions changed");
 const [ox,oy,mw,mh]=job.measure,seen=new Uint8Array(mw*mh),cards=[];
 const paper=i=>{const x=i%mw+ox,y=Math.floor(i/mw)+oy,n=(y*w+x)*3;return source[n]>70&&source[n+1]>65&&source[n+2]>45&&source[n+2]/source[n]>.52;};
 for(let i=0;i<seen.length;i++){
  if(seen[i]||!paper(i))continue;const queue=[i],points=[];seen[i]=1;
  for(let q=0;q<queue.length;q++){const n=queue[q],x=n%mw,y=Math.floor(n/mw);points.push([x+ox,y+oy]);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&xx<mw&&yy>=0&&yy<mh){const j=yy*mw+xx;if(!seen[j]&&paper(j)){seen[j]=1;queue.push(j);}}}
  if(points.length>5000)cards.push({hull:hull(points),pixels:points.length});
 }
 cards.sort((a,b)=>Math.min(...a.hull.map(p=>p[0]))-Math.min(...b.hull.map(p=>p[0])));
 if(cards.length!==4)throw Error(`Expected 4 source paper hulls, got ${cards.length} (${profile})`);
 const [l,t,ww,hh]=job.roi,mask=new Float32Array(w*h);
 for(let y=t;y<t+hh;y++)for(let x=l;x<l+ww;x++){
  const d=-distance(cards[0].hull,x,y);
  if(d<=2.5||d>=23||cards.some(c=>distance(c.hull,x,y)>=-2.5))continue;
  mask[y*w+x]=Math.max(0,Math.min(1,(d-2.5)/1.5,(23-d)/3));
 }
 for(const pending of [false,true]){
  const base=pending?job.pending:job.source,before=await sharp(base).removeAlpha().raw().toBuffer(),after=Buffer.from(before);
  let changed=0,changedOutsideRoi=0,changedProtectedPaper=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const a=mask[y*w+x];if(!a)continue;const n=(y*w+x)*3;
   for(let c=0;c<3;c++)after[n+c]=Math.max(0,Math.min(255,Math.round(before[n+c]+a*(candidate[n+c]-source[n+c]))));
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const n=(y*w+x)*3;if(after[n]===before[n]&&after[n+1]===before[n+1]&&after[n+2]===before[n+2])continue;changed++;
   if(x<l||x>=l+ww||y<t||y>=t+hh)changedOutsideRoi++;
   if(cards.some(c=>distance(c.hull,x,y)>=-2.5))changedProtectedPaper++;
  }
  if(changedOutsideRoi||changedProtectedPaper)throw Error("Source protection failed");
  const name=pending?"18-chooser-pending-inactive-hand-v5.png":"11-chooser-inactive-hand-v5.png",output=`art/mockups/web-v3/${profile==="portrait"?"portrait/":""}${name}`;
  await sharp(after,{raw:{width:w,height:h,channels:3}}).png().toFile(output);
  reports.push({profile,pending,base,baseSha256:await hash(base),candidate:job.candidate,candidateSha256:await hash(job.candidate),output,outputSha256:await hash(output),roi:job.roi,mask:"first paper hull exterior 2.5..23px with feather; all four expanded paper hulls protected",paperHulls:cards,changedPixels:changed,changedOutsideRoi,changedProtectedPaper});
 }
 const crop={left:l-8,top:t-8,width:ww+16,height:hh+16};
 const before=await sharp(job.source).extract(crop).toBuffer(),after=await sharp(`art/mockups/web-v3/${profile==="portrait"?"portrait/":""}11-chooser-inactive-hand-v5.png`).extract(crop).toBuffer();
 await sharp({create:{width:crop.width*2+16,height:crop.height,channels:3,background:"#10151d"}}).composite([{input:before,left:0,top:0},{input:after,left:crop.width+16,top:0}]).png().toFile(`${folder}/${profile}-before-after.png`);
}
await writeFile(`${folder}/provenance.json`,JSON.stringify({method:"Built-in ImageGen local glow removal; source paper and unrelated pixels protected",reports},null,2)+"\n");
console.log(JSON.stringify(reports.map(r=>({profile:r.profile,pending:r.pending,changed:r.changedPixels,outside:r.changedOutsideRoi,paper:r.changedProtectedPaper}))));
