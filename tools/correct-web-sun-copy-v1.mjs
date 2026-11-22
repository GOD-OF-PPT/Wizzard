// Local copy correction only. Never replace a whole ImageGen candidate page.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),folder='art/source/web-v3/hud-source-v1',runtime='art/runtime/web-v3/hud-source-v1';
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)]??0;
const jobs={landscape:{candidate:`${folder}/landscape-trump-corrected-candidate-v2.png`,generated:[1541,259,172,176],name:[234,16,59,39],glyph:[234,18,32,36],reference:[672,505,331,75]},portrait:{candidate:`${folder}/portrait-trump-corrected-candidate-v2.png`,generated:[1534,271,175,173],name:[253,16,65,43],glyph:[253,20,34,39],reference:[298,923,359,80]}};
const generated={};
for(const [profile,p]of Object.entries(jobs)){
 const [left,top,width,height]=p.generated,{data}=await sharp(p.candidate).extract({left,top,width,height}).removeAlpha().raw().toBuffer({resolveWithObject:true}),out=Buffer.alloc(width*height*4);
 for(let i=0;i<width*height;i++){const [r,g,b]=data.subarray(i*3,i*3+3),a=r>g*1.2?Math.max(0,Math.min(1,(200-g)/180)):0;out[i*4]=145;out[i*4+1]=20;out[i*4+2]=10;out[i*4+3]=Math.round(a*255);}
 generated[profile]=await sharp(out,{raw:{width,height,channels:4}}).png().toBuffer();
}
const reports=[];
async function patch(input,output,profile,rect,kind){
 const {data:before,info}=await sharp(input).removeAlpha().raw().toBuffer({resolveWithObject:true}),after=Buffer.from(before),[rx,ry,rw,rh]=rect,{width:w,height:h}=info,p=jobs[profile],points=[];
 for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++){const i=(y*w+x)*3,[r,g,b]=before.subarray(i,i+3);if(r>55&&g<160&&g<r*.74&&b<r*.8)points.push([x,y]);}
 if(points.length<30)throw Error('Missing original ink '+input+' '+rect);
 const xs=points.map(v=>v[0]),ys=points.map(v=>v[1]),bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs)+1,Math.max(...ys)+1], [l,t,r,b]=bounds,gw=r-l,gh=b-t;
 const [nx,ny,nw,nh]=p.name;
 const texture=await sharp(`${runtime}/${profile}-trump-live-fields-v1.png`).extract({left:nx,top:ny,width:nw,height:nh}).resize(rw,rh,{fit:'fill'}).removeAlpha().raw().toBuffer();
 const quiet=[];for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const i=((y+ry)*w+x+rx)*3;if(before[i+1]>before[i]*.72)quiet.push([x,y]);}
 const shifts=[0,1,2].map(c=>median(quiet.map(([x,y])=>before[((y+ry)*w+x+rx)*3+c]-texture[(y*rw+x)*3+c])));
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const i=((y+ry)*w+x+rx)*3,j=(y*rw+x)*3,a=Math.max(0,Math.min(1,x/2,y/2,(rw-1-x)/2,(rh-1-y)/2));for(let c=0;c<3;c++)after[i+c]=Math.round(before[i+c]*(1-a)+Math.max(0,Math.min(255,texture[j+c]+shifts[c]))*a);}
 const ink=[0,1,2].map(c=>median(points.map(([x,y])=>before[(y*w+x)*3+c]).filter((_,i)=>{const [x,y]=points[i],n=(y*w+x)*3;return before[n+1]<110&&before[n]>before[n+1]*1.5;})));
 const glyph=await sharp(generated[profile]).resize(gw,gh,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=((y+t)*w+x+l)*3,j=(y*gw+x)*4,a=glyph[j+3]/255;for(let c=0;c<3;c++)after[i+c]=Math.round(after[i+c]*(1-a)+ink[c]*a);}
 let changed=0,changedOutside=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*3;if([0,1,2].every(c=>before[i+c]===after[i+c]))continue;changed++;if(x<rx||x>=rx+rw||y<ry||y>=ry+rh)changedOutside++;}
 if(changedOutside)throw Error('Unrelated source change');
 const meta=await sharp(input).metadata();
 if(meta.hasAlpha){const alpha=await sharp(input).extractChannel('alpha').raw().toBuffer();await sharp(after,{raw:{width:w,height:h,channels:3}}).joinChannel(alpha,{raw:{width:w,height:h,channels:1}}).png().toFile(output);}
 else await sharp(after,{raw:{width:w,height:h,channels:3}}).png().toFile(output);
 const report={profile,kind,input,inputSha256:await sha(input),output,sha256:await sha(output),candidate:p.candidate,candidateSha256:await sha(p.candidate),generated:p.generated,rect,originalInkBounds:bounds,ink,changed,changedOutsideROI:changedOutside,alphaChanges:0};reports.push(report);return report;
}
// Correct only the original first glyph; the original 日 and fixed prefix stay.
for(const [profile,p]of Object.entries(jobs)){
 const corrected=`${folder}/${profile}-trump-corrected-reference-v1.png`;
 await patch(`${folder}/${profile}-trump-reference.png`,corrected,profile,p.glyph,'reference');
 const [left,top,width,height]=p.name,{data}=await sharp(corrected).extract({left,top,width,height}).removeAlpha().raw().toBuffer({resolveWithObject:true}),out=Buffer.alloc(width*height*4);
 for(let i=0;i<width*height;i++){const [r,g,b]=data.subarray(i*3,i*3+3);if(r>g*1.3&&g<160){for(let c=0;c<3;c++)out[i*4+c]=data[i*3+c];out[i*4+3]=255;}}
 await sharp(out,{raw:{width,height,channels:4}}).png().toFile(`${runtime}/${profile}-trump-sun-name-v1.png`);
}
// Measure the original plaque's location by normalized RGB template matching.
async function findPanel(source,profile,bid){
 const p=jobs[profile],[,cy,tw,th]=p.reference,{data,info}=await sharp(source).removeAlpha().raw().toBuffer({resolveWithObject:true}),ref=await sharp(`${folder}/${profile}-trump-reference.png`).removeAlpha().raw().toBuffer(),center=[p.reference[0],bid?595:cy];let best=null;
 for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++){const [l,t]=[center[0]+dx,center[1]+dy];let dot=0,power=0;for(let y=4;y<th-4;y+=4)for(let x=8;x<tw-8;x+=4)for(let c=0;c<3;c++){const a=ref[(y*tw+x)*3+c],b=data[((y+t)*info.width+x+l)*3+c];dot+=a*b;power+=a*a;}const scale=dot/power;let error=0,n=0;for(let y=4;y<th-4;y+=4)for(let x=8;x<tw-8;x+=4)for(let c=0;c<3;c++){error+=(data[((y+t)*info.width+x+l)*3+c]-ref[(y*tw+x)*3+c]*scale)**2;n++;}error/=n;if(!best||error<best.error)best={left:l,top:t,error,scale};}
 return best;
}
const old=JSON.parse(await readFile('art/review/web-v3/gameplay-seats-calibration-20261026/coverage.json','utf8')),mapping=[];
for(const r of old.reports){
 const {profile,state,source}=r,tall=profile==='portrait';let target=null,position=null;
 if(state.startsWith('chooser'))target=tall?[574,1110,45,47]:[1105,613,39,39];
 else if(!(tall&&state.startsWith('bid'))&&!['reconnecting','session-ended','reconnecting-focus','session-ended-focus'].includes(state)){position=await findPanel(source,profile,state.startsWith('bid'));const [x,y,w,h]=jobs[profile].glyph;target=[position.left+x,position.top+y,w,h];}
 if(!target){mapping.push({profile,state,input:source,output:source,reason:'Modal covers this HUD field; no hidden-pixel correction claimed'});continue;}
 const output=source.replace(/\.png$/,'-copy-v1.png');const report=await patch(source,output,profile,target,'design');mapping.push({...report,state,position});
}
// Existing chooser bitmap dimensions and layout remain intact, with one local
// glyph correction. v1 files remain as historical resources and are not erased.
for(const profile of ['landscape','portrait'])for(const pending of [false,true]){
 const tall=profile==='portrait',input=`art/runtime/web-v3/${tall?'portrait/':''}chooser${pending?'-pending-v2':''}.png`,output=`${runtime}/${profile}-chooser${pending?'-pending':''}-copy-v1.png`;
 await patch(input,output,profile,tall?[574,1110,45,47]:[1105,613,39,39],'runtime-chooser');
}
await writeFile(`${folder}/copy-correction-provenance-v1.json`,JSON.stringify({method:'Original one-glyph ROI cleared using existing ImageGen quiet paper, median color registration. Corrected built-in ImageGen v2 赤+者 glyph alpha is fitted to original ink bounds. Original 日, all frame/other text and pixels outside each ROI unchanged. V1 candidates rejected; source and runtime versions are explicit.',reports,mapping},null,2)+'\n');
console.log({reports:reports.length,designMappings:mapping.length,positions:mapping.filter(r=>r.position).map(r=>({profile:r.profile,state:r.state,...r.position}))});
