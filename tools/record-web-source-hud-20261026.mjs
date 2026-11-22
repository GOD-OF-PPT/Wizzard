// The reviewer opened all 28 full and 28 focused current pairs, in small batches.
// This records that manual review; it does not infer a visual pass from checks.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const folder='art/review/web-v3/hud-source-calibration-20261026',coverage=JSON.parse(await readFile(folder+'/coverage.json','utf8'));
const states=['idle','selected','notimer','play-pending','bid','bid-pending','chooser','chooser-pending','dense-idle','dense-selected','reconnecting','session-ended','reconnecting-focus','session-ended-focus'];
if(coverage.batch!==135||coverage.reports.length!==28)throw Error('Not the current reviewed revision');
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const reviews=[];
for(const profile of ['landscape','portrait'])for(const state of states){
 const r=coverage.reports.find(r=>r.state===state&&r.profile===profile);if(!r)throw Error('Missing review pair');
 const hidden=state.startsWith('chooser')?['underlying trump/status/action']:state.includes('connecting')||state.includes('session-ended')?['trump field covered by modal','timer/status/action intentionally hidden']:profile==='portrait'&&state.startsWith('bid')?['trump hidden','normal status hidden']:profile==='portrait'&&!state.startsWith('dense')?['normal status hidden']:[];
 const notes=[
  'Fixed action lettering/frame/cloud uses source pixels. Original trump paper/prefix and finite sun icon/name now use separate source crops. Dynamic other suit names, round/timer/mode, numeric glyphs, edge resampling and other whole-page P2 remain.',
  profile==='portrait'?'Independent portrait positions retained, including local bid seat148px shift. Source/Chrome GPU edge sampling remains visible.':'Landscape original furniture ratios/coordinates retained; local status quiet-table tile still has subtle tone/edge differences.'
 ];
 if(state.startsWith('bid'))notes.push('Actual bid2 before capture. Original confirm/pending raster and label match authored anatomy; modal title/value/timer differences remain. Portrait135 removes adjacent modal rail pixels from button alpha.');
 if(state.startsWith('chooser'))notes.push('Visible sun glyph normalized to ImageGen v2 赤+者 in source/runtime; 日 and unrelated copy remain original. Chooser position/material/scale and pending ink/fade differences remain; no whole-modal pass.');
 if(state==='notimer')notes.push('133 native selection replaces132 idle-state mismatch. One selected card and confirm action, no timer furniture.');
 if(state.startsWith('dense'))notes.push('Original dense action variant; portrait local-play plaque restored. Other dense pending/no-timer/nonlocal/full-mode sources still missing.');
 if(state.endsWith('-focus'))notes.push('Native Tab focus-visible recorded. Covered furniture excluded; recovery visible panel remains a regression comparison only.');
 reviews.push({profile,state,batch:r.batch,fullOpened:true,focusOpened:true,sourceSha256:r.sourceSha256,captureSha256:r.captureSha256,fullSha256:await sha(folder+'/'+r.comparison),focusSha256:await sha(folder+'/'+r.focus),hiddenExcluded:hidden,notes,status:'source-hud-actions-reviewed-full-page-P2-remain'});
 r.status='source-hud-actions-reviewed-full-page-P2-remain';r.rawRecord=folder+'/raw/'+r.record.prefix+'.json';
}
const axes={typography:'Finite fixed button/status/prefix raster copy restored. Dynamic round/timer/modal/name glyph and sampling differences remain.',layout:'Independent original action rectangles, portrait bid and dense bands retained. Whole-page and missing state layouts not accepted.',color:'Original action/frame RGB retained; local clean paper and one-glyph ink registration have bounded differences. Chooser pending fade remains P2.',imagery:'Original frame/cloud/sun/status pixels, no CSS/SVG/emoji substitutes. Alpha edges and GPU sampling are not byte-identical render claims.',content:'Semantic labels/real values remain live; explicit canonical sun copy revised locally in source and runtime. Fixture pending is not ACK-delay proof.'};
await writeFile(folder+'/manual-review.json',JSON.stringify({batch:135,reviewedViews:{full:28,focused:28},axes,reviews,finalResult:'blocked'},null,2)+'\n');
coverage.status='source-hud-actions-reviewed-full-page-P2-remain';coverage.reviewedViews={full:28,focused:28};coverage.reviewReport='docs/65-web-v3-source-hud-and-actions.md';coverage.actualBatches={default:132,selectedNoTimer:133,portraitBidNormalAndPending:135};
await writeFile(folder+'/coverage.json',JSON.stringify(coverage,null,2)+'\n');
let html=await readFile(folder+'/index.html','utf8');html=html.replace('原稿错误字与运行正确字暂有差异，具体见报告。','当前源图只作单字文案修订，原版本及ROI外像素保留；其他P2见报告。');await writeFile(folder+'/index.html',html);
console.log({full:28,focused:28,result:'blocked'});
