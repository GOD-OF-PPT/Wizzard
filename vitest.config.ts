import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@wizzard\/game-core$/,
        replacement: fileURLToPath(
          new URL("./packages/game-core/src/index.ts", import.meta.url),
        ),
      },
      {
        find: /^@wizzard\/game-core\/contracts$/,
        replacement: fileURLToPath(
          new URL("./packages/game-core/src/contracts.ts", import.meta.url),
        ),
      },
      {
        find: /^@wizzard\/game-core\/authority$/,
        replacement: fileURLToPath(
          new URL("./packages/game-core/src/authority.ts", import.meta.url),
        ),
      },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
