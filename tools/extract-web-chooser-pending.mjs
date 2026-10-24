// Mechanical copy of ImageGen pixels into the existing transparent runtime
// layer. No painting/recoloring. Raw copy avoids alpha round-trip changes.
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
const sharp = createRequire(import.meta.url)(process.argv[2] ?? "sharp");
const jobs = [
  { profile: "landscape", base: "chooser.png", raw: "chooser-pending-landscape-v2.png", output: "chooser-pending-v2.png", regions: [[445,390,170,274],[649,390,169,274],[853,390,169,274],[1057,390,169,274],[1457,13,190,52]] },
  { profile: "portrait", base: "portrait/chooser.png", raw: "chooser-pending-portrait-v3.png", output: "portrait/chooser-pending-v2.png", regions: [[272,504,397,49],[206,573,241,295],[495,573,241,295],[206,889,241,296],[495,889,241,296]] },
];
const reports=[];
for (const job of jobs) {
  const base=`art/runtime/web-v3/${job.base}`, generated=`art/source/web-v3/${job.raw}`;
  const [a,b]=await Promise.all([base,generated].map(p=>sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
  // Landscape cleanup was authored at 1671 px; preserve its one-column
  // historical rounding difference, without resizing the generated source.
  if (Math.abs(a.info.width-b.info.width)>1 || a.info.height!==b.info.height) throw new Error("Unexpected canvas mismatch");
  const data=Buffer.from(a.data);
  for(const [x,y,w,h] of job.regions) {
    if(x+w>a.info.width || y+h>a.info.height) throw new Error("ROI out of bounds");
    for(let row=y;row<y+h;row++) b.data.copy(data,(row*a.info.width+x)*4,(row*b.info.width+x)*4,(row*b.info.width+x+w)*4);
  }
  const output=`art/runtime/web-v3/${job.output}`;
  await sharp(data,{raw:{width:a.info.width,height:a.info.height,channels:4}}).png().toFile(output);
  const result=await sharp(output).ensureAlpha().raw().toBuffer();
  let changedOutside=0;
  for(let y=0;y<a.info.height;y++)for(let x=0;x<a.info.width;x++) {
    if(job.regions.some(([l,t,w,h])=>x>=l&&x<l+w&&y>=t&&y<t+h))continue;
    const i=(y*a.info.width+x)*4;
    if(result.subarray(i,i+4).compare(a.data.subarray(i,i+4)))changedOutside++;
  }
  if(changedOutside)throw new Error("Pixels outside the generated crop changed");
  reports.push({...job,base,generated,output,sourceSize:[b.info.width,b.info.height],runtimeSize:[a.info.width,a.info.height],changedOutside});
}
await writeFile("art/review/web-v3/41-chooser-runtime-extraction-20261020.json",JSON.stringify(reports,null,2)+"\n");
console.log(JSON.stringify(reports));
