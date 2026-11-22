// Freeze source component rectangles before replacing approximate furniture.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),root='art/source/web-v3/results-source-v1';await mkdir(root,{recursive:true});
const profiles={
 landscape:{canvas:[1672,941],results:{title:[575,72,520,111],roundRoi:[758,93,49,68],roundValue:[750,90,64,68],note:[351,727,442,83],secondary:[818,718,241,94],primary:[1075,717,318,96],rows:[304,379,454,529,604,679],avatar:[388,38.5],name:{x:443,y:-24,width:160,font:34.5},columns:[677,859,1039,1222],numberFont:42},ranking:{title:[538,57,595,118],subtitle:[606,175,461,38],secondary:[459,744,369,101],primary:[846,742,370,105],rows:[326,402,478,554,630,706],avatar:[671,40],name:{x:742,y:-24,width:220,font:35.5},columns:[507,1145],numberFont:48}},
 portrait:{canvas:[941,1672],results:{title:[214,244,518,136],roundRoi:[392,272,54,78],roundValue:[386,269,66,79],note:[216,1205,509,93],secondary:[130,1365,684,116],primary:[132,1482,680,122],rows:[580,688,796,904,1012,1120],avatar:[176,50],name:{x:240,y:-27,width:138,font:35},columns:[403,513,632,760],numberFont:46},ranking:{title:[207,268,528,126],subtitle:[248,401,445,43],secondary:[179,1333,585,122],primary:[179,1457,585,130],rows:[607,714,821,928,1035,1142],avatar:[378,51],name:{x:451,y:-28,width:152,font:40},columns:[255,694],numberFont:54}}
};
const reports=[],sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
for(const[profile,p]of Object.entries(profiles))for(const state of ['results','ranking']){
 const source=`art/mockups/web-v3/${profile==='portrait'?'portrait/':''}${state==='results'?'06-results.png':'07-ranking.png'}`,s=p[state];
 for(const kind of ['title','subtitle','note','secondary','primary']){if(!s[kind])continue;const[left,top,width,height]=s[kind],output=`${root}/${profile}-${state}-${kind}-reference-v1.png`;await sharp(source).extract({left,top,width,height}).png().toFile(output);reports.push({profile,state,kind,source,sourceSha256:await sha(source),rect:s[kind],output,sha256:await sha(output)});}
}
await writeFile(`${root}/catalog-v1.json`,JSON.stringify({profiles,reports},null,2)+'\n');console.log({references:reports.length});
