// Verifies that the shared-package dist outputs the Cocos editor and
// cocos-client typecheck consume have been built. Unlike cocos:prepare /
// cocos:typecheck, this does NOT rebuild — it fails fast so a missing build
// is caught before opening the editor or running type checks.
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

const requiredDist = [
  "packages/game-core/dist",
  "packages/room-protocol/dist",
];

const missing = requiredDist.filter(
  (rel) => !existsSync(resolve(projectRoot, rel)),
);

if (missing.length > 0) {
  for (const rel of missing) {
    console.error(`Missing required build output: ${rel}`);
  }
  console.error(
    "Run `npm run build:core && npm run build:protocol` before opening the Cocos editor or running cocos:check.",
  );
  process.exit(1);
}

console.log("Cocos editor dist dependencies are present.");
