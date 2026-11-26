import {
  findLineNumber,
  lineSnippet,
  normalizePackageName,
  stripTomlComment,
} from "./util.js";

function splitKeyValue(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "=") {
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }
  }
  return null;
}

function isBalancedArray(text) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "[") {
      depth += 1;
    } else if (ch === "]") {
      depth -= 1;
    }
  }
  return depth <= 0;
}

function extractQuotedStrings(text) {
  const values = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch !== '"' && ch !== "'") {
      i += 1;
      continue;
    }
    const quote = ch;
    i += 1;
    let value = "";
    while (i < text.length) {
      if (text[i] === "\\") {
        value += text[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (text[i] === quote) {
        i += 1;
        break;
      }
      value += text[i];
      i += 1;
    }
    values.push(value);
  }
  return values;
}

function parseRequirementSpec(spec) {
  const raw = String(spec || "").trim().replace(/^["']|["']$/g, "");
  if (!raw || raw.startsWith("-") || /^(git\+|https?:\/\/|file:)/i.test(raw)) {
    return null;
  }
  if (raw.includes(" @ ")) return null;

  let line = raw;
  let marker = "";
  const markerIndex = line.indexOf(";");
  if (markerIndex >= 0) {
    marker = line.slice(markerIndex + 1).trim();
    line = line.slice(0, markerIndex).trim();
  }

  const match = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)(\[[^\]]*\])?\s*(.*)$/);
  if (!match) return null;

  return {
    name: match[1],
    normalized: normalizePackageName(match[1]),
    extras: match[2] ? match[2].slice(1, -1) : "",
    version: match[3].trim(),
    marker,
  };
}

function addSpec(dependencies, unsupported, spec, group, groupLabel, line, snippet) {
  const parsed = parseRequirementSpec(spec);
  if (!parsed) {
    unsupported.push({ line, snippet, reason: `无法解析依赖声明：${spec}` });
    return;
  }
  dependencies.push({
    ...parsed,
    group,
    groupLabel,
    line,
    snippet,
  });
}

export function parsePyproject(text) {
  const lines = text.split(/\r?\n/);
  const dependencies = [];
  const unsupported = [];
  let section = "";
  let i = 0;

  while (i < lines.length) {
    const cleaned = stripTomlComment(lines[i]).trim();
    if (!cleaned) {
      i += 1;
      continue;
    }

    if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
      section = cleaned.slice(1, -1).trim();
      i += 1;
      continue;
    }

    const pair = splitKeyValue(cleaned);
    if (!pair) {
      i += 1;
      continue;
    }

    const [rawKey, rawValue] = pair;
    const key = rawKey.replace(/^["']|["']$/g, "");

    if (rawValue.startsWith("[")) {
      let arrayText = rawValue;
      const startLine = i + 1;
      while (!isBalancedArray(arrayText) && i + 1 < lines.length) {
        i += 1;
        arrayText += `\n${stripTomlComment(lines[i])}`;
      }

      let group = null;
      let groupLabel = null;
      if (section === "project" && key === "dependencies") {
        group = "project";
        groupLabel = "project.dependencies";
      } else if (section === "project.optional-dependencies") {
        group = `optional:${key}`;
        groupLabel = `project.optional-dependencies.${key}`;
      } else if (section === "dependency-groups") {
        group = `group:${key}`;
        groupLabel = `dependency-groups.${key}`;
      } else if (/^tool\.poetry\.group\.[^.]+\.dependencies$/.test(section)) {
        group = `poetry:${section.split(".")[3]}`;
        groupLabel = section;
      }

      if (group) {
        for (const spec of extractQuotedStrings(arrayText)) {
          const line = findLineNumber(text, spec, startLine) || startLine;
          addSpec(
            dependencies,
            unsupported,
            spec,
            group,
            groupLabel,
            line,
            lineSnippet(text, line)
          );
        }
      }
      i += 1;
      continue;
    }

    if (section === "tool.poetry.dependencies" && key !== "python") {
      const line = i + 1;
      addSpec(
        dependencies,
        unsupported,
        key,
        "poetry",
        "tool.poetry.dependencies",
        line,
        lineSnippet(text, line)
      );
    } else if (section === "tool.poetry.dev-dependencies" && key !== "python") {
      const line = i + 1;
      addSpec(
        dependencies,
        unsupported,
        key,
        "poetry-dev",
        "tool.poetry.dev-dependencies",
        line,
        lineSnippet(text, line)
      );
    } else if (/^tool\.poetry\.group\.[^.]+\.dependencies$/.test(section)) {
      const line = i + 1;
      addSpec(
        dependencies,
        unsupported,
        key,
        `poetry:${section.split(".")[3]}`,
        section,
        line,
        lineSnippet(text, line)
      );
    }

    i += 1;
  }

  return {
    ok: true,
    format: "pyproject.toml",
    dependencies,
    unsupported,
  };
}
