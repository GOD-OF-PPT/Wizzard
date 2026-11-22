// Saved Chrome bytes only: comparison assembly, no browser automation/pass.
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {mkdir,readFile,writeFile,copyFile,access} from "node:fs/promises";
const sharpPath=process.argv[2]??"sharp",sharp=createRequire(import.meta.url)(sharpPath);
const root="art/review/web-v3",folder=`${root}/join-states-20261025`;
await mkdir(folder,{recursive:true});
const records=[];
for(const profile of ["landscape","portrait"])for(const [state,file]of [["join-code-error","22-join-code-error-v1.png"],["join-name-error","23-join-name-error-v1.png"],["join-code-focus","24-join-code-focus-v1.png"],["join-idle","03-join.png"],["create-name-error","21-create-name-error-v1.png"]]){
  const tall=profile==="portrait",width=tall?390:1672,height=tall?694:941;
  const design=`art/mockups/web-v3/${tall?"portrait/":""}${file}`;
  const capture=`${folder}/${state}-${profile}-chrome.png`,prefix=`${root}/57-${state}-${profile}-20261025`;
  await copyFile(`${prefix}.png`,capture);
  const focus=state==="create-name-error"?(tall?"60,170,275,275":"630,210,630,430"):tall?(state==="join-name-error"?"125,280,210,68":"55,375,285,110"):(state==="join-name-error"?"745,317,480,112":"602,458,630,178");
  const result=spawnSync(process.execPath,["tools/compare-web-design.mjs",design,capture,prefix,sharpPath,String(width),String(height),focus],{encoding:"utf8"});
  if(result.status!==0)throw Error(result.stderr);
  const metrics=JSON.parse(result.stdout),comparison=`${state}-${profile}-comparison.jpg`,focused=`${state}-${profile}-focus.png`;
  await sharp(`${prefix}-comparison.png`).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(`${folder}/${comparison}`);
  await copyFile(`${prefix}-focus.png`,`${folder}/${focused}`);
  const before=`${root}/55-${state}-${profile}-before-20261025.png`;
  let beforePresent=false;
  try{await access(before);await copyFile(before,`${folder}/${state}-${profile}-before.png`);beforePresent=true;}catch{}
  let beforeMaskPresent=false;
  const beforeMask=`${root}/56-${state}-${profile}-20261025.png`;
  try{await access(beforeMask);await copyFile(beforeMask,`${folder}/${state}-${profile}-before-mask.png`);beforeMaskPresent=true;}catch{}
  const hash=async p=>createHash("sha256").update(await readFile(p)).digest("hex");
  records.push({state,profile,design,capture,comparison,focused,beforePresent,beforeMaskPresent,sourceSha256:await hash(design),captureSha256:await hash(capture),metrics,status:"blocked-inherited-typography-P2",content:state==="join-code-error"?{nickname:"茶客听雨",code:"12",error:"请输入六位数字房间码"}:state==="join-name-error"?{nickname:"",code:"628315",error:"请填写茶客昵称"}:state==="create-name-error"?{nickname:"",seats:6,fillAi:true,timer:false,error:"请填写茶客昵称"}:{nickname:"茶客听雨",code:"628315",...(state==="join-code-focus"?{focused:"六位房间码"}:{})}});
}
for(const profile of ["landscape","portrait"])await copyFile(`${root}/57-join-empty-${profile}-20261025.png`,`${folder}/join-empty-${profile}-diagnostic.png`);
await writeFile(`${folder}/coverage.json`,JSON.stringify({date:"2026-10-25",browser:"Chrome extension browser ID 3",status:"blocked-not-a-pass",scope:"Three new key join states plus ordinary join and create-name-error regression, both profiles: ten comparisons. Empty-code images are diagnostic only, no independent state source/pass claim.",capturePolicy:"Integer origin PNG, 1672x941 / 390x694; actual fractional geometry in runtime.json. JPEG comparisons are derived previews; originals and focused PNGs retained.",records},null,2)+"\n");
const figures=records.map(r=>`<figure><figcaption>${r.state} · ${r.profile}</figcaption><a href="${r.comparison}"><img src="${r.comparison}" alt="左ImageGen，右Chrome"></a><p><a href="${r.focused}">无损局部对照</a> · <a href="${r.capture.split('/').at(-1)}">Chrome原图</a> · <a href="../../../mockups/web-v3/${r.profile==="portrait"?"portrait/":""}${r.design.split('/').at(-1)}">独立设计稿</a></p></figure>`).join("\n");
await writeFile(`${folder}/index.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>奇术茶馆 · 加入校验与焦点 2026-10-25</title><style>body{margin:0;padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}figure{margin:0}img{width:100%;display:block}a{color:inherit}</style><h1>加入房间 · 校验与键盘焦点</h1><p>左：独立ImageGen稿；右：真实Chrome表单。三新状态及正常加入/创建校验复核，共十组。校验和焦点使用真实输入/Tab触发；数字遮罩缩至字形周围，恢复原纸纹。字号笔形等P2仍保留，整体未通过。</p><main>${figures}</main></html>`);
console.log(JSON.stringify({folder,comparisons:records.length,status:"blocked"}));
