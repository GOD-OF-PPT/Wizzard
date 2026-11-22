// Assemble saved Chrome bytes only. This script does not drive a browser,
// change a design, or infer a pass from image statistics.
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {mkdir,readFile,writeFile,copyFile} from "node:fs/promises";
const sharpPath=process.argv[2]??"sharp";
const sharp=createRequire(import.meta.url)(sharpPath);
const root="art/review/web-v3",folder=`${root}/entry-calibration-20261024`;
await mkdir(folder,{recursive:true});
const records=[];
for(const profile of ["landscape","portrait"])for(const [state,file]of [["create","02-create.png"],["join","03-join.png"],["create-name-error","21-create-name-error-v1.png"]]){
  const portrait=profile==="portrait";
  const width=portrait?390:1672,height=portrait?694:941;
  const design=`art/mockups/web-v3/${portrait?"portrait/":""}${file}`;
  const batch=state==="join"?"54":"53";
  const original=`${root}/${batch}-${state}-${profile}-final-20261024.png`;
  const capture=`${folder}/${state}-${profile}-chrome.png`;
  await copyFile(original,capture);
  const localPrefix=`${root}/${batch}-${state}-${profile}-final-20261024`;
  const focus=portrait?(state==="join"?"65,280,270,165":"60,170,275,275"):(state==="join"?"620,300,600,290":"630,210,630,430");
  const result=spawnSync(process.execPath,["tools/compare-web-design.mjs",design,capture,localPrefix,sharpPath,String(width),String(height),focus],{encoding:"utf8"});
  if(result.status!==0)throw Error(result.stderr);
  const metrics=JSON.parse(result.stdout);
  const comparison=`${state}-${profile}-comparison.jpg`,focused=`${state}-${profile}-focus.png`;
  await sharp(`${localPrefix}-comparison.png`).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(`${folder}/${comparison}`);
  await copyFile(`${localPrefix}-focus.png`,`${folder}/${focused}`);
  if(state!=="create-name-error"){
    await copyFile(`${root}/52-${state}-${profile}-before-20261024.png`,`${folder}/${state}-${profile}-before.png`);
    await copyFile(`${root}/52-${state}-${profile}-before-20261024-focus.png`,`${folder}/${state}-${profile}-before-focus.png`);
  }
  if(state==="join")await copyFile(`${root}/53-join-${profile}-final-20261024.png`,`${folder}/join-${profile}-pre-baseline.png`);
  const hash=async path=>createHash("sha256").update(await readFile(path)).digest("hex");
  records.push({state,profile,design,capture,comparison,focused,sourceSha256:await hash(design),captureSha256:await hash(capture),metrics,status:"blocked-P2",comparisonEncoding:"JPEG derived preview only; lossless Chrome original and focused comparison retained",content:state==="join"?{nickname:"茶客听雨",code:"628315"}:state==="create"?{nickname:"茶客听雨",seats:6,fillAi:true,timer:false}:{nickname:"",seats:6,fillAi:true,timer:false,error:"请填写茶客昵称"}});
}
await writeFile(`${folder}/coverage.json`,JSON.stringify({date:"2026-10-24",browser:"Chrome extension, browser ID 3",status:"blocked-not-a-pass",scope:"Six comparisons: create, join and new empty-nickname validation state in both profiles. Other pages retain docs43 findings.",capturePolicy:"No stretching of clipped captures. Requested 1672x941 / 390x694. Actual CSS viewport and fractional stages recorded in runtime.json.",baselineCaveat:"Join before images include keyboard focus on return-home; before-field crops are diagnostic, not idle full-page acceptance. The 707px-high JPEG was rejected and excluded.",records},null,2)+"\n");
const figures=records.map(r=>`<figure><figcaption>${r.state} · ${r.profile} · P2 未关闭</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左 ImageGen 设计；右 Chrome 实现"></a><p><a href="${r.focused}">无损局部对照</a> · <a href="${r.capture.split('/').at(-1)}">Chrome 无损原图</a> · <a href="../../../mockups/web-v3/${r.profile==="portrait"?"portrait/":""}${r.design.split('/').at(-1)}">独立设计稿</a></p></figure>`).join("\n");
await writeFile(`${folder}/index.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>奇术茶馆 · 表单同视口对照 2026-10-24</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}figure{margin:0}img{width:100%;display:block}a{color:inherit}</style><h1>创建 / 加入 / 空昵称校验 · Chrome 对照</h1><p>左：独立 ImageGen 真值；右：2026-10-24 Chrome。横屏1672×941、竖屏390×694。全景预览为JPEG；无损截图与局部图保留。数字笔形、中文笔触/基线及表单局部色调仍有P2，整体未通过。新校验提示在昵称行内显示；编辑后清除。完整结论见docs/53-web-v3-entry-calibration.md。</p><main>${figures}</main></html>`);
console.log(JSON.stringify({folder,comparisons:records.length,status:"blocked"}));
