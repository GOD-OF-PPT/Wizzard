export {
  DEFAULT_ROOM_SERVICE_CONFIG,
  readAllowedOrigins,
  readRoomServiceConfig,
} from "./config.js";
export type { RoomServiceConfig } from "./config.js";
export { RoomWebSocketGateway } from "./gateway/RoomWebSocketGateway.js";
export { createConfiguredRoomRepository } from "./persistence/configured-repository.js";
export type { ConfiguredRoomRepository } from "./persistence/configured-repository.js";
export { createRoomService } from "./server.js";
export type {
  CreateRoomServiceOptions,
  RoomService,
} from "./server.js";
export { RoomCoordinator } from "./room/RoomCoordinator.js";
export type {
  CoordinatorUpdate,
  EstablishedRoomSession,
  RoomCoordinatorOptions,
} from "./room/RoomCoordinator.js";
export { RoomServiceError } from "./room/errors.js";
export type {
  BoundRoomSession,
  RoomDeadline,
  RoomLifecycle,
  RoomPlayerRecord,
  RoomRecord,
} from "./room/model.js";
