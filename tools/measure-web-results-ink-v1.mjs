// Paired dark/semantic ink bounds inside independently chosen quiet text cells.
// Diagnostic geometry, not an image similarity acceptance threshold.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),batch=process.argv[3]??'before-178',folder='art/review/web-v3/results-type-calibration-20261027';
await mkdir(folder,{recursive:true});
const layout=JSON.parse(await readFile('art/runtime/web-v3/results-source-v1/layout-v1.json')),reports=[];
for(const profile of ['landscape','portrait'])for(const state of ['results','current-ranking']){
 const p=layout.profiles[profile],view=state==='results'?'results':'ranking',s=p[view],[cw,ch]=p.canvas,w=profile==='portrait'?390:1672,h=profile==='portrait'?694:941,source=`art/mockups/web-v3/${profile==='portrait'?'portrait/':''}${state==='results'?'06-results-home-v2.png':'33-current-ranking-home-v2.png'}`;
 const sub=batch==='before-181'?'/before-181':batch==='probe-183'?'/probe-183':'';
 const capture=batch==='before-178'?`art/review/web-v3/results-return-home-20261027/${state}-${profile}-chrome.png`:`${folder}${sub}/${state}-${profile}-chrome.png`,images=await Promise.all([source,capture].map(path=>sharp(path).resize(w,h,{fit:'fill'}).removeAlpha().raw().toBuffer()));
 for(let row=0;row<6;row++)for(const part of ['name',...s.columns.map((_,i)=>'col'+i)]){
  if(view==='ranking'&&part==='col0'&&row===0)continue;
  const center=part==='name'?s.name.x+s.name.width/2:s.columns[Number(part.slice(3))],bw=part==='name'?s.name.width:view==='ranking'?100:100,bh=profile==='portrait'?66:60,x0=Math.round((center-bw/2)/cw*w),y0=Math.round((s.rows[row]-bh/2)/ch*h),rw=Math.round(bw/cw*w),rh=Math.round(bh/ch*h),kind=view==='results'&&part==='col2'?(row%2===0?'red':'blue'):'dark';
  const boxes=images.map(data=>{let left=w,top=h,right=-1,bottom=-1,n=0,sx=0,sy=0;for(let y=y0;y<y0+rh;y++)for(let x=x0;x<x0+rw;x++){const i=(y*w+x)*3,[r,g,b]=data.subarray(i,i+3),ink=kind==='red'?r>g*1.7&&r>b*1.6&&g<130&&b<110:kind==='blue'?b>r*1.3&&b>g*.8&&r<95&&g<140:view==='ranking'&&part==='col0'?r<85&&g<70&&b<70:r<140&&g<140&&b<140;if(ink){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);n++;sx+=x;sy+=y;}}return n?{left,top,width:right-left+1,height:bottom-top+1,pixels:n,centroid:[sx/n,sy/n]}:null;});
  reports.push({profile,state,row,part,kind,roi:[x0,y0,rw,rh],source,capture,sourceBox:boxes[0],actualBox:boxes[1],widthRatio:boxes[0]?.width/boxes[1]?.width,heightRatio:boxes[0]?.height/boxes[1]?.height});
 }
}
await writeFile(folder+`/ink-${batch}.json`,JSON.stringify({method:'Independent quiet-cell ROI, dark/red/blue ink threshold. Includes font antialiasing/source paint differences; diagnostic only. Portrait measurements remain at native390width.',reports},null,2)+'\n');
for(const profile of ['landscape','portrait'])for(const state of ['results','current-ranking']){const rows=reports.filter(r=>r.profile===profile&&r.state===state),median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];console.log({profile,state,names:rows.filter(r=>r.part==='name').map(r=>({row:r.row,source:r.sourceBox,actual:r.actualBox})),numericMedian:{width:median(rows.filter(r=>r.part!=='name').map(r=>r.widthRatio)),height:median(rows.filter(r=>r.part!=='name').map(r=>r.heightRatio))}});}
