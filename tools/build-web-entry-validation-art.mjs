// A new, independent validation state from the selected ImageGen page plus
// its ImageGen empty-field layer and a tightly bounded ImageGen error line.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFile,writeFile } from "node:fs/promises";
const sharp=createRequire(import.meta.url)(process.argv[2]??"sharp");
const records=[];
for(const job of [
  {profile:"landscape",source:"art/mockups/web-v3/02-create.png",clean:"art/runtime/web-v3/create.png",candidate:"art/source/web-v3/create-name-error-wide-v1-candidate.png",field:[724,232,502,54],line:[713,300,192,29],place:[742,301]},
  {profile:"portrait",source:"art/mockups/web-v3/portrait/02-create.png",clean:"art/runtime/web-v3/portrait/create.png",candidate:"art/source/web-v3/create-name-error-tall-v1-candidate.png",field:[365,437,370,76],line:[355,531,245,37],place:[380,532]},
]) {
  const [x,y,w,h]=job.field,[left,top,width,height]=job.line;
  const field=await sharp(job.clean).extract({left:x,top:y,width:w,height:h}).png().toBuffer();
  const line=await sharp(job.candidate).extract({left,top,width,height}).png().toBuffer();
  const output=`art/mockups/web-v3/${job.profile==="portrait"?"portrait/":""}21-create-name-error-v1.png`;
  const runtime=`art/runtime/web-v3/create-name-error-${job.profile}-v1.png`;
  const result=await sharp(job.source).composite([{input:field,left:x,top:y},{input:line,left:job.place[0],top:job.place[1]}]).png().toBuffer();
  const original=await sharp(job.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const actual=await sharp(result).ensureAlpha().raw().toBuffer();
  let changedOutsideRoi=0;
  for(let row=0;row<original.info.height;row++)for(let col=0;col<original.info.width;col++){
    if((col>=x&&col<x+w&&row>=y&&row<y+h)||(col>=job.place[0]&&col<job.place[0]+width&&row>=job.place[1]&&row<job.place[1]+height))continue;
    const i=(row*original.info.width+col)*4;
    if(!original.data.subarray(i,i+4).equals(actual.subarray(i,i+4)))changedOutsideRoi++;
  }
  if(changedOutsideRoi)throw Error("Unrelated source pixels changed");
  await writeFile(output,result);await writeFile(runtime,line);
  const hash=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
  records.push({...job,output,runtime,changedOutsideRoi,sourceSha256:await hash(job.source),cleanSha256:await hash(job.clean),candidateSha256:await hash(job.candidate),outputSha256:await hash(output),runtimeSha256:await hash(runtime)});
}
await writeFile("art/source/web-v3/create-name-error-v1-provenance.json",JSON.stringify({method:"Built-in ImageGen sources only; original page preserved outside empty editable field and error-line ROI",records},null,2)+"\n");
console.log(JSON.stringify(records.map(({output,runtime,changedOutsideRoi})=>({output,runtime,changedOutsideRoi}))));
