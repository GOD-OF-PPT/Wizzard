#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  collectRecords,
  readManifest,
} from "./sync-cocos-assets.mjs";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");
const SOURCE_COCOS_ROOT = path.join(REPOSITORY_ROOT, "cocos-client");
const SOURCE_GAME_ART_ROOT = path.join(
  SOURCE_COCOS_ROOT,
  "assets",
  "resources",
  "game-art",
);
const RUNTIME_ROOT = path.join(REPOSITORY_ROOT, "art", "runtime");
const TEMP_ROOT = path.join(REPOSITORY_ROOT, "tmp");
const REVIEW_OUTPUT_ROOT = path.join(
  SOURCE_COCOS_ROOT,
  "build",
  "wechatgame-patrol-review",
);
const MAIN_PACKAGE_LIMIT_BYTES = 4 * 1024 * 1024;
const TOTAL_PACKAGE_LIMIT_BYTES = 30 * 1024 * 1024;
const LEGACY_SHARE_BUILD_NAME = "share-card-v1.jpg";
const LEGACY_SHARE_USER_FILE_NAME = "wizzard-share-card-v1.jpg";
const LEGACY_HOME_SHARE_TITLE = "奇术茶馆：邀好友来一局";
const PATROL_PROJECT_DESCRIPTION =
  "漆环巡游非牌类玩法的人工类目调查制品；不可作为最终提交包。";
const PATROL_PROJECT_NAME = "漆环巡游-类目调查";
const PATROL_SHARE_TITLE = "漆环巡游：双环拾灵挑战";
const PATROL_SHARE_USER_FILE_NAME = "wizzard-share-card-patrol-v2.jpg";

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function assertExactGeneratedPath(target, parent, basename) {
  if (
    !isWithin(parent, target) ||
    path.dirname(target) !== parent ||
    path.basename(target) !== basename
  ) {
    throw new Error(`Unsafe generated path: ${target}`);
  }
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function directoryBytes(directory) {
  let bytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    bytes += entry.isDirectory()
      ? await directoryBytes(entryPath)
      : (await stat(entryPath)).size;
  }
  return bytes;
}

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

async function copySelectedGameArt(stagedGameArtRoot, records) {
  const copiedDirectoryMetas = new Set();

  for (const record of records) {
    const runtimeSource = path.resolve(REPOSITORY_ROOT, record.runtime);
    if (!isWithin(RUNTIME_ROOT, runtimeSource)) {
      throw new Error(`Review asset is outside art/runtime: ${record.runtime}`);
    }

    const relativeAsset = path.relative(RUNTIME_ROOT, runtimeSource);
    const sourceAsset = path.join(SOURCE_GAME_ART_ROOT, relativeAsset);
    const destinationAsset = path.join(stagedGameArtRoot, relativeAsset);
    if (!(await exists(sourceAsset)) || !(await exists(`${sourceAsset}.meta`))) {
      throw new Error(
        `Run npm run cocos:prepare before the review build; synchronized asset or meta is missing: ${relativeAsset}`,
      );
    }

    const relativeDirectory = path.dirname(relativeAsset);
    if (relativeDirectory !== ".") {
      const segments = relativeDirectory.split(path.sep);
      for (let index = 1; index <= segments.length; index += 1) {
        const directory = segments.slice(0, index).join(path.sep);
        const relativeMeta = `${directory}.meta`;
        if (copiedDirectoryMetas.has(relativeMeta)) {
          continue;
        }
        const sourceMeta = path.join(SOURCE_GAME_ART_ROOT, relativeMeta);
        if (!(await exists(sourceMeta))) {
          throw new Error(`Synchronized directory meta is missing: ${relativeMeta}`);
        }
        const destinationMeta = path.join(stagedGameArtRoot, relativeMeta);
        await mkdir(path.dirname(destinationMeta), { recursive: true });
        await copyFile(sourceMeta, destinationMeta);
        copiedDirectoryMetas.add(relativeMeta);
      }
    }

    await mkdir(path.dirname(destinationAsset), { recursive: true });
    await Promise.all([
      copyFile(sourceAsset, destinationAsset),
      copyFile(`${sourceAsset}.meta`, `${destinationAsset}.meta`),
    ]);
  }
}

async function runWechatBuild(stagedCocosRoot) {
  const child = spawn(
    process.execPath,
    [path.join(SCRIPT_DIRECTORY, "build-cocos.mjs"), "wechatgame"],
    {
      cwd: REPOSITORY_ROOT,
      env: {
        ...process.env,
        COCOS_PROJECT_DIRECTORY: stagedCocosRoot,
      },
      stdio: "inherit",
      windowsHide: true,
    },
  );
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  if (code !== 0) {
    throw new Error(`Patrol review Cocos build failed with exit code ${code}.`);
  }
}

async function patchStandaloneRuntime(outputRoot) {
  const gameScriptPath = path.join(outputRoot, "game.js");
  const source = await readFile(gameScriptPath, "utf8");
  const blockStart = source.indexOf(
    "if (globalThis.__WIZZARD_APP_RUNTIME_CONFIG__ === undefined) {",
  );
  const blockEndMarker = "\n\nfunction __initApp()";
  const blockEnd = source.indexOf(blockEndMarker, blockStart);
  if (blockStart < 0 || blockEnd < 0) {
    throw new Error("Could not locate the WeChat runtime config block.");
  }

  const reviewConfig = `if (globalThis.__WIZZARD_APP_RUNTIME_CONFIG__ === undefined) {
  // This review artifact intentionally exposes only the local non-card slice.
  globalThis.__WIZZARD_APP_RUNTIME_CONFIG__ = {
    friendRoom: null,
    startup: "patrol",
  };
}`;
  const patched = `${source.slice(0, blockStart)}${reviewConfig}${source.slice(blockEnd)}`;
  await writeFile(gameScriptPath, patched, "utf8");

  if (
    !patched.includes('friendRoom: null') ||
    !patched.includes('startup: "patrol"')
  ) {
    throw new Error("Standalone patrol runtime config was not written.");
  }

  const projectConfigPath = path.join(outputRoot, "project.config.json");
  const projectConfig = JSON.parse(
    await readFile(projectConfigPath, "utf8"),
  );
  projectConfig.description = PATROL_PROJECT_DESCRIPTION;
  projectConfig.projectname = PATROL_PROJECT_NAME;
  await writeFile(
    projectConfigPath,
    `${JSON.stringify(projectConfig, null, 2)}\n`,
    "utf8",
  );
}

async function hashFile(target) {
  return createHash("sha256")
    .update(await readFile(target))
    .digest("hex");
}

async function verifyCompiledReviewNavigation(outputRoot) {
  const compiledMainPath = path.join(
    outputRoot,
    "assets",
    "main",
    "index.js",
  );
  const compiledMain = await readFile(compiledMainPath, "utf8");
  const requiredMarkers = [
    "PatrolReviewHome",
    "PATROL_REVIEW_HOME_ASSETS_NOT_READY",
    "patrol-review-home",
    "returnPatrolReviewToHome",
    "开始巡游",
    "本巡",
  ];

  for (const marker of requiredMarkers) {
    if (!compiledMain.includes(marker)) {
      throw new Error(`Compiled patrol review navigation is missing: ${marker}`);
    }
  }
}

async function installPatrolShareImage(
  outputRoot,
  runtimeSource,
  buildName,
) {
  if (
    path.basename(buildName) !== buildName ||
    buildName !== "share-card-patrol-v2.jpg"
  ) {
    throw new Error(`Unexpected patrol share build path: ${buildName}`);
  }
  if (!isWithin(RUNTIME_ROOT, runtimeSource) || !(await exists(runtimeSource))) {
    throw new Error(`Patrol share image is missing: ${runtimeSource}`);
  }

  const compiledPlatformPath = path.join(
    outputRoot,
    "assets",
    "main",
    "index.js",
  );
  let compiledPlatform = await readFile(compiledPlatformPath, "utf8");
  for (const legacyMarker of [
    LEGACY_SHARE_BUILD_NAME,
    LEGACY_SHARE_USER_FILE_NAME,
    LEGACY_HOME_SHARE_TITLE,
  ]) {
    if (!compiledPlatform.includes(legacyMarker)) {
      throw new Error(
        `Compiled platform share marker is missing: ${legacyMarker}`,
      );
    }
  }
  compiledPlatform = compiledPlatform
    .replaceAll(LEGACY_SHARE_USER_FILE_NAME, PATROL_SHARE_USER_FILE_NAME)
    .replaceAll(LEGACY_SHARE_BUILD_NAME, buildName)
    .replaceAll(LEGACY_HOME_SHARE_TITLE, PATROL_SHARE_TITLE);
  if (
    compiledPlatform.includes(LEGACY_SHARE_BUILD_NAME) ||
    compiledPlatform.includes(LEGACY_SHARE_USER_FILE_NAME) ||
    compiledPlatform.includes(LEGACY_HOME_SHARE_TITLE)
  ) {
    throw new Error("Legacy share image markers survived review patching.");
  }
  await writeFile(compiledPlatformPath, compiledPlatform, "utf8");

  const patrolDestination = path.join(outputRoot, buildName);
  const legacyDestination = path.join(outputRoot, LEGACY_SHARE_BUILD_NAME);
  if (
    !isWithin(outputRoot, patrolDestination) ||
    !isWithin(outputRoot, legacyDestination)
  ) {
    throw new Error("Unsafe review share destination.");
  }
  await copyFile(runtimeSource, patrolDestination);
  if (await exists(legacyDestination)) {
    await rm(legacyDestination, { force: true });
  }
  if (!(await exists(patrolDestination))) {
    throw new Error("Patrol share image was not copied into the review package.");
  }

  return {
    buildPath: buildName,
    bytes: (await stat(patrolDestination)).size,
    sha256: await hashFile(patrolDestination),
    title: PATROL_SHARE_TITLE,
    userFileName: PATROL_SHARE_USER_FILE_NAME,
  };
}

async function measureWechatPackages(outputRoot) {
  const gameConfig = JSON.parse(
    await readFile(path.join(outputRoot, "game.json"), "utf8"),
  );
  const subpackageRoots = (gameConfig.subpackages ?? []).map((subpackage) =>
    path.resolve(outputRoot, subpackage.root),
  );
  for (const subpackageRoot of subpackageRoots) {
    if (!isWithin(outputRoot, subpackageRoot) || !(await exists(subpackageRoot))) {
      throw new Error(`Invalid review subpackage root: ${subpackageRoot}`);
    }
  }
  const totalBytes = await directoryBytes(outputRoot);
  const subpackageBytes = (
    await Promise.all(subpackageRoots.map(directoryBytes))
  ).reduce((total, bytes) => total + bytes, 0);
  return {
    mainBytes: totalBytes - subpackageBytes,
    totalBytes,
  };
}

async function writeStableReviewReport(outputRoot, report) {
  const reportPath = path.join(outputRoot, "patrol-review-build.json");
  let packageSizes = await measureWechatPackages(outputRoot);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    await writeFile(
      reportPath,
      `${JSON.stringify(
        {
          ...report,
          mainPackageBytes: packageSizes.mainBytes,
          totalPackageBytes: packageSizes.totalBytes,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    const measured = await measureWechatPackages(outputRoot);
    if (
      measured.mainBytes === packageSizes.mainBytes &&
      measured.totalBytes === packageSizes.totalBytes
    ) {
      return measured;
    }
    packageSizes = measured;
  }

  throw new Error("Review package report size did not converge.");
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.length === 1 && args[0] === "--dry-run";
  if (args.length > 0 && !dryRun) {
    throw new Error("Usage: node tools/build-patrol-review.mjs [--dry-run]");
  }

  const manifest = await readManifest();
  const reviewKeys = manifest.patrol?.reviewAssetKeys;
  if (!Array.isArray(reviewKeys) || reviewKeys.length === 0) {
    throw new Error("art/asset-manifest.json has no patrol.reviewAssetKeys.");
  }
  const recordByKey = new Map(
    collectRecords(manifest).map((record) => [record.semanticKey, record]),
  );
  const records = reviewKeys.map((key) => {
    const record = recordByKey.get(key);
    if (!record) {
      throw new Error(`Unknown patrol review asset key: ${key}`);
    }
    return record;
  });
  const imageCount = records.filter(
    (record) => record.kind === "spriteFrame",
  ).length;
  const fontCount = records.filter((record) => record.kind === "font").length;
  if (imageCount !== 17 || fontCount !== 2) {
    throw new Error(
      `Patrol review inventory drifted: expected 17 images + 2 fonts, got ${imageCount} images + ${fontCount} fonts.`,
    );
  }
  const sourceAssetBytes = (
    await Promise.all(
      records.map(async (record) =>
        (await stat(path.resolve(REPOSITORY_ROOT, record.runtime))).size,
      ),
    )
  ).reduce((total, bytes) => total + bytes, 0);
  const shareRecord = manifest.social?.patrolShareCardV2;
  if (
    !shareRecord ||
    typeof shareRecord.runtime !== "string" ||
    typeof shareRecord.buildPath !== "string"
  ) {
    throw new Error(
      "art/asset-manifest.json has no social.patrolShareCardV2 contract.",
    );
  }
  const shareRuntimeSource = path.resolve(
    REPOSITORY_ROOT,
    shareRecord.runtime,
  );
  if (!isWithin(RUNTIME_ROOT, shareRuntimeSource)) {
    throw new Error(
      `Patrol share image is outside art/runtime: ${shareRecord.runtime}`,
    );
  }
  if (!(await exists(shareRuntimeSource))) {
    throw new Error(`Patrol share image is missing: ${shareRecord.runtime}`);
  }
  const shareRuntimeHash = (await hashFile(shareRuntimeSource)).toUpperCase();
  if (
    typeof shareRecord.runtimeSha256 !== "string" ||
    shareRuntimeHash !== shareRecord.runtimeSha256.toUpperCase()
  ) {
    throw new Error(
      `Patrol share image hash drifted: ${shareRecord.runtime}`,
    );
  }

  if (dryRun) {
    process.stdout.write(
      `Validated patrol review inventory: ${imageCount} images + ${fontCount} fonts (${sourceAssetBytes.toLocaleString("en-US")} bytes).\n`,
    );
    return;
  }

  await mkdir(TEMP_ROOT, { recursive: true });
  const stagingRoot = await mkdtemp(
    path.join(TEMP_ROOT, "patrol-review-"),
  );
  if (!isWithin(TEMP_ROOT, stagingRoot)) {
    throw new Error(`Unsafe staging root: ${stagingRoot}`);
  }
  const stagedCocosRoot = path.join(stagingRoot, "cocos-client");
  const stagedGameArtRoot = path.join(
    stagedCocosRoot,
    "assets",
    "resources",
    "game-art",
  );

  try {
    await cp(SOURCE_COCOS_ROOT, stagedCocosRoot, {
      filter: (source) => {
        const relative = path.relative(SOURCE_COCOS_ROOT, source);
        if (relative === "") {
          return true;
        }
        const firstSegment = relative.split(path.sep)[0];
        if (
          new Set(["build", "library", "node_modules", "temp", "test"]).has(
            firstSegment,
          )
        ) {
          return false;
        }
        const gameArtRelative = path.join(
          "assets",
          "resources",
          "game-art",
        );
        return !(
          relative === gameArtRelative ||
          relative.startsWith(`${gameArtRelative}${path.sep}`)
        );
      },
      recursive: true,
    });
    await mkdir(stagedGameArtRoot, { recursive: true });
    await copySelectedGameArt(stagedGameArtRoot, records);

    await runWechatBuild(stagedCocosRoot);
    const stagedOutputRoot = path.join(
      stagedCocosRoot,
      "build",
      "wechatgame",
    );
    await patchStandaloneRuntime(stagedOutputRoot);
    const shareImage = await installPatrolShareImage(
      stagedOutputRoot,
      shareRuntimeSource,
      shareRecord.buildPath,
    );
    await verifyCompiledReviewNavigation(stagedOutputRoot);
    const packageSizes = await writeStableReviewReport(stagedOutputRoot, {
      assetKeys: reviewKeys,
      friendRoom: null,
      generatedAt: new Date().toISOString(),
      legacyCodePathsIncluded: true,
      legacyRuntimeAssetsIncluded: false,
      legacyShareImageIncluded: false,
      purpose: "manual-category-investigation-artifact",
      projectName: PATROL_PROJECT_NAME,
      shareImage,
      sourceAssetBytes,
      startup: "patrol",
      submissionReady: false,
    });
    if (
      packageSizes.mainBytes > MAIN_PACKAGE_LIMIT_BYTES ||
      packageSizes.totalBytes > TOTAL_PACKAGE_LIMIT_BYTES
    ) {
      throw new Error(
        `Review package exceeds limits: main ${formatMiB(packageSizes.mainBytes)}, total ${formatMiB(packageSizes.totalBytes)}.`,
      );
    }

    const buildRoot = path.dirname(REVIEW_OUTPUT_ROOT);
    assertExactGeneratedPath(
      REVIEW_OUTPUT_ROOT,
      buildRoot,
      "wechatgame-patrol-review",
    );
    if (await exists(REVIEW_OUTPUT_ROOT)) {
      await rm(REVIEW_OUTPUT_ROOT, {
        force: true,
        maxRetries: 6,
        recursive: true,
        retryDelay: 350,
      });
    }
    await mkdir(buildRoot, { recursive: true });
    await rename(stagedOutputRoot, REVIEW_OUTPUT_ROOT);

    process.stdout.write(
      `Patrol review Mini Game built at ${REVIEW_OUTPUT_ROOT}.\n`,
    );
    process.stdout.write(
      `Verified main package ${formatMiB(packageSizes.mainBytes)} and total package ${formatMiB(packageSizes.totalBytes)}.\n`,
    );
  } finally {
    if (await exists(stagingRoot)) {
      await rm(stagingRoot, {
        force: true,
        maxRetries: 6,
        recursive: true,
        retryDelay: 350,
      });
    }
  }
}

main().catch((error) => {
  process.stderr.write(`build-patrol-review: ${error.message}\n`);
  process.exitCode = 1;
});
