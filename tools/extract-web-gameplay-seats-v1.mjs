// Original ImageGen portrait pixels; geometric masks remove surrounding scene.
// This file also freezes independently measured source layout before wiring UI.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp');
const sourceRoot='art/source/web-v3/gameplay-seats-v1',runtime='art/runtime/web-v3/gameplay-seats-v1';
await mkdir(sourceRoot,{recursive:true});await mkdir(runtime,{recursive:true});
const profiles={
 landscape:{canvas:[1672,941],seats:[
  {slot:0,key:'bamboo-cat',circle:[178,520,87,87],name:[82,568,191,43],stats:[85,610,181,36],you:[128,648,96,43]},
  {slot:1,key:'ink-panda',circle:[473,169,76,76],name:[392,216,161,40],stats:[396,255,153,31]},
  {slot:2,key:'wandering-crane',circle:[747,124,79,79],hat:[[666,66],[692,49],[745,29],[760,38],[778,51],[800,79],[820,101],[795,100],[759,89],[721,77],[687,73]],name:[666,166,160,41],stats:[669,205,153,30]},
  {slot:3,key:'flower-fox',circle:[1099,151,73,73],name:[1017,202,160,40],stats:[1021,241,152,30]},
  {slot:4,key:'sleepy-star-cat',circle:[1389,257,74,74],name:[1305,306,161,40],stats:[1309,345,153,30]},
  {slot:5,key:'masked-traveler',circle:[281,288,74,74],name:[200,343,162,40],stats:[204,382,154,30]},
 ]},
 portrait:{canvas:[941,1672],seats:[
  {slot:0,key:'bamboo-cat',circle:[115,1001,93,93],name:[18,1057,196,48],stats:[20,1102,192,39],you:[62,1144,106,44]},
  {slot:1,key:'ink-panda',circle:[265,415,89,89],name:[173,469,185,44],stats:[176,511,179,37]},
  {slot:2,key:'wandering-crane',circle:[478,335,90,90],hat:[[390,290],[416,271],[472,250],[491,261],[512,278],[534,302],[556,321],[524,321],[484,307],[438,297]],name:[382,393,186,44],stats:[386,435,179,38]},
  {slot:3,key:'flower-fox',circle:[685,419,88,88],name:[593,469,184,44],stats:[597,512,178,36]},
  {slot:4,key:'sleepy-star-cat',circle:[835,574,84,84],name:[746,631,178,44],stats:[750,673,170,36]},
  {slot:5,key:'masked-traveler',circle:[112,575,85,85],name:[21,631,176,43],stats:[23,673,171,36]},
 ]},
};
const sha=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
function inPoly(poly,x,y){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>y)!==(poly[j][1]>y)&&x<(poly[j][0]-poly[i][0])*(y-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])inside=!inside;return inside;}
const reports=[];
for(const [profile,p]of Object.entries(profiles)){
 const source=`art/mockups/web-v3/${profile==='portrait'?'portrait/':''}25-gameplay-selection-idle-v2.png`,[w,h]=p.canvas,bytes=await sharp(source).removeAlpha().raw().toBuffer();
 const proofs=[];
 for(const s of p.seats){
  const [cx,cy,rx,ry]=s.circle,x0=Math.floor(Math.min(cx-rx-2,...(s.hat??[[cx,cy]]).map(p=>p[0]-2))),y0=Math.floor(Math.min(cy-ry-2,...(s.hat??[[cx,cy]]).map(p=>p[1]-2))),x1=Math.ceil(Math.max(cx+rx+2,...(s.hat??[[cx,cy]]).map(p=>p[0]+2))),y1=s.name[1]+5,cw=x1-x0,ch=y1-y0,out=Buffer.alloc(cw*ch*4);
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
   let inside=0;for(const dy of [.125,.375,.625,.875])for(const dx of [.125,.375,.625,.875]){const xx=x+x0+dx,yy=y+y0+dy;inside+=(((xx-cx)/rx)**2+((yy-cy)/ry)**2<=1||s.hat&&inPoly(s.hat,xx,yy))?1:0;}
   const alpha=Math.round(255*inside/16),j=(y*cw+x)*4,i=((y+y0)*w+x+x0)*3;if(!alpha)continue;out[j]=bytes[i];out[j+1]=bytes[i+1];out[j+2]=bytes[i+2];out[j+3]=alpha;
  }
  const output=`${runtime}/${profile}-${s.key}-v1.png`;await sharp(out,{raw:{width:cw,height:ch,channels:4}}).png().toFile(output);
  s.portrait=[x0,y0,cw,ch];s.portraitRuntime=output;
  const proof=await sharp(output).flatten({background:'#182433'}).png().toBuffer();proofs.push({input:proof,left:s.slot*240,top:0});
  const reference=`${sourceRoot}/${profile}-${s.key}-reference.png`;await sharp(source).extract({left:x0,top:y0,width:cw,height:ch}).png().toFile(reference);
  let changedOpaqueRGB=0,hiddenRGB=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const j=(y*cw+x)*4,i=((y+y0)*w+x+x0)*3;if(out[j+3]===255&&[0,1,2].some(c=>out[j+c]!==bytes[i+c]))changedOpaqueRGB++;if(!out[j+3]&&(out[j]||out[j+1]||out[j+2]))hiddenRGB++;}
  reports.push({profile,slot:s.slot,key:s.key,source,sourceSha256:await sha(source),reference,referenceSha256:await sha(reference),output,sha256:await sha(output),crop:s.portrait,circle:s.circle,hat:s.hat??null,mask:'4x4 subpixel original ellipse and source hat contour; stop before source name lettering',changedOpaqueRGB,hiddenRGB});
 }
 await sharp({create:{width:1440,height:220,channels:3,background:'#182433'}}).composite(proofs).png().toFile(`${sourceRoot}/${profile}-portrait-mask-proof-v1.png`);
 const local=p.seats[0],[cx,cy,rx,ry]=local.circle,pad=14,l=cx-rx-pad,t=cy-ry-pad,aw=2*(rx+pad),ah=2*(ry+pad),halo=Buffer.alloc(aw*ah*4);
 for(let y=0;y<ah;y++)for(let x=0;x<aw;x++){const sx=x+l,sy=y+t,i=(sy*w+sx)*3,j=(y*aw+x)*4,r=bytes[i],g=bytes[i+1],b=bytes[i+2],norm=Math.hypot((sx-cx)/rx,(sy-cy)/ry);if(norm<.93||norm>1.22||sy>=local.name[1]+3||r<120||g<70||g<r*.45||b>r*.9)continue;halo[j]=r;halo[j+1]=g;halo[j+2]=b;halo[j+3]=255;}
 p.activeHaloRuntime=`${runtime}/${profile}-active-halo-v1.png`;
 await sharp(halo,{raw:{width:aw,height:ah,channels:4}}).png().toFile(p.activeHaloRuntime);
 for(const seat of p.seats){const [sx,sy,srx,sry]=seat.circle;seat.halo=[sx-(rx+pad)*srx/rx,sy-(ry+pad)*sry/ry,aw*srx/rx,ah*sry/ry];}
 reports.push({profile,kind:'active-halo',source,sourceSha256:await sha(source),output:p.activeHaloRuntime,sha256:await sha(p.activeHaloRuntime),crop:[l,t,aw,ah],method:'Exact source local active gold pixels in outer circular band; original non-gold scene removed. Shared raster scales with each source circle; no CSS glow drawing.'});
}
await writeFile(`${sourceRoot}/portrait-provenance-v1.json`,JSON.stringify({method:'Mechanical original ImageGen source extraction. All non-transparent RGB copied from exact source, opaque RGB invariant, hidden RGB zero. Geometry is source-measured, never based on browser screenshot.',reports},null,2)+'\n');
await writeFile(`${sourceRoot}/measurements-v1.json`,JSON.stringify({source:'25-gameplay-selection-idle-v2.png both profiles; original six-seat component bounds',profiles},null,2)+'\n');
await writeFile(`${runtime}/layout-v1.json`,JSON.stringify({profiles},null,2)+'\n');
console.log(reports.map(r=>({profile:r.profile,key:r.key,crop:r.crop,changed:r.changedOpaqueRGB})));
