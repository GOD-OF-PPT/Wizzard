// Verify saved source/capture provenance and record this checkpoint's gates.
import {readFile,writeFile,readdir,stat} from "node:fs/promises";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
const folder="art/review/web-v3/selection-calibration-20261025";
const galleryPath=`${folder}/index.html`,gallery=await readFile(galleryPath,"utf8");
if(!gallery.includes('href="affected/index.html"'))await writeFile(galleryPath,gallery.replace("<h2>分层证据</h2>",'<p><a href="affected/index.html">六个共用手牌状态 · 十二组当前对照</a> · <a href="../../../../docs/55-web-v3-selection-geometry-and-motion.md">选牌报告</a> · <a href="../../../../docs/56-web-v3-shared-hand-surface-recapture.md">共用状态报告</a></p><h2>分层证据</h2>'));
const read=async p=>JSON.parse(await readFile(p,"utf8"));
const sha=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
const verified=[];
async function verify(path,expected,kind){const actual=await sha(path);if(actual!==expected)throw Error(`Hash mismatch: ${path}`);verified.push({path,sha256:actual,kind});}
const p=await read("art/source/web-v3/selection-geometry-v2-provenance.json");
await verify(p.halo.source,p.halo.sha256,"source-halo");
for(const r of p.reports){for(const [path,key]of [[r.source,"sourceSha256"],[r.clean,"cleanSha256"],[r.idleAction,"idleActionSha256"],[r.output,"sha256"]])await verify(path,r[key],"source-design");if(r.changedOutsideRoi!==0)throw Error("Unrelated source changes");}
const d=await read("art/source/web-v3/selection-geometry-v2-derivatives.json");
for(const r of d.derivatives){await verify(r.base,r.baseSha256,"derivative-base");await verify(r.output,r.sha256,"derivative-design");if(r.changedOutsideHandRoi!==0)throw Error("Unrelated derivative changes");}
for(const path of [`${folder}/coverage.json`,`${folder}/affected/coverage.json`]){
 const c=await read(path);for(const r of c.reports){await verify(r.design??r.source,r.sourceSha256,"comparison-source");await verify(r.capture,r.captureSha256,"Chrome-capture");}
}
const runtime="art/runtime/web-v3/selection-layout-v2.json",source="art/source/web-v3/selection-geometry-v2-contract.json";
if(await sha(runtime)!==await sha(source))throw Error("Runtime geometry drift");
const manifest=await read("art/web-v3-manifest.json");if(manifest.version<6||manifest.selectionContract.designStateCount!==30)throw Error("Manifest stale");
const input=await read(`${folder}/61-native-selection-inputs-20261025.json`),failed=input.rows.filter(r=>r.failures.length);
if(input.rows.length!==144||failed.length)throw Error("Input evidence differs from report");
const coverage=await read(`${folder}/coverage.json`);if(coverage.reports.length!==8||coverage.rejected.length!==2)throw Error("Coverage differs from report");
const affected=await read(`${folder}/affected/coverage.json`);if(affected.reports.length!==12)throw Error("Affected coverage incomplete");
await writeFile(`${folder}/verification.json`,JSON.stringify({verifiedAt:new Date().toISOString(),hashChecks:verified.length,verified,geometryCopySha256:await sha(runtime),nativeInputs:{count:input.rows.length,failed:failed.length,scope:"DEV exposed-point inputs, not motion/network/visual acceptance"},currentComparisons:8,affectedComparisons:12,rejectedCaptures:2,status:"verified-evidence-not-visual-pass"},null,2)+"\n");
const assets=await readdir("dist/assets"),scripts=assets.filter(p=>/\.(js|css)$/.test(p));
const markers=["design-review","review-leaf-5","reviewMatchController","DesignReview","Review WenKai","Review ZhenKai"],matches=[];
for(const file of scripts){const data=await readFile(`dist/assets/${file}`,"utf8");for(const marker of markers)if(data.includes(marker))matches.push({file,marker});}
const candidateAssets=assets.filter(p=>/candidate|measurement|mockup|hand-clean|select-idle-action/i.test(p));
if(matches.length||candidateAssets.length)throw Error("DEV/source data in production");
const diff=spawnSync("git",["diff","--check"],{encoding:"utf8"});if(diff.status!==0)throw Error(diff.stdout+diff.stderr);
const build=await read("dist/web-build-report.json");
const sourceFiles=["src/components/MatchScreen.tsx","src/components/CardView.tsx","src/styles.css","src/web-v3.css",runtime];
await writeFile(`${folder}/build.json`,JSON.stringify({typescript:{command:"npx tsc --noEmit",exitCode:0,scope:"Completed in this checkpoint after face-wrapper and final hand CSS changes"},webBuild:{command:"npm run web:build",exitCode:0,...build},productionScan:{files:await Promise.all(scripts.map(async file=>({file,sha256:await sha(`dist/assets/${file}`),bytes:(await stat(`dist/assets/${file}`)).size}))),markers,markerMatches:matches,candidateAssets},sourceFiles:await Promise.all(sourceFiles.map(async path=>({path,sha256:await sha(path)}))),diffCheck:{command:"git diff --check",exitCode:diff.status},interpretation:"Engineering and exclusion gates only; whole-page visual result remains blocked"},null,2)+"\n");
console.log(JSON.stringify({hashChecks:verified.length,comparisons:20,productionMarkers:matches.length,typescript:0,webBuild:0,diff:0,visualResult:"blocked"}));
