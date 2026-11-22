import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { normalizePath } from "vite";

// Keep authored PNGs and asset registry keys intact. Resolve both JS imports
// and CSS urls to real WebP files before Vite hashes, inlines or emits them.
export function webpArt(root) {
  const art = path.join(root, "art/runtime");
  const cache = path.join(root, "node_modules/.cache/wizzard-webp");
  const jobs = new Map();

  async function encode(source) {
    const input = await readFile(source);
    const image = sharp(input);
    const { width, height } = await image.metadata();
    const large = width * height >= 1_000_000;
    const isScene = large && Math.max(width, height) / Math.min(width, height) >= 1.45;
    const isPortraitArt = large && normalizePath(path.relative(art, source)).startsWith("web-v3/avatars/");
    const options = isScene || isPortraitArt
      ? { quality: isScene ? 85 : 90, alphaQuality: 100, smartSubsample: true, effort: 5 }
      : { lossless: true, effort: 5 };
    const fingerprint = createHash("sha256").update(JSON.stringify([options, sharp.versions.webp, sharp.versions.vips])).update(input).digest("hex");
    const folder = path.join(cache, fingerprint);
    const output = path.join(folder, path.basename(source, ".png") + ".webp");
    try {
      await access(output);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(folder, { recursive: true });
      const temporary = path.join(folder, randomUUID() + ".tmp");
      await writeFile(temporary, await image.webp(options).toBuffer());
      await rename(temporary, output);
    }
    return normalizePath(output);
  }

  function convert(source) {
    if (!jobs.has(source)) jobs.set(source, encode(source));
    return jobs.get(source);
  }

  return {
    name: "wizzard-webp-art",
    apply: "build",
    buildStart() { jobs.clear(); },
    config() {
      return { resolve: { alias: [{
        find: /^(?:\.\.?\/)+art\/runtime\/(.+\.png)$/,
        replacement: normalizePath(art) + "/$1",
        customResolver(source) {
          this.addWatchFile(source);
          return convert(path.normalize(source));
        },
      }] } };
    },
    transformIndexHtml: {
      order: "pre",
      async handler() {
        // Both links are discoverable in the HTML. The browser fetches only
        // the orientation that matches the home <picture>.
        return Promise.all(["landscape", "portrait"].map(async orientation => {
          const source = path.join(art, "web-v3", orientation === "portrait" ? "portrait" : "", "home.png");
          const href = "/" + normalizePath(path.relative(root, await convert(source)));
          return { tag: "link", attrs: { rel: "preload", as: "image", type: "image/webp", media: `(orientation: ${orientation})`, fetchpriority: "high", href }, injectTo: "head-prepend" };
        }));
      },
    },
  };
}
