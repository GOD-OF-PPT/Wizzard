import { readAllowedOrigins, readRoomServiceConfig } from "./config.js";
import { createConfiguredRoomRepository } from "./persistence/configured-repository.js";
import { createRoomService } from "./server.js";

const config = readRoomServiceConfig();
const allowedOrigins = readAllowedOrigins();
const configuredRepository = await createConfiguredRoomRepository();
const service = createRoomService({
  ...(allowedOrigins ? { allowedOrigins } : {}),
  config,
  repository: configuredRepository.repository,
});
const address = await service.listen(config.port, "0.0.0.0");

process.stdout.write(
  `Wizzard friend-room service (${configuredRepository.kind}) listening at ${address.wsUrl}\n`,
);

async function shutdown(): Promise<void> {
  await service.close();
  await configuredRepository.close();
  process.exitCode = 0;
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
