// Copies the compiled Quartal skin (dist/quartal.css of the docs repo's packages/skins, built by
// `pnpm skins:build` there) to public/skin/, with its fonts in public/skin/assets/. The skin's
// asset URLs are root-relative (/assets/...); they are made relative to the stylesheet so the site
// also works under a base path. Nothing else in the CSS is changed.
//
//   pnpm -C packages/web skin:sync                 # from ../docs/packages/skins/dist
//   SKINS_DIST=/path/to/skins/dist pnpm -C packages/web skin:sync
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const web = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(process.env.SKINS_DIST ?? join(web, "../../../docs/packages/skins/dist"));
const target = join(web, "public/skin");

const css = readFileSync(join(source, "quartal.css"), "utf8");
const assets = [...css.matchAll(/url\(\/assets\/([^?)"']+)/g)].map((m) => m[1]);

rmSync(target, { recursive: true, force: true });
mkdirSync(join(target, "assets"), { recursive: true });
writeFileSync(join(target, "quartal.css"), css.replaceAll("url(/assets/", "url(assets/"));
for (const file of new Set(assets)) copyFileSync(join(source, "assets", file), join(target, "assets", file));

console.log(`Copied quartal.css and ${new Set(assets).size} assets from ${source} to ${target}`);
if (!readdirSync(join(target, "assets")).length) console.warn("No assets referenced: check the skin build.");
