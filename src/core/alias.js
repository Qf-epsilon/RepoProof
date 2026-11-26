import { normalizePackageName } from "./parsers/util.js";

const ALIASES = Object.freeze({
  fastapi: ["fastapi"],
  "spring boot": ["spring-boot-starter-web", "spring-boot-starter"],
  "spring boot web": ["spring-boot-starter-web"],
  pytorch: ["torch"],
  torch: ["torch"],
  vue: ["vue"],
  "vue 3": ["vue"],
  vue3: ["vue"],
  react: ["react"],
  postgresql: ["psycopg2", "psycopg2-binary", "asyncpg", "sqlalchemy"],
  postgres: ["psycopg2", "psycopg2-binary", "asyncpg"],
  sqlalchemy: ["sqlalchemy"],
  mongoose: ["mongoose"],
  prisma: ["prisma", "@prisma/client"],
});

export function resolveAliases(input) {
  const raw = String(input || "").trim();
  const aliases = ALIASES[raw.toLowerCase()];
  if (aliases) {
    const changed =
      aliases.length > 1 || String(aliases[0]).toLowerCase() !== raw.toLowerCase();
    return { candidates: [...aliases], aliasUsed: changed };
  }
  return { candidates: [raw], aliasUsed: false };
}

// 归一化只用于包名生态（npm/PyPI）；go.mod、Maven 坐标是路径式标识符，
// 把 . _ - 折叠成 - 会破坏模块路径，所以原始小写形式必须一并比较。
export function dependencyMatches(candidates, dependency) {
  const names = new Set([
    dependency.normalized,
    String(dependency.name || "").toLowerCase(),
    String(dependency.name || "").split(":").pop().toLowerCase(),
  ]);
  return candidates.some((candidate) => {
    const lowered = String(candidate).toLowerCase();
    return names.has(lowered) || names.has(normalizePackageName(lowered));
  });
}
