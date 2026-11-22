// Rebuild from original page pixels. Existing blank-art is a bounded texture
// donor only; original row dividers, paper, frame and decorations never move.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),folder='art/source/web-v3/results-source-v1',root='art/runtime/web-v3/results-source-v1';
await mkdir(root,{recursive:true});
const layout=JSON.parse(await readFile(`${root}/layout-v1.json`,'utf8')),sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)]??0;
const copy={landscape:{results:{title:[694,91,301,73],secondary:[855,744,176,46],primary:[1136,739,216,53]},ranking:{title:[665,78,348,77],subtitle:[681,174,313,40],secondary:[550,766,193,59],primary:[938,766,183,58]}},portrait:{results:{title:[333,275,307,75],secondary:[360,1385,230,72],primary:[323,1510,301,72]},ranking:{title:[326,293,310,75],subtitle:[325,403,290,39],secondary:[340,1360,265,81],primary:[330,1486,280,88]}}};
const reports=[];
for(const[profile,p]of Object.entries(layout.profiles))for(const view of ['results','ranking']){
 const tall=profile==='portrait',source=`art/mockups/web-v3/${tall?'portrait/':''}${view==='results'?'06-results.png':'07-ranking.png'}`,donor=`art/runtime/web-v3/${view==='results'?(tall?'portrait/results.png':'results.png'):(tall?'portrait/ranking-v2.png':'ranking-clean-v3.png')}`,[cw,ch]=p.canvas,s=p[view],before=await sharp(source).removeAlpha().raw().toBuffer(),texture=await sharp(donor).resize(cw,ch,{fit:'fill'}).removeAlpha().raw().toBuffer(),after=Buffer.from(before),mask=new Uint8Array(cw*ch),regions=[];
 const panel=copy[profile][view];for(const[kind,rect]of Object.entries(panel))regions.push({kind,rect});
 for(const[index,y]of s.rows.entries()){
  const[cx,r]=s.avatar;regions.push({kind:'avatar',index,circle:[cx,y,r+7],rect:[Math.floor(cx-r-9),Math.floor(y-r-9),Math.ceil(2*r+18),Math.ceil(2*r+18)]});
  regions.push({kind:'name',index,rect:[s.name.x-9,Math.floor(y-(tall?29:25)),s.name.width+12,tall?57:49]});
  for(const[column,x]of s.columns.entries())regions.push({kind:'number',index,column,rect:[Math.floor(x-(view==='results'?56:65)),Math.floor(y-(tall?34:28)),view==='results'?112:130,tall?65:55]});
 }
 for(const region of regions){const[l,t,w,h]=region.rect,quiet=[];
  for(let y=t;y<t+h;y++)for(let x=l;x<l+w;x++){const i=(y*cw+x)*3,[r,g,b]=before.subarray(i,i+3);if(region.kind==='primary'?r<100&&g>r*.9&&g<140&&b<100:r>175&&g>150&&b>110&&g>r*.7)quiet.push(i);}
  const shifts=[0,1,2].map(c=>median(quiet.map(i=>before[i+c]-texture[i+c])));
  for(let y=t;y<t+h;y++)for(let x=l;x<l+w;x++){
   let a=Math.max(0,Math.min(1,(x-l)/3,(y-t)/3,(l+w-1-x)/3,(t+h-1-y)/3));
   if(region.circle){const[cx,cy,r]=region.circle;a=Math.max(0,Math.min(1,(r-Math.hypot(x-cx,y-cy))/2));}
   if(!a)continue;const i=(y*cw+x)*3;mask[y*cw+x]=1;for(let c=0;c<3;c++)after[i+c]=Math.round(after[i+c]*(1-a)+Math.max(0,Math.min(255,texture[i+c]+shifts[c]))*a);
  }
 }
 let changed=0,changedOutside=0;for(let i=0;i<cw*ch;i++)if([0,1,2].some(c=>before[i*3+c]!==after[i*3+c])){changed++;if(!mask[i])changedOutside++;}
 if(changedOutside)throw Error('Static source changed outside dynamic masks');
 const output=`${root}/${profile}-${view}-background-v1.png`;await sharp(after,{raw:{width:cw,height:ch,channels:3}}).png().toFile(output);
 reports.push({profile,view,source,sourceSha256:await sha(source),donor,donorSha256:await sha(donor),output,sha256:await sha(output),canvas:p.canvas,regions,changed,changedOutsideDynamicMasks:changedOutside,originalStaticPixels:cw*ch-mask.reduce((a,b)=>a+b,0),originalStaticFraction:1-mask.reduce((a,b)=>a+b,0)/(cw*ch)});
}
await writeFile(`${folder}/background-provenance-v1.json`,JSON.stringify({method:'Full original page is the base. Existing ImageGen blank-art used only inside explicit dynamic text/numeric/avatar masks, quiet-source median color registration and3px rectangle/2pxcircle feather. Original paper/frame/tableheaders/rowdivider pixels outside masks invariant; no whole generated background replacement.',reports},null,2)+'\n');
console.log(reports.map(r=>({profile:r.profile,view:r.view,changed:r.changed,outside:r.changedOutsideDynamicMasks,staticFraction:r.originalStaticFraction})));
