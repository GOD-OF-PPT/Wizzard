// Remove adjacent-avatar cap contamination, preserving every original RGB byte.
// Fit the existing opaque middle-band contour; never repaint a face or a rim.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sharp=createRequire(import.meta.url)(process.argv[2]??'sharp'),wire=process.argv.includes('--wire');
const sourceRoot='art/source/web-v3/results-avatar-matte-v3',runtimeRoot='art/runtime/web-v3/results-avatar-matte-v3';
await mkdir(sourceRoot,{recursive:true});await mkdir(runtimeRoot,{recursive:true});
const original=JSON.parse(await readFile('art/source/web-v3/results-source-v1/provenance-v1.json','utf8'));
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
function solve(m){for(let i=0;i<3;i++){let p=i;for(let k=i+1;k<3;k++)if(Math.abs(m[k][i])>Math.abs(m[p][i]))p=k;[m[i],m[p]]=[m[p],m[i]];const s=m[i][i];for(let j=i;j<4;j++)m[i][j]/=s;for(let k=0;k<3;k++)if(k!==i){const q=m[k][i];for(let j=i;j<4;j++)m[k][j]-=q*m[i][j];}}return m.map(r=>r[3]);}
const reports=[];
for(const r of original.reports.filter(r=>r.kind==='avatar')){
 const {data:before,info}=await sharp(r.output).ensureAlpha().raw().toBuffer({resolveWithObject:true}),after=Buffer.from(before),w=info.width,h=info.height,ox=r.circle[0]-r.rect[0],oy=r.circle[1]-r.rect[1],rad=r.circle[2],obs=[];
 for(let y=Math.ceil(oy-rad*.65);y<=Math.floor(oy+rad*.65);y++){
  const xs=[];for(let x=0;x<w;x++){const i=(y*w+x)*4;if(before[i+3]===255&&before[i]<155&&before[i+1]<140&&before[i+2]<125)xs.push(x);}
  if(xs.length)obs.push({z:y-oy,v:((xs.at(-1)-xs[0]+1)/2)**2,x:(xs[0]+xs.at(-1))/2});
 }
 const powers=n=>obs.reduce((a,o)=>a+o.z**n,0),rhs=n=>obs.reduce((a,o)=>a+o.v*o.z**n,0);
 const[A,B,C]=solve([[powers(4),powers(3),powers(2),rhs(2)],[powers(3),powers(2),powers(1),rhs(1)],[powers(2),powers(1),powers(0),rhs(0)]]),dy=-B/(2*A),rx=Math.sqrt(C-A*dy*dy),ry=Math.sqrt(-rx*rx/A),cx=obs.map(o=>o.x).sort((a,b)=>a-b)[Math.floor(obs.length/2)],cy=oy+dy;
 const residual=Math.sqrt(obs.reduce((s,o)=>s+(Math.sqrt(Math.max(0,A*o.z*o.z+B*o.z+C))-Math.sqrt(o.v))**2,0)/obs.length);
 if(![rx,ry,cx,cy,residual].every(Number.isFinite)||residual>1.1)throw Error('Unreliable contour '+r.output);
 const eligible=r.profile==='landscape'&&r.key!=='masked-traveler';
 let changed=0,opaqueReduced=0,rgbChanged=0,coreChanged=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  if(eligible&&y-cy>ry*.78){const distance=(1-Math.hypot((x-cx)/rx,(y-cy)/ry))*Math.min(rx,ry),alpha=Math.round(Math.max(0,Math.min(1,distance+1))*255);after[i+3]=Math.min(before[i+3],alpha);}
  if(after[i+3]!==before[i+3]){changed++;if(before[i+3]===255)opaqueReduced++;if(y-cy<=ry*.78)coreChanged++;}
  if([0,1,2].some(c=>after[i+c]!==before[i+c]))rgbChanged++;
 }
 if(rgbChanged||coreChanged)throw Error('Original RGB/core changed '+r.output);
 const candidate=`${sourceRoot}/${r.profile}-${r.state}-${r.key}-candidate-v3.png`,output=eligible?`${runtimeRoot}/${r.profile}-${r.state}-${r.key}-v3.png`:r.output;
 await sharp(after,{raw:{width:w,height:h,channels:4}}).png().toFile(candidate);
 if(wire&&eligible)await sharp(after,{raw:{width:w,height:h,channels:4}}).png().toFile(output);
 reports.push({profile:r.profile,state:r.state,key:r.key,source:r.source,sourceSha256:r.sourceSha256,rect:r.rect,previous:r.output,previousSha256:await sha(r.output),candidate,candidateSha256:await sha(candidate),output,outputSha256:wire?await sha(output):null,eligible,fit:{boundary:'Original opaque dark outline; excludes gold-highlight paper around leading avatar',center:[cx,cy],radii:[rx,ry],middleBandFraction:.65,capBandFraction:.78,outwardMargin:1,residual},changedAlphaPixels:changed,reducedOpaquePixels:opaqueReduced,rgbChanged,coreChanged});
}
if(wire){
 const mapped=original.reports.map(r=>r.kind==='avatar'?{...r,output:reports.find(v=>v.profile===r.profile&&v.state===r.state&&v.key===r.key).output}:r);
 const ts=['// Generated from original source extraction with tools/refine-web-results-avatar-mattes-v3.mjs.'];mapped.forEach((r,i)=>ts.push(`import r${i} from '../../${r.output}';`));ts.push('export const resultSourceAssets={');
 for(const profile of ['landscape','portrait']){ts.push(` ${profile}:{`);for(const state of ['results','ranking']){ts.push(`  ${state}:{avatars:{`);for(const[i,r]of mapped.entries())if(r.profile===profile&&r.state===state&&r.kind==='avatar')ts.push(`   '${r.key}':{src:r${i},rect:${JSON.stringify(r.rect)}},`);ts.push('  },');for(const[i,r]of mapped.entries())if(r.profile===profile&&r.state===state&&r.kind!=='avatar')ts.push(`   ${r.kind}:{src:r${i},rect:${JSON.stringify(r.rect)}},`);ts.push('  },');}ts.push(' },');}ts.push('} as const;');await writeFile('src/web/results-source-assets.generated.ts',ts.join('\n')+'\n');
}
await writeFile(sourceRoot+(wire?'/provenance-v3.json':'/candidates-v3.json'),JSON.stringify({method:'Source-middle opaque-dark-outline fit only gates contaminated lower alpha caps. Restricts10landscape avatars; portraits and final traveler images unchanged. All original RGB plus entire upper/core/side-rim alpha retained. No positional/scale change; originalv2 retained. Upper-cap draft rejected before wiring to protect authored ears/rim.',wired:wire,reports},null,2)+'\n');
console.log({wired:wire,inspected:reports.length,eligible:reports.filter(r=>r.eligible).length,changed:reports.filter(r=>r.changedAlphaPixels).map(r=>({key:r.profile+'/'+r.state+'/'+r.key,alpha:r.changedAlphaPixels,opaque:r.reducedOpaquePixels,residual:r.fit.residual}))});
