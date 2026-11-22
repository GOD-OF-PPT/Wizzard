// Finalize this dated evidence set after the actual joint visual review.
import {readFile,writeFile,mkdir,copyFile,readdir,stat} from "node:fs/promises";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
const folder="art/review/web-v3/semantic-state-calibration-20261025",read=async p=>JSON.parse(await readFile(p,"utf8")),sha=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
const verified=[];async function check(path,expected){const actual=await sha(path);if(actual!==expected)throw Error("Hash mismatch: "+path);verified.push({path,sha256:actual});}
const timer=await read("art/source/web-v3/bid-timer-portrait-v3/provenance.json");
for(const [path,hash]of [[timer.candidate,timer.candidateSha256],[timer.cleanup,timer.cleanupSha256],[timer.contract.runtime,timer.runtimeSha256],[timer.contract.runtimeIcon,timer.runtimeIconSha256]])await check(path,hash);
for(const r of timer.reports){await check(r.base,r.baseSha256);await check(r.output,r.outputSha256);if(r.changedOutsideRoi!==0)throw Error("Timer source leaked");}
const chooser=await read("art/source/web-v3/chooser-inactive-hand-v5/provenance.json");
for(const r of chooser.reports){await check(r.base,r.baseSha256);await check(r.candidate,r.candidateSha256);await check(r.output,r.outputSha256);if(r.changedOutsideRoi!==0||r.changedProtectedPaper!==0)throw Error("Protected paper changed");}
const coverage=await read(`${folder}/coverage.json`);if(coverage.reports.length!==8)throw Error("Missing current comparison");
for(const r of coverage.reports){await check(r.source,r.sourceSha256);await check(r.capture,r.captureSha256);r.status="captured-and-reviewed-P2-remain";}
coverage.status="captured-and-reviewed-P2-remain";coverage.reviewReport="docs/57-web-v3-timer-and-inactive-hand.md";coverage.reviewedViews={full:8,focused:8};
await writeFile(`${folder}/coverage.json`,JSON.stringify(coverage,null,2)+"\n");
await mkdir(`${folder}/diagnostics`,{recursive:true});
const diagnosticFiles=["69-bid-notimer-eight-portrait-20261025.png","69-live-bid-timer-portrait-20261025.png","70-live-bid-timer-portrait-20261025.png","71-live-bid-countdown-portrait-20261025.png","71-timer-functional-evidence-20261025.json"];
for(const file of diagnosticFiles)await copyFile(`art/review/web-v3/${file}`,`${folder}/${file.endsWith('.json')?'':'diagnostics/'}${file}`);
const functional=await read(`${folder}/71-timer-functional-evidence-20261025.json`),success=functional.attempts.find(a=>a.result?.decremented===true);
if(!success||success.result.before.seconds!==30||success.result.secondsAfter!==29||functional.noTimer.timers!==0||functional.noTimer.bidArt!==0)throw Error("Functional claims not supported");
const indexPath=`${folder}/index.html`,html=await readFile(indexPath,"utf8");if(!html.includes('id="functional"'))await writeFile(indexPath,html.replace("<main>",'<p id="functional"><a href="71-timer-functional-evidence-20261025.json">真实练习/无计时/失败尝试分层记录</a> · <a href="diagnostics/71-live-bid-countdown-portrait-20261025.png">真实29秒截图（非四牌设计对照）</a></p><main>'));
const manifest=await read("art/web-v3-manifest.json");if(manifest.version<7||manifest.semanticStateRevision.designStateCount!==30)throw Error("Manifest not current");
await writeFile(`${folder}/verification.json`,JSON.stringify({verifiedAt:new Date().toISOString(),hashChecks:verified.length,verified,protectedPaperChanges:0,outsideRoiChanges:0,reviewed:{full:8,focused:8},functional:{noTimerCount:0,decrement:[30,29],elapsedMs:success.result.elapsedMs,rejectedAttemptNumbers:[1,2],transitionFirstValue:"unresolved; 1-to-30 not counted"},scope:"Current source/capture provenance and limited local behavior, not whole-page/network acceptance"},null,2)+"\n");
const files=await readdir("dist/assets"),scripts=files.filter(p=>/\.(js|css)$/.test(p)),markers=["design-review","review-leaf-5","reviewMatchController","DesignReview","Review WenKai","Review ZhenKai","bid-timer-blank-v1","bid-timer-portrait-v3-candidate"],matches=[];
for(const file of scripts){const contents=await readFile(`dist/assets/${file}`,"utf8");for(const marker of markers)if(contents.includes(marker))matches.push({file,marker});}
const candidates=files.filter(p=>/candidate|mockup|measurement|bid-timer-blank-v1/i.test(p));if(matches.length||candidates.length)throw Error("Source candidates or DEV entries emitted");
const diff=spawnSync("git",["diff","--check"],{encoding:"utf8"});if(diff.status!==0)throw Error(diff.stdout+diff.stderr);
const inputs=["src/components/MatchScreen.tsx","src/web-v3.css","art/runtime/web-v3/bid-timer-layout-v3.json",timer.contract.runtime,timer.contract.runtimeIcon];
await writeFile(`${folder}/build.json`,JSON.stringify({typescript:{command:"npx tsc --noEmit",exitCode:0},webBuild:{command:"npm run web:build",exitCode:0,...await read("dist/web-build-report.json")},productionScan:{files:await Promise.all(scripts.map(async file=>({file,bytes:(await stat(`dist/assets/${file}`)).size,sha256:await sha(`dist/assets/${file}`)}))),markers,matches,candidates},sourceFiles:await Promise.all(inputs.map(async path=>({path,sha256:await sha(path)}))),diffCheck:{command:"git diff --check",exitCode:0},scope:"Engineering only; overall visual result remains blocked"},null,2)+"\n");
console.log(JSON.stringify({hashChecks:verified.length,comparisons:8,protectedPaper:0,sourceOutsideRoi:0,decrement:[30,29],productionMarkerMatches:matches.length,visualResult:"blocked"}));
