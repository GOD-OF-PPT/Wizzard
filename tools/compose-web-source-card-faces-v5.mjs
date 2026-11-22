// Apply only ImageGen's cleaned numeral paper to exact source-derived faces.
// Runtime export waits for all eight masters; no generated alpha or border is
// accepted. Read all other pixels, including the paper alpha, from references.
import {createRequire} from "node:module";
import {readFile,writeFile,copyFile,access} from "node:fs/promises";
import {createHash} from "node:crypto";
const sharp=createRequire(import.meta.url)(process.argv[2]??"sharp"),root="art/source/web-v3/cards-v5",sha=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
const refs=JSON.parse(await readFile(`${root}/reference-provenance.json`,"utf8")),reports=[],missing=[];
for(const r of refs.reports){
 try{await access(r.candidate);}catch{missing.push(r.candidate);continue;}
 const [w,h]=r.pixelSize,meta=await sharp(r.candidate).metadata();if(Math.abs((meta.width/meta.height)/(w/h)-1)>.005)throw Error("Wrong candidate aspect "+r.candidate);
 const original=await sharp(r.reference).ensureAlpha().raw().toBuffer(),normalized=await sharp(r.candidate).resize(w,h,{fit:"fill"}).png().toBuffer(),out=Buffer.from(original);
 const cleanupRoi=[r.rankRoi[0]-8,r.rankRoi[1]-8,r.rankRoi[2]+16,r.rankRoi[3]+16],[l,t,ww,hh]=cleanupRoi;
 // The source letters have a pale outer impression beyond the dark ink.
 // Include that impression, while preserving nearby colored corner pixels.
 const protectedPixels=new Uint8Array(ww*hh);
 for(let y=0;y<hh;y++)for(let x=0;x<ww;x++){const n=((y+t)*w+x+l)*4,[red,green,blue]=original.subarray(n,n+3),colored=r.suit==="leaf"?green>60&&green>red*1.3&&green>blue*.9:r.suit==="mountain"?blue>65&&blue>red*1.3&&blue>green*1.05:r.suit==="knot"?red>80&&red>green*1.5&&red>blue*1.5:red>100&&green>70&&green>blue*1.7;
  if(colored)for(let yy=Math.max(0,y-6);yy<=Math.min(hh-1,y+6);yy++)for(let xx=Math.max(0,x-6);xx<=Math.min(ww-1,x+6);xx++)protectedPixels[yy*ww+xx]=1;
 }
 // Direct inpainting retained a pale numeral impression on the first leaf.
 // Use only the candidate's verified quiet paper above the motif instead.
 const paperSample={left:248,top:56,width:112,height:156};
 const paper=await sharp(normalized).extract(paperSample).resize(ww,hh,{fit:"fill"}).ensureAlpha().raw().toBuffer();
 const offsets=[0,0,0];let borderSamples=0;
 for(let y=0;y<hh;y++)for(let x=0;x<ww;x++)if(!protectedPixels[y*ww+x]&&(x<2||y<2||x>=ww-2||y>=hh-2)){const n=((y+t)*w+x+l)*4,j=(y*ww+x)*4;for(let c=0;c<3;c++)offsets[c]+=original[n+c]-paper[j+c];borderSamples++;}
 for(let c=0;c<3;c++)offsets[c]/=borderSamples;
 if(offsets.some(v=>Math.abs(v)>30))throw Error("Candidate paper tone diverged too far");
 for(let y=t;y<t+hh;y++)for(let x=l;x<l+ww;x++){if(protectedPixels[(y-t)*ww+x-l])continue;const a=Math.max(0,Math.min(1,(x-l)/8,(y-t)/8,(l+ww-1-x)/8,(t+hh-1-y)/8)),n=(y*w+x)*4,j=((y-t)*ww+x-l)*4;for(let c=0;c<3;c++)out[n+c]=Math.round(original[n+c]*(1-a)+Math.max(0,Math.min(255,paper[j+c]+offsets[c]))*a);}
 let changedPixels=0,changedOutsideRoi=0,alphaChanges=0,protectedChanges=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=(y*w+x)*4;if(original[n+3]!==out[n+3])alphaChanges++;if(original[n]===out[n]&&original[n+1]===out[n+1]&&original[n+2]===out[n+2])continue;changedPixels++;if(x<l||x>=l+ww||y<t||y>=t+hh)changedOutsideRoi++;else if(protectedPixels[(y-t)*ww+x-l])protectedChanges++;}
 if(changedOutsideRoi||alphaChanges||protectedChanges)throw Error("Source invariants changed");
 const source=`${root}/${r.profile}-${r.suit}-face.png`,runtime=`art/runtime/web-v3/cards/${r.profile}-${r.suit}-v5.png`;
 await sharp(out,{raw:{width:w,height:h,channels:4}}).png().toFile(source);
 const proofInputs=await Promise.all([r.reference,source].map(p=>sharp(p).resize(280,420).flatten({background:"#171d25"}).png().toBuffer()));
 const proof=`${root}/${r.profile}-${r.suit}-proof.png`;await sharp({create:{width:576,height:420,channels:3,background:"#171d25"}}).composite([{input:proofInputs[0],left:0,top:0},{input:proofInputs[1],left:296,top:0}]).png().toFile(proof);
 reports.push({...r,cleanupRoi,candidateSize:[meta.width,meta.height],candidateSha256:await sha(r.candidate),paperSample,borderToneOffsets:offsets,source,sourceSha256:await sha(source),runtime,proof,changedPixels,changedOutsideRoi,alphaChanges,protectedChanges});
}
const complete=reports.length===8;
if(complete)for(const r of reports){await copyFile(r.source,r.runtime);r.runtimeSha256=await sha(r.runtime);r.nativeRuntime=r.runtime.replace('-v5.png','-v5-native.png');await sharp(r.source).resize(140,210,{kernel:'nearest'}).png().toFile(r.nativeRuntime);r.nativeRuntimeSize=[140,210];r.nativeRuntimeSha256=await sha(r.nativeRuntime);}
await writeFile(`${root}/face-provenance.json`,JSON.stringify({method:"Exact selected-source raster faces with ImageGen quiet-paper numeral-ROI cleanup only; source alpha/border/symbol/core paper protected. Candidate paper tone matched at ROI boundary; direct pale numeral inpainting rejected.",complete,runtimeExported:complete,missing,reports},null,2)+"\n");
console.log(JSON.stringify({complete,sourceFaces:reports.length,runtimeExported:complete,missing:missing.length,sourceOutsideRoi:reports.reduce((s,r)=>s+r.changedOutsideRoi,0),alphaChanges:reports.reduce((s,r)=>s+r.alphaChanges,0)}));
