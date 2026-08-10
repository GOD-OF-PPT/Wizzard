#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..");
const MANIFEST_PATH = path.join(REPOSITORY_ROOT, "art", "asset-manifest.json");
const RUNTIME_ROOT = path.join(REPOSITORY_ROOT, "art", "runtime");
const PLATFORM_SUBMISSION_ROOT = path.join(RUNTIME_ROOT, "branding");
const GENERATED_DIRECTORY = "_generated";
const GENERATED_TYPESCRIPT = "AssetAddresses.generated.ts";
const SYNC_REPORT = "asset-sync-report.md";
const EXPECTED_FULL_COUNTS = Object.freeze({ spriteFrame: 78, font: 2 });
const EXPECTED_CORE_COUNTS = Object.freeze({ spriteFrame: 48, font: 2 });

function printUsage() {
  process.stdout.write(`Usage:
  node tools/sync-cocos-assets.mjs <resource-directory> [options]

The resource directory should normally be:
  <cocos-project>/assets/resources/game-art

Options:
  --target <directory>         Alternative to the positional resource directory.
  --generated-ts <file>        Write the generated TypeScript to an explicit path.
  --core-only                  Copy the first implementation slice only.
  --dry-run                    Validate and print the plan without writing.
  --resource-prefix <prefix>   Override the Cocos resources.load prefix.
  --help                       Show this help.

Examples:
  node tools/sync-cocos-assets.mjs cocos-client/assets/resources/game-art --dry-run
  node tools/sync-cocos-assets.mjs --target cocos-client/assets/resources/game-art --generated-ts cocos-client/assets/scripts/assets/AssetAddresses.generated.ts --core-only
`);
}

function parseArguments(argv) {
  const options = {
    coreOnly: false,
    dryRun: false,
    generatedTs: undefined,
    resourcePrefix: undefined,
    target: undefined,
  };

  const assignTarget = (value) => {
    if (!value || value.startsWith("--")) {
      throw new Error("--target requires a value.");
    }
    if (options.target) {
      throw new Error("Only one resource directory may be provided.");
    }
    options.target = value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      printUsage();
      process.exit(0);
    }

    if (argument === "--core-only") {
      options.coreOnly = true;
      continue;
    }

    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (argument === "--target") {
      assignTarget(argv[index + 1]);
      index += 1;
      continue;
    }

    if (argument.startsWith("--target=")) {
      assignTarget(argument.slice("--target=".length));
      continue;
    }

    if (argument === "--generated-ts") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--generated-ts requires a value.");
      }
      options.generatedTs = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--generated-ts=")) {
      const value = argument.slice("--generated-ts=".length);
      if (!value) {
        throw new Error("--generated-ts requires a value.");
      }
      options.generatedTs = value;
      continue;
    }

    if (argument === "--resource-prefix") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--resource-prefix requires a value.");
      }
      options.resourcePrefix = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--resource-prefix=")) {
      options.resourcePrefix = argument.slice("--resource-prefix=".length);
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    }

    assignTarget(argument);
  }

  if (!options.target) {
    throw new Error("A target Cocos resource directory is required.");
  }

  return options;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function normalizeResourcePrefix(value) {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.includes("..")) {
    throw new Error(`Invalid resource prefix: ${value}`);
  }
  return normalized;
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function assertSafeTarget(targetDirectory) {
  const root = path.parse(targetDirectory).root;
  if (targetDirectory === root) {
    throw new Error("Refusing to use a drive root as the target directory.");
  }
  if (
    isWithin(RUNTIME_ROOT, targetDirectory) ||
    isWithin(targetDirectory, RUNTIME_ROOT)
  ) {
    throw new Error("Target directory must not overlap art/runtime.");
  }
}

function assertSafeGeneratedTypeScript(generatedTypeScript) {
  if (path.extname(generatedTypeScript).toLowerCase() !== ".ts") {
    throw new Error("--generated-ts must point to a .ts file.");
  }
  if (isWithin(RUNTIME_ROOT, generatedTypeScript)) {
    throw new Error(
      "Generated TypeScript must not be written inside art/runtime.",
    );
  }
}

async function readManifest() {
  const source = await readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(source);
}

function createRecord(semanticKey, runtime, kind, tier) {
  if (!semanticKey || !runtime) {
    throw new Error(
      "Every synchronized asset needs a semantic key and runtime path.",
    );
  }
  return { semanticKey, runtime, kind, tier };
}

function collectRecords(manifest) {
  const records = [];

  for (const background of Object.values(manifest.backgrounds)) {
    records.push(
      createRecord(
        background.semanticKey,
        background.runtime,
        "spriteFrame",
        "core",
      ),
    );
  }

  for (const card of Object.values(manifest.cards.items)) {
    records.push(
      createRecord(card.semanticKey, card.runtime, "spriteFrame", "core"),
    );
  }

  for (const character of Object.values(manifest.avatars.characters)) {
    for (const expression of manifest.avatars.expressions) {
      records.push(
        createRecord(
          `${character.semanticKey}.${expression}`,
          character.runtime[expression],
          "spriteFrame",
          expression === "normal" ? "core" : "full",
        ),
      );
    }
  }

  records.push(
    createRecord(
      manifest.tutorial.ruleHint.semanticKey,
      manifest.tutorial.ruleHint.runtime,
      "spriteFrame",
      "core",
    ),
  );

  for (const gesture of Object.values(manifest.tutorial.gestures)) {
    if (!gesture.semanticKey || !gesture.runtimeFrames) {
      continue;
    }
    gesture.runtimeFrames.forEach((runtime, index) => {
      const frame = String(index + 1).padStart(2, "0");
      records.push(
        createRecord(
          `${gesture.semanticKey}.frame${frame}`,
          runtime,
          "spriteFrame",
          "full",
        ),
      );
    });
  }

  for (const [name, runtime] of Object.entries(manifest.ui.components)) {
    records.push(
      createRecord(
        manifest.ui.semanticKeys[name],
        runtime,
        "spriteFrame",
        "core",
      ),
    );
  }

  for (const [name, runtime] of Object.entries(manifest.ui.effects)) {
    records.push(
      createRecord(
        manifest.ui.effectSemanticKeys[name],
        runtime,
        "spriteFrame",
        "core",
      ),
    );
  }

  for (const font of Object.values(manifest.fonts)) {
    records.push(createRecord(font.semanticKey, font.runtime, "font", "core"));
  }

  return records.sort((left, right) =>
    left.semanticKey.localeCompare(right.semanticKey, "en"),
  );
}

function assertUniqueRecords(records) {
  const keys = new Map();
  const sources = new Map();

  for (const record of records) {
    if (keys.has(record.semanticKey)) {
      throw new Error(
        `Duplicate semantic key ${record.semanticKey}: ${keys.get(record.semanticKey)} and ${record.runtime}`,
      );
    }
    keys.set(record.semanticKey, record.runtime);

    if (sources.has(record.runtime)) {
      throw new Error(
        `Runtime file ${record.runtime} is mapped by both ${sources.get(record.runtime)} and ${record.semanticKey}`,
      );
    }
    sources.set(record.runtime, record.semanticKey);
  }
}

function countByKind(records) {
  return records.reduce(
    (counts, record) => {
      counts[record.kind] += 1;
      return counts;
    },
    { spriteFrame: 0, font: 0 },
  );
}

function assertCounts(records, expected, label) {
  const actual = countByKind(records);
  if (
    actual.spriteFrame !== expected.spriteFrame ||
    actual.font !== expected.font
  ) {
    throw new Error(
      `${label} asset count drifted: expected ${expected.spriteFrame} PNG + ${expected.font} fonts, got ${actual.spriteFrame} PNG + ${actual.font} fonts.`,
    );
  }
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolute)));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files;
}

async function sha256(filePath) {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

async function validateIgnoredPngs(manifest, records) {
  const referenced = new Set(
    records
      .filter((record) => record.kind === "spriteFrame")
      .map((record) =>
        toPosix(
          path.relative(
            REPOSITORY_ROOT,
            path.resolve(REPOSITORY_ROOT, record.runtime),
          ),
        ),
      ),
  );
  const allRuntimePngs = (await walkFiles(RUNTIME_ROOT))
    .filter((file) => path.extname(file).toLowerCase() === ".png")
    .map((file) => toPosix(path.relative(REPOSITORY_ROOT, file)))
    .sort();

  const avatarDirectory = path.join(RUNTIME_ROOT, "avatars");
  const topLevelAvatarFiles = (
    await readdir(avatarDirectory, { withFileTypes: true })
  )
    .filter(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === ".png",
    )
    .map((entry) => toPosix(path.join("art", "runtime", "avatars", entry.name)))
    .sort();

  if (topLevelAvatarFiles.length !== 6) {
    throw new Error(
      `Expected 6 duplicate top-level avatar PNGs, found ${topLevelAvatarFiles.length}.`,
    );
  }

  for (const duplicate of topLevelAvatarFiles) {
    const basename = path.posix.basename(duplicate, ".png");
    const normal = `art/runtime/avatars/${basename}/normal.png`;
    const [duplicateHash, normalHash] = await Promise.all([
      sha256(path.resolve(REPOSITORY_ROOT, duplicate)),
      sha256(path.resolve(REPOSITORY_ROOT, normal)),
    ]);
    if (duplicateHash !== normalHash) {
      throw new Error(
        `${duplicate} is no longer identical to ${normal}; review the exclusion.`,
      );
    }
  }

  const unslicedSheets = [manifest.ui.chromeAtlas, manifest.ui.feedbackFxAtlas]
    .map((runtime) => toPosix(runtime))
    .sort();
  const platformSubmissionFiles = (await readdir(PLATFORM_SUBMISSION_ROOT, {
    withFileTypes: true,
  }).catch((error) => {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }))
    .filter(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === ".png",
    )
    .map((entry) =>
      toPosix(path.join("art", "runtime", "branding", entry.name)),
    )
    .sort();
  const reportedIgnored = [...topLevelAvatarFiles, ...unslicedSheets].sort();
  const ignored = [...reportedIgnored, ...platformSubmissionFiles].sort();
  const ignoredSet = new Set(ignored);
  const unreferenced = allRuntimePngs.filter(
    (runtime) => !referenced.has(runtime),
  );
  const unexpected = unreferenced.filter((runtime) => !ignoredSet.has(runtime));
  const missingIgnored = ignored.filter(
    (runtime) => !allRuntimePngs.includes(runtime),
  );

  if (unexpected.length > 0 || missingIgnored.length > 0) {
    throw new Error(
      [
        unexpected.length > 0
          ? `Unexpected unreferenced runtime PNGs: ${unexpected.join(", ")}`
          : undefined,
        missingIgnored.length > 0
          ? `Expected ignored PNGs are missing: ${missingIgnored.join(", ")}`
          : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const expectedRuntimePngs = 86 + platformSubmissionFiles.length;
  const expectedIgnoredPngs = 8 + platformSubmissionFiles.length;
  if (
    allRuntimePngs.length !== expectedRuntimePngs ||
    ignored.length !== expectedIgnoredPngs
  ) {
    throw new Error(
      `Runtime PNG inventory drifted: expected ${expectedRuntimePngs} total / ${expectedIgnoredPngs} ignored, got ${allRuntimePngs.length} total / ${ignored.length} ignored.`,
    );
  }

  return reportedIgnored;
}

async function enrichRecord(record, targetDirectory, resourcePrefix) {
  const source = path.resolve(REPOSITORY_ROOT, record.runtime);
  if (!isWithin(RUNTIME_ROOT, source)) {
    throw new Error(`${record.runtime} is outside art/runtime.`);
  }

  const info = await stat(source);
  if (!info.isFile()) {
    throw new Error(`${record.runtime} is not a regular file.`);
  }

  const extension = path.extname(source).toLowerCase();
  const validExtensions =
    record.kind === "font"
      ? new Set([".ttf"])
      : new Set([".jpg", ".jpeg", ".png"]);
  if (!validExtensions.has(extension)) {
    throw new Error(
      `${record.semanticKey} must point to ${record.kind === "font" ? "a .ttf" : "a .png, .jpg, or .jpeg"} file.`,
    );
  }

  const runtimeRelative = path.relative(RUNTIME_ROOT, source);
  const destination = path.join(targetDirectory, runtimeRelative);
  const withoutExtension = toPosix(
    runtimeRelative.slice(0, -path.extname(runtimeRelative).length),
  );
  // Synced PNGs are imported by Creator as Texture2D assets by default. The
  // runtime registry wraps each texture in a SpriteFrame so the pipeline does
  // not depend on hand-edited per-file .meta importer settings.
  const suffix = record.kind === "spriteFrame" ? "/texture" : "";

  return {
    ...record,
    source,
    destination,
    bytes: info.size,
    sha256: await sha256(source),
    resourcePath: `${resourcePrefix}/${withoutExtension}${suffix}`,
  };
}

function renderTypeScript(records, manifestVersion, mode) {
  const union = records
    .map((record) => `  | ${JSON.stringify(record.semanticKey)}`)
    .join("\n");
  const keys = records
    .map((record) => `  ${JSON.stringify(record.semanticKey)},`)
    .join("\n");
  const addresses = records
    .map(
      (record) =>
        `  ${JSON.stringify(record.semanticKey)}: { kind: ${JSON.stringify(record.kind)}, resourcePath: ${JSON.stringify(record.resourcePath)} },`,
    )
    .join("\n");

  return `// Generated by tools/sync-cocos-assets.mjs from art/asset-manifest.json v${manifestVersion}.
// Mode: ${mode}. Do not edit this file by hand.

export type AssetKey =
${union};

export type AssetAddress = Readonly<{
  kind: "spriteFrame" | "font";
  resourcePath: string;
}>;

export const ASSET_KEYS: readonly AssetKey[] = [
${keys}
];

export const ASSET_ADDRESSES: Record<AssetKey, AssetAddress> = {
${addresses}
};
`;
}

function renderReport({
  manifest,
  mode,
  resourcePrefix,
  selected,
  omitted,
  ignored,
  generatedTypeScript,
  targetDirectory,
}) {
  const counts = countByKind(selected);
  const bytes = selected.reduce((total, record) => total + record.bytes, 0);
  const rows = selected
    .map(
      (record) =>
        `| \`${record.semanticKey}\` | ${record.kind} | \`${record.runtime}\` | \`${record.resourcePath}\` | ${record.bytes.toLocaleString("en-US")} | \`${record.sha256}\` |`,
    )
    .join("\n");
  const omittedRows = omitted.length
    ? omitted
        .map(
          (record) =>
            `| \`${record.semanticKey}\` | ${record.kind} | \`${record.runtime}\` |`,
        )
        .join("\n")
    : "| — | — | Full sync selected every manifest asset. |";
  const ignoredRows = ignored
    .map((runtime) => {
      const reason = runtime.startsWith("art/runtime/avatars/")
        ? "Duplicate of the character's nested `normal.png`."
        : "Unsliced sheet; synchronized UI/FX components are used instead.";
      return `| \`${runtime}\` | ${reason} |`;
    })
    .join("\n");

  const generatedTypeScriptFromTarget = toPosix(
    path.relative(targetDirectory, generatedTypeScript),
  );

  return `# Cocos art asset sync report

Generated by \`tools/sync-cocos-assets.mjs\`. Do not edit by hand.

- Manifest: \`art/asset-manifest.json\` v${manifest.version}
- Mode: **${mode}**
- Cocos resource prefix: \`${resourcePrefix}\`
- Selected: **${counts.spriteFrame} image SpriteFrames + ${counts.font} fonts** (${bytes.toLocaleString("en-US")} bytes before Cocos import/compression)
- Generated TypeScript: \`${generatedTypeScriptFromTarget}\`
- This command copies or overwrites selected files but never deletes stale files from the target.

## Synchronized assets

| Semantic key | Kind | Manifest source | Cocos \`resources.load\` path | Bytes | SHA-256 |
| --- | --- | --- | --- | ---: | --- |
${rows}

## Manifest assets omitted by this mode

| Semantic key | Kind | Manifest source |
| --- | --- | --- |
${omittedRows}

## Deliberately excluded runtime PNGs

Exactly 78 non-duplicate runtime PNGs are represented by semantic keys. Duplicate source sheets and any platform-submission artwork under \`art/runtime/branding/\` are intentionally never synchronized:

| Runtime file | Reason |
| --- | --- |
${ignoredRows}
`;
}

async function writeOutputs(
  targetDirectory,
  generatedTypeScript,
  records,
  typeScript,
  report,
) {
  await Promise.all(
    records.map(async (record) => {
      await mkdir(path.dirname(record.destination), { recursive: true });
      await copyFile(record.source, record.destination);
    }),
  );

  const reportDirectory = path.join(targetDirectory, GENERATED_DIRECTORY);
  await Promise.all([
    mkdir(path.dirname(generatedTypeScript), { recursive: true }),
    mkdir(reportDirectory, { recursive: true }),
  ]);
  await Promise.all([
    writeFile(generatedTypeScript, typeScript, "utf8"),
    writeFile(path.join(reportDirectory, SYNC_REPORT), report, "utf8"),
  ]);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const targetDirectory = path.resolve(process.cwd(), options.target);
  assertSafeTarget(targetDirectory);
  const generatedTypeScript = path.resolve(
    process.cwd(),
    options.generatedTs ??
      path.join(targetDirectory, GENERATED_DIRECTORY, GENERATED_TYPESCRIPT),
  );
  assertSafeGeneratedTypeScript(generatedTypeScript);

  const defaultPrefix = path.basename(targetDirectory);
  const resourcePrefix = normalizeResourcePrefix(
    options.resourcePrefix ?? defaultPrefix,
  );
  const manifest = await readManifest();
  const allRecords = collectRecords(manifest);
  assertUniqueRecords(allRecords);
  assertCounts(allRecords, EXPECTED_FULL_COUNTS, "Full");

  const coreRecords = allRecords.filter((record) => record.tier === "core");
  assertCounts(coreRecords, EXPECTED_CORE_COUNTS, "Core-only");
  const ignored = await validateIgnoredPngs(manifest, allRecords);

  const selectedBase = options.coreOnly ? coreRecords : allRecords;
  const selectedKeys = new Set(
    selectedBase.map((record) => record.semanticKey),
  );
  const omitted = allRecords.filter(
    (record) => !selectedKeys.has(record.semanticKey),
  );
  const selected = await Promise.all(
    selectedBase.map((record) =>
      enrichRecord(record, targetDirectory, resourcePrefix),
    ),
  );
  selected.sort((left, right) =>
    left.semanticKey.localeCompare(right.semanticKey, "en"),
  );

  const mode = options.coreOnly ? "core-only" : "full";
  const typeScript = renderTypeScript(selected, manifest.version, mode);
  const report = renderReport({
    manifest,
    mode,
    resourcePrefix,
    selected,
    omitted,
    ignored,
    generatedTypeScript,
    targetDirectory,
  });

  if (!options.dryRun) {
    await writeOutputs(
      targetDirectory,
      generatedTypeScript,
      selected,
      typeScript,
      report,
    );
  }

  const counts = countByKind(selected);
  const action = options.dryRun ? "Validated" : "Synchronized";
  process.stdout.write(
    `${action} ${counts.spriteFrame} image SpriteFrames + ${counts.font} fonts (${mode}) for ${resourcePrefix}.\n`,
  );
  process.stdout.write(
    `${options.dryRun ? "Would write" : "Generated"} ${toPosix(generatedTypeScript)}.\n`,
  );
  process.stdout.write(
    `${options.dryRun ? "Would write" : "Generated"} ${toPosix(path.join(targetDirectory, GENERATED_DIRECTORY, SYNC_REPORT))}.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`sync-cocos-assets: ${error.message}\n`);
  process.exitCode = 1;
});
