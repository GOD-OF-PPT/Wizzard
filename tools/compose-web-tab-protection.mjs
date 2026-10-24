// Assemble independent ImageGen notice + edited entry ROIs. Preserve every
// base pixel outside these explicit rectangles, never repaint the scene.
import { createRequire } from "node:module";
import { writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const sharp=createRequire(import.meta.url)(process.argv[2]??"sharp");
const jobs=[
 {profile:"landscape",base:"art/mockups/web-v3/01-home.png",raw:"art/source/web-v3/tab-protection-landscape-v2.png",regions:[[140,340,530,125],[140,466,530,125]]},
 {profile:"portrait",base:"art/mockups/web-v3/portrait/01-home.png",raw:"art/source/web-v3/tab-protection-portrait-v2.png",regions:[[180,470,580,130],[180,609,580,130],[90,1250,760,370]]},
];
const reports=[];
for(const j of jobs){
 const a=await sharp(j.base).metadata(), b=await sharp(j.raw).metadata();
 if(a.width!==b.width||a.height!==b.height)throw new Error("Generated state changed canvas");
 const layers=await Promise.all(j.regions.map(async([left,top,width,height])=>({left,top,input:await sharp(j.raw).extract({left,top,width,height}).png().toBuffer()})));
 let notice=null;
 if(j.profile==="landscape"){
  // Ignore isolated alpha<8 output dust beyond the notice and retain 8px
  // transparent padding around its authored visible border. Uniform resize.
  const input=await sharp("art/source/web-v3/tab-protection-notice-landscape-v1.png").extract({left:160,top:61,width:1797,height:625}).resize({width:550}).png().toBuffer();
  const m=await sharp(input).metadata();notice=[775,34,m.width,m.height];
  layers.push({input,left:775,top:34});
 }
 const prefix=j.profile==="portrait"?"portrait/":"";
 const design=`art/mockups/web-v3/${prefix}20-tab-protection-v1.png`;
 const runtime=`art/runtime/web-v3/${prefix}tab-protection-v1.png`;
 const png=await sharp(j.base).composite(layers).png().toBuffer();
 await writeFile(design,png);await writeFile(runtime,png);
 const rawBase=await sharp(j.base).ensureAlpha().raw().toBuffer();
 const rawOut=await sharp(png).ensureAlpha().raw().toBuffer();
 const rois=[...j.regions,...(notice?[notice]:[])];let changedOutside=0;
 for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
  if(rois.some(([l,t,w,h])=>x>=l&&x<l+w&&y>=t&&y<t+h))continue;
  const i=(y*a.width+x)*4;if(rawBase.subarray(i,i+4).compare(rawOut.subarray(i,i+4)))changedOutside++;
 }
 if(changedOutside)throw new Error("Unexpected scene edits");
 const hash=p=>createHash("sha256").update(p).digest("hex");
 reports.push({...j,design,runtime,size:[a.width,a.height],notice,changedOutside,baseSha256:hash(await readFile(j.base)),designSha256:hash(png)});
}
await writeFile("art/review/web-v3/44-tab-protection-source-20261020.json",JSON.stringify(reports,null,2)+"\n");
console.log(JSON.stringify(reports));
