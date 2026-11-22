// Compose only generated numeric ink/removal footprints into original07.
// The generated whole page is not accepted as a replacement for the scene.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),root='art/source/web-v3/results-negative-six-v1',layout=JSON.parse(await readFile('art/runtime/web-v3/results-source-v1/layout-v1.json')),reports=[],sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
for(const[profile,p]of Object.entries(layout.profiles)){
 const tall=profile==='portrait',[w,h]=p.canvas,source=`art/mockups/web-v3/${tall?'portrait/':''}07-ranking.png`,candidate=`${root}/${profile}-candidate-v1.png`,meta=await sharp(candidate).metadata();if(meta.width!==w||meta.height!==h)throw Error('Candidate canvas mismatch');
 const before=await sharp(source).removeAlpha().raw().toBuffer(),generated=await sharp(candidate).removeAlpha().raw().toBuffer(),after=Buffer.from(before),allowed=[];
 const regions=[...p.ranking.rows.map((cy,row)=>({role:row===0?'gold':'black',row,rect:tall?[625,cy-42,122,84]:[1080,cy-33,140,66]})),...[1,3].map(row=>({role:'rank',row,rect:[(tall?255:507)-21,p.ranking.rows[row]-28,42,56]}))];
 for(const region of regions){const[l,t,rw,rh]=region.rect,mask=new Uint8Array(rw*rh),ink=(bytes,x,y)=>{const i=((t+y)*w+l+x)*3,[r,g,b]=bytes.subarray(i,i+3);return region.role==='gold'?r>55&&r<190&&g<150&&b<95&&r>g*1.2:region.role==='rank'?r<85&&g<70&&b<70:r<145&&g<125&&b<110;};
  for(let y=0;y<rh;y++)for(let x=0;x<rw;x++)mask[y*rw+x]=ink(before,x,y)||ink(generated,x,y);
  let changed=0;for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){let distance=99;for(let yy=-3;yy<=3;yy++)for(let xx=-3;xx<=3;xx++){const nx=x+xx,ny=y+yy;if(nx>=0&&ny>=0&&nx<rw&&ny<rh&&mask[ny*rw+nx])distance=Math.min(distance,Math.max(Math.abs(xx),Math.abs(yy)));}const a=distance<=2?1:distance===3?.5:0;if(!a)continue;const i=((t+y)*w+l+x)*3;let diff=false;for(let c=0;c<3;c++){const v=Math.round(before[i+c]*(1-a)+generated[i+c]*a);if(v!==before[i+c])diff=true;after[i+c]=v;}if(diff)changed++;}
  allowed.push({...region,changedPixels:changed,mask:'Union of old/generated numeric ink, dilate2px,1px feather. Quiet local source paper clears old ink. No full page replacement.'});
 }
 let outside=0,total=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*3;if([0,1,2].some(c=>before[i+c]!==after[i+c])){total++;if(!allowed.some(({rect:[l,t,rw,rh]})=>x>=l&&x<l+rw&&y>=t&&y<t+rh))outside++;}}
 if(outside)throw Error('Unrelated source changed');const output=`art/mockups/web-v3/${tall?'portrait/':''}41-ranking-six-negative-v1.png`;await sharp(after,{raw:{width:w,height:h,channels:3}}).png().toFile(output);
 reports.push({profile,source,sourceSha256:await sha(source),candidate,candidateSha256:await sha(candidate),output,outputSha256:await sha(output),allowed,totalChangedPixels:total,changedOutsideROI:outside});
}
await writeFile(root+'/provenance-v1.json',JSON.stringify({generator:'Built-in ImageGen local numeric edits on selected07, complete prompts in art/prompts/web-v3-ranking-six-negative-v1.txt',data:{ranks:[1,1,3,3,5,6],totals:[-10,-10,-30,-30,-60,-80]},reports},null,2)+'\n');console.log({designs:reports.length,reports:reports.map(r=>({profile:r.profile,changed:r.totalChangedPixels,outside:r.changedOutsideROI}))});
