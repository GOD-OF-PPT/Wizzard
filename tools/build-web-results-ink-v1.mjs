import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/web-v3/results-ink-v1/source-colors-v1.json',data=JSON.parse(await readFile(source)),output='art/runtime/web-v3/results-ink-v1.json',profiles={};
for(const profile of ['landscape','portrait']){
 const sample=(state,role)=>{const r=data.reports.find(r=>r.profile===profile&&r.state===state&&r.role===role);if(!r)throw Error('Missing source ink');return r.hex;},variants={};
 for(const state of ['results','final-round','ranking','current-ranking','current-final','ranking3','ranking4','ranking5'])variants[state]={positive:sample(state==='final-round'?'final-round':'results','positive'),negative:sample(state==='final-round'?'final-round':'results','negative'),leading:sample(['results','final-round'].includes(state)?'ranking':state,'leading')};
 profiles[profile]={minus:profile==='landscape'?{scaleX:1.3,scaleY:.9,shiftX:.5,shiftY:-2,origin:'right center'}:{scaleX:1.2,scaleY:1,shiftX:0,shiftY:-2.5,origin:'left center'},variants};
}
await writeFile(output,JSON.stringify({version:1,profiles},null,2)+'\n');
await writeFile('art/source/web-v3/results-ink-v1/runtime-provenance-v1.json',JSON.stringify({source,sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),output,outputSha256:createHash('sha256').update(await readFile(output)).digest('hex'),selection:'Native source1px-eroded RGB medians, with original distributions retained. Existing authored normal/final/current/count variants stay distinct. Classic and guest use unchanged final-ranking source ink.',minus:'Initial optical correction derived from source/186 blue-ink component geometry; must be reviewed in Chrome. Live ASCII minus and complete score string retained; no data or rules change.'},null,2)+'\n');
console.log({output,profiles:Object.keys(profiles),variants:8,sourcePixels:'unchanged'});
