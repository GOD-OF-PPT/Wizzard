// Reassemble unscaled Chrome PNG clips; never synthesizes app pixels.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [recordPath,output,modulePath='sharp']=process.argv.slice(2),sharp=createRequire(import.meta.url)(modulePath),raw=JSON.parse(await readFile(recordPath,'utf8')),records=Array.isArray(raw)?raw:raw.tiles;
const root=recordPath.slice(0,recordPath.lastIndexOf('/')),width=Math.max(...records.map(r=>r.x+r.width)),height=Math.max(...records.map(r=>r.y+r.height)),seen=new Uint8Array(width*height),layers=[],hashes=[];
for(const r of records){if(r.status!==200)throw Error('Unsaved tile');const path=root+'/'+r.name,bytes=await readFile(path),m=await sharp(bytes).metadata();if(m.width!==r.width||m.height!==r.height)throw Error('Tile size mismatch');for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){if(seen[y*width+x]++)throw Error('Overlapping tiles');}layers.push({input:bytes,left:r.x,top:r.y});hashes.push({...r,sha256:createHash('sha256').update(bytes).digest('hex')});}
if(seen.some(n=>n!==1))throw Error('Missing tile pixels');
await sharp({create:{width,height,channels:3,background:'#000'}}).composite(layers).png().toFile(output);
await writeFile(output.replace(/\.png$/,'.tiles.json'),JSON.stringify({method:'Unscaled, non-overlapping Chrome CDP PNG clips, stitched without resampling; frozen reduced-motion fixture only',width,height,tiles:hashes,sha256:createHash('sha256').update(await readFile(output)).digest('hex')},null,2)+'\n');
console.log(JSON.stringify({output,width,height,tiles:records.length}));
