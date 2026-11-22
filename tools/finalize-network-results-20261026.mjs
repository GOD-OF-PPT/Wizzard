// Audit stored real-browser/real-server evidence without replaying a match.
// No green artifact check is treated as source-design fidelity acceptance.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {scoreBid} from '../packages/game-core/dist/index.js';
const root='art/review/web-v3',folder=root+'/network-results-20261026';
await mkdir(folder+'/raw',{recursive:true});
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const checks=[],verify=(ok,why)=>{checks.push({ok,why});if(!ok)throw Error(why);};
const evidence=[];
for(const prefix of ['166-network-results','167-network-rematch']){
 const path=root+'/'+prefix+'-flow-20261026.json',receipt=await read(path),roles={host:[],guest:[]},files=[];
 verify(!/"(?:resumeToken|inviteToken|roomSecret|privateState|session)"\s*:/.test(await readFile(path,'utf8')),'No secrets/private-state fields in '+prefix);
 for(const p of receipt.parts){
  const src=root+'/'+p.file,text=await readFile(src,'utf8'),rows=JSON.parse(text);
  verify(rows.length===p.count,'Complete whitelisted frame part '+p.file);
  verify(!/"(?:resumeToken|inviteToken|roomSecret|privateState|session)"\s*:/.test(text),'No secret/private fields '+p.file);
  roles[p.role].push(...rows);await copyFile(src,folder+'/raw/'+p.file);files.push({path:'raw/'+p.file,sha256:await sha(src),records:rows.length});
 }
 for(const s of receipt.snapshots){await copyFile(root+'/'+s.file,folder+'/'+s.file);verify(s.status===200,'Saved browser screenshot '+s.file);files.push({path:s.file,sha256:await sha(root+'/'+s.file)});}
 await copyFile(path,folder+'/'+prefix+'-flow-20261026.json');files.push({path:prefix+'-flow-20261026.json',sha256:await sha(path)});
 evidence.push({prefix,receipt,roles,files});
}
const [first,follow]=evidence;
const updates=rows=>rows.filter(r=>r.event==='received'&&r.update);
const endUpdates=rows=>updates(rows).filter(r=>r.update.match?.phase==='match-end');
const mapScores=players=>players.map(p=>[p.name,String(p.totalScore)]).sort((a,b)=>a[0].localeCompare(b[0]));
const uiScores=rows=>rows.map(c=>[c[1],c[2]]).sort((a,b)=>a[0].localeCompare(b[0]));
const originalTerminals={};
for(const role of ['host','guest']){
 const all=updates(first.roles[role]),terminal=endUpdates(first.roles[role]).at(-1),view=first.receipt.snapshots.find(s=>s.role===role);
 verify(terminal&&view,'Original live terminal update and UI '+role);
 verify(JSON.stringify(mapScores(terminal.update.match.players))===JSON.stringify(uiScores(view.record.rows.map(r=>r.cells.map(c=>c.text)))),'Original terminal totals match authoritative update '+role);
 verify(view.animations.opacity==='1'&&view.animations.running===0,'Original screenshot is stable '+role);
 verify(view.record.buttons[0].label==='离开房间'&&!view.record.buttons[0].disabled,'Original terminal leave action enabled '+role);
 verify(view.record.buttons[1].disabled===(role==='guest')&&terminal.update.permissions.canRematch===(role==='host'),'Host/guest rematch permission reflected in actual UI '+role);
 const rounds=[];
 for(let index=0;index<8;index++){
  const score=all.filter(r=>r.update.match?.phase==='round-score'&&r.update.match.roundIndex===index).at(-1);
  verify(!!score,'Observed actual score round '+(index+1)+' '+role);
  const players=score.update.match.players;
  verify(players.reduce((n,p)=>n+p.tricksWon,0)===index+1,'Won-trick count actual round '+(index+1)+' '+role);
  verify(players.every(p=>scoreBid(p.bid,p.tricksWon)===p.roundScore),'Actual scores follow shared core round '+(index+1)+' '+role);
  rounds.push({round:index+1,roomRevision:score.update.roomRevision,players});
 }
 originalTerminals[role]={roomId:terminal.update.roomId,selfPlayerId:terminal.update.selfPlayerId,hostPlayerId:terminal.update.hostPlayerId,permissions:terminal.update.permissions,rounds,players:terminal.update.match.players};
}
verify(originalTerminals.host.roomId===originalTerminals.guest.roomId&&originalTerminals.host.selfPlayerId!==originalTerminals.guest.selfPlayerId,'Two independent real guest identities in one original room');
verify(JSON.stringify(mapScores(originalTerminals.host.players))===JSON.stringify(mapScores(originalTerminals.guest.players)),'Original host and guest authoritative final totals agree');
for(const role of ['host','guest'])verify(first.roles[role].some(r=>r.event==='socket-created'&&r.url===`ws://${role==='host'?'localhost':'127.0.0.1'}:5174/ws`),'Actual same-origin websocket '+role);

const fp=follow.receipt.proof,rematch=fp.find(p=>p.event==='native-host-rematch-to-lobby'),terminal2=fp.find(p=>p.event==='actual-rematch-terminal');
verify(rematch&&terminal2,'Second run actual rematch and new terminal observed');
verify(rematch.host.roomHeading===rematch.guest.roomHeading&&!rematch.host.phase&&!rematch.guest.phase,'Both clients return to same lobby after rematch');
const sentRematch=follow.roles.host.find(r=>r.event==='sent'&&r.type==='room.rematch');
verify(!!sentRematch,'Actual native rematch command sent');
const rematchAck=updates(follow.roles.host).find(r=>r.update.ackCommandId===sentRematch.requestId&&r.update.roomPhase==='lobby'&&r.update.match===null);
verify(!!rematchAck,'Authoritative rematch ACK carries lobby and no match');
verify(rematchAck.update.roomPlayers.length===2&&rematchAck.update.roomPlayers.every(p=>!p.isAi&&!p.ready&&p.connected),'Rematch keeps both connected humans, resets ready and removes AI');
verify(updates(follow.roles.guest).some(r=>r.update.roomId===rematchAck.update.roomId&&r.update.roomRevision===rematchAck.update.roomRevision&&r.update.roomPhase==='lobby'&&r.update.match===null),'Guest receives same rematch lobby revision');
const matches=new Set(endUpdates(follow.roles.host).map(r=>r.update.match.matchId));
verify(matches.size>=2,'Two genuine match IDs across rematch');
verify(JSON.stringify(terminal2.host.rows)===JSON.stringify(terminal2.guest.rows),'Both rematch terminals render identical standings and scores');
verify(fp.some(p=>p.event==='native-cancel-leave-retains-room'&&p.state.roomHeading===rematch.host.roomHeading&&p.state.storage.sessionPresent&&p.state.storage.leasePresent),'Cancel leave retains real room/session');
const leaveAcks=[];
for(const role of ['guest','host']){
 const command=follow.roles[role].find(r=>r.event==='sent'&&r.type==='room.leave');verify(!!command,'Native terminal room.leave '+role);
 const ack=updates(follow.roles[role]).find(r=>r.update.ackCommandId===command.requestId);verify(!!ack,'Server acknowledges terminal leave '+role);
 const proof=fp.find(p=>p.event===`terminal-${role}-left-acknowledged`),state=proof?.[role];
 verify(state?.home&&!state.storage.sessionPresent&&!state.storage.leasePresent,'Home and cleared session/lease only after leave '+role);
 leaveAcks.push({role,requestId:command.requestId,ackSequence:ack.sequence,roomRevision:ack.update.roomRevision,roomPhase:ack.update.roomPhase});
}
const guestLeft=fp.find(p=>p.event==='terminal-guest-left-acknowledged');
verify(guestLeft.host.phase==='match-end'&&guestLeft.host.storage.sessionPresent,'Guest leave preserves host terminal/session');
for(const role of ['host','guest']){
 const last=endUpdates(follow.roles[role]).at(-1);if(!last)continue;
 const terminal=terminal2[role];verify(JSON.stringify(mapScores(last.update.match.players))===JSON.stringify(uiScores(terminal.rows)),'Second terminal data remains authoritative '+role);
}
const consoleReceipt=await read(root+'/167-network-console-20261026.json');verify(!consoleReceipt.host.length&&!consoleReceipt.guest.length,'No error/warn in followup clients');
verify(follow.receipt.snapshots.find(s=>s.label==='second-terminal')?.visualState.resultOpacity==='1','Followup terminal screenshot is fully opaque after finite animations');
await copyFile(root+'/167-network-console-20261026.json',folder+'/167-network-console-20261026.json');
await copyFile(root+'/network-results-followup-20261026/runtime.json',folder+'/followup-runtime.json');
for(const file of ['runtime.json','followup-runtime.json']){const r=await read(folder+'/'+file);for(const p of r.hashes)verify(await sha(p.path)===p.sha256,'Compiled engine/protocol/service bytes '+file+' '+p.path);}
const cleanup=await read(folder+'/cleanup.json');verify(cleanup.isolatedListenersRemoved&&cleanup.mainPreviewRetained,'Only isolated carriers stopped');
await writeFile(folder+'/verification.json',JSON.stringify({scope:'Stored real-browser/server flow and artifact audit; accelerated timing. No source-design pixel pass, no default-duration/no-timer/distributed deployment acceptance.',engineeringPassed:true,checks,originalTerminals,rematch:{requestId:sentRematch.requestId,ackRoomRevision:rematchAck.update.roomRevision,roomId:rematchAck.update.roomId,distinctTerminalMatches:matches.size},leaveAcks,artifacts:evidence.map(e=>({prefix:e.prefix,frameCounts:{host:e.roles.host.length,guest:e.roles.guest.length},files:e.files})),boundaries:['166 original browser debugger detached before rematch; closed continuity there.','167 is a separate run. Read buffer explicitly truncated before rematch; tail ACK/state evidence retained, not all-action transport continuity.','Timeout/AI pacing accelerated; no human play input or shipping30second timer acceptance.','167 terminal screenshots wait finite animations;166 stable opacity1/no running animations.','Current rendered names/scores differ from frozen source: screenshots are functional/runtime evidence, not same-state pixel acceptance.']},null,2)+'\n');
const screenshots=evidence.flatMap(e=>e.receipt.snapshots.map(s=>({file:s.file,label:s.role+' · '+(s.label??s.event)})));
await writeFile(folder+'/index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>真实联机结算、重开与离房</title><style>body{padding:24px;background:#10151d;color:#f4e1b5;font:16px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,650px),1fr));gap:24px}img{width:100%;max-height:800px;object-fit:contain}figure{margin:0}a{color:inherit}</style><h1>真实联机结算、重开与终局离房</h1><p>两次隔离运行，均使用真实WebSocket和当前规则/协议/服务。时长加速，不能代表正式三十秒节奏，也不是原稿同态像素验收。</p><p><a href="../../../../docs/71-web-v3-network-results-and-rematch.md">报告与边界</a> · <a href="verification.json">收包/ACK/DOM核对</a> · <a href="runtime.json">首轮服务配置</a> · <a href="followup-runtime.json">重开运行配置</a> · <a href="cleanup.json">清理</a></p><main>${screenshots.map(s=>`<figure><figcaption>${s.label}</figcaption><a href="${s.file}"><img src="${s.file}" alt="真实联机界面"></a></figure>`).join('')}</main></html>`);
console.log({checks:checks.length,originalObservedRounds:8,roles:2,actualRematchAck:rematchAck.update.roomRevision,leaveAcks:leaveAcks.length,distinctFollowupMatches:matches.size,status:'accelerated-real-flow-verified-visual-goal-incomplete'});
