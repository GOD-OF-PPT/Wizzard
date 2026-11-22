// Native Chrome geometry audit only. It does not auto-pass visual fidelity.
import {readFile,writeFile,mkdir} from "node:fs/promises";
const root="art/review/web-v3",folder=`${root}/selection-calibration-20261025`;
await mkdir(folder,{recursive:true});
const records=JSON.parse(await readFile(`${root}/63-selection-capture-records-20261025.json`,"utf8")).records;
const source=JSON.parse(await readFile("art/source/web-v3/selection-geometry-v2-contract.json","utf8"));
const center=r=>[(r.left+r.right)/2,(r.top+r.bottom)/2];
const profiles=[];
for(const profile of ["landscape","portrait"]){
 const get=(batch,state)=>records.find(r=>r.name===`${batch}-selection-${state}-${profile}${batch==="58"?"-before":""}-20261025.png`);
 const beforeIdle=get("58","idle"),beforeSelected=get("58","complete"),idle=get("63","idle"),selected=get("63","complete");
 if(!idle||!selected)throw Error("Current pair missing");
 const s=source.profiles[profile],sx=selected.stage.width/s.canvas[0],sy=selected.stage.height/s.canvas[1];
 const cards=selected.cards.map((c,i)=>{
  const a=center(idle.cards[i].rect),b=center(c.rect),expected=[selected.stage.left+(s.poses[i].center[0]+(i?9:0))*sx,selected.stage.top+(s.poses[i].center[1]-(i?0:12))*sy];
  return{index:i,label:c.label,center:b,sourceCenter:expected,sourceCenterError:[b[0]-expected[0],b[1]-expected[1]],movement:[b[0]-a[0],b[1]-a[1]],expectedMovement:i?[9*sx,0]:[0,-12*sx],transform:c.transform,origin:c.origin};
 });
 const hc=center(selected.halo.rect),cc=center(selected.cards[0].rect);
 profiles.push({profile,cards,haloCenterDelta:[hc[0]-cc[0],hc[1]-cc[1]],expectedHaloDelta:[0,8*sx],haloLayer:selected.halo.z,haloFilter:selected.halo.filter,
  oldSelectedHorizontalJump:beforeIdle&&beforeSelected?center(beforeSelected.cards[0].rect)[0]-center(beforeIdle.cards[0].rect)[0]:null});
}
const input=JSON.parse(await readFile(`${root}/61-native-selection-inputs-20261025.json`,"utf8"));
const neighbor=JSON.parse(await readFile(`${root}/61-neighbor-audits-20261025.json`,"utf8"));
const summary={scope:"Chrome logical geometry, endpoints and observed input points only; not art/typography/complete-game acceptance",profiles,nativeInputs:{total:input.rows.length,failures:input.rows.filter(r=>r.failures.length),
 profileHeights:Object.fromEntries(["landscape","portrait"].map(p=>[p,[...new Set(input.rows.filter(r=>r.profile===p).map(r=>r.height))]]))},
 neighbors:neighbor.audits.map(a=>({profile:a.profile,selectedIndex:a.selectedIndex,maxOffsetError:Math.max(...a.cards.map(c=>Math.abs(c.observedOffset-c.expectedOffset))),overlapsAction:a.cards.some(c=>c.overlapsAction),confirmPulse:a.confirmPulse})),
 maxSourceCenterError:Math.max(...profiles.flatMap(p=>p.cards.flatMap(c=>c.sourceCenterError.map(Math.abs)))),overallVisualResult:"blocked"};
await writeFile(`${folder}/geometry-audit.json`,JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify({maxSourceCenterError:summary.maxSourceCenterError,nativeInputs:summary.nativeInputs.total,failures:summary.nativeInputs.failures.length,visualResult:"blocked"}));
