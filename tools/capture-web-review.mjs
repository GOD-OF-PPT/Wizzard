// Local-only screenshot sink for Chrome's browser-control capture bytes.
// It accepts image filenames only and cannot write outside the review folder.
import http from "node:http";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const directory = path.resolve("art/review/web-v3");
await mkdir(directory, { recursive: true });
const server = http.createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  const filename = (request.url ?? "").slice(1);
  if (request.method !== "POST" || !/^[a-zA-Z0-9_.-]+\.(png|jpg)$/.test(filename)) {
    response.writeHead(400).end("Expected an image filename");
    return;
  }
  try {
    const chunks = [];
    let length = 0;
    for await (const chunk of request) {
      length += chunk.length;
      if (length > 8 * 1024 * 1024) throw new Error("Screenshot too large");
      chunks.push(chunk);
    }
    await writeFile(path.join(directory, filename), Buffer.concat(chunks));
    response.writeHead(200).end("saved");
  } catch {
    response.writeHead(400).end("Capture rejected");
  }
});
server.listen(5199, "127.0.0.1", () => console.log(`Chrome review capture sink: ${directory}`));
