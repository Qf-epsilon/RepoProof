import { SUPPORTED_SPDX } from "./constants.js";
import { parseRepoUrl } from "./url.js";

const MAX_SUGGESTIONS = 6;

const REPO_URL_RE =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+/i;

const TRAILING_RE = /[.,;:!?)\]}>。，；：！？）】”’]+$/u;

const CLAIM_RULES = [
  { re: /\bfastapi\b/i, template: "framework", object: "fastapi", text: "项目使用 FastAPI" },
  { re: /\bdjango\b/i, template: "framework", object: "django", text: "项目使用 Django" },
  { re: /\bflask\b/i, template: "framework", object: "flask", text: "项目使用 Flask" },
  { re: /spring\s*boot/i, template: "framework", object: "spring-boot-starter-web", text: "使用 Spring Boot Web" },
  { re: /react\s*native/i, template: "framework", object: "react-native", text: "使用 React Native" },
  { re: /\breact\b/i, template: "framework", object: "react", text: "前端使用 React" },
  { re: /\bvue\b/i, template: "framework", object: "vue", text: "前端使用 Vue" },
  { re: /\bnext\.?js\b/i, template: "framework", object: "next", text: "使用 Next.js" },
  { re: /\bexpress\b/i, template: "framework", object: "express", text: "后端使用 Express" },
  { re: /tailwind/i, template: "framework", object: "tailwindcss", text: "使用 Tailwind CSS" },
  { re: /typescript/i, template: "framework", object: "typescript", text: "使用 TypeScript" },
  { re: /\bpytest\b|自动化测试|单元测试/i, template: "tests", object: "tests/", text: "项目包含自动化测试" },
  { re: /\bjest\b/i, template: "framework", object: "jest", text: "使用 Jest 测试" },
  { re: /\bvitest\b/i, template: "framework", object: "vitest", text: "使用 Vitest 测试" },
  { re: /docker\s*compose/i, template: "docker", object: "docker-compose.yml", text: "使用 Docker Compose 编排" },
  { re: /docker(?!\s*compose)/i, template: "docker", object: "Dockerfile", text: "使用 Docker 部署" },
  { re: /github\s*actions|流水线|\bci\b/i, template: "ci", object: ".github/workflows/", text: "项目配置了 CI 流水线" },
  { re: /\breadme\b|文档/i, template: "docs", object: "README.md", text: "项目有 README 文档" },
  { re: /postgres(ql)?/i, template: "storage", object: "postgresql", text: "数据存储使用 PostgreSQL" },
  { re: /mongo(db)?/i, template: "storage", object: "mongoose", text: "数据存储使用 MongoDB" },
  { re: /prisma/i, template: "storage", object: "prisma", text: "数据存储使用 Prisma" },
  { re: /redis/i, template: "storage", object: "redis", text: "数据存储使用 Redis" },
];

const LICENSE_RULES = [
  { re: /\bMIT\b/i, spdx: "MIT" },
  { re: /apache[\s-]*(?:license[\s-]*)?2\.0/i, spdx: "Apache-2.0" },
  { re: /\bAGPL[\s-]*(?:3\.0|v3)\b/i, spdx: "AGPL-3.0-only" },
  { re: /\bLGPL[\s-]*(?:2\.1|3\.0|v3)\b/i, spdx: "LGPL-3.0-only" },
  { re: /\bGPL[\s-]*(?:3\.0|v3)\b/i, spdx: "GPL-3.0-only" },
  { re: /\bGPL[\s-]*(?:2\.0|v2)\b/i, spdx: "GPL-2.0-only" },
  { re: /\bMPL[\s-]*2\.0\b/i, spdx: "MPL-2.0" },
  { re: /\bBSD[\s-]*3(?:[\s-]*clause)?\b/i, spdx: "BSD-3-Clause" },
  { re: /\bBSD[\s-]*2(?:[\s-]*clause)?\b/i, spdx: "BSD-2-Clause" },
  { re: /\bISC\b/i, spdx: "ISC" },
  { re: /\bUnlicense\b/i, spdx: "Unlicense" },
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectLicense(text) {
  for (const rule of LICENSE_RULES) {
    if (rule.re.test(text)) return rule.spdx;
  }
  for (const spdx of SUPPORTED_SPDX) {
    const re = new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(spdx)}([^A-Za-z0-9]|$)`);
    if (re.test(text)) return spdx;
  }
  return null;
}

export function extractRepoUrl(text) {
  const raw = String(text || "");
  const match = raw.match(REPO_URL_RE);
  if (!match) return null;
  const candidate = match[0].replace(TRAILING_RE, "");
  try {
    return parseRepoUrl(candidate).canonicalUrl;
  } catch {
    return null;
  }
}

export function suggestClaimsFromText(text) {
  const value = String(text || "");
  if (!value.trim()) return [];

  const out = [];
  const seen = new Set();
  const push = (claim) => {
    const key = `${claim.template}:${claim.object}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(claim);
  };

  for (const rule of CLAIM_RULES) {
    if (rule.re.test(value)) {
      push({ template: rule.template, object: rule.object, text: rule.text });
    }
  }

  const license = detectLicense(value);
  if (license) {
    push({ template: "license", object: license, text: `采用 ${license} 许可证` });
  }

  return out.slice(0, MAX_SUGGESTIONS);
}

export function suggestFromResume(text) {
  return {
    repoUrl: extractRepoUrl(text),
    claims: suggestClaimsFromText(text),
  };
}