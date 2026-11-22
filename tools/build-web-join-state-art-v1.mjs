// Compose independent state truth from built-in ImageGen outputs. Only the
// declared fields, error line or focus perimeter may replace original pixels.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFile,writeFile } from "node:fs/promises";
const sharp=createRequire(import.meta.url)(process.argv[2]??"sharp");
const records=[],focusGeometry={};
const rect=([left,top,width,height])=>({left,top,width,height});
const hash=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
async function compose(job,patches,runtime=[]){
  const output=`art/mockups/web-v3/${job.profile==="portrait"?"portrait/":""}${job.number}-${job.state}-v1.png`;
  const bytes=await sharp(job.source).composite(patches.map(p=>({input:p.input,left:p.place[0],top:p.place[1]}))).png().toBuffer();
  const original=await sharp(job.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const actual=await sharp(bytes).ensureAlpha().raw().toBuffer();
  let changedOutsideRoi=0;
  for(let y=0;y<original.info.height;y++)for(let x=0;x<original.info.width;x++){
    if(patches.some(p=>x>=p.place[0]&&x<p.place[0]+p.size[0]&&y>=p.place[1]&&y<p.place[1]+p.size[1]))continue;
    const i=(y*original.info.width+x)*4;
    if(!original.data.subarray(i,i+4).equals(actual.subarray(i,i+4)))changedOutsideRoi++;
  }
  if(changedOutsideRoi)throw Error("Unrelated selected source pixels changed");
  await writeFile(output,bytes);
  records.push({...job,output,patches:patches.map(({input,...p})=>p),runtime,changedOutsideRoi,sourceSha256:await hash(job.source),candidateSha256:await hash(job.candidate),outputSha256:await hash(output)});
}
for(const profile of ["landscape","portrait"]){
  const tall=profile==="portrait",suffix=tall?"tall":"wide";
  const source=`art/mockups/web-v3/${tall?"portrait/":""}03-join.png`;
  const clean=`art/runtime/web-v3/${tall?"portrait/":""}join.png`;
  const fields=tall?[178,280,381,484,586,687].map(x=>[x,951,77,88]):Array.from({length:6},(_,i)=>[632+i*99,491,74,79]);
  const codeCandidate=`art/source/web-v3/join-code-error-${suffix}-v1-candidate.png`;
  const codePatches=[];
  for(const r of fields)codePatches.push({input:await sharp(codeCandidate).extract(rect(r)).png().toBuffer(),place:r.slice(0,2),size:r.slice(2)});
  const helper=tall?[302,1060,352,45]:[710,590,405,34];
  const helperBytes=await sharp(codeCandidate).extract(rect(helper)).png().toBuffer();
  const helperPath=`art/runtime/web-v3/join-code-error-${profile}-v1.png`;
  await writeFile(helperPath,helperBytes);
  codePatches.push({input:helperBytes,place:helper.slice(0,2),size:helper.slice(2)});
  await compose({profile,source,candidate:codeCandidate,number:22,state:"join-code-error",content:{nickname:"茶客听雨",code:"12",error:"请输入六位数字房间码"}},codePatches,[helperPath]);

  const nameCandidate=`art/source/web-v3/join-name-error-${suffix}-v1-candidate.png`;
  const blank=tall?[335,700,275,61]:[765,334,425,54];
  const nameCrop=tall?[339,708,280,48]:[772,343,225,37];
  const nameSize=tall?[224,38]:[200,33],namePlace=tall?[348,714]:[776,345];
  const nameBytes=await sharp(nameCandidate).extract(rect(nameCrop)).resize(...nameSize,{fit:"fill"}).png().toBuffer();
  const namePath=`art/runtime/web-v3/join-name-error-${profile}-v1.png`;
  await writeFile(namePath,nameBytes);
  await compose({profile,source,candidate:nameCandidate,clean,cleanSha256:await hash(clean),number:23,state:"join-name-error",content:{nickname:"",code:"628315",error:"请填写茶客昵称"},nameCrop,nameSize},[
    {input:await sharp(clean).extract(rect(blank)).png().toBuffer(),place:blank.slice(0,2),size:blank.slice(2)},
    {input:nameBytes,place:namePlace,size:nameSize},
  ],[namePath]);

  const candidate=`art/source/web-v3/join-code-focus-${suffix}-v1-candidate.png`;
  const frameCrop=tall?[145,921,651,148]:[604,461,627,138];
  const frameSize=tall?[651,148]:[613,121],origin=tall?[145,921]:[610,470];
  const frame=await sharp(candidate).extract(rect(frameCrop)).resize(...frameSize,{fit:"fill"}).png().toBuffer();
  const strips=tall?{top:[0,0,651,18],bottom:[0,130,651,18],left:[0,18,24,112],right:[634,18,17,112]}:{top:[0,0,613,10],bottom:[0,108,613,13],left:[0,10,14,98],right:[602,10,11,98]};
  const focusPatches=[],focusFiles=[];
  focusGeometry[profile]={canvas:tall?[941,1672]:[1672,941],parts:{}};
  for(const[part,r]of Object.entries(strips)){
    const input=await sharp(frame).extract(rect(r)).png().toBuffer();
    const place=[origin[0]+r[0],origin[1]+r[1]],size=r.slice(2);
    const output=`art/runtime/web-v3/join-code-focus-${profile}-${part}-v1.png`;
    await writeFile(output,input);focusFiles.push(output);
    focusPatches.push({input,place,size});focusGeometry[profile].parts[part]=[...place,...size];
  }
  await compose({profile,source,candidate,number:24,state:"join-code-focus",frameCrop,frameSize,content:{nickname:"茶客听雨",code:"628315",focused:"六位房间码"}},focusPatches,focusFiles);
}
await writeFile("art/runtime/web-v3/join-code-focus-geometry-v1.json",JSON.stringify(focusGeometry,null,2)+"\n");
await writeFile("art/source/web-v3/join-state-v1-provenance.json",JSON.stringify({method:"Built-in ImageGen edits. Perimeter contains no value glyphs; original selected design retained outside declared ROI. Empty-name lettering and wide focus frame resized once to their measured slots.",records},null,2)+"\n");
console.log(JSON.stringify(records.map(({output,changedOutsideRoi})=>({output,changedOutsideRoi}))));
