import { parseGemfile } from "./gemfile.js";
import { parseGoMod } from "./go-mod.js";
import { parsePackageJson } from "./package-json.js";
import { parsePom } from "./pom.js";
import { parsePyproject } from "./pyproject.js";
import { parseRequirements } from "./requirements.js";

const PARSERS = {
  "package.json": parsePackageJson,
  "pyproject.toml": parsePyproject,
  "pom.xml": parsePom,
  "go.mod": parseGoMod,
  Gemfile: parseGemfile,
};

export function isSupportedManifestPath(path) {
  const base = String(path || "").split("/").pop() || "";
  return Boolean(PARSERS[base]) || /^requirements.*\.txt$/i.test(base);
}

export function parseManifest(path, text) {
  const base = String(path || "").split("/").pop() || "";
  if (/^requirements.*\.txt$/i.test(base)) {
    return parseRequirements(text);
  }
  const parser = PARSERS[base];
  if (!parser) {
    return {
      ok: false,
      format: base || "unknown",
      error: `不支持的清单类型：${base || "unknown"}`,
    };
  }
  return parser(text);
}
