import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const PUBLIC = join(ROOT, "public");
const SRC = join(ROOT, "src");

async function listFiles(dir, base = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(join(dir, entry.name), rel)));
    } else {
      files.push(rel);
    }
  }
  return files;
}

async function rewriteImports(filePath, transform) {
  const original = await readFile(filePath, "utf8");
  const updated = transform(original);
  await writeFile(filePath, updated, "utf8");
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

await cp(PUBLIC, DIST, { recursive: true });
await cp(SRC, join(DIST, "src"), { recursive: true });

await rewriteImports(join(DIST, "index.html"), (text) =>
  text
    .replaceAll('href="/public/styles.css"', 'href="./styles.css"')
    .replaceAll('href="/public/theme.css"', 'href="./theme.css"')
    .replaceAll('src="/public/app.js"', 'src="./app.js"')
);

await rewriteImports(join(DIST, "app.js"), (text) =>
  text.replaceAll('from "/src/', 'from "./src/')
);

const srcFiles = await listFiles(join(DIST, "src"));

const leftovers = [];
for (const rel of ["index.html", "app.js", ...srcFiles.map((item) => `src/${item}`)]) {
  const text = await readFile(join(DIST, rel), "utf8");
  if (text.includes('"/src/') || text.includes('"/public/')) leftovers.push(rel);
}
if (leftovers.length > 0) {
  throw new Error(`仍有绝对路径引用: ${leftovers.join(", ")}`);
}

console.log(`dist ready: ${DIST}`);
