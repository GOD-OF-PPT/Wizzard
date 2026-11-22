// Measure the projected paper edges in the immutable ImageGen page sources.
// Extract unwarped source faces for local numeral cleanup, never from Chrome.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),folder='art/source/web-v3/trick-faces-v1';await mkdir(folder,{recursive:true});
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
function solve(a,b){a=a.map((r,i)=>[...r,b[i]]);for(let i=0;i<b.length;i++){let p=i;for(let j=i+1;j<b.length;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;[a[i],a[p]]=[a[p],a[i]];const k=a[i][i];if(Math.abs(k)<1e-12)throw Error('Singular geometry');for(let c=i;c<=b.length;c++)a[i][c]/=k;for(let j=0;j<b.length;j++)if(j!==i){const q=a[j][i];for(let c=i;c<=b.length;c++)a[j][c]-=q*a[i][c];}}return a.map(r=>r.at(-1));}
function homography(src,dst){const a=[],b=[];src.forEach(([x,y],i)=>{const [u,v]=dst[i];a.push([x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]);b.push(u,v);});return [...solve(a,b),1];}
function point(m,x,y){const z=m[6]*x+m[7]*y+m[8];return [(m[0]*x+m[1]*y+m[2])/z,(m[3]*x+m[4]*y+m[5])/z];}
function fit(points){const n=points.length,sx=points.reduce((s,p)=>s+p[0],0),sy=points.reduce((s,p)=>s+p[1],0),sxx=points.reduce((s,p)=>s+p[0]*p[0],0),sxy=points.reduce((s,p)=>s+p[0]*p[1],0),slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);return [slope,(sy-slope*sx)/n];}
function intersect(xLine,yLine){const x=(xLine[0]*yLine[1]+xLine[1])/(1-xLine[0]*yLine[0]);return [x,yLine[0]*x+yLine[1]];}
function sample(data,w,h,x,y){const xx=Math.max(0,Math.min(w-1,x)),yy=Math.max(0,Math.min(h-1,y)),x0=Math.floor(xx),y0=Math.floor(yy),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=xx-x0,fy=yy-y0;return [0,1,2].map(c=>Math.round(data[(y0*w+x0)*3+c]*(1-fx)*(1-fy)+data[(y0*w+x1)*3+c]*fx*(1-fy)+data[(y1*w+x0)*3+c]*(1-fx)*fy+data[(y1*w+x1)*3+c]*fx*fy));}
const profiles={landscape:{canvas:[1672,941],source:'art/mockups/web-v3/25-gameplay-selection-idle-v2.png',roi:[540,305,590,200]},portrait:{canvas:[941,1672],source:'art/mockups/web-v3/portrait/25-gameplay-selection-idle-v2.png',roi:[185,710,575,215]}};
const reports=[];
for(const [profile,p]of Object.entries(profiles)){
 const [w,h]=p.canvas,data=await sharp(p.source).removeAlpha().raw().toBuffer(),[ox,oy,rw,rh]=p.roi,seen=new Uint8Array(rw*rh),cards=[];
 const white=n=>{const i=((Math.floor(n/rw)+oy)*w+(n%rw+ox))*3;return data[i]>145&&data[i+1]>125&&data[i+2]>95&&data[i+2]/data[i]>.6;};
 for(let n=0;n<seen.length;n++){if(seen[n]||!white(n))continue;seen[n]=1;const q=[n],points=[];for(let k=0;k<q.length;k++){const a=q[k],x=a%rw,y=Math.floor(a/rw);points.push([x+ox,y+oy]);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&xx<rw&&yy>=0&&yy<rh){const j=yy*rw+xx;if(!seen[j]&&white(j)){seen[j]=1;q.push(j);}}}if(points.length<5000)continue;
 const ys=points.map(p=>p[1]),xs=points.map(p=>p[0]),top=Math.min(...ys),bottom=Math.max(...ys),left=Math.min(...xs),right=Math.max(...xs),rows=new Map(),columns=new Map();for(const [x,y]of points){const row=rows.get(y)??[Infinity,-Infinity];rows.set(y,[Math.min(row[0],x),Math.max(row[1],x)]);const col=columns.get(x)??[Infinity,-Infinity];columns.set(x,[Math.min(col[0],y),Math.max(col[1],y)]);}
 const rowRange=[...rows.entries()].filter(([y])=>y>top+(bottom-top)*.15&&y<bottom-(bottom-top)*.15),colRange=[...columns.entries()].filter(([x])=>x>left+(right-left)*.2&&x<right-(right-left)*.2),ll=fit(rowRange.map(([y,[l]])=>[y,l])),rr=fit(rowRange.map(([y,[,r]])=>[y,r])),tt=fit(colRange.map(([x,[t]])=>[x,t])),bb=fit(colRange.map(([x,[,b]])=>[x,b])),quad=[intersect(ll,tt),intersect(rr,tt),intersect(rr,bb),intersect(ll,bb)].map(p=>p.map(n=>Number(n.toFixed(5))));
 cards.push({bounds:[left,top,right-left+1,bottom-top+1],whitePixels:points.length,quad,lines:{left:ll,right:rr,top:tt,bottom:bb},center:point(homography([[0,0],[140,0],[140,210],[0,210]],quad),70,105)});
 }
 cards.sort((a,b)=>a.center[0]-b.center[0]);if(cards.length!==4)throw Error('Expected four projected cards '+profile+cards.length);
 for(const [i,c]of cards.entries()){
  const suit=['leaf','knot','sun','mountain'][i],rank=[7,3,1,9][i],matrix=homography([[0,0],[140,0],[140,210],[0,210]],c.quad),scale=3,fw=420,fh=630,out=Buffer.alloc(fw*fh*4);
  for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){const [sx,sy]=point(matrix,(x+.5)/scale,(y+.5)/scale),rgb=sample(data,w,h,sx,sy),j=(y*fw+x)*4;for(let k=0;k<3;k++)out[j+k]=rgb[k];const lx=x/scale,ly=y/scale,rx=lx<5?5-lx:lx>135?lx-135:0,ry=ly<5?5-ly:ly>205?ly-205:0;out[j+3]=rx&&ry?Math.round(255*Math.max(0,Math.min(1,5.5-Math.hypot(rx,ry)))):255;}
  const output=`${folder}/${profile}-${suit}-reference.png`;await sharp(out,{raw:{width:fw,height:fh,channels:4}}).png().toFile(output);c.suit=suit;c.rank=rank;c.matrix=matrix;c.reference=output;c.referenceSha256=await sha(output);c.rankRoi=[12,12,49,67].map(n=>n*scale);c.cssMatrix3d=[matrix[0],matrix[3],0,matrix[6],matrix[1],matrix[4],0,matrix[7],0,0,1,0,matrix[2],matrix[5],0,matrix[8]];
 }
 reports.push({profile,source:p.source,sourceSha256:await sha(p.source),canvas:p.canvas,roi:p.roi,cards});
}
const output={contract:{cardBox:[140,210],fourCardSourceCorners:'Measured paper straight edges; TL/TR/BR/BL; all runtime card values dynamic',scope:'Central trick card geometry only; local hand unchanged'},profiles:Object.fromEntries(reports.map(r=>[r.profile,{canvas:r.canvas,cards:r.cards.map(c=>({suit:c.suit,rank:c.rank,quad:c.quad,center:c.center,matrix:c.matrix,cssMatrix3d:c.cssMatrix3d}))}]))};
await writeFile(folder+'/measurements.json',JSON.stringify({method:'White-paper connected components; fit four straight edges across central70%rows/60%columns and intersect. Source-only inverse homography420x630 extraction. Rounded5px alpha; no browser capture used.',reports},null,2)+'\n');await writeFile('art/runtime/web-v3/trick-layout-v1.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
