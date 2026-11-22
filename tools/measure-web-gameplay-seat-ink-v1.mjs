import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),batch=process.argv[3]??'121',layout=JSON.parse(await readFile('art/runtime/web-v3/gameplay-seats-v1/layout-v2.json','utf8')),reports=[];
for(const [profile,p]of Object.entries(layout.profiles)){
 const tall=profile==='portrait',w=tall?390:1672,h=tall?694:941,source=`art/mockups/web-v3/${tall?'portrait/':''}25-gameplay-selection-idle-v2.png`,capture=`art/review/web-v3/gameplay-seats-calibration-20261026/idle-${profile}-chrome.png`,raw=await Promise.all([source,capture].map(path=>sharp(path).resize(w,h,{fit:'fill'}).removeAlpha().raw().toBuffer()));
 for(const s of p.seats)for(const part of ['name','stats']){
  const [x,y,bw,bh]=s[part],scale=w/p.canvas[0],left=Math.round(x*scale),top=Math.round(y*h/p.canvas[1]),width=Math.round(bw*scale),height=Math.round(bh*h/p.canvas[1]),insetX=part==='name'?Math.round(22*scale):Math.round(12*scale),insetY=Math.max(2,Math.round((part==='name'?6:4)*scale));
  const boxes=raw.map(bytes=>{const points=[];for(let yy=top+insetY;yy<top+height-insetY;yy++)for(let xx=left+insetX;xx<left+width-insetX;xx++){const i=(yy*w+xx)*3,[r,g,b]=bytes.subarray(i,i+3);if(r>150&&g>130&&b>95&&b>r*.5)points.push([xx-left,yy-top]);}if(!points.length)return null;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return{left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs)+1,height:Math.max(...ys)-Math.min(...ys)+1,pixels:points.length};});
  reports.push({profile,slot:s.slot,part,source,sourceBox:boxes[0],captureBox:boxes[1],widthRatio:boxes[0]?.width/boxes[1]?.width,heightRatio:boxes[0]?.height/boxes[1]?.height});
 }
}
await writeFile(`art/source/web-v3/gameplay-seats-v1/ink-comparison-${batch}.json`,JSON.stringify({method:'Pale ink threshold within independently defined quiet source component bounds; diagnostic only, includes sampling/edge effects, never an acceptance threshold.',reports},null,2)+'\n');console.log(reports);
