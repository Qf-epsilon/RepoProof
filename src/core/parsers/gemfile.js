import { normalizePackageName } from "./util.js";

export function parseGemfile(text) {
  const lines = text.split(/\r?\n/);
  const dependencies = [];

  lines.forEach((original, index) => {
    const line = original.trim();
    if (!line || line.startsWith("#")) return;

    const match = line.match(/^gem\s+['"]([^'"]+)['"]\s*(.*)$/);
    if (!match) return;

    dependencies.push({
      name: match[1],
      normalized: normalizePackageName(match[1]),
      version: match[2].replace(/,\s*/, "").trim(),
      group: "gem",
      groupLabel: "Gemfile gem",
      line: index + 1,
      snippet: line,
    });
  });

  return {
    ok: true,
    format: "Gemfile",
    dependencies,
    unsupported: [],
    note: "只识别顶层与块内的 gem 声明，不解析 group/条件语义。",
  };
}
