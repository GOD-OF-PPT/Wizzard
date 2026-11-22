// Normalize ImageGen dense-hand designs with source raster components only.
// Browser screenshots are never inputs. Existing four-card mocks stay frozen.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp');
const root='art/source/web-v3/dense-hand-v1';
await mkdir(root,{recursive:true});
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const contract={cardBox:[128,192],lift:12,neighborShift:9,haloOffset:8,haloCanvas:[156,211],durationMs:140,confirmPulseMs:560,origin:'center',appliesTo:'5-8 card quick-mode play/trick-result hands only; four-card source poses and bid/chooser layouts unchanged'};
const profiles={
 landscape:{canvas:[1672,941],hand:{x:240,y:650,width:1004,height:245},columns:[320,440,560,680,800,920,1040,1160],rows:[775],roundRoi:[52,128,135,90],cleanup:[240,650,1004,245]},
 portrait:{canvas:[941,1672],hand:{x:154,y:1170,width:642,height:450},columns:[238,391,548,704],rows:[1288,1504],roundRoi:[55,151,160,100],cleanup:[0,1005,941,667],action:[275,1072,394,102],timer:[688,957,241,230],status:[342,1008,262,52]},
};
const box=(a)=>({left:a[0],top:a[1],width:a[2],height:a[3]});
// Isolate the two new generated number faces by flood-filling bright paper,
// preserving its original ink/art inside the measured convex hull.
function hull(points){const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const p=points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]),lo=[],hi=[];for(const q of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}for(const q of p.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
async function isolate(path,roi,out){
 const {data,info}=await sharp(path).extract(box(roi)).removeAlpha().raw().toBuffer({resolveWithObject:true}),seen=new Uint8Array(info.width*info.height);let best=[];
 const white=i=>data[i*3]>175&&data[i*3+1]>145&&data[i*3+2]>90;
 for(let i=0;i<seen.length;i++){if(seen[i]||!white(i))continue;const q=[i],p=[];seen[i]=1;for(let k=0;k<q.length;k++){const n=q[k],x=n%info.width,y=Math.floor(n/info.width);p.push([x,y]);for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&yy>=0&&xx<info.width&&yy<info.height){const j=yy*info.width+xx;if(!seen[j]&&white(j)){seen[j]=1;q.push(j);}}}if(p.length>best.length)best=p;}
 if(best.length<8000)throw Error('Missing paper '+path+roi);
 const poly=hull(best),xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]),l=Math.max(0,Math.min(...xs)-1),t=Math.max(0,Math.min(...ys)-1),r=Math.min(info.width,Math.max(...xs)+2),b=Math.min(info.height,Math.max(...ys)+2),w=r-l,h=b-t,rgba=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const xx=x+l,yy=y+t,j=(y*w+x)*4;let inside=true;for(let k=0;k<poly.length;k++){const a=poly[k],z=poly[(k+1)%poly.length];if((z[0]-a[0])*(yy-a[1])-(z[1]-a[1])*(xx-a[0]) < -1){inside=false;break;}}for(let c=0;c<3;c++)rgba[j+c]=data[(yy*info.width+xx)*3+c];rgba[j+3]=inside?255:0;}
 await sharp(rgba,{raw:{width:w,height:h,channels:4}}).resize(128,192).png().toFile(out);
 return {source:path,sourceRoi:roi,paperBounds:[roi[0]+l,roi[1]+t,w,h],output:out,sha256:await sha(out)};
}
async function sourceNumberFace(extracted,blankPath,output){
 const {data:ink,info}=await sharp(extracted).ensureAlpha().raw().toBuffer({resolveWithObject:true}),base=await sharp(blankPath).resize(128,192).ensureAlpha().raw().toBuffer();let pixels=0;
 const mask=new Uint8Array(128*192),seen=new Uint8Array(mask.length),groups=[];
 for(let y=12;y<70;y++)for(let x=12;x<68;x++){const i=(y*128+x)*4,r=ink[i],g=ink[i+1],b=ink[i+2];mask[y*128+x]=ink[i+3]>200&&r<170&&g<160&&b<145&&((Math.max(r,g,b)-Math.min(r,g,b)<24)||(b<r*.95&&g<r*1.3))?1:0;}
 for(let n=0;n<mask.length;n++){if(seen[n]||!mask[n])continue;const q=[n];seen[n]=1;for(let k=0;k<q.length;k++){const p=q[k],x=p%128,y=Math.floor(p/128);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&xx<128&&yy>=0&&yy<192){const j=yy*128+xx;if(mask[j]&&!seen[j]){seen[j]=1;q.push(j);}}}const xs=q.map(p=>p%128),ys=q.map(p=>Math.floor(p/128));if(q.length>35&&Math.max(...ys)-Math.min(...ys)>15&&Math.min(...ys)>12&&xs.reduce((a,b)=>a+b,0)/q.length>17)groups.push(q);}
 for(const group of groups.sort((a,b)=>b.length-a.length).slice(0,2))for(const p of group){const i=p*4;for(let c=0;c<3;c++)base[i+c]=ink[i+c];pixels++;}
 if(pixels<120)throw Error('Missing two-digit source ink '+extracted);
 await sharp(base,{raw:{width:128,height:192,channels:4}}).png().toFile(output);return {sourceBlank:blankPath,sourceBlankSha256:await sha(blankPath),sourceInk:extracted,inkRoi:[12,12,56,58],inkPixels:pixels,output,sha256:await sha(output),method:'Original source face family for all ranks. Only generated numeral ink added inside bounded upper-left region; generation-specific suit scale/border rejected.'};
}
const provenance=[];
for(const [profile,p] of Object.entries(profiles)){
 const tall=profile==='portrait',prefix=`art/mockups/web-v3/${tall?'portrait/':''}`,source=prefix+'25-gameplay-selection-idle-v2.png',idle=`art/source/web-v3/dense-hand-${profile}-idle-v2-candidate.png`,selected=`art/source/web-v3/dense-hand-${profile}-selected-v2-candidate.png`,clean=tall?'art/source/web-v3/dense-hand-portrait-clean-lower-v1-candidate.png':'art/source/web-v3/hand-clean-landscape-v2-candidate.png';
 const [w,h]=p.canvas;
 const crop=async(path,roi)=>sharp(path).resize(w,h,{fit:'fill'}).extract(box(roi)).png().toBuffer();
 const overlays=[{input:await crop(clean,p.cleanup),left:p.cleanup[0],top:p.cleanup[1]},{input:await crop(idle,p.roundRoi),left:p.roundRoi[0],top:p.roundRoi[1]}];
 if(tall){overlays.push({input:await crop(source,[0,1005,220,140]),left:0,top:1005});overlays.push({input:await crop(idle,p.status),left:p.status[0],top:p.status[1]},{input:await crop(idle,[707,976,225,205]),left:707,top:960});}
 const base=await sharp(source).composite(overlays).png().toBuffer(),faces=[];
 if(tall){const {data,info}=await sharp(await crop(clean,p.cleanup)).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let y=0;y<140;y++)for(let x=0;x<220;x++)data[(y*info.width+x)*4+3]=0;await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile('art/runtime/web-v3/dense-scene-portrait-v1.png');}
 for(const suit of ['leaf','mountain','knot','sun'])faces.push(await sharp(`art/source/web-v3/cards-v5/${profile}-${suit}-reference.png`).resize(128,192).png().toBuffer());
 const rois=tall?[[160,1390,155,208],[318,1390,156,208]]:[[786,673,122,190],[906,673,118,190]];
 for(const [i,roi] of rois.entries()){const name=i?'mountain-12':'leaf-11',extracted=`${root}/${profile}-${name}.png`,output=`${root}/${profile}-${name}-source-family-v3.png`;provenance.push(await isolate(idle,roi,extracted));provenance.push(await sourceNumberFace(extracted,`art/source/web-v3/cards-v5/${profile}-${i?'mountain':'leaf'}-face.png`,output));faces.push(await readFile(output));}
 for(const kind of ['highest','lowest'])faces.push(await sharp(`art/runtime/cards/${kind}-special.png`).resize(128,192).png().toBuffer());
 const halo=await sharp('art/runtime/web-v3/selected-halo.png').resize(...contract.haloCanvas,{fit:'fill'}).png().toBuffer();
 for(const isSelected of [false,true]){
  const layers=[],poses=[];
  if(tall){const roi=p.action;layers.push({input:await crop(isSelected?selected:idle,roi),left:roi[0],top:roi[1]});}
  else if(isSelected){const roi=[1254,688,373,120];layers.push({input:await crop(selected,roi),left:roi[0],top:roi[1]});}
  for(let i=0;i<8;i++){const col=tall?i%4:i,row=tall?Math.floor(i/4):0,shift=isSelected&&i!==4?Math.sign(col-(tall?0:4))*9:0,center=[p.columns[col]+shift,p.rows[row]-(isSelected&&i===4?12:0)];poses.push({index:i,center,angle:0,column:col,row});}
  for(const i of [0,1,2,3,5,6,7,4]){const [x,y]=poses[i].center;if(isSelected&&i===4)layers.push({input:halo,left:Math.round(x-78),top:Math.round(y+8-105.5)});layers.push({input:faces[i],left:Math.round(x-64),top:Math.round(y-96)});}
  const output=prefix+`${isSelected?'28':'27'}-dense-hand-${isSelected?'selected':'idle'}-v4.png`;await sharp(base).composite(layers).png().toFile(output);
  const before=await sharp(source).removeAlpha().raw().toBuffer(),after=await sharp(output).removeAlpha().raw().toBuffer();let changedOutside=0;
  const allowed=[p.cleanup,p.roundRoi,...(tall?[[707,960,225,205]]:isSelected?[[1254,688,373,120]]:[])];for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(allowed.some(([l,t,ww,hh])=>x>=l&&x<l+ww&&y>=t&&y<t+hh))continue;const n=(y*w+x)*3;if(before[n]!==after[n]||before[n+1]!==after[n+1]||before[n+2]!==after[n+2])changedOutside++;}
  if(changedOutside)throw Error('Source changed outside bounded regions '+profile+changedOutside);
  provenance.push({profile,state:isSelected?'selected':'idle',source,sourceSha256:await sha(source),candidate:idle,candidateSha256:await sha(idle),clean,cleanSha256:await sha(clean),cleanNormalization:tall?'941x1671 raw cleanup resized to941x1672 before bounded crop; original avatar/name/stats restored throughy1144':'none',output,sha256:await sha(output),poses,changedOutsideAllowedRegions:changedOutside,allowedRegions:allowed});
 }
}
await writeFile('art/runtime/web-v3/dense-hand-layout-v1.json',JSON.stringify({contract,profiles},null,2)+'\n');
await writeFile(`${root}/provenance-v4.json`,JSON.stringify({method:'Built-in ImageGen dense-state edits and clean scene, followed by geometric normalization of source raster components. No browser capture or runtime card face supplies design geometry. V1 retained; v2 warm-black threshold excluded neutral-black numeral interiors; v3 fixes numeral ink; v4 explicitly fills the156x211 halo canvas instead of Sharp default cover. All earlier designs/provenance retained.',contract,profiles,provenance},null,2)+'\n');
console.log(JSON.stringify(provenance.filter(p=>p.output?.includes('mockups'))));
