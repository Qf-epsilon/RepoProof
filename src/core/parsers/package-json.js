import { findLineNumber, lineSnippet, normalizePackageName } from "./util.js";

const GROUPS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const GROUP_LABELS = {
  dependencies: "生产依赖",
  devDependencies: "开发依赖",
  peerDependencies: "对等依赖",
  optionalDependencies: "可选依赖",
};

export function parsePackageJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      format: "package.json",
      error: `JSON 解析失败：${error.message}`,
    };
  }

  const lines = text.split(/\r?\n/);
  const dependencies = [];

  for (const group of GROUPS) {
    const block = data[group];
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;

    const groupLine = findLineNumber(text, `"${group}"`);
    for (const [name, range] of Object.entries(block)) {
      const line = findLineNumber(text, `"${name}"`, groupLine || 1);
      dependencies.push({
        name,
        normalized: normalizePackageName(name),
        version: String(range),
        group,
        groupLabel: GROUP_LABELS[group],
        line,
        snippet: line ? lineSnippet(text, line) : lines[0] || "",
      });
    }
  }

  return {
    ok: true,
    format: "package.json",
    dependencies,
    unsupported: [],
  };
}
