// Preserve selected ImageGen button pixels. Only the editable number-label
// rectangle comes from the label-free ImageGen candidate, never its borders.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
const sharp = createRequire(import.meta.url)(process.argv[2] ?? "sharp");
const jobs = [
  { profile:"landscape", source:"art/mockups/web-v3/02-create.png", crop:[1098,352,160,86], exportWidth:154, roi:[43,22,63,43], candidate:"art/source/web-v3/seat-selected-wide-label-free-v3-candidate.png" },
  { profile:"portrait", source:"art/mockups/web-v3/portrait/02-create.png", crop:[613,650,170,120], exportWidth:152, roi:[29,44,66,43], candidate:"art/source/web-v3/seat-selected-tall-label-free-v3-candidate.png" },
];
const records=[];
for (const job of jobs) {
  const [left,top,width,height]=job.crop;
  const [x,y,w,h]=job.roi;
  const original=await sharp(job.source).extract({left,top,width,height}).png().toBuffer();
  const patch=await sharp(job.candidate).resize(width,height,{fit:"fill"}).extract({left:x,top:y,width:w,height:h}).png().toBuffer();
  const output=`art/runtime/web-v3/seat-selected-${job.profile}-v3.png`;
  const result=await sharp(original).composite([{input:patch,left:x,top:y}]).png().toBuffer();
  const [a,b]=await Promise.all([original,result].map(input=>sharp(input).ensureAlpha().raw().toBuffer()));
  let changedOutsideRoi=0;
  for(let row=0;row<height;row++) for(let col=0;col<width;col++) {
    if(col>=x && col<x+w && row>=y && row<y+h) continue;
    const i=(row*width+col)*4;
    if(!a.subarray(i,i+4).equals(b.subarray(i,i+4))) changedOutsideRoi++;
  }
  if(changedOutsideRoi) throw new Error("Unrelated source pixels changed");
  // Exclude the neighboring panel's right border: the control can move to any
  // of the four seats without carrying that unrelated piece of frame along.
  await sharp(result).extract({left:0,top:0,width:job.exportWidth,height}).png().toFile(output);
  const hash=async path=>createHash("sha256").update(await readFile(path)).digest("hex");
  records.push({...job,output,sourceSha256:await hash(job.source),candidateSha256:await hash(job.candidate),outputSha256:await hash(output),changedOutsideRoi});
}
await writeFile("art/source/web-v3/entry-seat-v3-provenance.json",JSON.stringify({method:"Built-in ImageGen label cleanup, explicit label ROI only; outside ROI source bytes retained",records},null,2)+"\n");
const clearRecords=[];
for (const [profile,source,region] of [
  ["landscape","art/mockups/web-v3/02-create.png",[1184,240,36,36]],
  ["portrait","art/mockups/web-v3/portrait/02-create.png",[687,457,40,40]],
]) {
  const [left,top,width,height]=region;
  const output=`art/runtime/web-v3/input-clear-${profile}-v3.png`;
  const png=await sharp(source).extract({left,top,width,height}).png().toBuffer();
  await writeFile(output,png);
  clearRecords.push({profile,source,region,output,changedSourcePixels:0,sha256:createHash("sha256").update(png).digest("hex")});
}
await writeFile("art/source/web-v3/entry-clear-v3-provenance.json",JSON.stringify({method:"Lossless authored ImageGen control crop; no drawing or color change",records:clearRecords},null,2)+"\n");
console.log(JSON.stringify(records.map(({profile,changedOutsideRoi,output})=>({profile,changedOutsideRoi,output}))));
