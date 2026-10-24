// Local Chrome QA carrier. It forwards the actual app and WebSocket protocol;
// outage controls close transports only, never inject DOM, state or wire data.
import http from "node:http";
import net from "node:net";
import { Transform } from "node:stream";

const port = Number(process.env.REVIEW_PROXY_PORT ?? 5174);
const roomPort = Number(process.env.REVIEW_ROOM_PORT ?? 8791);
const appPort = Number(process.env.REVIEW_APP_PORT ?? 5173);
const handshakeDelayMs = Math.max(0, Math.min(10000, Number(process.env.REVIEW_WS_HANDSHAKE_DELAY_MS ?? 0)));
const downstreamDelayMs = Math.max(0, Math.min(5000, Number(process.env.REVIEW_ROOM_DOWNSTREAM_DELAY_MS ?? 0)));
let offline = false;
const roomSockets = new Set();
const server = http.createServer((request, response) => {
  if (request.url?.startsWith("/__review__/")) {
    const action = request.url.slice("/__review__/".length);
    if (request.method === "POST" && ["offline", "online"].includes(action)) {
      offline = action === "offline";
      if (offline) for (const socket of roomSockets) socket.destroy();
    } else if (!(request.method === "GET" && action === "status")) {
      response.writeHead(404).end(); return;
    }
    response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ offline, activeTransports: roomSockets.size, appPort, roomPort, downstreamDelayMs }));
    return;
  }
  const proxy = http.request({ hostname: "127.0.0.1", port: appPort, path: request.url, method: request.method, headers: request.headers }, upstream => {
    response.writeHead(upstream.statusCode ?? 502, upstream.headers);
    upstream.pipe(response);
  });
  proxy.on("error", () => { response.writeHead(502).end("Local app unavailable"); });
  request.pipe(proxy);
});
server.on("upgrade", (request, socket, head) => {
  const isRoom = request.url?.split("?")[0] === "/ws";
  if (isRoom && offline) { socket.destroy(); return; }
  const upstream = new net.Socket();
  const connect = () => { if (!socket.destroyed) upstream.connect(isRoom ? roomPort : appPort, "127.0.0.1"); };
  const connectTimer = isRoom && handshakeDelayMs > 0 ? setTimeout(connect, handshakeDelayMs) : null;
  upstream.on("connect", () => {
    upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${request.rawHeaders.reduce((rows, value, index, all) => index % 2 === 0 ? rows + `${value}: ${all[index + 1]}\r\n` : rows, "")}\r\n`);
    if (head.length) upstream.write(head);
    socket.pipe(upstream);
    if (isRoom && downstreamDelayMs) {
      // Preserve bytes and ordering; delay transport delivery only so Chrome
      // can inspect the real pending state before the authoritative response.
      let delayTimer;
      const delay = new Transform({
        transform(chunk, _encoding, callback) { delayTimer = setTimeout(() => callback(null, chunk), downstreamDelayMs); },
        destroy(error, callback) { clearTimeout(delayTimer); callback(error); },
      });
      socket.once("close", () => delay.destroy());
      upstream.pipe(delay).pipe(socket);
    } else upstream.pipe(socket);
  });
  if (!connectTimer) connect();
  if (isRoom) roomSockets.add(socket);
  socket.on("close", () => { if (connectTimer) clearTimeout(connectTimer); roomSockets.delete(socket); upstream.destroy(); });
  socket.on("error", () => upstream.destroy());
  upstream.on("close", () => socket.destroy());
  upstream.on("error", () => socket.destroy());
});
server.listen(port, "127.0.0.1", () => console.log(`Local recovery QA proxy http://127.0.0.1:${port}, real room server ${roomPort}`));
