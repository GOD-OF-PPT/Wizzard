// Pixel analysis only: dark text on a light authored paper region. It does not
// modify images or auto-pass a font. Use a region without dark illustrations.
import { createRequire } from "node:module";
const [source, capture, modulePath = "sharp", widthArg = "1672", heightArg = "941", rectArg = "500,300,340,120"] = process.argv.slice(2);
const sharp = createRequire(import.meta.url)(modulePath);
const width = Number(widthArg), height = Number(heightArg);
const [x,y,w,h] = rectArg.split(",").map(Number);
async function measure(path) {
  const { data, info } = await sharp(path).resize(width,height).removeAlpha().raw().toBuffer({ resolveWithObject:true });
  const rows = [];
  for (let row=y;row<y+h;row++) {
    let left=width,right=-1,count=0;
    for (let col=x;col<x+w;col++) {
      const i=(row*width+col)*info.channels;
      if (data[i]>=90 || data[i+1]>=90 || data[i+2]>=90) continue;
      left=Math.min(left,col);right=Math.max(right,col);count++;
    }
    if(count>=3) rows.push({y:row,left,right,count});
  }
  const runs=[];
  for(const row of rows) {
    let run=runs.at(-1);
    if(!run || row.y>run.bottom+1) {run={top:row.y,bottom:row.y,left:row.left,right:row.right,pixels:0};runs.push(run);}
    run.bottom=row.y;run.left=Math.min(run.left,row.left);run.right=Math.max(run.right,row.right);run.pixels+=row.count;
  }
  return { path, runs:runs.filter(run=>run.bottom>run.top), inkPixels:rows.reduce((sum,row)=>sum+row.count,0) };
}
console.log(JSON.stringify({viewport:[width,height],region:[x,y,w,h],threshold:"all RGB channels <90, >=3 ink pixels per row",source:await measure(source),capture:await measure(capture),limitation:"Bounding ink and row rhythm only; not a font identity, legibility or full visual pass."},null,2));
