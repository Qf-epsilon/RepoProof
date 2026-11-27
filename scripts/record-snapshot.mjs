import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { CASES } from "./cases.config.mjs";
import { constName, fetchSnapshot } from "./lib/record.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const CASES_DIR = join(ROOT, "src", "data", "cases");

await mkdir(CASES_DIR, { recursive: true });

const recorded = [];
for (const entry of CASES) {
  process.stdout.write(`recording ${entry.repo} ... `);
  const { snapshot, report } = await fetchSnapshot(entry);
  const file = join(CASES_DIR, `${entry.slug}.js`);
  const body = [
    `// 由 scripts/record-snapshot.mjs 生成，请勿手改。`,
    `// 来源：${entry.repo} @ ${snapshot.meta.commit}`,
    `// 快照日期：${snapshot.meta.snapshotDate}`,
    `export const ${constName(entry.slug)} = ${JSON.stringify(snapshot, null, 2)};`,
    "",
  ].join("\n");
  await writeFile(file, body, "utf8");
  recorded.push(entry);
  console.log(
    JSON.stringify(report.summary) +
      ` files=${snapshot.tree.entries.filter((item) => item.type === "blob").length}` +
      ` raw=${Object.keys(snapshot.raw).length}`
  );
}

const imports = recorded
  .map((entry) => `import { ${constName(entry.slug)} } from "./${entry.slug}.js";`)
  .join("\n");
const items = recorded.map((entry) => `  ${constName(entry.slug)},`).join("\n");
await writeFile(
  join(CASES_DIR, "index.js"),
  [
    "// 由 scripts/record-snapshot.mjs 生成，请勿手改。",
    imports,
    "",
    "export const CASES = [",
    items,
    "];",
    "",
  ].join("\n"),
  "utf8"
);

console.log(`cases ready: ${recorded.map((entry) => entry.slug).join(", ")}`);