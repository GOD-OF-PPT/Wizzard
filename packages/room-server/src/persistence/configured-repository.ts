import { createClient } from "redis";
import { createJsonRoomCodec } from "./JsonRoomCodec.js";
import { MemoryRoomRepository } from "./MemoryRoomRepository.js";
import {
  RedisRoomRepository,
  type RedisClientLike,
} from "./RedisRoomRepository.js";
import type { RoomRepository } from "./types.js";
import { isRoomRecord, type RoomRecord } from "../room/model.js";

export type ConfiguredRoomRepository = {
  close(): Promise<void>;
  kind: "memory" | "redis";
  repository: RoomRepository<RoomRecord>;
};

export async function createConfiguredRoomRepository(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<ConfiguredRoomRepository> {
  const redisUrl = environment.WIZZARD_REDIS_URL?.trim();
  if (!redisUrl) {
    return {
      async close() {},
      kind: "memory",
      repository: new MemoryRoomRepository<RoomRecord>(),
    };
  }

  const client = createClient({ url: redisUrl });
  client.on("error", () => {
    // The process owner decides how to report availability; never log room data.
  });
  await client.connect();
  const adapter: RedisClientLike = {
    eval: (script, options) => client.eval(script, options),
    get: (key) => client.get(key),
  };
  const repository = new RedisRoomRepository<RoomRecord>(adapter, {
    codec: createJsonRoomCodec(isRoomRecord),
  });

  return {
    async close() {
      if (client.isOpen) {
        await client.close();
      }
    },
    kind: "redis",
    repository,
  };
}
