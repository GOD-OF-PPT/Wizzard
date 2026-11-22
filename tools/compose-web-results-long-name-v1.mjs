import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),root='art/source/web-v3/results-long-name-v1',sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex'),reports=[];
const profiles={landscape:{canvas:[1672,941],results:[436,276,167,56],ranking:[734,294,230,64]},portrait:{canvas:[941,1672],results:[232,545,150,68],ranking:[445,570,180,76]}};
for(const[profile,p]of Object.entries(profiles))for(const view of ['results','ranking']){
 const tall=profile==='portrait',prefix=`art/mockups/web-v3/${tall?'portrait/':''}`,source=prefix+(view==='results'?'06-results-home-v2.png':'07-ranking.png'),candidate=`${root}/${profile}-${view}-candidate-v1.png`,[w,h]=p.canvas,[l,t,rw,rh]=p[view],meta=await sharp(candidate).metadata();if(meta.width!==w||meta.height!==h)throw Error('Wrong candidate size');
 const a=await sharp(source).removeAlpha().raw().toBuffer(),b=await sharp(candidate).removeAlpha().raw().toBuffer(),out=Buffer.from(a),mask=new Uint8Array(rw*rh);
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const i=((t+y)*w+l+x)*3;mask[y*rw+x]=[a,b].some(v=>v[i]<135&&v[i+1]<120&&v[i+2]<100);}
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){let d=99;for(let yy=-3;yy<=3;yy++)for(let xx=-3;xx<=3;xx++){const nx=x+xx,ny=y+yy;if(nx>=0&&ny>=0&&nx<rw&&ny<rh&&mask[ny*rw+nx])d=Math.min(d,Math.max(Math.abs(xx),Math.abs(yy)));}const alpha=d<=2?1:d===3?.5:0;if(!alpha)continue;const i=((t+y)*w+l+x)*3;for(let c=0;c<3;c++)out[i+c]=Math.round(a[i+c]*(1-alpha)+b[i+c]*alpha);}
 const output=prefix+(view==='results'?'42-results-long-name-v1.png':'44-ranking-long-name-v1.png');await sharp(out,{raw:{width:w,height:h,channels:3}}).png().toFile(output);let changed=0,outside=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*3;if([0,1,2].some(c=>a[i+c]!==out[i+c])){changed++;if(x<l||x>=l+rw||y<t||y>=t+rh)outside++;}}if(outside)throw Error('Unrelated source RGB changed');
 reports.push({profile,view,source,sourceSha256:await sha(source),candidate,candidateSha256:await sha(candidate),output,outputSha256:await sha(output),rect:p[view],changedPixels:changed,changedOutsideROI:outside});
 if(view==='ranking'){
  const current=prefix+'33-current-ranking-home-v2.png',currentBytes=await sharp(current).removeAlpha().raw().toBuffer();for(let y=t;y<t+rh;y++)for(let x=l;x<l+rw;x++){const i=(y*w+x)*3;for(let c=0;c<3;c++)currentBytes[i+c]=out[i+c];}const currentOut=prefix+'43-current-ranking-long-name-v1.png';await sharp(currentBytes,{raw:{width:w,height:h,channels:3}}).png().toFile(currentOut);reports.push({profile,view:'current-ranking',source:current,sourceSha256:await sha(current),controlSource:output,controlSourceSha256:await sha(output),output:currentOut,outputSha256:await sha(currentOut),rect:p.ranking,changedOutsideROI:0});
 }
}
await writeFile(root+'/source-provenance-v1.json',JSON.stringify({generator:'Built-in ImageGen local first-name edits on selected06/07. Strict union-of-old/new ink footprint with2px dilation/1px feather, bounded within name ROI.33reuses same row layout/ROI, all unrelated sourceRGB preserved.',fullName:'竹下听雨的第十二位茶客',profiles,reports},null,2)+'\n');console.log({designs:reports.length,unrelatedSourceRGBChanged:0});
