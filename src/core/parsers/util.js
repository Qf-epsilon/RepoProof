export function normalizePackageName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[-_.]+/g, "-");
}

export function findLineNumber(text, needle, startLine = 1) {
  if (!needle) return 0;
  const lines = String(text || "").split(/\r?\n/);
  for (let i = Math.max(0, startLine - 1); i < lines.length; i += 1) {
    if (lines[i].includes(needle)) return i + 1;
  }
  return 0;
}

export function lineSnippet(text, line) {
  if (!line) return "";
  const lines = String(text || "").split(/\r?\n/);
  return (lines[line - 1] || "").trim();
}

export function stripInlineComment(line) {
  const index = line.indexOf(" #");
  return (index >= 0 ? line.slice(0, index) : line).trim();
}

export function stripTomlComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (ch === "\\") {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "#") {
      return line.slice(0, i);
    }
  }
  return line;
}

export function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function countLinesBefore(text, index) {
  let count = 0;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) count += 1;
  }
  return count + 1;
}
