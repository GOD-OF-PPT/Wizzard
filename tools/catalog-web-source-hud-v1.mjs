// Catalog frozen ImageGen component pixels before runtime implementation.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sharp = createRequire(import.meta.url)(process.argv[2] ?? 'sharp');
const root = 'art/source/web-v3/hud-source-v1';
await mkdir(root, { recursive: true });
const profiles = {
  landscape: { canvas:[1672,941], round:[8,90,217,164], timer:[1340,462,224,195], trump:[672,505,331,75], action:[1248,680,390,140], status:[650,586,380,80] },
  portrait: { canvas:[941,1672], round:[6,108,258,181], timer:[723,1182,211,193], trump:[298,923,359,80], action:[660,1495,281,153], status:[342,1008,262,52], denseAction:[275,1072,394,102], bidTimer:[665,1078,241,230] },
};
const reports=[];
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
for (const [profile,p] of Object.entries(profiles)) {
  const base=`art/mockups/web-v3/${profile==='portrait'?'portrait/':''}`;
  for (const kind of ['round','timer','trump','status','action','denseAction','bidTimer']) {
    if(!p[kind])continue;
    const source=base+(kind==='denseAction'||kind==='status'&&profile==='portrait'?'27-dense-hand-idle-v4.png':kind==='bidTimer'?'10-bid-timer-v3.png':'25-gameplay-selection-idle-v2.png');
    const [left,top,width,height]=p[kind],output=`${root}/${profile}-${kind}-reference-v1.png`;
    await sharp(source).extract({left,top,width,height}).png().toFile(output);
    reports.push({profile,kind,source,sourceSha256:await sha(source),crop:p[kind],output,sha256:await sha(output)});
  }
  const names={idle:'25-gameplay-selection-idle-v2.png',confirm:'26-gameplay-selection-complete-v2.png',pending:'19-play-pending-selection-v2.png',bid:'10-bid.png','bid-pending':profile==='portrait'?'17-bid-pending-timer-v3.png':'17-bid-pending-v1.png','dense-idle':'27-dense-hand-idle-v4.png','dense-confirm':'28-dense-hand-selected-v4.png'};
  const layers=[];
  for(const [state,name]of Object.entries(names)){
    const rect=profile==='portrait'&&state.startsWith('dense-')?p.denseAction:profile==='portrait'&&state.startsWith('bid')?[229,963,520,157]:p.action;
    const source=base+name,[left,top,width,height]=rect,output=`${root}/${profile}-action-${state}-reference-v1.png`;
    const data=await sharp(source).extract({left,top,width,height}).png().toBuffer();await writeFile(output,data);
    layers.push({input:await sharp(data).resize(520,160,{fit:'contain',background:'#161a20'}).png().toBuffer(),left:0,top:layers.length*168});
    reports.push({profile,kind:'action',state,source,sourceSha256:await sha(source),crop:rect,output,sha256:await sha(output)});
  }
  await sharp({create:{width:520,height:168*layers.length,channels:3,background:'#161a20'}}).composite(layers).png().toFile(`${root}/${profile}-action-catalog-v1.png`);
}
await writeFile(`${root}/catalog-v1.json`,JSON.stringify({profiles,reports},null,2)+'\n');
console.log({references:reports.length});
