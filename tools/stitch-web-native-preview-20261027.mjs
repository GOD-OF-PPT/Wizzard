// Native-DPR screenshot clips are physical pixels after clearing emulation.
// Keep original CSS clips alongside corrected pixel grid; never resample PNGs.
import {createRequire} from 'node:module';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const[prefix,modulePath='sharp',folder='art/review/web-v3/results-type-calibration-20261027']=process.argv.slice(2),sharp=createRequire(import.meta.url)(modulePath),root='art/review/web-v3',path=root+'/'+prefix+'.json',r=JSON.parse(await readFile(path,'utf8'));
r.cssTiles??=r.tiles.map(t=>({...t}));r.tiles=await Promise.all(r.cssTiles.map(async t=>{const m=await sharp(root+'/'+t.name).metadata();if(Math.abs(m.width-t.width*r.dpr)>1||Math.abs(m.height-t.height*r.dpr)>1)throw Error('Unexpected native tile scale');return{...t,x:Math.round(t.x*r.dpr),y:Math.round(t.y*r.dpr),width:m.width,height:m.height};}));
r.originalHelperPointerLabel??=r.pointer;r.pointer='Native browser click20,20 in quiet letterbox; generic helper label corrected from actual input. No image pixels edited.';r.nativePixelNote='CSS clip grid retained. Native physical pixels stitched without resizing after temporary metrics cleared.';
await writeFile(path,JSON.stringify(r,null,2)+'\n');
const out=folder+'/'+prefix,p=spawnSync(process.execPath,['tools/stitch-web-chrome-tiles.mjs',path,out+'.png',modulePath],{encoding:'utf8'});if(p.status)throw Error(p.stderr||p.stdout);
const tilePath=out+'.tiles.json',tileReceipt=JSON.parse(await readFile(tilePath,'utf8'));tileReceipt.originalStitchHelperMethod=tileReceipt.method;tileReceipt.method='Unscaled native physical-pixel Chrome PNG clips. Live local result awaiting user advancement; finite animations completed. No frozen fixture or injected state.';await writeFile(tilePath,JSON.stringify(tileReceipt,null,2)+'\n');
await sharp(out+'.png').jpeg({quality:92,chromaSubsampling:'4:4:4'}).toFile(out+'.jpg');await copyFile(path,out+'.json');console.log({output:out+'.png',cssViewport:r.viewport,dpr:r.dpr});
