// ImageGen repairs the exposed table. Original source card pixels then follow
// the existing 140x210 / 12 / 9 / 8 contract through explicit affine poses.
// No browser capture or implementation asset face supplies design geometry.
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {mkdir,readFile,writeFile} from "node:fs/promises";
const sharp=createRequire(import.meta.url)(process.argv[2]??"sharp");
const outputRoot="art/source/web-v3/selection-geometry-v2";
await mkdir(outputRoot,{recursive:true});
const hash=async path=>createHash("sha256").update(await readFile(path)).digest("hex");
const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
function hull(points){
 const p=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),lo=[],hi=[];
 for(const v of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),v)<=0)lo.pop();lo.push(v);}
 for(const v of p.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),v)<=0)hi.pop();hi.push(v);}
 return lo.slice(0,-1).concat(hi.slice(0,-1));
}
function signedDistance(poly,x,y){
 let inside=true,d=Infinity;
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1];
  if(dx*(y-a[1])-dy*(x-a[0])<0)inside=false;
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));
 }
 return inside?d:-d;
}
function sample(data,w,h,x,y,channels=3){
 const xx=Math.max(0,Math.min(w-1,x)),yy=Math.max(0,Math.min(h-1,y));
 const x0=Math.floor(xx),y0=Math.floor(yy),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=xx-x0,fy=yy-y0;
 return Array.from({length:channels},(_,c)=>(data[(y0*w+x0)*channels+c]*(1-fx)+data[(y0*w+x1)*channels+c]*fx)*(1-fy)+(data[(y1*w+x0)*channels+c]*(1-fx)+data[(y1*w+x1)*channels+c]*fx)*fy);
}
function blend(out,index,rgb,alpha){for(let c=0;c<3;c++)out[index+c]=Math.round(out[index+c]*(1-alpha)+rgb[c]*alpha);}
const contract={cardBox:[140,210],lift:12,neighborShift:9,haloOffset:8,haloCanvas:[171,231],haloLayer:"behind original paper",durationMs:140,confirmPulseMs:560,origin:"center"};
const profiles={
 landscape:{source:"art/mockups/web-v3/05-gameplay-final.png",clean:"art/source/web-v3/hand-clean-landscape-v2-candidate.png",idleAction:"art/source/web-v3/select-idle-action-landscape-v1-candidate.png",canvas:[1672,941],measure:[505,640,665,260],cleanup:[520,660,640,240],roi:[510,650,665,255],action:[1300,710,310,72],hand:{x:351.12,y:625.765,width:969.76,height:254.07,bottom:879.835}},
 portrait:{source:"art/mockups/web-v3/portrait/05-gameplay-safe-v2.png",clean:"art/source/web-v3/hand-clean-portrait-v2-candidate.png",idleAction:"art/source/web-v3/select-idle-action-portrait-v1-candidate.png",canvas:[941,1672],measure:[112,1225,635,290],cleanup:[118,1250,617,247],roi:[112,1240,635,275],action:[665,1498,276,143],hand:{x:86.8543,y:1237.28,width:621.06,height:234.08,bottom:1471.36}},
};
const haloPath="art/runtime/web-v3/selected-halo.png";
const halo=await sharp(haloPath).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const reports=[];
for(const [profile,job]of Object.entries(profiles)){
 const [w,h]=job.canvas;
 const [source,clean,idleAction]=await Promise.all([job.source,job.clean,job.idleAction].map(path=>sharp(path).removeAlpha().raw().toBuffer()));
 const [ox,oy,mw,mh]=job.measure,visited=new Uint8Array(mw*mh),cards=[];
 const white=(i)=>{const x=i%mw+ox,y=Math.floor(i/mw)+oy,j=(y*w+x)*3;return source[j]>145&&source[j+1]>125&&source[j+2]>95&&source[j+2]/source[j]>.60;};
 for(let i=0;i<mw*mh;i++){
  if(visited[i]||!white(i))continue;
  const points=[],queue=[i];visited[i]=1;
  for(let q=0;q<queue.length;q++){
   const n=queue[q],x=n%mw,y=Math.floor(n/mw);points.push([x+ox,y+oy]);
   for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&xx<mw&&yy>=0&&yy<mh){const j=yy*mw+xx;if(!visited[j]&&white(j)){visited[j]=1;queue.push(j);}}
  }
  if(points.length<5000)continue;
  const poly=hull(points);let best=null;
  for(let a=-8;a<=8;a+=.05){const r=a*Math.PI/180,c=Math.cos(r),s=Math.sin(r);let l=Infinity,t=Infinity,rr=-Infinity,b=-Infinity;for(const [x,y]of poly){const xx=x*c+y*s,yy=-x*s+y*c;l=Math.min(l,xx);rr=Math.max(rr,xx);t=Math.min(t,yy);b=Math.max(b,yy);}const area=(rr-l)*(b-t);if(!best||area<best.area){const cx=(l+rr)/2,cy=(t+b)/2;best={angle:a,area,width:rr-l,height:b-t,center:[cx*c-cy*s,cx*s+cy*c]};}}
  cards.push({...best,hull:poly,whitePixels:points.length});
 }
 cards.sort((a,b)=>a.center[0]-b.center[0]);
 if(cards.length!==4)throw Error(`Expected four source paper components: ${profile}`);
 job.poses=cards.map(c=>({center:c.center.map(n=>Number(n.toFixed(4))),angle:Number(c.angle.toFixed(2))}));
 const base=Buffer.from(source),[cl,ct,cw,ch]=job.cleanup;
 // Feather the exposed table only around the old cards/glow, not the HUD.
 for(let y=ct;y<ct+ch;y++)for(let x=cl;x<cl+cw;x++){
  let alpha=0;
  for(let k=0;k<cards.length;k++){const d=signedDistance(cards[k].hull,x,y);const radius=k===0?25:15;alpha=Math.max(alpha,Math.max(0,Math.min(1,(d+radius)/6)));}
  blend(base,(y*w+x)*3,[clean[(y*w+x)*3],clean[(y*w+x)*3+1],clean[(y*w+x)*3+2]],alpha);
 }
 const drawCard=(out,index,target)=>{
  const card=cards[index],sa=card.angle*Math.PI/180,ta=target.angle*Math.PI/180,cs=Math.cos(sa),ss=Math.sin(sa),cc=Math.cos(ta),st=Math.sin(ta);
  const r=130,[rl,rt,rw,rh]=job.roi;
  for(let y=Math.max(rt,Math.floor(target.center[1]-r));y<Math.min(rt+rh,Math.ceil(target.center[1]+r));y++)for(let x=Math.max(rl,Math.floor(target.center[0]-r));x<Math.min(rl+rw,Math.ceil(target.center[0]+r));x++){
   const dx=x-target.center[0],dy=y-target.center[1],lx=dx*cc+dy*st,ly=-dx*st+dy*cc;
   if(Math.abs(lx)>70.5||Math.abs(ly)>105.5)continue;
   const sx=card.center[0]+lx*cs-ly*ss,sy=card.center[1]+lx*ss+ly*cs;
   const alpha=Math.max(0,Math.min(1,(signedDistance(card.hull,sx,sy)+2)/1.2));
   if(alpha)blend(out,(y*w+x)*3,sample(source,w,h,sx,sy),alpha);
  }
 };
 const drawHalo=(out,center)=>{
  const [hw,hh]=contract.haloCanvas,left=center[0]-hw/2,top=center[1]+contract.haloOffset-hh/2,[rl,rt,rw,rh]=job.roi;
  for(let y=Math.max(rt,Math.floor(top));y<Math.min(rt+rh,Math.ceil(top+hh));y++)for(let x=Math.max(rl,Math.floor(left));x<Math.min(rl+rw,Math.ceil(left+hw));x++){
   const rgba=sample(halo.data,halo.info.width,halo.info.height,(x-left)/hw*(halo.info.width-1),(y-top)/hh*(halo.info.height-1),4);
   if(rgba[3])blend(out,(y*w+x)*3,rgba,rgba[3]/255);
  }
 };
 for(const selected of [false,true]){
  const out=Buffer.from(base),poses=job.poses.map((p,i)=>({center:[p.center[0]+(selected&&i>0?9:0),p.center[1]-(selected&&i===0?12:0)],angle:selected&&i===0?0:p.angle}));
  for(let i=3;i>=0;i--)if(!selected||i!==0)drawCard(out,i,poses[i]);
  if(selected){drawHalo(out,poses[0].center);drawCard(out,0,poses[0]);}
  if(!selected){const [l,t,ww,hh]=job.action;for(let y=t;y<t+hh;y++)for(let x=l;x<l+ww;x++){const n=(y*w+x)*3;out[n]=idleAction[n];out[n+1]=idleAction[n+1];out[n+2]=idleAction[n+2];}}
  const name=selected?"26-gameplay-selection-complete-v2.png":"25-gameplay-selection-idle-v2.png";
  const output=`art/mockups/web-v3/${profile==="portrait"?"portrait/":""}${name}`;
  let changedOutsideRoi=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const [l,t,ww,hh]=job.roi,[al,at,aw,ah]=job.action;
   if(x>=l&&x<l+ww&&y>=t&&y<t+hh||!selected&&x>=al&&x<al+aw&&y>=at&&y<at+ah)continue;
   const n=(y*w+x)*3;if(out[n]!==source[n]||out[n+1]!==source[n+1]||out[n+2]!==source[n+2])changedOutsideRoi++;
  }
  if(changedOutsideRoi)throw Error("Unrelated source pixels changed");
  await sharp(out,{raw:{width:w,height:h,channels:3}}).png().toFile(output);
  reports.push({profile,state:selected?"complete":"idle",output,source:job.source,sourceSha256:await hash(job.source),clean:job.clean,cleanSha256:await hash(job.clean),idleAction:job.idleAction,idleActionSha256:await hash(job.idleAction),poses,handRoi:job.roi,actionRoi:selected?null:job.action,changedOutsideRoi,sha256:await hash(output)});
 }
 await writeFile(`${outputRoot}/${profile}-measurement.json`,JSON.stringify({source:job.source,threshold:"R>145,G>125,B>95,B/R>.60; largest four connected paper components; minimum area rectangle angle search 0.05deg",cards},null,2)+"\n");
}
await writeFile("art/source/web-v3/selection-geometry-v2-contract.json",JSON.stringify({contract,profiles:Object.fromEntries(Object.entries(profiles).map(([k,v])=>[k,{canvas:v.canvas,hand:v.hand,poses:v.poses}]))},null,2)+"\n");
await writeFile("art/runtime/web-v3/selection-layout-v2.json",JSON.stringify({contract,profiles:Object.fromEntries(Object.entries(profiles).map(([k,v])=>[k,{canvas:v.canvas,hand:v.hand,poses:v.poses}]))},null,2)+"\n");
const derivatives=[];
for(const [profile,job]of Object.entries(profiles)){
 const tall=profile==="portrait",prefix=`art/mockups/web-v3/${tall?"portrait/":""}`;
 const original=await sharp(job.source).removeAlpha().raw().toBuffer();
 const complete=await sharp(`${prefix}26-gameplay-selection-complete-v2.png`).removeAlpha().raw().toBuffer();
 const [w,h]=job.canvas,[l,t,ww,hh]=job.roi;
 for(const [base,name]of [
  [tall?"14-gameplay-notimer-safe-v3.png":"14-gameplay-notimer.png","14-gameplay-notimer-selection-v4.png"],
  ["19-play-pending-v1.png","19-play-pending-selection-v2.png"],
 ]){
  const basePath=prefix+base,out=await sharp(basePath).removeAlpha().raw().toBuffer();let changedPixels=0;
  for(let y=t;y<t+hh;y++)for(let x=l;x<l+ww;x++){
   const i=(y*w+x)*3;
   if(original[i]===complete[i]&&original[i+1]===complete[i+1]&&original[i+2]===complete[i+2])continue;
   out[i]=complete[i];out[i+1]=complete[i+1];out[i+2]=complete[i+2];changedPixels++;
  }
  const output=prefix+name;await sharp(out,{raw:{width:w,height:h,channels:3}}).png().toFile(output);
  derivatives.push({profile,base:basePath,baseSha256:await hash(basePath),output,sha256:await hash(output),changedPixels,changedOutsideHandRoi:0,method:"Only changed hand pixels from the canonical selected endpoint, not its mode/timer/action/scene"});
 }
}
await writeFile("art/source/web-v3/selection-geometry-v2-provenance.json",JSON.stringify({method:"Built-in ImageGen exposed-table/action edits plus geometric normalization of original source card pixels; original ranks/art preserved, no implementation screenshot used.",contract,halo:{source:haloPath,sha256:await hash(haloPath)},reports},null,2)+"\n");
await writeFile("art/source/web-v3/selection-geometry-v2-derivatives.json",JSON.stringify({contract,derivatives},null,2)+"\n");
console.log(JSON.stringify(reports.map(({profile,state,output,changedOutsideRoi})=>({profile,state,output,changedOutsideRoi}))));
