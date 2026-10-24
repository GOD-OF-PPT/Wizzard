// New semantic design revision, never modifies the original reference.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sharp = createRequire(import.meta.url)(process.argv[2] ?? 'sharp');
// V2's hard rectangular cut left a visible seam across the exposed paper/table.
// V3's top feather still intersected the old gold border. V4 moves the blend
// margin completely outside the plaque/shadow, so none of its border survives.
const roi = { left: 630, top: 1360, width: 311, height: 220 };
const feather = 16;
const raw = 'art/source/web-v3/chooser-portrait-no-play-v2.png';
const patch = await sharp(raw).extract(roi).ensureAlpha().raw().toBuffer();
const reports = [];
for (const [base, design] of [
  ['art/mockups/web-v3/portrait/11-chooser.png', 'art/mockups/web-v3/portrait/11-chooser-no-play-v4.png'],
  ['art/mockups/web-v3/portrait/18-chooser-pending-v1.png', 'art/mockups/web-v3/portrait/18-chooser-pending-no-play-v4.png'],
]) {
  const meta = await sharp(base).metadata();
  if (meta.width !== 941 || meta.height !== 1672) throw new Error('Unexpected base size');
  const before = await sharp(base).ensureAlpha().raw().toBuffer();
  const after = Buffer.from(before);
  for (let y = 0; y < roi.height; y++) for (let x = 0; x < roi.width; x++) {
    const alpha = Math.min(1, x / feather, y / feather, (roi.height - 1 - y) / feather);
    const dst = ((roi.top + y) * meta.width + roi.left + x) * 4, src = (y * roi.width + x) * 4;
    for (let c = 0; c < 4; c++) after[dst + c] = Math.round(before[dst + c] * (1 - alpha) + patch[src + c] * alpha);
  }
  let changedOutside = 0;
  for (let y = 0; y < meta.height; y++) for (let x = 0; x < meta.width; x++) {
    if (x >= roi.left && x < roi.left + roi.width && y >= roi.top && y < roi.top + roi.height) continue;
    const i = (y * meta.width + x) * 4;
    if (!before.subarray(i, i + 4).equals(after.subarray(i, i + 4))) changedOutside++;
  }
  if (changedOutside) throw new Error('Unexpected outside pixel change');
  const out = await sharp(after, { raw: { width: meta.width, height: meta.height, channels: 4 } }).png().toBuffer();
  await writeFile(design, out);
  const hash = b => createHash('sha256').update(b).digest('hex');
  reports.push({ base, design, raw, roi, feather, previousCandidate: 'v2 hard seam and v3 residual border rejected', changedOutside, baseSha256: hash(await readFile(base)), designSha256: hash(out) });
}
await writeFile('art/review/web-v3/45-chooser-no-play-source-20261020.json', JSON.stringify(reports, null, 2) + '\n');
console.log(JSON.stringify(reports));
