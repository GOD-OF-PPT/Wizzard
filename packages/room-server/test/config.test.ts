import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROOM_SERVICE_CONFIG,
  readRoomServiceConfig,
} from "../src/config.js";

describe("readRoomServiceConfig", () => {
  it("prefers the platform PORT used by container hosts", () => {
    const config = readRoomServiceConfig({
      PORT: "8080",
      WIZZARD_ROOM_PORT: "8787",
    });

    expect(config.port).toBe(8080);
  });

  it("keeps the project-specific port override outside container hosts", () => {
    const config = readRoomServiceConfig({
      WIZZARD_ROOM_PORT: "9876",
    });

    expect(config.port).toBe(9876);
  });

  it("falls back safely when configured ports are invalid", () => {
    const config = readRoomServiceConfig({
      PORT: "invalid",
      WIZZARD_ROOM_PORT: "also-invalid",
    });

    expect(config.port).toBe(DEFAULT_ROOM_SERVICE_CONFIG.port);
  });
});
