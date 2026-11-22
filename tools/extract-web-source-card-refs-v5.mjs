// Mechanical, source-coordinate extraction. No implementation screenshot or
// restored v4 face supplies pixels. ImageGen will clear only the numeral ROI.
import {createRequire} from "node:module";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
const sharp=createRequire(import.meta.url)(process.argv[2]??"sharp"),folder="art/source/web-v3/cards-v5";
await mkdir(folder,{recursive:true});const sha=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
function distance(poly,x,y){let inside=true,d=Infinity;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1];if(dx*(y-a[1])-dy*(x-a[0])<0)inside=false;const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return inside?d:-d;}
function sample(b,w,h,x,y){const x0=Math.max(0,Math.min(w-1,Math.floor(x))),y0=Math.max(0,Math.min(h-1,Math.floor(y))),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;return [0,1,2].map(c=>Math.round(b[(y0*w+x0)*3+c]*(1-fx)*(1-fy)+b[(y0*w+x1)*3+c]*fx*(1-fy)+b[(y1*w+x0)*3+c]*(1-fx)*fy+b[(y1*w+x1)*3+c]*fx*fy));}
const reports=[];
for(const profile of ["landscape","portrait"]){
 const measure=JSON.parse(await readFile(`art/source/web-v3/selection-geometry-v2/${profile}-measurement.json`,"utf8")),meta=await sharp(measure.source).metadata(),source=await sharp(measure.source).removeAlpha().raw().toBuffer();
 for(const [i,suit]of ["leaf","mountain","knot","sun"].entries()){
  const card=measure.cards[i],r=card.angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r),scale=4,w=560,h=840,out=Buffer.alloc(w*h*4),dark=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const lx=(x+.5)/scale-70,ly=(y+.5)/scale-105,sx=card.center[0]+lx*c-ly*s,sy=card.center[1]+lx*s+ly*c,n=(y*w+x)*4,rgb=sample(source,meta.width,meta.height,sx,sy),alpha=Math.max(0,Math.min(1,(distance(card.hull,sx,sy)+2)/1.2));
   for(let ch=0;ch<3;ch++)out[n+ch]=rgb[ch];out[n+3]=Math.round(255*alpha);
   if(lx+70>12&&lx+70<57&&ly+105>12&&ly+105<69&&alpha>.95&&rgb[0]<105&&rgb[1]<95&&rgb[2]<80&&rgb[2]<rgb[0]*.85&&rgb[1]<rgb[0]*1.25)dark.push([x,y]);
  }
  if(dark.length<100)throw Error("Missing source rank");
  const xs=dark.map(p=>p[0]),ys=dark.map(p=>p[1]),bbox=[Math.min(...xs),Math.min(...ys),Math.max(...xs)+1,Math.max(...ys)+1];
  const rankRoi=[Math.max(0,bbox[0]-12),Math.max(0,bbox[1]-12),Math.min(w,bbox[2]+12)-Math.max(0,bbox[0]-12),Math.min(h,bbox[3]+12)-Math.max(0,bbox[1]-12)];
  const reference=`${folder}/${profile}-${suit}-reference.png`;await sharp(out,{raw:{width:w,height:h,channels:4}}).png().toFile(reference);
  reports.push({profile,suit,source:measure.source,sourceSha256:await sha(measure.source),reference,referenceSha256:await sha(reference),pixelSize:[w,h],logicalBox:[140,210],pose:{center:card.center,angle:card.angle},rank:[5,8,2,6][i],rankInkBounds:bbox,rankRoi,rankLogicalBounds:bbox.map(n=>n/scale),candidate:`${folder}/${profile}-${suit}-rank-clean-candidate.png`});
 }
}
await writeFile(`${folder}/reference-provenance.json`,JSON.stringify({method:"Original source card pixels, inverse measured rotation, same 140x210 frame/hull mask as canonical selection design, 4x raster sampling",reports},null,2)+"\n");
console.log(JSON.stringify(reports.map(r=>({profile:r.profile,suit:r.suit,rank:r.rank,ink:r.rankLogicalBounds,roi:r.rankRoi}))));
