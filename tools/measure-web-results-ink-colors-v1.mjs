// Native source pixels inside quiet score cells. Erode one pixel to exclude
// paper/antialias edges; distributions are diagnostics, not acceptance scores.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),folder='art/source/web-v3/results-ink-v1';await mkdir(folder,{recursive:true});
const layout=JSON.parse(await readFile('art/runtime/web-v3/results-source-v1/layout-v1.json')),reports=[];
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),quantile=(a,q)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*q)];
for(const[profile,p]of Object.entries(layout.profiles))for(const[state,file]of Object.entries({results:'06-results-home-v2.png','final-round':'34-results-final-round-home-v2.png',ranking:'07-ranking.png','current-ranking':'33-current-ranking-home-v2.png','current-final':'36-current-ranking-final-home-v2.png',ranking3:'38-ranking-3-players-v1.png',ranking4:'39-ranking-4-players-v1.png',ranking5:'40-ranking-5-players-v1.png'})){
 const tall=profile==='portrait',source=`art/mockups/web-v3/${tall?'portrait/':''}${file}`,{data,info}=await sharp(source).removeAlpha().raw().toBuffer({resolveWithObject:true}),isRound=state==='results'||state==='final-round',s=p[isRound?'results':'ranking'];
 for(const role of isRound?['positive','negative']:['leading']){
  const rows=role==='leading'?[0]:role==='positive'?(state==='final-round'?[0,3,4]:[0,2,4]):state==='final-round'?[1,2,5]:[1,3,5],samples=[],bounds=[];
  for(const row of rows){const cx=s.columns[isRound?2:1],cy=s.rows[row],w=isRound?110:160,h=tall?78:64,l=Math.round(cx-w/2),t=Math.round(cy-h/2),mask=new Uint8Array(w*h),rgb=(x,y)=>data.subarray(((t+y)*info.width+l+x)*3,((t+y)*info.width+l+x)*3+3);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const[r,g,b]=rgb(x,y);mask[y*w+x]=role==='positive'?r>g*1.7&&r>b*1.6&&g<130&&b<110:role==='negative'?b>r*1.3&&b>g*.8&&r<95&&g<140:r>60&&r<185&&g<140&&b<80&&r>g*1.25;}
   let n=0;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let core=true;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(!mask[(y+yy)*w+x+xx])core=false;if(core){samples.push([...rgb(x,y)]);n++;}}
   bounds.push({row,rect:[l,t,w,h],corePixels:n});
  }
  if(samples.length<20)throw Error('Insufficient source ink '+profile+' '+state+' '+role);
  const channels=[0,1,2].map(c=>samples.map(v=>v[c])),median=channels.map(c=>quantile(c,.5));
  reports.push({profile,state,role,source,sourceSha256:await sha(source),bounds,pixels:samples.length,median,hex:'#'+median.map(n=>n.toString(16).padStart(2,'0')).join(''),p05:channels.map(c=>quantile(c,.05)),p95:channels.map(c=>quantile(c,.95))});
 }
}
await writeFile(folder+'/source-colors-v1.json',JSON.stringify({method:'Native source RGB in quiet score cells,1px mask erosion. Texture and generated glyph variation retained as5/50/95percentiles. Not a screenshot pass threshold.',reports},null,2)+'\n');console.log(reports.map(({profile,state,role,hex,pixels,p05,p95})=>({profile,state,role,hex,pixels,p05,p95})));
