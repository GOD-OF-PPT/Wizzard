// Local-only evidence sink for Chrome capture bytes and diagnostic JSON.
// It accepts flat filenames only and cannot write outside the review folder.
import http from "node:http";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const directory = path.resolve("art/review/web-v3");
await mkdir(directory, { recursive: true });
const server = http.createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  const filename = (request.url ?? "").slice(1);
  if (request.method !== "POST" || !/^[a-zA-Z0-9_.-]+\.(png|jpg|json)$/.test(filename)) {
    response.writeHead(400).end("Expected an evidence filename");
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
    const body = Buffer.concat(chunks);
    if (filename.endsWith(".json")) JSON.parse(body.toString("utf8"));
    await writeFile(path.join(directory, filename), body);
    response.writeHead(200).end("saved");
  } catch {
    response.writeHead(400).end("Capture rejected");
  }
});
server.listen(5199, "127.0.0.1", () => console.log(`Chrome review capture sink: ${directory}`));
