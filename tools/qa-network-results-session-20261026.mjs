// Isolated real WebSocket carrier for result/rematch/leave browser evidence.
// No injected room/match/session state. Production defaults remain unchanged.
import {createServer as createViteServer} from 'vite';
import {createRoomService,DEFAULT_ROOM_SERVICE_CONFIG} from '../packages/room-server/dist/index.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const followup=process.argv.includes('--followup'),roundExit=process.argv.includes('--round-exit'),longName=process.argv.includes('--long-name'),frontendPort=longName?5177:roundExit?5176:followup?5175:5174,roomPort=longName?8795:roundExit?8794:followup?8793:8792;
const folder=`art/review/web-v3/${longName?'network-results-long-name-20261027':roundExit?'network-round-result-exit-20261027':followup?'network-results-followup-20261026':'network-results-20261026'}`;
await mkdir(folder,{recursive:true});
const config={...DEFAULT_ROOM_SERVICE_CONFIG,port:roomPort,aiActionDelayMs:followup?20:50,trickResultDelayMs:followup?50:100,turnTimeoutMs:followup?400:1200,roundScoreDelayMs:roundExit||longName?600000:followup?200:60000};
const origins=[`http://localhost:${frontendPort}`,`http://127.0.0.1:${frontendPort}`];
const service=createRoomService({config,allowedOrigins:origins});
const address=await service.listen(config.port,'127.0.0.1');
const vite=await createViteServer({configFile:fileURLToPath(new URL('../vite.config.mjs',import.meta.url)),server:{host:'127.0.0.1',port:frontendPort,strictPort:true,open:false,proxy:{'/ws':{target:`http://127.0.0.1:${roomPort}`,ws:true}}}});
await vite.listen();
const files=['packages/room-server/dist/server.js','packages/room-server/dist/room/MatchScheduler.js','packages/room-server/dist/gateway/RoomWebSocketGateway.js','packages/game-core/dist/match.js','packages/room-protocol/dist/validation.js'];
const hashes=await Promise.all(files.map(async path=>({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')})));
await writeFile(folder+'/runtime.json',JSON.stringify({scope:'Isolated real browser/room-service WebSocket validation. Current compiled core/protocol/server, in-memory rooms, fresh runtime random seed. Accelerated timings, not shipping-duration acceptance. Followup is a separate room run after original browser-debugger loss, not continuity proof.',config,origins,roomEndpoint:address.wsUrl,frontendPort,hashes,pid:process.pid,startedAt:new Date().toISOString()},null,2)+'\n');
process.stdout.write(JSON.stringify({service:'isolated-network-results',pid:process.pid,frontendPort,roomPort,ready:true})+'\n');
let closing=false;
async function close(){if(closing)return;closing=true;await vite.close();await service.close();process.stdout.write('Isolated network-results carrier stopped.\n');process.exitCode=0;}
process.once('SIGINT',()=>void close());process.once('SIGTERM',()=>void close());
