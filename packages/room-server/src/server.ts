import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  type RoomServiceConfig,
} from "./config.js";
import { RoomWebSocketGateway } from "./gateway/RoomWebSocketGateway.js";
import { MemoryRoomRepository } from "./persistence/MemoryRoomRepository.js";
import type { RoomRepository } from "./persistence/types.js";
import { RoomCoordinator } from "./room/RoomCoordinator.js";
import type { RoomRecord } from "./room/model.js";

export type CreateRoomServiceOptions = {
  allowedOrigins?: readonly string[];
  config?: Partial<RoomServiceConfig>;
  repository?: RoomRepository<RoomRecord>;
};

export type RoomService = {
  close(): Promise<void>;
  coordinator: RoomCoordinator;
  httpServer: HttpServer;
  listen(port?: number, hostname?: string): Promise<{ httpUrl: string; wsUrl: string }>;
};

export function createRoomService(
  options: CreateRoomServiceOptions = {},
): RoomService {
  const config = { ...DEFAULT_ROOM_SERVICE_CONFIG, ...options.config };
  const repository =
    options.repository ?? new MemoryRoomRepository<RoomRecord>();
  const coordinator = new RoomCoordinator({ config, repository });
  const httpServer = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (request.method === "GET" && pathname === "/healthz") {
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({ service: "wizzard-room", status: "ok" }));
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });
  const gateway = new RoomWebSocketGateway({
    ...(options.allowedOrigins ? { allowedOrigins: options.allowedOrigins } : {}),
    config,
    coordinator,
    httpServer,
  });

  return {
    async close() {
      await gateway.close();
      if (!httpServer.listening) {
        return;
      }
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    },
    coordinator,
    httpServer,
    async listen(port = config.port, hostname = "127.0.0.1") {
      if (!httpServer.listening) {
        await new Promise<void>((resolve, reject) => {
          httpServer.once("error", reject);
          httpServer.listen(port, hostname, () => {
            httpServer.off("error", reject);
            resolve();
          });
        });
      }
      const address = httpServer.address() as AddressInfo;
      const displayHost = address.address.includes(":")
        ? `[${address.address}]`
        : address.address;
      return {
        httpUrl: `http://${displayHost}:${address.port}`,
        wsUrl: `ws://${displayHost}:${address.port}/ws`,
      };
    },
  };
}
