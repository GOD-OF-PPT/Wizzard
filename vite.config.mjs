import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
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
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  plugins: [react()],
});
