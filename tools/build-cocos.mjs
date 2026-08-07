import { existsSync, readFileSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const TARGETS = {
  "web-desktop": {
    config: "cocos-client/build-config/web-desktop.json",
    requiredFiles: ["index.html"],
    freshFiles: ["index.html"],
  },
  wechatgame: {
    config: "cocos-client/build-config/wechatgame.json",
    requiredFiles: ["game.json", "game.js", "application.js"],
    freshFiles: ["game.json", "project.config.json", "first-screen.js"],
    requiredMarkers: [
      { file: "game.js", text: "__wizzardRenderDpr" },
      { file: "game.js", text: "web-adapter.js snapshots" },
    ],
  },
};

const target = process.argv[2];
if (target === "--help" || target === "-h" || !target) {
  console.log("Usage: node tools/build-cocos.mjs <web-desktop|wechatgame>");
  console.log("Optional: set COCOS_CREATOR to the Creator executable path.");
  process.exit(target ? 0 : 1);
}

const targetConfig = TARGETS[target];
if (!targetConfig) {
  console.error(`Unknown Cocos target: ${target}`);
  process.exit(1);
}

const projectRoot = resolve(import.meta.dirname, "..");
const configPath = resolve(projectRoot, targetConfig.config);
const outputPath = resolve(projectRoot, "cocos-client", "build", target);
const creatorPath =
  process.env.COCOS_CREATOR ??
  (process.platform === "win32"
    ? "C:\\ProgramData\\cocos\\editors\\Creator\\3.8.8\\CocosCreator.exe"
    : "CocosCreator");
const startedAt = Date.now();

if (!existsSync(configPath)) {
  console.error(`Cocos build config not found: ${configPath}`);
  process.exit(1);
}
if (process.platform === "win32" && !existsSync(creatorPath)) {
  console.error(
    `Cocos Creator not found at ${creatorPath}. Set COCOS_CREATOR to the installed executable path.`,
  );
  process.exit(1);
}

const args = [
  "--project",
  resolve(projectRoot, "cocos-client"),
  "--build",
  `configPath=${configPath.replaceAll("\\", "/")}`,
];

console.log(`Building Cocos target: ${target}`);
console.log(`Creator: ${creatorPath}`);
console.log(`Config: ${configPath}`);
console.log(`Output: ${outputPath}`);

const result = await new Promise((resolveResult, rejectResult) => {
  const child = spawn(creatorPath, args, {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";

  const collect = (chunk, stream) => {
    const text = chunk.toString();
    output += text;
    stream.write(text);
  };

  child.stdout.on("data", (chunk) => collect(chunk, process.stdout));
  child.stderr.on("data", (chunk) => collect(chunk, process.stderr));
  child.once("error", rejectResult);
  child.once("close", (code, signal) => resolveResult({ code, output, signal }));
});

const outputFiles = targetConfig.requiredFiles.map((file) =>
  resolve(outputPath, file),
);
const missingFiles = outputFiles.filter((file) => !existsSync(file));
const freshOutputFiles = targetConfig.freshFiles.map((file) =>
  resolve(outputPath, file),
);
const staleFiles = freshOutputFiles.filter((file) => {
  if (!existsSync(file)) {
    return true;
  }
  return statSync(file).mtimeMs < startedAt;
});

const missingMarkers = (targetConfig.requiredMarkers ?? []).filter(({ file, text }) => {
  const output = resolve(outputPath, file);
  if (!existsSync(output)) {
    return true;
  }
  return !readFileSync(output, "utf8").includes(text);
});

let orientation = null;
if (target === "wechatgame" && existsSync(outputFiles[0])) {
  try {
    orientation = JSON.parse(readFileSync(outputFiles[0], "utf8"))
      .deviceOrientation;
  } catch {
    // The missing/invalid output is reported by the checks below.
  }
}

const finishedMarker = new RegExp(`build\\s+Task\\s*\\(${target}\\)\\s+Finished`, "i").test(
  result.output,
);
const outputReady =
  missingFiles.length === 0 &&
  staleFiles.length === 0 &&
  missingMarkers.length === 0;
const acceptedKnownCreatorExit = result.code === 36 && outputReady;
const accepted = result.code === 0 || acceptedKnownCreatorExit;

if (accepted && outputReady && (target !== "wechatgame" || orientation === "landscape")) {
  if (acceptedKnownCreatorExit && !finishedMarker) {
    console.warn(
      "Creator returned 36, but the fresh output was verified; treating this known Creator exit as success.",
    );
  }
  console.log(`Cocos target ${target} built successfully.`);
  if (target === "wechatgame") {
    console.log("Verified game.json.deviceOrientation=landscape.");
  }
  process.exit(0);
}

console.error(`Cocos target ${target} build was not verified.`);
console.error(`Exit code: ${result.code ?? "unknown"}${result.signal ? ` (${result.signal})` : ""}`);
if (missingFiles.length > 0) {
  console.error(`Missing output files: ${missingFiles.join(", ")}`);
}
if (staleFiles.length > 0) {
  console.error(`Output files were not refreshed during this build: ${staleFiles.join(", ")}`);
}
if (missingMarkers.length > 0) {
  console.error(
    `Generated files are missing required markers: ${missingMarkers.map(({ file, text }) => `${file}:${text}`).join(", ")}`,
  );
}
if (target === "wechatgame" && orientation !== "landscape") {
  console.error(`Expected game.json.deviceOrientation=landscape, received ${orientation ?? "missing"}.`);
}
process.exit(typeof result.code === "number" && result.code !== 0 ? result.code : 1);
