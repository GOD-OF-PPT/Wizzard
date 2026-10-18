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
    // Native Windows file events missed entry-module replacements during
    // visual calibration, leaving a served module older than the worktree.
    watch: process.platform === "win32" ? { usePolling: true, interval: 400, binaryInterval: 800 } : undefined,
    proxy: {
      "/ws": {
        target: "http://127.0.0.1:8787",
        ws: true,
      },
    },
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  plugins: [react()],
});
