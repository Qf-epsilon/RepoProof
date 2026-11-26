const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

export function parseRepoUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    throw new Error("请输入公开 GitHub 仓库地址");
  }

  let url;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error("地址格式不正确，请使用 https://github.com/owner/repo");
  }

  if (url.username || url.password) {
    throw new Error("地址中不能包含用户名或密码");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("只支持 http/https 的 GitHub 地址");
  }
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    throw new Error("只支持 github.com 上的公开仓库");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("地址缺少 owner 或 repo");
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");

  if (!OWNER_RE.test(owner)) {
    throw new Error("owner 格式不正确");
  }
  if (!REPO_RE.test(repo)) {
    throw new Error("repo 格式不正确");
  }

  return {
    owner,
    repo,
    canonicalUrl: `https://github.com/${owner}/${repo}`,
  };
}

export function encodePath(path) {
  return String(path || "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function buildBlobUrl(owner, repo, ref, path, line) {
  const base = `https://github.com/${owner}/${repo}/blob/${encodeURIComponent(ref)}/${encodePath(path)}`;
  return line ? `${base}#L${line}` : base;
}

export function buildTreeUrl(owner, repo, ref, path) {
  const suffix = path ? `/${encodePath(path)}` : "";
  return `https://github.com/${owner}/${repo}/tree/${encodeURIComponent(ref)}${suffix}`;
}

export function buildRawUrl(owner, repo, ref, path) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${encodePath(path)}`;
}

export function buildRepoApiUrl(owner, repo) {
  return `https://api.github.com/repos/${owner}/${repo}`;
}

export function buildRefApiUrl(owner, repo, branch) {
  return `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`;
}

export function buildCommitApiUrl(owner, repo, ref) {
  return `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}`;
}

export function buildContentsApiUrl(owner, repo, path, ref) {
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`;
}

export function buildTreeApiUrl(owner, repo, ref) {
  return `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
}

export function buildLicenseApiUrl(owner, repo, ref) {
  return `https://api.github.com/repos/${owner}/${repo}/license?ref=${encodeURIComponent(ref)}`;
}

export function isSafeGithubUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "github.com" || url.hostname === "raw.githubusercontent.com")
    );
  } catch {
    return false;
  }
}
