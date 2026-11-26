import { normalizePackageName, stripInlineComment } from "./util.js";

const NAME_RE = /^([A-Za-z0-9][A-Za-z0-9._-]*)(\[[^\]]*\])?\s*(.*)$/;

export function parseRequirements(text) {
  const lines = text.split(/\r?\n/);
  const dependencies = [];
  const unsupported = [];

  lines.forEach((original, index) => {
    const raw = original.trim();
    if (!raw || raw.startsWith("#")) return;

    if (raw.startsWith("-") || /^(git\+|https?:\/\/|file:)/i.test(raw)) {
      unsupported.push({
        line: index + 1,
        raw,
        reason: "可编辑安装、远程地址或选项行不在 MVP 解析范围内",
      });
      return;
    }

    let line = stripInlineComment(raw);
    if (!line) return;

    if (line.includes(" @ ")) {
      unsupported.push({
        line: index + 1,
        raw,
        reason: "PEP 508 直接引用（name @ url）不在 MVP 解析范围内",
      });
      return;
    }

    let marker = "";
    const markerIndex = line.indexOf(";");
    if (markerIndex >= 0) {
      marker = line.slice(markerIndex + 1).trim();
      line = line.slice(0, markerIndex).trim();
    }

    const match = line.match(NAME_RE);
    if (!match) {
      unsupported.push({
        line: index + 1,
        raw,
        reason: "无法识别的依赖声明",
      });
      return;
    }

    const name = match[1];
    dependencies.push({
      name,
      normalized: normalizePackageName(name),
      version: match[3].trim(),
      extras: match[2] ? match[2].slice(1, -1) : "",
      marker,
      group: "requirements",
      groupLabel: "requirements.txt",
      line: index + 1,
      snippet: raw,
    });
  });

  return {
    ok: true,
    format: "requirements.txt",
    dependencies,
    unsupported,
  };
}
