import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),label=process.argv[3]??'before-186',captureRoot=process.argv[4]??'art/review/web-v3/results-type-calibration-20261027',layout=JSON.parse(await readFile('art/runtime/web-v3/results-source-v1/layout-v1.json')),reports=[];
for(const[profile,p]of Object.entries(layout.profiles))for(const state of ['results','final-round']){
 const tall=profile==='portrait',w=tall?390:1672,h=tall?694:941,[cw,ch]=p.canvas,scale=w/cw,s=p.results,source=`art/mockups/web-v3/${tall?'portrait/':''}${state==='results'?'06-results-home-v2.png':'34-results-final-round-home-v2.png'}`,capture=`${captureRoot}/${state}-${profile}-chrome.png`,images=await Promise.all([source,capture].map(f=>sharp(f).resize(w,h,{fit:'fill'}).removeAlpha().raw().toBuffer()));
 for(const row of state==='results'?[1,3,5]:[1,2,5]){
  const x0=Math.round((s.columns[2]-55)*scale),y0=Math.round((s.rows[row]-32)/ch*h),rw=Math.round(110*scale),rh=Math.round(64/ch*h),cx=s.columns[2]*scale,cy=s.rows[row]/ch*h;
  const boxes=images.map(data=>{const mask=new Uint8Array(rw*rh),seen=new Uint8Array(rw*rh),components=[];for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const i=((y0+y)*w+x0+x)*3,[r,g,b]=data.subarray(i,i+3);mask[y*rw+x]=b>r*1.3&&b>g*.8&&r<95&&g<140;}
   for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){let z=y*rw+x;if(!mask[z]||seen[z])continue;const queue=[z],xs=[],ys=[];seen[z]=1;while(queue.length){const n=queue.pop(),nx=n%rw,ny=Math.floor(n/rw);xs.push(nx);ys.push(ny);for(const[a,b]of [[nx-1,ny],[nx+1,ny],[nx,ny-1],[nx,ny+1]]){const k=b*rw+a;if(a<0||b<0||a>=rw||b>=rh||seen[k]||!mask[k])continue;seen[k]=1;queue.push(k);}}if(xs.length<3)continue;components.push({left:x0+Math.min(...xs),top:y0+Math.min(...ys),width:Math.max(...xs)-Math.min(...xs)+1,height:Math.max(...ys)-Math.min(...ys)+1,pixels:xs.length});}
   const minus=components.filter(c=>c.width>c.height*2&&c.left<cx&&Math.abs(c.top+c.height/2-cy)<10*scale).sort((a,b)=>Math.abs(a.top+a.height/2-cy)-Math.abs(b.top+b.height/2-cy))[0];return{minus,components};});
  reports.push({profile,state,row,source,capture,scale,sourceBox:boxes[0].minus??null,actualBox:boxes[1].minus??null,sourceComponents:boxes[0].components,actualComponents:boxes[1].components});
 }
}
await writeFile(`art/source/web-v3/results-ink-v1/minus-${label}.json`,JSON.stringify({method:'Blue ink connected components in fixed score cells. Only quiet horizontal component left of column center and near row center selected. Source symmetrically normalized to actual capture size. Diagnostic only.',reports},null,2)+'\n');console.log(reports.map(({profile,state,row,sourceBox,actualBox})=>({profile,state,row,sourceBox,actualBox})));
