// Design first: add ImageGen's normal human countdown in the free table band.
// Runtime art is the same bounded tile with only live content removed.
import {createRequire} from "node:module";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
const sharp=createRequire(import.meta.url)(process.argv[2]??"sharp");
const folder="art/source/web-v3/bid-timer-portrait-v3";await mkdir(folder,{recursive:true});
const hash=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
const candidate="art/source/web-v3/bid-timer-portrait-v3-candidate.png",cleanup="art/source/web-v3/bid-timer-portrait-v3-blank-face-candidate.png";
const [w,h]=[941,1672],tile=[665,1078,241,230],face=[759,1125,90,113],hourglass=[777,1130,45,56];
const [clock,clean]=await Promise.all([candidate,cleanup].map(p=>sharp(p).removeAlpha().raw().toBuffer()));
if(clock.length!==w*h*3||clean.length!==clock.length)throw Error("Invalid candidate dimensions");
const blank=Buffer.from(clock),[fl,ft,fw,fh]=face;
for(let y=ft;y<ft+fh;y++)for(let x=fl;x<fl+fw;x++){const a=Math.min(1,(x-fl)/5,(y-ft)/5,(fl+fw-1-x)/5,(ft+fh-1-y)/5),n=(y*w+x)*3;for(let c=0;c<3;c++)blank[n+c]=Math.round(clock[n+c]*(1-a)+clean[n+c]*a);}
const [l,t,ww,hh]=tile,rgba=Buffer.alloc(ww*hh*4);
for(let y=0;y<hh;y++)for(let x=0;x<ww;x++){const n=((y+t)*w+x+l)*3,j=(y*ww+x)*4,a=Math.max(0,Math.min(1,x/12,y/12,(ww-1-x)/12,(hh-1-y)/12,Math.max((x-75)/5,(y-24)/6)));for(let c=0;c<3;c++)rgba[j+c]=blank[n+c];rgba[j+3]=Math.round(255*a);}
const runtime="art/runtime/web-v3/bid-timer-portrait-v3.png";await sharp(rgba,{raw:{width:ww,height:hh,channels:4}}).png().toFile(runtime);
// Mechanical matte of the original ImageGen hourglass; no drawn substitute.
const [il,it,iw,ih]=hourglass,icon=Buffer.alloc(iw*ih*4);let iconPixels=0;
for(let y=0;y<ih;y++)for(let x=0;x<iw;x++){const n=((y+it)*w+x+il)*3,j=(y*iw+x)*4;const a=Math.max(0,Math.min(1,(clock[n+1]-65)/60));for(let c=0;c<3;c++)icon[j+c]=clock[n+c];icon[j+3]=Math.round(255*a);if(a>.1)iconPixels++;}
if(iconPixels<150)throw Error("Hourglass extraction empty");
const runtimeIcon="art/runtime/web-v3/bid-hourglass-portrait-v3.png";await sharp(icon,{raw:{width:iw,height:ih,channels:4}}).png().toFile(runtimeIcon);
const reports=[];
for(const [base,name]of [["10-bid.png","10-bid-timer-v3.png"],["17-bid-pending-v2.png","17-bid-pending-timer-v3.png"]]){
 const input=`art/mockups/web-v3/portrait/${base}`,before=await sharp(input).removeAlpha().raw().toBuffer(),after=Buffer.from(before);
 for(let y=0;y<hh;y++)for(let x=0;x<ww;x++){const n=((y+t)*w+x+l)*3,a=rgba[(y*ww+x)*4+3]/255;for(let c=0;c<3;c++)after[n+c]=Math.round(before[n+c]*(1-a)+clock[n+c]*a);}
 let changedPixels=0,changedOutsideRoi=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=(y*w+x)*3;if(after[n]===before[n]&&after[n+1]===before[n+1]&&after[n+2]===before[n+2])continue;changedPixels++;if(x<l||x>=l+ww||y<t||y>=t+hh)changedOutsideRoi++;}
 if(changedOutsideRoi)throw Error("Unrelated design changed");
 const output=`art/mockups/web-v3/portrait/${name}`;await sharp(after,{raw:{width:w,height:h,channels:3}}).png().toFile(output);
 reports.push({base:input,baseSha256:await hash(input),output,outputSha256:await hash(output),changedPixels,changedOutsideRoi});
}
const contract={canvas:[w,h],tile,faceCleanup:face,hourglass,value:{centerX:798,top:1192},visualTimerBounds:[684,1090,204,201],minimumHandPaperTop:1310,visualGapToHand:19,runtime,runtimeIcon,scope:"portrait human bid, including pending; number remains dynamic; no-timer mode renders no clock"};
await writeFile("art/runtime/web-v3/bid-timer-layout-v3.json",JSON.stringify(contract,null,2)+"\n");
await writeFile(`${folder}/provenance.json`,JSON.stringify({method:"Built-in ImageGen timer addition, bounded source composition; second ImageGen edit cleans live-content center only",candidate,candidateSha256:await hash(candidate),cleanup,cleanupSha256:await hash(cleanup),runtimeSha256:await hash(runtime),runtimeIconSha256:await hash(runtimeIcon),contract,iconPixels,rejected:"bid-timer-blank-v1.png independent redraw added stronger glow/diamond markers and is not used",reports},null,2)+"\n");
const [sourceCrop,blankCrop]=await Promise.all([clock,blank].map(b=>sharp(b,{raw:{width:w,height:h,channels:3}}).extract({left:l,top:t,width:ww,height:hh}).png().toBuffer()));
await sharp({create:{width:ww*2+16,height:hh,channels:3,background:"#10151d"}}).composite([{input:sourceCrop,left:0,top:0},{input:blankCrop,left:ww+16,top:0}]).png().toFile(`${folder}/source-and-blank-tile.png`);
console.log(JSON.stringify({reports,contract,iconPixels}));
