// Analyze green lacquer bands only. This is a diagnostic measurement, not art
// editing or an automatic visual pass; avatar/copy similarity needs inspection.
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
const [source,capture,modulePath,profile="landscape",output] = process.argv.slice(2);
const sharp = createRequire(import.meta.url)(modulePath);
const [width,height] = profile === "landscape" ? [1672,941] : [390,694];
const slots = profile === "landscape" ? [
  ["cat",365,305,190,115],["crane",738,290,200,115],["fox",1110,305,200,115],
  ["panda",85,515,215,115],["traveler",1175,675,225,115],
] : [["cat",29,260,95,62],["crane",145,210,95,60],["fox",268,260,95,62],["panda",25,396,95,60],["traveler",268,396,95,60]];
async function measure(path) {
  const {data,info}=await sharp(path).resize(width,height).removeAlpha().raw().toBuffer({resolveWithObject:true});
  return slots.map(([name,x,y,w,h])=>{
    const runs=[];
    for(let row=y;row<y+h;row++) {
      let left=width,right=-1,count=0;
      for(let col=x;col<x+w;col++) {
        const i=(row*width+col)*info.channels,r=data[i],g=data[i+1],b=data[i+2];
        if(g<r*1.12||g<b*1.1||g>150) continue;
        left=Math.min(left,col);right=Math.max(right,col);count++;
      }
      if(count<w*.15) continue;
      const type=right-left>w*.65 ? "wide-name" : "narrow-status";
      let run=runs.at(-1);
      if(!run||run.type!==type||run.bottom!==row-1) {run={type,top:row,bottom:row,left,right};runs.push(run);}
      run.bottom=row;run.left=Math.min(run.left,left);run.right=Math.max(run.right,right);
    }
    return {name,runs:runs.filter(r=>r.bottom-r.top>=2)};
  });
}
const result={profile,viewport:[width,height],source:await measure(source),capture:await measure(capture),limitation:"Green-band threshold diagnostic; irregular gold caps/text excluded."};
if(output) await writeFile(output,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(output?{output,profile}:result,null,2));
