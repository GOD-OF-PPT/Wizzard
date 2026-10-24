// Copy only the generated state-label pixels; the original source is immutable.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sharp = createRequire(import.meta.url)(process.argv[2] ?? 'sharp');
const roi = { left: 1510, top: 22, width: 130, height: 34 };
const root = 'art/mockups/web-v3/';
const reports = [];
for (const [name, baseName, designName, rawName] of [
  ['reconnecting', '15-reconnecting.png', '15-reconnecting-network-v2.png', 'reconnecting-mode-landscape-v2.png'],
  ['session-ended', '16-session-ended-v2.png', '16-session-ended-network-v3.png', 'session-ended-mode-landscape-v3.png'],
]) {
  const base = root + baseName, design = root + designName, raw = 'art/source/web-v3/' + rawName;
  const meta = await sharp(base).metadata(), generated = await sharp(raw).metadata();
  if (meta.width !== 1672 || meta.height !== 941 || generated.width !== meta.width || generated.height !== meta.height) throw new Error('Unexpected canvas size');
  const patch = await sharp(raw).extract(roi).ensureAlpha().raw().toBuffer();
  const before = await sharp(base).ensureAlpha().raw().toBuffer(), after = Buffer.from(before);
  for (let y = 0; y < roi.height; y++) patch.copy(after, ((roi.top + y) * meta.width + roi.left) * 4, y * roi.width * 4, (y + 1) * roi.width * 4);
  let changedOutside = 0;
  for (let y = 0; y < meta.height; y++) for (let x = 0; x < meta.width; x++) {
    if (x >= roi.left && x < roi.left + roi.width && y >= roi.top && y < roi.top + roi.height) continue;
    const i = (y * meta.width + x) * 4;
    if (!before.subarray(i, i + 4).equals(after.subarray(i, i + 4))) changedOutside++;
  }
  if (changedOutside) throw new Error('Outside pixels changed');
  const out = await sharp(after, { raw: { width: meta.width, height: meta.height, channels: 4 } }).png().toBuffer();
  await writeFile(design, out);
  const hash = b => createHash('sha256').update(b).digest('hex');
  reports.push({ name, base, design, raw, roi, changedOutside, baseSha256: hash(await readFile(base)), designSha256: hash(out) });
}
await writeFile('art/review/web-v3/45-recovery-mode-source-20261020.json', JSON.stringify(reports, null, 2) + '\n');
console.log(JSON.stringify(reports));
