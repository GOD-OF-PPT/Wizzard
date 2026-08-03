import type { RequestErrorCode } from "@wizzard/room-protocol";

export class RoomServiceError extends Error {
  public constructor(
    public readonly code: RequestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RoomServiceError";
  }
}

export function isRoomServiceError(error: unknown): error is RoomServiceError {
  return error instanceof RoomServiceError;
}
