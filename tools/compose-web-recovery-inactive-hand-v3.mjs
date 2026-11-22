// Bounded ImageGen correction: recovery disables the whole hand. Keep all
// original card paper, panel, focus art and unrelated scene pixels intact.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp');
const folder='art/source/web-v3/recovery-source-v1';
const source='art/mockups/web-v3/portrait/15-reconnecting.png';
const candidate=folder+'/portrait-reconnecting-inactive-hand-clean-candidate.png';
const w=941,h=1672,roi=[122,1250,170,240],measure=[112,1240,635,275];
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function hull(points){const sorted=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),lo=[],hi=[];for(const v of sorted){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),v)<=0)lo.pop();lo.push(v);}for(const v of sorted.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),v)<=0)hi.pop();hi.push(v);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
function distance(poly,x,y){let inside=true,d=Infinity;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1];if(dx*(y-a[1])-dy*(x-a[0])<0)inside=false;const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return inside?d:-d;}
const [original,generated]=await Promise.all([source,candidate].map(p=>sharp(p).removeAlpha().raw().toBuffer()));
if(original.length!==w*h*3||generated.length!==original.length)throw Error('Unexpected dimensions');
const [ox,oy,mw,mh]=measure,seen=new Uint8Array(mw*mh),cards=[];
const paper=i=>{const x=i%mw+ox,y=Math.floor(i/mw)+oy,n=(y*w+x)*3;return original[n]>70&&original[n+1]>65&&original[n+2]>45&&original[n+2]/original[n]>.52;};
for(let i=0;i<seen.length;i++){
 if(seen[i]||!paper(i))continue;const q=[i],points=[];seen[i]=1;
 for(let k=0;k<q.length;k++){const n=q[k],x=n%mw,y=Math.floor(n/mw);points.push([x+ox,y+oy]);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&xx<mw&&yy>=0&&yy<mh){const j=yy*mw+xx;if(!seen[j]&&paper(j)){seen[j]=1;q.push(j);}}}
 if(points.length>5000)cards.push({hull:hull(points),pixels:points.length});
}
cards.sort((a,b)=>Math.min(...a.hull.map(p=>p[0]))-Math.min(...b.hull.map(p=>p[0])));
if(cards.length!==4)throw Error('Expected four protected paper hulls');
const [l,t,rw,rh]=roi,mask=new Float32Array(w*h);
for(let y=t;y<t+rh;y++)for(let x=l;x<l+rw;x++){
 const d=-distance(cards[0].hull,x,y);
 if(d<=2.5||d>=23||cards.some(c=>distance(c.hull,x,y)>=-2.5))continue;
 mask[y*w+x]=Math.max(0,Math.min(1,(d-2.5)/1.5,(23-d)/3));
}
const reports=[];
for(const [base,output]of [[source,'art/mockups/web-v3/portrait/15-reconnecting-inactive-hand-v3.png'],['art/mockups/web-v3/portrait/29-reconnecting-focus-v2.png','art/mockups/web-v3/portrait/29-reconnecting-focus-v3.png']]){
 const before=await sharp(base).removeAlpha().raw().toBuffer(),after=Buffer.from(before);
 for(let i=0;i<mask.length;i++)if(mask[i])for(let c=0;c<3;c++)after[i*3+c]=Math.max(0,Math.min(255,Math.round(before[i*3+c]+mask[i]*(generated[i*3+c]-original[i*3+c]))));
 let changedPixels=0,changedOutsideROI=0,changedProtectedPaper=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=(y*w+x)*3;if([0,1,2].every(c=>after[n+c]===before[n+c]))continue;changedPixels++;if(x<l||x>=l+rw||y<t||y>=t+rh)changedOutsideROI++;if(cards.some(c=>distance(c.hull,x,y)>=-2.5))changedProtectedPaper++;}
 if(changedOutsideROI||changedProtectedPaper)throw Error('Protected source changed');
 await sharp(after,{raw:{width:w,height:h,channels:3}}).png().toFile(output);
 reports.push({base,baseSha256:await hash(base),output,outputSha256:await hash(output),changedPixels,changedOutsideROI,changedProtectedPaper});
}
const crop={left:l-8,top:t-8,width:rw+16,height:rh+16};
await sharp({create:{width:crop.width*2+16,height:crop.height,channels:3,background:'#10151d'}}).composite([{input:await sharp(source).extract(crop).toBuffer(),left:0,top:0},{input:await sharp(reports[0].output).extract(crop).toBuffer(),left:crop.width+16,top:0}]).png().toFile(folder+'/portrait-hand-before-after-v3.png');
const sceneROI={left:0,top:0,width:280,height:95},sceneOutput='art/runtime/web-v3/recovery-source-v1/portrait-top-scene-v1.png';
await sharp(source).extract(sceneROI).png().toFile(sceneOutput);
await writeFile(folder+'/inactive-hand-provenance-v3.json',JSON.stringify({method:'Built-in ImageGen halo removal, bounded first-card exterior 2.5..23px with feather; all four expanded paper hulls protected. Same source delta applied to normal and independently saved focus design.',source,sourceSha256:await hash(source),candidate,candidateSha256:await hash(candidate),canvas:[w,h],roi,paperHulls:cards,reports,sceneRepair:{method:'Exact original already-dimmed decorative scene crop above the scrim, hides baked empty return plaque. No runtime data in this region.',roi:sceneROI,output:sceneOutput,sha256:await hash(sceneOutput)}},null,2)+'\n');
console.log(reports);
