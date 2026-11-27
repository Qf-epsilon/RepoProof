import { createSnapshotGateway } from "../../src/adapters/snapshot.js";
import { createCachedGateway } from "../../src/app/session.js";
import { buildClaimReport, loadRepository, verifyClaims } from "../../src/app/usecases.js";
import { buildBlobUrl, encodePath } from "../../src/core/url.js";
import { buildInventory } from "../../src/core/rules/r4.js";
import { summarize } from "../../src/core/state.js";

const API = "https://api.github.com";
const HEADERS = {
  accept: "application/vnd.github+json",
  "user-agent": "repoproof-recorder",
  "x-github-api-version": "2022-11-28",
};

const MAX_BLOBS = 2000;
const MAX_MANIFESTS = 6;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function constName(slug) {
  return `CASE_${slug.replace(/[^a-z0-9]+/gi, "_").toUpperCase()}`;
}

async function api(path, { allow404 = false } = {}) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await sleep(500);
    const response = await fetch(`${API}${path}`, { headers: HEADERS });
    if (response.status === 404 && allow404) return null;
    if (response.ok) return response.json();
    lastStatus = response.status;
    if (response.status === 403 || response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after"));
      await sleep(
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500 * (attempt + 1)
      );
      continue;
    }
    break;
  }
  throw new Error(`GitHub API ${path} -> ${lastStatus}`);
}

async function fetchRaw(full, sha, path) {
  const encoded = encodePath(path);
  const raw = await fetch(`https://raw.githubusercontent.com/${full}/${sha}/${encoded}`, {
    headers: { "user-agent": "repoproof-recorder" },
  });
  if (raw.ok) return raw.text();

  // 部分网络环境无法访问 raw 域名时，退回 Contents API 的 raw 表示
  const fallback = await fetch(`${API}/repos/${full}/contents/${encoded}?ref=${sha}`, {
    headers: { ...HEADERS, accept: "application/vnd.github.raw" },
  });
  if (!fallback.ok) return null;
  return fallback.text();
}

export async function fetchSnapshot(entry) {
  const [owner, repo] = entry.repo.split("/");
  const meta = await api(`/repos/${entry.repo}`);
  const branch = meta.default_branch;
  const commit = await api(`/repos/${entry.repo}/commits/${branch}`);
  const sha = commit.sha;

  const treeResponse = await api(`/repos/${entry.repo}/git/trees/${sha}?recursive=1`);
  const entries = (treeResponse.tree || [])
    .filter((item) => item.path && (item.type === "blob" || item.type === "tree"))
    .map((item) => ({ path: item.path, type: item.type }));
  const blobCount = entries.filter((item) => item.type === "blob").length;
  if (blobCount > MAX_BLOBS) {
    throw new Error(`仓库文件过多（${blobCount}），不适合做内嵌快照`);
  }

  const licenseResponse = await api(`/repos/${entry.repo}/license?ref=${sha}`, {
    allow404: true,
  });
  const license = licenseResponse
    ? {
        ok: true,
        spdxId: licenseResponse.license?.spdx_id || null,
        path: licenseResponse.path || "LICENSE",
        htmlUrl: buildBlobUrl(owner, repo, sha, licenseResponse.path || "LICENSE"),
      }
    : { ok: false, error: { kind: "not_found" } };

  const inventory = buildInventory({
    owner,
    repo,
    ref: sha,
    tree: { ok: true, truncated: Boolean(treeResponse.truncated), entries },
  });

  const rawPaths = new Set();
  if (inventory.ok) {
    for (const path of inventory.manifestPaths.slice(0, MAX_MANIFESTS)) rawPaths.add(path);
  }
  for (const claim of entry.claims) {
    for (const path of claim.manifests || []) rawPaths.add(path);
  }

  const raw = {};
  for (const path of rawPaths) {
    const text = await fetchRaw(entry.repo, sha, path);
    if (typeof text === "string") raw[path] = text;
  }

  const snapshot = {
    meta: {
      id: entry.slug,
      label: entry.label,
      note: entry.note,
      snapshotDate: new Date().toISOString().slice(0, 10),
      sourceRepo: entry.repo,
      commit: sha,
    },
    repo: {
      owner,
      name: repo,
      defaultBranch: branch,
      commitSha: sha,
      private: Boolean(meta.private),
      htmlUrl: meta.html_url,
      lastCommitAt: meta.pushed_at || null,
      license: meta.license ? { spdxId: meta.license.spdx_id, name: meta.license.name } : null,
    },
    tree: {
      ok: true,
      truncated: Boolean(treeResponse.truncated),
      entries,
    },
    license,
    raw,
    claims: entry.claims,
  };

  return verifySnapshot(snapshot);
}

export async function verifySnapshot(snapshot) {
  const gateway = createCachedGateway(createSnapshotGateway(snapshot));
  const loaded = await loadRepository(gateway, snapshot.repo.htmlUrl);
  if (!loaded.ok) {
    throw new Error(`快照自检失败：${loaded.error.message}`);
  }
  const { results, notices } = await verifyClaims({
    gateway,
    repo: loaded.repo,
    claims: snapshot.claims,
    inventory: loaded.inventory,
  });
  snapshot.meta.expectedSummary = summarize(results);
  snapshot.meta.expectedStates = results.map((result) => ({
    id: result.claimId,
    state: result.state,
  }));
  return {
    snapshot,
    loaded,
    results,
    notices,
    report: buildClaimReport(loaded.repo, results),
  };
}