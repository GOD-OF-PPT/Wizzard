import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const manifestFile = 'art/audio-manifest.json';
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
const selectionFile = 'art/source/audio/teahouse-v1/selection-v1.json';
const curated = existsSync(selectionFile) ? JSON.parse(readFileSync(selectionFile, 'utf8')) : null;
if (manifest.entries.some(entry => entry.status !== 'generated' || entry.sourceFiles?.length !== 4)) {
  throw new Error('All sixteen generated effects must have four original candidates.');
}
const runtimeRoot = 'art/runtime/audio/teahouse-v1';
const reviewRoot = 'art/review/audio';
mkdirSync(`${runtimeRoot}/candidates`, { recursive: true });
mkdirSync(reviewRoot, { recursive: true });
const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
function decode(file) {
  const bytes = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', '48000', 'pipe:1'], { maxBuffer: 8e6 });
  return Float32Array.from({ length: bytes.length / 4 }, (_, index) => bytes.readFloatLE(index * 4));
}
function measure(samples) {
  let peak = 0, squares = 0, clipped = 0;
  for (const value of samples) { peak = Math.max(peak, Math.abs(value)); squares += value * value; if (Math.abs(value) >= 0.999) clipped++; }
  const threshold = Math.max(0.0005, peak * 0.01);
  let first = samples.findIndex(value => Math.abs(value) > threshold);
  let last = samples.length - 1;
  while (last >= 0 && Math.abs(samples[last]) <= threshold) last--;
  if (first < 0 || peak < 0.0001) throw new Error('Silent generated candidate');
  return { duration: samples.length / 48000, peakDbfs: 20 * Math.log10(peak), rmsDbfs: 10 * Math.log10(squares / samples.length), clippedSamples: clipped, leadingSilenceSeconds: first / 48000, trailingSilenceSeconds: (samples.length - 1 - last) / 48000, first, last };
}
const checks = [];
for (const entry of manifest.entries) {
  const candidates = [];
  for (const original of entry.sourceFiles.toSorted((a, b) => a.take - b.take)) {
    const samples = decode(original.path);
    const sourceMetrics = measure(samples);
    const start = Math.max(0, sourceMetrics.first / 48000 - 0.008);
    const end = Math.min(samples.length / 48000, (sourceMetrics.last + 1) / 48000 + 0.06);
    const length = Math.max(0.06, end - start);
    const trimmedMetrics = measure(samples.slice(Math.floor(start * 48000), Math.ceil(end * 48000)));
    const targetRmsDbfs = entry.targetLufs - 3;
    const gainDb = Math.min(9, targetRmsDbfs - trimmedMetrics.rmsDbfs, -3 - sourceMetrics.peakDbfs);
    const target = `${runtimeRoot}/candidates/${entry.id.replaceAll('.', '-')}-take-0${original.take}.mp3`;
    const filter = `atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,volume=${gainDb}dB,afade=t=in:d=0.003,afade=t=out:st=${Math.max(0, length - 0.015)}:d=0.015`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', original.path, '-af', filter, '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '128k', '-map_metadata', '-1', target], { stdio: 'pipe' });
    const outputMetrics = measure(decode(target));
    if (outputMetrics.peakDbfs > -1.5 || outputMetrics.clippedSamples) throw new Error(`Output peak check failed: ${target}`);
    candidates.push({ take: original.take, source: original.path, sourceSha256: sha256(original.path), sourceBytes: statSync(original.path).size, sourceMetrics, runtimePath: target, sha256: sha256(target), bytes: statSync(target).size, outputMetrics, technicalWarning: outputMetrics.rmsDbfs < -40 ? 'Very quiet candidate; excluded from technical default.' : null, processing: { trimStartSeconds: start, trimEndSeconds: end, targetRmsDbfs, gainDb, sampleRate: 44100, channels: 1, mp3Bitrate: 128000, fadeInSeconds: 0.003, fadeOutSeconds: 0.015 } });
  }
  if (new Set(candidates.map(candidate => candidate.sourceSha256)).size !== 4) throw new Error(`Duplicate source takes: ${entry.id}`);
  // Technical convenience default only: usable level, RMS proximity and onset.
  // This does not rank timbre, musicality or subjective suitability.
  const technicalScore = candidate => Math.abs(candidate.outputMetrics.rmsDbfs - (entry.targetLufs - 3)) + candidate.outputMetrics.leadingSilenceSeconds * 4;
  const choice = curated?.entries[entry.id];
  const selected = choice ? candidates.find(candidate => candidate.take === choice.take && !candidate.technicalWarning) : candidates.filter(candidate => !candidate.technicalWarning).toSorted((a, b) => technicalScore(a) - technicalScore(b) || a.take - b.take)[0];
  if (!selected) throw new Error(`No audible technical candidate: ${entry.id}`);
  copyFileSync(selected.runtimePath, entry.runtimePath);
  if (choice?.eq || choice?.gainDb) {
    const processing = [choice.eq, choice.gainDb ? `volume=${choice.gainDb}dB` : null].filter(Boolean).join(',');
    const temp = `tmp/teahouse-sfx-${entry.id.replaceAll('.', '-')}.mp3`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', selected.runtimePath, '-af', processing, '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '128k', '-map_metadata', '-1', temp], { stdio: 'pipe' });
    copyFileSync(temp, entry.runtimePath);
  }
  const finalMetrics = measure(decode(entry.runtimePath));
  if (finalMetrics.peakDbfs > -1.5 || finalMetrics.clippedSamples) throw new Error(`Selected output peak check failed: ${entry.id}`);
  Object.assign(entry, { candidates, selectedTake: selected.take, selectionStatus: choice ? 'agent-selected' : 'provisional', selectionBasis: choice?.reason ?? 'Provisional technical default: audible RMS level, target proximity and short onset.', selectionReviewMethod: curated?.reviewMethod ?? 'Technical convenience default only.', finalProcessing: choice ? { eq: choice.eq ?? null, gainDb: choice.gainDb ?? 0 } : null, finalMetrics, runtimeSha256: sha256(entry.runtimePath), runtimeBytes: statSync(entry.runtimePath).size, durationActualSeconds: finalMetrics.duration, technicalStatus: 'decode-duration-peak-and-unique-takes-verified', listeningStatus: 'not-human-reviewed', wiredToGame: manifest.integration?.target === 'react-web' });
  delete entry.uiControls;
  delete entry.downloadBefore;
  writeFileSync(path.join(entry.sourceDirectory, 'provenance.json'), JSON.stringify(entry, null, 2) + '\n');
  checks.push({ id: entry.id, uniqueSourceTakes: 4, selectedTake: selected.take, selectionStatus: entry.selectionStatus, duration: finalMetrics.duration, peakDbfs: finalMetrics.peakDbfs, rmsDbfs: finalMetrics.rmsDbfs });
}
manifest.model = 'eleven_text_to_sound_v2';
manifest.modelDisplayName = 'Sound Effects v2';
manifest.generationSurface = 'https://elevenlabs.io/app/sound-effects/history';
manifest.technicalVerifiedAt = new Date().toISOString();
manifest.outputEncoding = { format: 'MP3', sampleRate: 44100, channels: 1, bitrate: 128000 };
manifest.listeningReview = 'Pending human audition; no claim of subjective audio acceptance.';
manifest.selectionStatus = curated?.status ?? 'provisional';
manifest.selectionFile = curated ? selectionFile : null;
manifest.generationNotes = 'Official logged-in webpage used after connector tools returned unavailable. SFX v2, loop off, prompt influence 30%, prompt auto-optimization left on. Stored prompts are submitted text. Two overlength attempts produced no history or credit deduction. Downloads use MP3 where available; one source take is WAV. No account settings or subscriptions were changed.';
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
const montage = [];
const montageTimeline = [];
let position = 0;
for (const entry of manifest.entries) {
  const samples = decode(entry.runtimePath);
  montageTimeline.push({ id: entry.id, label: entry.label, startSeconds: position, durationSeconds: samples.length / 48000 });
  const bytes = Buffer.alloc(samples.length * 4);
  samples.forEach((sample, index) => bytes.writeFloatLE(sample, index * 4));
  montage.push(bytes, Buffer.alloc(Math.round(0.45 * 48000) * 4));
  position += samples.length / 48000 + 0.45;
}
mkdirSync('tmp/teahouse-sfx', { recursive: true });
writeFileSync('tmp/teahouse-sfx/montage.f32', Buffer.concat(montage));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', '48000', '-ac', '1', '-i', 'tmp/teahouse-sfx/montage.f32', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '128k', `${runtimeRoot}/teahouse-sfx-audition-v1.mp3`]);
writeFileSync(`${reviewRoot}/teahouse-sfx-v1-metrics.json`, JSON.stringify({ verifiedAt: manifest.technicalVerifiedAt, effects: checks.length, candidates: checks.length * 4, runtimeBytes: checks.reduce((n, c, index) => n + manifest.entries[index].runtimeBytes, 0), checks, montageTimeline, limitations: ['Subjective listening approval pending', manifest.integration?.target === 'react-web' ? 'Web runtime integrated; Cocos/WeChat not wired' : 'Not wired into game runtime', 'Mobile speaker and cross-browser playback not verified'] }, null, 2) + '\n');
const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const rows = manifest.entries.map((entry, index) => `<article><div class="label"><span class="number">${String(index + 1).padStart(2, '0')}</span><div><h2>${esc(entry.label)}</h2><code>${entry.id}</code></div><span class="time">${entry.durationActualSeconds.toFixed(2)}s</span></div><p>${esc(entry.trigger)}</p><audio controls preload="none" src="/${entry.runtimePath}"></audio><p class="hint">已选定：候选 ${entry.selectedTake}</p><details><summary>比较四个候选</summary>${entry.candidates.map(candidate => `<div class="candidate"><label>候选 ${candidate.take}${candidate.technicalWarning ? '（音量过轻，仅保留归档）' : ''}</label><audio controls preload="none" src="/${candidate.runtimePath}"></audio></div>`).join('')}</details></article>`).join('');
writeFileSync(`${reviewRoot}/teahouse-sfx-v1.html`, `<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>奇术茶馆 · 音效试听</title><style>*{box-sizing:border-box}body{margin:0;background:#111b20;color:#eddfc2;font-family:system-ui,sans-serif;line-height:1.6}main{max-width:1220px;margin:auto;padding:40px 24px}header{padding-bottom:24px;border-bottom:1px solid #735d3d}h1{font-size:30px;margin:0 0 10px}h2{font-size:18px;margin:0}p{color:#cbbd9f}a{color:#f0c675}code,.hint{font-size:12px;color:#b6b7a4}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px;margin-top:24px}article{border:1px solid #5d503c;border-radius:12px;background:#1a272b;padding:18px}.label{display:flex;align-items:center;gap:12px}.number{color:#cfa65f;font-size:24px}.time{margin-left:auto;color:#b8bda9}audio{width:100%;height:36px}.candidate{margin:14px 0}.candidate label{display:block;font-size:13px}summary{cursor:pointer;color:#e0bd79}.note{padding:14px 18px;background:#243331;border-radius:8px}.preview{max-width:640px}</style><main><header><p>ELEVENLABS SFX v2 · 原创声音设计 v1</p><h1>奇术茶馆 · 音效试听</h1><p>漆木轻点、纸牌动作、瓷杯确认和克制的玉铃奖励。16 类音效，64 个原始候选。</p><p class="note">已为每类选定一个版本，无需逐个挑选。点击播放才会发声，一次只播放一个片段。${manifest.integration?.target === "react-web" ? "已接入网页试玩，可在体验设置开关音效。" : "当前未接入游戏。"}</p><div class="preview"><p>按下方 01–16 顺序连续试听，片段间留 0.45 秒：</p><audio controls preload="none" src="/${runtimeRoot}/teahouse-sfx-audition-v1.mp3"></audio></div><p><a href="/${manifestFile}" target="_blank">生成与校验清单</a> · <a href="/docs/83-teahouse-sound-design.md" target="_blank">设计和触发规格</a> · <a href="/${runtimeRoot}/teahouse-sfx-v1.zip" download>下载音效包</a></p></header><section class="grid">${rows}</section></main><script>document.addEventListener('play',event=>{for(const audio of document.querySelectorAll('audio'))if(audio!==event.target)audio.pause()},true)</script></html>`);
console.log(JSON.stringify({ effects: checks.length, uniqueCandidates: checks.length * 4, runtimeFiles: checks.length, preview: `${reviewRoot}/teahouse-sfx-v1.html`, checks }, null, 2));
