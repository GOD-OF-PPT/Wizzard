import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp');
const root='art/source/web-v3/results-long-name-v1',runtime='art/runtime/web-v3/results-name-dialog-v1';
const generated='C:/Users/KSG/.codex/generated_images/01a16e70-08a8-78f3-8046-def5c5757192';
const profiles={landscape:{file:'exec-a5531a7f-25d3-4641-bdff-01e5ac528ff5.png',canvas:[1672,941],rect:[488,302,696,338],name:[60,119,576,95],ink:[93,139,510,61]},portrait:{file:'exec-f1c884e1-74ff-463d-86ed-a82d14ffa2b9.png',canvas:[941,1672],rect:[59,605,824,452],name:[58,165,708,112],ink:[103,186,610,71]}};
await mkdir(runtime,{recursive:true});const records=[];
for(const[profile,p]of Object.entries(profiles)){
 const candidate=`${root}/${profile}-dialog-blank-generated-v1.png`,output=`${runtime}/${profile}-panel-v1.png`;
 await copyFile(`${generated}/${p.file}`,candidate);
 const metadata=await sharp(candidate).metadata();if(!metadata.hasAlpha)throw Error('Missing generated transparency');
 await sharp(candidate).resize(p.rect[2],p.rect[3],{fit:'fill',kernel:'lanczos3'}).png().toFile(output);
 // Retain only the original generated name ink, never its changed full-screen background.
 const[left,top,width,height]=p.ink,ink=await sharp(`${root}/${profile}-dialog-component-v1.png`).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
 for(let i=0;i<ink.length;i+=4)ink[i+3]=Math.round(Math.max(0,Math.min(1,(150-Math.max(ink[i],ink[i+1],ink[i+2]))/45))*255);
 const nameInk=await sharp(ink,{raw:{width,height,channels:4}}).png().toBuffer();
 const panel=await sharp(output).composite([{input:nameInk,left,top}]).png().toBuffer();
 const base=`art/mockups/web-v3/${profile==='portrait'?'portrait/':''}`,source=base+'42-results-long-name-v1.png',design=base+'45-results-name-dialog-v1.png';
 const scrim=await sharp({create:{width:p.canvas[0],height:p.canvas[1],channels:4,background:{r:0,g:0,b:0,alpha:.44}}}).png().toBuffer();
 await sharp(source).composite([{input:scrim},{input:panel,left:p.rect[0],top:p.rect[1]}]).png().toFile(design);
 records.push({profile,candidate,output,design,...p,sha256:createHash('sha256').update(await readFile(output)).digest('hex'),generatedHasAlpha:metadata.hasAlpha});
}
await writeFile(root+'/dialog-provenance-v1.json',JSON.stringify({description:'Built-in ImageGen cleaned panel. Normalize to measured component. Full-screen source is unchanged42 plus44% scrim, generated panel and original generated name ink. Runtime full name remains DOM text.',records},null,2)+'\n');
console.log(records.map(({profile,output,design})=>({profile,output,design})));
