import { STATE } from "../constants.js";
import { isSupportedManifestPath } from "../parsers/index.js";
import { buildBlobUrl } from "../url.js";

const EXCLUDED_SEGMENTS = new Set([
  "node_modules",
  "vendor",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "venv",
  ".venv",
  "__pycache__",
]);

function segments(path) {
  return path.split("/").filter(Boolean);
}

function basename(path) {
  return segments(path).pop() || "";
}

function isExcluded(path) {
  return segments(path).some((segment) => EXCLUDED_SEGMENTS.has(segment));
}

function isTestPath(path) {
  const parts = segments(path);
  if (parts.some((part) => ["test", "tests", "__tests__", "spec"].includes(part))) {
    return true;
  }
  const name = basename(path);
  return (
    /^test_.*\.py$/i.test(name) ||
    /^.*_test\.py$/i.test(name) ||
    /^.*\.(test|spec)\.(js|jsx|ts|tsx)$/i.test(name)
  );
}

function isCiPath(path) {
  if (/^\.github\/workflows\/.+\.ya?ml$/i.test(path)) return true;
  const name = basename(path);
  return (
    name === ".gitlab-ci.yml" ||
    name === "Jenkinsfile" ||
    path === ".circleci/config.yml" ||
    name === "azure-pipelines.yml"
  );
}

function isContainerPath(path) {
  const name = basename(path);
  return (
    name === "Dockerfile" ||
    name.startsWith("Dockerfile.") ||
    name === "docker-compose.yml" ||
    name === "docker-compose.yaml" ||
    name === "compose.yml" ||
    name === "compose.yaml"
  );
}

function isDocsPath(path) {
  const name = basename(path);
  return (
    /^README/i.test(name) ||
    path.startsWith("docs/") ||
    /^CONTRIBUTING/i.test(name) ||
    /^CHANGELOG/i.test(name)
  );
}

function isEntryPath(path) {
  return (
    /(?:^|\/)src\/(main|app|index)\.[^/]+$/i.test(path) ||
    /(?:^|\/)(main|app|manage)\.py$/i.test(path) ||
    path === "index.html" ||
    path === "server.js" ||
    /(?:^|\/)cmd\/[^/]+\/main\.go$/i.test(path)
  );
}

const CATEGORIES = [
  { id: "manifests", label: "依赖清单", match: isSupportedManifestPath },
  { id: "tests", label: "测试材料", match: isTestPath },
  { id: "ci", label: "CI 工作流", match: isCiPath },
  { id: "container", label: "容器配置", match: isContainerPath },
  { id: "docs", label: "文档", match: isDocsPath },
  { id: "entry", label: "候选入口", match: isEntryPath },
];

export function buildInventory({ owner, repo, ref, tree }) {
  if (!tree || !tree.ok) {
    return {
      ok: false,
      reason: "tree_unavailable",
      state: STATE.UNABLE,
      message: "仓库目录清点请求失败，本次无法完成自动发现。",
    };
  }
  if (tree.truncated) {
    return {
      ok: false,
      reason: "truncated",
      state: STATE.UNABLE,
      message:
        "仓库目录清点数据不完整（truncated）。证据清点整块无法完成核验，但单文件仍可用 Contents API 核验。",
    };
  }

  const files = (tree.entries || [])
    .filter((entry) => entry.type === "blob")
    .map((entry) => entry.path)
    .filter((path) => path && !isExcluded(path));

  const categories = CATEGORIES.map((category) => {
    const paths = files.filter((path) => category.match(path));
    return {
      id: category.id,
      label: category.label,
      count: paths.length,
      samples: paths.slice(0, 3).map((path) => ({
        path,
        url: buildBlobUrl(owner, repo, ref, path),
      })),
      hasMore: paths.length > 3,
      paths,
    };
  });

  const manifestCategory = categories.find((item) => item.id === "manifests");

  return {
    ok: true,
    totalFiles: files.length,
    categories,
    manifestPaths: manifestCategory ? manifestCategory.paths : [],
  };
}
