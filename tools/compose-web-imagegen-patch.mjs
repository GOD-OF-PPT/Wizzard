// Composite only specified rectangles from a built-in ImageGen edit. All other
// original pixels remain identical. No generated pixel is painted or recolored.
import { createRequire } from "node:module";
import { access, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const [base, generated, output, modulePath, rects, mode, reportPath] = process.argv.slice(2);
const verifyOnly = mode === "--verify-only";
if (!rects) throw new Error("Expected base, ImageGen edit, new output, sharp module, x,y,w,h[;...]");
if (!verifyOnly) {
  try { await access(output); throw new Error(`Refusing to overwrite ${output}`); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
const sharp = createRequire(import.meta.url)(modulePath);
const original = await sharp(base).metadata(), edited = await sharp(generated).metadata();
if (original.width !== edited.width || original.height !== edited.height) throw new Error("ImageGen edit changed the canvas; do not rescale it silently");
const regions = rects.split(";").map(rect => {
  const [left,top,width,height] = rect.split(",").map(Number);
  if (![left,top,width,height].every(Number.isInteger) || left < 0 || top < 0 || width <= 0 || height <= 0 || left + width > original.width || top + height > original.height) throw new Error("Invalid patch bounds");
  return {left,top,width,height};
});
if (!verifyOnly) {
  const patches = await Promise.all(regions.map(async region => ({ input: await sharp(generated).extract(region).png().toBuffer(), left:region.left, top:region.top })));
  await sharp(base).composite(patches).png().toFile(output);
}
const a = await sharp(base).ensureAlpha().raw().toBuffer(), b = await sharp(output).ensureAlpha().raw().toBuffer();
let changedOutside = 0;
for(let y=0;y<original.height;y++) for(let x=0;x<original.width;x++) {
  if(regions.some(r=>x>=r.left&&x<r.left+r.width&&y>=r.top&&y<r.top+r.height)) continue;
  const i=(y*original.width+x)*4;
  if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3]) changedOutside++;
}
if(changedOutside) throw new Error(`Changed ${changedOutside} pixels outside selected patch`);
const hash = async path => createHash("sha256").update(await readFile(path)).digest("hex");
const report={base,baseSha256:await hash(base),generated,generatedSha256:await hash(generated),output,outputSha256:await hash(output),size:[original.width,original.height],regions,changedOutside,limitation:"Local composition only; inspect texture/line seams in Chrome."};
if (reportPath) await writeFile(reportPath,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report));
