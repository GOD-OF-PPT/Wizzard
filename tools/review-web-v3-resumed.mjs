// Assemble current Chrome captures against immutable source designs.
import { spawnSync } from 'node:child_process';
const sharp = process.argv[2] ?? 'sharp';
const pages = [['gameplay','05-gameplay-final.png','05-gameplay-safe-v2.png'],['bid','10-bid.png'],['chooser','11-chooser.png'],['gameplay-notimer','14-gameplay-notimer.png','14-gameplay-notimer-safe-v3.png'],['reconnecting','15-reconnecting.png'],['session-ended','16-session-ended-v2.png']];
for (const profile of ['landscape','portrait']) for (const [state,wide,tall=wide] of pages) {
  const portrait = profile === 'portrait';
  const prefix = `art/review/web-v3/26-${state}-${profile}-20261019`;
  const source = `art/mockups/web-v3/${portrait?'portrait/':''}${portrait?tall:wide}`;
  const result = spawnSync(process.execPath,['tools/compare-web-design.mjs',source,`${prefix}.jpg`,prefix,sharp,portrait?'390':'1672',portrait?'694':'941',portrait?'25,180,360,500':'320,180,1030,700'],{encoding:'utf8'});
  if (result.status !== 0) throw new Error(result.stderr);
  console.log(`${state}/${profile}: comparison saved, visual review still required`);
}
