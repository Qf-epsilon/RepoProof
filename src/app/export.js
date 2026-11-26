import { STATE_META } from "../core/constants.js";
import { isSafeGithubUrl } from "../core/url.js";

const STATE_ORDER = ["inconsistent", "insufficient", "unable", "found"];

const RULE_LABEL = {
  R1: "路径存在性",
  R2: "依赖清单",
  R3: "许可证元数据（SPDX）",
};

function inline(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function code(value) {
  const text = inline(value);
  if (!text) return "—";
  if (text.includes("`")) return `\`\` ${text} \`\``;
  return `\`${text}\``;
}

function linkLabel(value) {
  return inline(value).replace(/([\\[\]])/g, "\\$1");
}

function nested(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) return [`  - ${fallback}`];
  return items.map((item) => `  - ${inline(item)}`);
}

function timeLabel(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return inline(iso);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function evidenceLine(item) {
  let label;
  if (item.type === "manifest") {
    label = `${item.path}:${item.line} · ${item.package} (${item.group})`;
  } else if (item.type === "license") {
    label = `${item.path || "LICENSE"} · 声明 ${item.declaredSpdx} / 识别 ${item.observedSpdx}`;
  } else {
    label = `${item.path}${item.kind === "dir" ? "/" : ""}`;
  }
  if (item.url && isSafeGithubUrl(item.url)) {
    return `[${linkLabel(label)}](${item.url})`;
  }
  return code(label);
}

export function buildEvidenceSheet({ report, mode = "live", siteUrl = "" }) {
  const repo = report.repo || {};
  const summary = report.summary || {};
  const claims = Array.isArray(report.claims) ? report.claims : [];
  const repoName = `${repo.owner || ""}/${repo.name || ""}`;
  const repoLink =
    repo.htmlUrl && isSafeGithubUrl(repo.htmlUrl)
      ? `[${linkLabel(repoName)}](${repo.htmlUrl})`
      : code(repoName);

  const lines = ["# RepoProof 证据单", "", `- 仓库：${repoLink}`];

  if (repo.evidencePinned && repo.commitSha) {
    lines.push(`- 提交：${code(repo.commitSha)}（证据链接固定到该提交）`);
  } else {
    const ref = repo.ref || repo.defaultBranch || "main";
    lines.push(`- 分支：${code(ref)}（未能固定到提交，链接可能随分支变化）`);
  }

  lines.push(`- 查询时间：${timeLabel(repo.queriedAt)}`);
  lines.push(`- 导出时间：${timeLabel(report.generatedAt)}`);
  lines.push(
    `- 数据来源：${
      mode === "example" ? "示例快照（不发起网络请求，429 为模拟）" : "GitHub 公开 API"
    }`
  );
  lines.push("");
  lines.push("## 汇总");
  lines.push("");
  const counts = STATE_ORDER.map(
    (key) => `${STATE_META[key].label} ${summary[key] || 0} 条`
  );
  lines.push(`共 ${claims.length} 条声明：${counts.join("，")}。`);
  lines.push("");
  lines.push("## 声明与证据");
  lines.push("");

  claims.forEach((claim, index) => {
    lines.push(`### ${index + 1}. ${inline(claim.claimText) || "（无声明文本）"}`);
    lines.push("");
    lines.push(`- 状态：**${STATE_META[claim.state]?.label || claim.state}**`);
    lines.push(
      `- 核验对象：${claim.rule} · ${code(claim.object)} · ${RULE_LABEL[claim.rule] || claim.rule}`
    );
    lines.push(`- 说明：${inline(claim.explanation)}`);
    lines.push("- 支持什么：");
    lines.push(...nested(claim.supports, "无。"));
    lines.push("- 不支持什么：");
    lines.push(...nested(claim.doesNotSupport, "仅限本条证据的范围。"));
    if (claim.evidence?.length) {
      lines.push("- 证据：");
      for (const item of claim.evidence) {
        lines.push(`  - ${evidenceLine(item)}`);
      }
    }
    lines.push("");
  });

  lines.push("## 边界");
  lines.push("");
  lines.push(report.boundary || "");
  if (siteUrl) {
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push(`由 RepoProof 生成：${siteUrl}`);
  }
  return lines.join("\n") + "\n";
}

export function evidenceSheetFilename(repo = {}) {
  const owner = inline(repo.owner);
  const name = inline(repo.name);
  const stamp =
    repo.evidencePinned && repo.commitSha
      ? repo.commitSha.slice(0, 7)
      : inline(repo.ref || repo.defaultBranch || "branch");
  const base = ["repoproof", owner, name, stamp].filter(Boolean).join("-");
  return `${base.replace(/[^A-Za-z0-9._-]+/g, "-")}.md`;
}
