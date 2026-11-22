// Keep the authored frame and fixed prefix; ImageGen cleans only live fields.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),folder='art/source/web-v3/hud-source-v1',root='art/runtime/web-v3/hud-source-v1';
await mkdir(root,{recursive:true});
const jobs={landscape:{strip:[0,111,2170,492],crop:[672,505,331,75],icon:[28,9,68,55],name:[234,16,59,39]},portrait:{strip:[0,120,2168,483],crop:[298,923,359,80],icon:[30,9,73,59],name:[253,16,65,43]}};
const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)]??0,sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const reports=[];
for(const [profile,p]of Object.entries(jobs)){
 const source=`${folder}/${profile}-trump-reference.png`,candidate=`${folder}/${profile}-trump-blank-candidate-v1.png`,[w,h]=p.crop.slice(2),before=await sharp(source).removeAlpha().raw().toBuffer(),after=Buffer.from(before),[l,t,cw,ch]=p.strip;
 const clean=await sharp(candidate).extract({left:l,top:t,width:cw,height:ch}).resize(w,h,{fit:'fill'}).removeAlpha().raw().toBuffer();
 const delta=[0,1,2].map(c=>median(Array.from({length:w*h},(_,i)=>i).filter(i=>{const x=i%w,y=Math.floor(i/w),[r,g,b]=before.subarray(i*3,i*3+3);return x>35&&x<w-35&&y>12&&y<h-12&&r>180&&g>130&&b>80&&g/r>.7;}).map(i=>before[i*3+c]-clean[i*3+c])));
 let changed=0,changedOutside=0;
 for(const [x0,y0,rw,rh]of [p.icon,p.name])for(let y=y0;y<y0+rh;y++)for(let x=x0;x<x0+rw;x++){
  const i=(y*w+x)*3,a=Math.max(0,Math.min(1,(x-x0)/2,(y-y0)/2,(x0+rw-1-x)/2,(y0+rh-1-y)/2));
  for(let c=0;c<3;c++)after[i+c]=Math.round(before[i+c]*(1-a)+Math.max(0,Math.min(255,clean[i+c]+delta[c]))*a);
 }
 const rgba=Buffer.alloc(w*h*4),icon=Buffer.alloc(p.icon[2]*p.icon[3]*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*3,j=(y*w+x)*4;
  // The source crop has a quiet red table edge. Preserve it only within a
  // two-pixel feather so original paper/frame pixels are never rematted.
  const a=Math.max(0,Math.min(1,x/2,y/2,(w-1-x)/2,(h-1-y)/2));
  for(let c=0;c<3;c++)rgba[j+c]=after[i+c];rgba[j+3]=Math.round(a*255);
  if([0,1,2].some(c=>before[i+c]!==after[i+c])){changed++;if(![p.icon,p.name].some(([l,t,w,h])=>x>=l&&x<l+w&&y>=t&&y<t+h))changedOutside++;}
 }
 const [ix,iy,iw,ih]=p.icon;
 for(let y=0;y<ih;y++)for(let x=0;x<iw;x++){const i=((iy+y)*w+ix+x)*3,j=(y*iw+x)*4,[r,g,b]=before.subarray(i,i+3);if(r>g*1.35&&g<155&&r>100){for(let c=0;c<3;c++)icon[j+c]=before[i+c];icon[j+3]=255;}}
 const output=`${root}/${profile}-trump-live-fields-v1.png`,sun=`${root}/${profile}-trump-sun-v1.png`;
 await sharp(rgba,{raw:{width:w,height:h,channels:4}}).png().toFile(output);
 await sharp(icon,{raw:{width:iw,height:ih,channels:4}}).png().toFile(sun);
 if(changedOutside)throw Error('Unexpected frame or fixed prefix change');
 reports.push({profile,...p,source,sourceSha256:await sha(source),candidate,candidateSha256:await sha(candidate),delta,changed,changedOutsideLiveFields:changedOutside,output,sha256:await sha(output),sun,sunSha256:await sha(sun)});
}
// Fixed local-turn copy and decoration, each taken from its own frozen source.
for(const profile of ['landscape','portrait']){
 const source=`${folder}/${profile}-status-reference-v1.png`,output=`${root}/${profile}-local-play-status-v1.png`;
 const {data,info}=await sharp(source).removeAlpha().raw().toBuffer({resolveWithObject:true}),{width:w,height:h}=info,out=Buffer.alloc(w*h*4);
 const mask=Uint8Array.from({length:w*h},(_,i)=>{const [r,g,b]=data.subarray(i*3,i*3+3);return r>105&&g>70&&g>r*.53&&b>25&&b<g*.95?1:0;});
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;let near=!!mask[i];
  for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1)&&!near;yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++)if(mask[yy*w+xx])near=true;
  // Portrait is a complete outlined lacquer plaque. Keep its dark interior.
  const interior=profile==='portrait'&&x>8&&x<w-8&&y>6&&y<h-6;
  const wideAlpha=profile==='landscape'?Math.max(0,Math.min(1,x/8,y/8,(w-1-x)/8,(h-1-y)/8)):0;
  if(wideAlpha||near||interior){for(let c=0;c<3;c++)out[i*4+c]=data[i*3+c];out[i*4+3]=profile==='landscape'?Math.round(wideAlpha*255):255;}
 }
 await sharp(out,{raw:{width:w,height:h,channels:4}}).png().toFile(output);reports.push({profile,kind:'local-play-status',source,sourceSha256:await sha(source),output,sha256:await sha(output),opaqueRGBChanges:0,alpha:profile==='landscape'?'Larger original source tile, 8px outer feather; quiet original center covers incompatible baked empty top line.':'Original gold decoration plus 1px adjacent pixels; retain original dark plaque interior.'});
}
await writeFile(`${folder}/trump-provenance-v1.json`,JSON.stringify({method:'Built-in ImageGen blank quiet paper texture registered/cropped and median color matched; only original sun and mutable suit-name rectangles cleaned. Original fixed prefix/frame RGB retained. Original sun saturated-ink alpha extraction. Status copy uses original pixels.',reports},null,2)+'\n');
console.log({artifacts:reports.length});
