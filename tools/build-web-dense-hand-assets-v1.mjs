// Preserve the source plaque's border/cloud pixels. ImageGen contributes only
// the bounded blank lacquer center, never its independently redrawn frame.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp');
const source='art/source/web-v3/dense-hand-portrait-idle-v2-candidate.png',candidate='art/source/web-v3/dense-action-portrait-blank-v1-candidate.png',roi={left:275,top:1072,width:394,height:102};
const {data,info}=await sharp(source).extract(roi).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const clean=await sharp(candidate).extract({left:420,top:275,width:1260,height:210}).resize(285,56).removeAlpha().raw().toBuffer();
const sourceMean=[0,0,0],cleanMean=[0,0,0];let samples=0;
for(let y=22;y<78;y++)for(let x=78;x<363;x++){const i=(y*info.width+x)*4;if(data[i]<65&&data[i+1]>data[i]*1.1&&data[i+2]<75){for(let c=0;c<3;c++)sourceMean[c]+=data[i+c];samples++;}}
for(let j=0;j<clean.length;j++)cleanMean[j%3]+=clean[j];for(let c=0;c<3;c++){sourceMean[c]/=samples;cleanMean[c]/=clean.length/3;}
const mask=new Uint8Array(info.width*info.height);
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const j=(y*info.width+x)*4,r=data[j],g=data[j+1],b=data[j+2];mask[y*info.width+x]=(x>=42&&x<365&&y>=19&&y<80)||(g>r*.98&&g>b*.7&&g>8)||(r>g*1.15&&g>90&&r>b*1.2)||(r>170&&g>115&&b>60)?1:0;}
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){let opaque=false;for(let yy=Math.max(0,y-1);yy<=Math.min(info.height-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(info.width-1,x+1);xx++)opaque ||= !!mask[yy*info.width+xx];const i=(y*info.width+x)*4;if((x<42||x>=365||y<19||y>=80)&&data[i]>data[i+1]*2&&data[i+1]<100)opaque=false;data[i+3]=opaque?255:0;}
// Exact source text box. Its perimeter feathers into the original green;
// protected border/cloud/corners never receive generated pixels.
for(let y=0;y<56;y++)for(let x=0;x<285;x++){const xx=x+78,yy=y+22,i=(yy*info.width+xx)*4,j=(y*285+x)*3,a=Math.min(1,Math.min(x,y,284-x,55-y)/3);for(let c=0;c<3;c++)data[i+c]=Math.round(data[i+c]*(1-a)+Math.max(0,Math.min(255,clean[j+c]+sourceMean[c]-cleanMean[c]))*a);}
const output='art/runtime/web-v3/dense-action-portrait-v1.png';await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(output);
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');await writeFile('art/source/web-v3/dense-hand-v1/action-provenance.json',JSON.stringify({source,sourceSha256:await hash(source),sourceRoi:roi,candidate,candidateSha256:await hash(candidate),method:'Original plaque pixels and color/inner-content raster alpha; generated blank green contributes only285x56 text ROI, feather3px. Generated border rejected.',cleanupRoiInCrop:[78,22,285,56],output,sha256:await hash(output)},null,2)+'\n');
console.log(output);
