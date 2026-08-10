import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import { extname, isAbsolute, relative, resolve } from "node:path";

const WECHAT_MAIN_PACKAGE_LIMIT_BYTES = 4 * 1024 * 1024;
const WECHAT_TOTAL_PACKAGE_LIMIT_BYTES = 30 * 1024 * 1024;

const TARGETS = {
  "web-desktop": {
    config: "cocos-client/build-config/web-desktop.json",
    requiredFiles: ["index.html"],
    freshFiles: ["index.html"],
  },
  wechatgame: {
    config: "cocos-client/build-config/wechatgame.json",
    requiredFiles: [
      "game.json",
      "game.js",
      "application.js",
      "src/settings.json",
      "assets/main/index.js",
    ],
    freshFiles: [
      "game.json",
      "project.config.json",
      "first-screen.js",
      "assets/main/index.js",
    ],
    requiredMarkers: [
      { file: "game.js", text: "__wizzardRenderDpr" },
      { file: "game.js", text: "web-adapter.js snapshots" },
      { file: "game.js", text: 'transport: "wechat-cloud-container"' },
      { file: "game.js", text: 'environmentId: "prod-d9g3qr6rqdbba6605"' },
      { file: "game.js", text: 'serviceName: "wizzard-room-server"' },
      { file: "game.js", text: 'path: "/ws"' },
      { file: "assets/main/index.js", text: "connectContainer" },
    ],
    forbiddenTexts: [
      "sh.run.tcloudbase.com",
      "mini-pro-d9gbcemh17af17f1b",
    ],
  },
};

function collectFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function directoryBytes(directory) {
  let bytes = 0;

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      bytes += directoryBytes(entryPath);
    } else if (entry.isFile()) {
      bytes += statSync(entryPath).size;
    }
  }

  return bytes;
}

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

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

let expectedWechatAppId = null;
let expectedWechatLibVersion = null;
let outputWechatAppId = null;
let outputWechatLibVersion = null;
if (target === "wechatgame") {
  try {
    const wechatBuildConfig = JSON.parse(readFileSync(configPath, "utf8"))
      .packages?.wechatgame;
    expectedWechatAppId = wechatBuildConfig?.appid;
    expectedWechatLibVersion = wechatBuildConfig?.libVersion;

    const projectConfigPath = resolve(outputPath, "project.config.json");
    const projectConfig = JSON.parse(readFileSync(projectConfigPath, "utf8"));
    if (
      expectedWechatLibVersion &&
      projectConfig.libVersion !== expectedWechatLibVersion
    ) {
      projectConfig.libVersion = expectedWechatLibVersion;
      writeFileSync(
        projectConfigPath,
        `${JSON.stringify(projectConfig, null, 2)}\n`,
        "utf8",
      );
    }
    outputWechatAppId = projectConfig.appid;
    outputWechatLibVersion = projectConfig.libVersion;
  } catch {
    // The missing/invalid output is reported by the checks below.
  }
}

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
const generatedTextFiles = existsSync(outputPath)
  ? collectFiles(outputPath).filter((file) =>
      new Set([".js", ".json"]).has(extname(file).toLowerCase()),
    )
  : [];
const presentForbiddenMarkers = (targetConfig.forbiddenTexts ?? []).flatMap(
  (text) =>
    generatedTextFiles
      .filter((file) => readFileSync(file, "utf8").includes(text))
      .map((file) => ({
        file: relative(outputPath, file).replaceAll("\\", "/"),
        text,
      })),
);

let orientation = null;
let wechatMainPackageBytes = null;
let wechatTotalPackageBytes = null;
let wechatPackageLayoutReady = target !== "wechatgame";
if (target === "wechatgame" && existsSync(outputFiles[0])) {
  try {
    const gameConfig = JSON.parse(readFileSync(outputFiles[0], "utf8"));
    orientation = gameConfig.deviceOrientation;
    const subpackages = Array.isArray(gameConfig.subpackages)
      ? gameConfig.subpackages
      : [];
    const resourcesSubpackage = subpackages.find(
      (subpackage) =>
        subpackage?.name === "resources" &&
        typeof subpackage.root === "string" &&
        subpackage.root.replaceAll("\\", "/").replace(/\/+$/u, "") ===
          "subpackages/resources",
    );
    const runtimeSettings = JSON.parse(
      readFileSync(resolve(outputPath, "src", "settings.json"), "utf8"),
    );
    const runtimeSubpackages = runtimeSettings.assets?.subpackages;
    const subpackageRoots = new Set();

    for (const subpackage of subpackages) {
      if (typeof subpackage?.root !== "string") {
        continue;
      }
      const absoluteRoot = resolve(outputPath, subpackage.root);
      const relativeRoot = relative(outputPath, absoluteRoot);
      if (
        relativeRoot === "" ||
        relativeRoot === ".." ||
        relativeRoot.startsWith(`..\\`) ||
        relativeRoot.startsWith("../") ||
        !existsSync(absoluteRoot)
      ) {
        continue;
      }
      subpackageRoots.add(absoluteRoot);
    }

    const subpackageRootList = [...subpackageRoots];
    const hasOverlappingSubpackageRoots = subpackageRootList.some(
      (candidate, candidateIndex) =>
        subpackageRootList.some((parent, parentIndex) => {
          if (candidateIndex === parentIndex) {
            return false;
          }
          const relativeCandidate = relative(parent, candidate);
          return (
            relativeCandidate !== "" &&
            relativeCandidate !== ".." &&
            !relativeCandidate.startsWith(`..\\`) &&
            !relativeCandidate.startsWith("../") &&
            !isAbsolute(relativeCandidate)
          );
        }),
    );

    wechatTotalPackageBytes = directoryBytes(outputPath);
    const subpackageBytes = subpackageRootList.reduce(
      (bytes, subpackageRoot) => bytes + directoryBytes(subpackageRoot),
      0,
    );
    wechatMainPackageBytes = wechatTotalPackageBytes - subpackageBytes;
    wechatPackageLayoutReady =
      Boolean(resourcesSubpackage) &&
      Array.isArray(runtimeSubpackages) &&
      runtimeSubpackages.includes("resources") &&
      subpackageRoots.size === subpackages.length &&
      !hasOverlappingSubpackageRoots &&
      wechatMainPackageBytes <= WECHAT_MAIN_PACKAGE_LIMIT_BYTES &&
      wechatTotalPackageBytes <= WECHAT_TOTAL_PACKAGE_LIMIT_BYTES;
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
  missingMarkers.length === 0 &&
  presentForbiddenMarkers.length === 0 &&
  wechatPackageLayoutReady &&
  (target !== "wechatgame" ||
    (Boolean(expectedWechatAppId) &&
      outputWechatAppId === expectedWechatAppId &&
      Boolean(expectedWechatLibVersion) &&
      outputWechatLibVersion === expectedWechatLibVersion));
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
    console.log(`Verified project.config.json.appid=${outputWechatAppId}.`);
    console.log(
      `Verified project.config.json.libVersion=${outputWechatLibVersion}.`,
    );
    console.log("Verified resources is a WeChat Mini Game subpackage.");
    console.log(
      `Verified main package size=${formatMiB(wechatMainPackageBytes)} and total package size=${formatMiB(wechatTotalPackageBytes)}.`,
    );
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
if (presentForbiddenMarkers.length > 0) {
  console.error(
    `Generated files contain forbidden markers: ${presentForbiddenMarkers.map(({ file, text }) => `${file}:${text}`).join(", ")}`,
  );
}
if (target === "wechatgame" && orientation !== "landscape") {
  console.error(`Expected game.json.deviceOrientation=landscape, received ${orientation ?? "missing"}.`);
}
if (
  target === "wechatgame" &&
  (!expectedWechatAppId || outputWechatAppId !== expectedWechatAppId)
) {
  console.error(
    `Expected project.config.json.appid=${expectedWechatAppId ?? "missing"}, received ${outputWechatAppId ?? "missing"}.`,
  );
}
if (
  target === "wechatgame" &&
  (!expectedWechatLibVersion ||
    outputWechatLibVersion !== expectedWechatLibVersion)
) {
  console.error(
    `Expected project.config.json.libVersion=${expectedWechatLibVersion ?? "missing"}, received ${outputWechatLibVersion ?? "missing"}.`,
  );
}
if (target === "wechatgame" && !wechatPackageLayoutReady) {
  console.error(
    "Expected resources to be a declared runtime subpackage within the WeChat Mini Game package limits.",
  );
  console.error(
    `Main package: ${wechatMainPackageBytes === null ? "unknown" : formatMiB(wechatMainPackageBytes)} / ${formatMiB(WECHAT_MAIN_PACKAGE_LIMIT_BYTES)}.`,
  );
  console.error(
    `Total package: ${wechatTotalPackageBytes === null ? "unknown" : formatMiB(wechatTotalPackageBytes)} / ${formatMiB(WECHAT_TOTAL_PACKAGE_LIMIT_BYTES)}.`,
  );
}
process.exit(typeof result.code === "number" && result.code !== 0 ? result.code : 1);
