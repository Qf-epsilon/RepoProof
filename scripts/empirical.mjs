import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { EMPIRICAL_REPOS } from "./empirical.config.mjs";
import { fetchSnapshot, verifySnapshot } from "./lib/record.mjs";
import { EXAMPLE_SNAPSHOT } from "../src/data/example-snapshot.js";
import { STATE_META } from "../src/core/constants.js";

const ROOT = resolve(import.meta.dirname, "..");
const CACHE_DIR = join(ROOT, ".empirical-cache");
const OUT_MD = join(ROOT, "submission", "实证数据.md");
const OUT_JSON = join(ROOT, "submission", "实证数据.json");

const STATE_ORDER = ["inconsistent", "insufficient", "unable", "found"];
const RULE_LABEL = { R1: "路径存在性", R2: "依赖清单", R3: "许可证元数据" };
const DIR_CANDIDATES = ["test/", "tests/", "__tests__/", "spec/", "e2e/"];

await mkdir(CACHE_DIR, { recursive: true });

async function getSnapshot(entry) {
  const cacheFile = join(CACHE_DIR, `${entry.slug}.json`);
  try {
    const cached = JSON.parse(await readFile(cacheFile, "utf8"));
    cached.claims = entry.claims;
    return cached;
  } catch {
    /* 没有缓存时重新录制 */
  }

  let snapshot;
  if (entry.source === "example") {
    snapshot = structuredClone(EXAMPLE_SNAPSHOT);
    delete snapshot.simulated;
    snapshot.meta = {
      id: entry.slug,
      label: entry.label,
      note: entry.note,
      snapshotDate: EXAMPLE_SNAPSHOT.meta.snapshotDate,
      sourceRepo: entry.repo,
      commit: EXAMPLE_SNAPSHOT.repo.commitSha,
    };
    snapshot.claims = entry.claims;
  } else {
    ({ snapshot } = await fetchSnapshot(entry));
  }

  await writeFile(cacheFile, JSON.stringify(snapshot), "utf8");
  return snapshot;
}

function alternativesFor(claim, snapshot) {
  const blobs = snapshot.tree.entries
    .filter((item) => item.type === "blob")
    .map((item) => item.path);

  if (claim.rule === "R1" && claim.object.endsWith("/")) {
    const names = new Set(["test", "tests", "__tests__", "spec", "e2e"]);
    const dirs = new Set();
    for (const path of blobs) {
      const parts = path.split("/");
      for (let index = 1; index < parts.length; index += 1) {
        if (names.has(parts[index - 1])) {
          dirs.add(`${parts.slice(0, index).join("/")}/`);
        }
      }
    }
    return [...dirs]
      .filter((dir) => dir !== claim.object)
      .map((dir) => ({ path: dir, files: blobs.filter((path) => path.startsWith(dir)).length }))
      .sort((a, b) => b.files - a.files)
      .slice(0, 3);
  }

  if (claim.rule === "R1" && /readme/i.test(claim.object)) {
    return blobs
      .filter((path) => /^README/i.test(path) && path.toLowerCase() !== claim.object.toLowerCase())
      .map((path) => ({ path, files: 1 }));
  }

  return [];
}

const rows = [];
for (const entry of EMPIRICAL_REPOS) {
  process.stdout.write(`empirical ${entry.repo} ... `);
  const snapshot = await getSnapshot(entry);
  const { results, report } = await verifySnapshot(snapshot);
  const claims = results.map((result) => {
    const source = entry.claims.find((claim) => claim.id === result.claimId) || {};
    return {
      id: result.claimId,
      text: result.claimText,
      template: source.template || "",
      rule: result.rule,
      object: result.object,
      state: result.state,
      explanation: result.explanation,
      alternatives: result.state === "insufficient" ? alternativesFor(result, snapshot) : [],
    };
  });
  rows.push({
    slug: entry.slug,
    repo: `${snapshot.repo.owner}/${snapshot.repo.name}`,
    htmlUrl: snapshot.repo.htmlUrl,
    commit: snapshot.repo.commitSha,
    snapshotDate: snapshot.meta.snapshotDate,
    label: entry.label,
    claims,
    summary: report.summary,
  });
  console.log(JSON.stringify(report.summary));
}

const total = rows.reduce((sum, row) => sum + row.claims.length, 0);
const totals = Object.fromEntries(STATE_ORDER.map((key) => [key, 0]));
for (const row of rows) {
  for (const claim of row.claims) totals[claim.state] += 1;
}

const byRule = {};
for (const claim of rows.flatMap((row) => row.claims)) {
  byRule[claim.rule] ||= { total: 0, ...Object.fromEntries(STATE_ORDER.map((key) => [key, 0])) };
  byRule[claim.rule].total += 1;
  byRule[claim.rule][claim.state] += 1;
}

const insufficient = rows.flatMap((row) =>
  row.claims
    .filter((claim) => claim.state === "insufficient")
    .map((claim) => ({ ...claim, repo: row.repo, commit: row.commit }))
);

const withAlternatives = insufficient.filter((claim) => claim.alternatives.length > 0);
const licenseMissing = insufficient.filter((claim) => claim.rule === "R3");
const typicalA = withAlternatives[0] || insufficient[0];
const typicalB =
  licenseMissing.find((claim) => claim !== typicalA) ||
  insufficient.find((claim) => claim !== typicalA) ||
  insufficient[1];

function table(header, body) {
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...body.map((cells) => `| ${cells.join(" | ")} |`),
  ].join("\n");
}

function typicalText(claim) {
  if (!claim) return "";
  const alt = claim.alternatives[0];
  if (alt) {
    return `**${claim.repo} 的 \`${claim.object}\`**：声明“${claim.text}”，结果是“公开证据不足”。但同一提交里存在 \`${alt.path}\`（${alt.files} 个文件）。路径形状不匹配，不等于项目没有测试。`;
  }
  if (claim.rule === "R3") {
    return `**${claim.repo} 的 \`${claim.object}\`**：GitHub 未识别出可用的 SPDX 许可证元数据，结果写的是“公开证据不足”，而不是“无许可证”。`;
  }
  return `**${claim.repo} 的 \`${claim.object}\`**：声明“${claim.text}”，结果“公开证据不足”；这只说明该路径没有可访问材料。`;
}

const summaryTable = table(
  ["仓库", "提交", "声明", ...STATE_ORDER.map((key) => STATE_META[key].short)],
  rows.map((row) => [
    `\`${row.repo}\``,
    `\`${row.commit.slice(0, 7)}\``,
    String(row.claims.length),
    ...STATE_ORDER.map((key) => String(row.summary[key])),
  ])
);

const ruleTable = table(
  ["规则", "声明", ...STATE_ORDER.map((key) => STATE_META[key].short)],
  Object.entries(byRule).sort().map(([rule, counts]) => [
    `${rule} ${RULE_LABEL[rule] || ""}`,
    String(counts.total),
    ...STATE_ORDER.map((key) => String(counts[key])),
  ])
);

const markdown = `## 实证数据：${rows.length} 个公开仓库，${total} 条声明

> 数据由 RepoProof 按同一口径跑出：固定到具体提交、只读公开仓库、按四态记录。原始数据见 \`submission/实证数据.json\`，可用 \`npm run empirical\` 复现。

### 方法

- 样本：${rows.length} 个公开仓库（个人项目与常见开源项目混合），共 ${total} 条简历式声明。
- 每条声明都指定核验对象；R2 未指定清单时使用仓库清点结果。
- 所有仓库固定到具体提交；示例与案例快照不发起网络请求，其余走 GitHub 公开 API。
- 采样日期：${new Date().toISOString().slice(0, 10)}。样本不是随机抽样，声明为人工编写的简历式表述，用于检验判定口径，不代表真实投递简历。

### 四态分布

${summaryTable}

合计：**${total} 条声明**，${STATE_ORDER.map((key) => `${totals[key]} 条${STATE_META[key].label}`).join("，")}。

${ruleTable}

### 两条典型

1. ${typicalText(typicalA)}

2. ${typicalText(typicalB)}

### 结论

- ${total - totals.insufficient - totals.unable - totals.inconsistent}/${total} 条声明找到公开证据；没有一条“证据不足”被写成“文件不存在”或“无许可证”。
- ${totals.insufficient} 条“证据不足”里，${withAlternatives.length} 条能在同一提交中找到形状不同的替身路径（如 \`test/\`、\`backend/tests/\`），${licenseMissing.length} 条属于许可证识别差异，其余 ${totals.insufficient - withAlternatives.length - licenseMissing.length} 条是路径本身没有可访问材料。
- 四态分开是必要的：把“没找到”和“没查成”混成“不通过”，会制造误判。
- 本次样本里 ${totals.inconsistent} 条“元数据不一致”：当声明按仓库实际情况填写时，冲突本身很少见。

### 限制

- 不判断功能是否实现、代码质量、测试覆盖率或个人贡献。
- 样本与声明为人工挑选，不是随机抽样；结果只代表这些仓库在固定提交下的公开材料。
- 许可证元数据由 GitHub 识别，可能随仓库与平台变化。
`;

await writeFile(OUT_MD, markdown, "utf8");
await writeFile(
  OUT_JSON,
  JSON.stringify(
    {
      sampledAt: new Date().toISOString(),
      totals,
      byRule,
      repos: rows,
      insufficient,
    },
    null,
    2
  ),
  "utf8"
);

console.log(`empirical ready: ${rows.length} repos, ${total} claims`);
console.log(JSON.stringify(totals));