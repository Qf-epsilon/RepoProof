import { buildReport } from "../core/report.js";
import { verifyPath } from "../core/rules/r1.js";
import { verifyDependency } from "../core/rules/r2.js";
import { verifyLicense } from "../core/rules/r3.js";
import { buildInventory } from "../core/rules/r4.js";
import { buildBlobUrl, parseRepoUrl } from "../core/url.js";

const MAX_AUTO_MANIFESTS = 6;

const LOAD_ERRORS = {
  input: "请输入公开 GitHub 仓库地址，例如 https://github.com/owner/repo",
  not_found: "仓库不可访问或不是公开仓库。",
  private: "仓库不可访问或不是公开仓库。",
  rate_limited: "请求受限，请稍后重试或使用示例数据。",
  forbidden: "请求受限，请稍后重试或使用示例数据。",
  network: "无法连接 GitHub，请稍后重试或使用示例数据。",
  server: "GitHub 暂时不可用，请稍后重试或使用示例数据。",
  parse: "GitHub 返回的数据无法解析，请稍后重试。",
};

function loadError(kind) {
  return {
    ok: false,
    error: { kind, message: LOAD_ERRORS[kind] || LOAD_ERRORS.server },
  };
}

function normalizeLicenseResult(licenseResponse, repoMeta, owner, name, ref) {
  if (licenseResponse.ok) {
    return {
      ok: true,
      spdxId: licenseResponse.spdxId,
      path: licenseResponse.path,
      htmlUrl: buildBlobUrl(owner, name, ref, licenseResponse.path || "LICENSE"),
    };
  }
  if (licenseResponse.error?.kind === "not_found") {
    return { ok: false, error: { kind: "not_found" } };
  }
  if (repoMeta?.license?.spdxId) {
    return {
      ok: true,
      spdxId: repoMeta.license.spdxId,
      path: "LICENSE",
      htmlUrl: buildBlobUrl(owner, name, ref, "LICENSE"),
    };
  }
  return { ok: false, error: { kind: licenseResponse.error?.kind || "server" } };
}

export async function loadRepository(gateway, input) {
  let parsed;
  try {
    parsed = parseRepoUrl(input);
  } catch {
    return loadError("input");
  }
  if (!parsed) return loadError("input");

  const { owner, repo } = parsed;
  const metaRes = await gateway.getRepo(owner, repo);
  if (!metaRes.ok) return loadError(metaRes.error?.kind || "server");
  if (metaRes.data.private) return loadError("private");

  const defaultBranch = metaRes.data.defaultBranch;
  if (!defaultBranch) return loadError("parse");

  const notices = [];
  const refRes = await gateway.resolveRef(owner, repo, defaultBranch);
  let ref = defaultBranch;
  let commitSha = "";
  let evidencePinned = false;
  if (refRes.ok && refRes.sha) {
    ref = refRes.sha;
    commitSha = refRes.sha;
    evidencePinned = true;
  } else {
    notices.push("证据未固定到具体 commit：后续证据链接会随默认分支移动。");
  }

  const treeRes = await gateway.getTree(owner, repo, ref);
  if (!treeRes.ok && treeRes.error?.kind === "not_found") {
    return { ok: false, error: { kind: "empty", message: "仓库没有可读取内容。" } };
  }
  const inventory = buildInventory({ owner, repo, ref, tree: treeRes });
  if (inventory.ok === false) notices.push(inventory.message);

  const licenseRes = await gateway.getLicense(owner, repo, ref);
  const license = normalizeLicenseResult(licenseRes, metaRes.data, owner, repo, ref);

  const repoInfo = {
    owner,
    name: repo,
    htmlUrl: metaRes.data.htmlUrl,
    defaultBranch,
    ref,
    commitSha,
    evidencePinned,
    licenseMeta: metaRes.data.license,
    lastCommitAt: metaRes.data.lastCommitAt || null,
    queriedAt: new Date().toISOString(),
  };

  return {
    ok: true,
    repo: repoInfo,
    inventory,
    license,
    notices,
    stats: gateway.stats ? gateway.stats() : null,
  };
}

async function readManifests(gateway, repo, paths) {
  const unique = [...new Set(paths.filter(Boolean))];
  const manifests = [];
  for (const path of unique) {
    const raw = await gateway.getRaw(repo.owner, repo.name, repo.ref, path);
    if (raw.ok) {
      manifests.push({ path, text: raw.text });
    } else {
      manifests.push({ path, error: { kind: raw.error?.kind || "server" } });
    }
  }
  return manifests;
}

function defaultManifestPaths(inventory) {
  if (!inventory || inventory.ok !== true) return [];
  return inventory.manifestPaths.slice(0, MAX_AUTO_MANIFESTS);
}

export async function verifyClaims({ gateway, repo, claims, inventory }) {
  const results = [];
  const notices = [];
  const autoManifests = defaultManifestPaths(inventory);

  for (const claim of claims) {
    const base = {
      claimId: claim.id,
      claimText: claim.text,
      object: claim.object,
      owner: repo.owner,
      repo: repo.name,
      ref: repo.ref,
    };

    if (claim.rule === "R1") {
      const contents = await gateway.getContents(
        repo.owner,
        repo.name,
        claim.object,
        repo.ref
      );
      results.push(verifyPath({ ...base, contents }));
      continue;
    }

    if (claim.rule === "R2") {
      const requested = claim.manifests && claim.manifests.length > 0
        ? claim.manifests
        : autoManifests;
      if (requested.length === 0) {
        notices.push(
          "没有可核验的依赖清单路径：仓库清点未发现清单，且该声明未指定清单。"
        );
      }
      const manifests = await readManifests(gateway, repo, requested);
      results.push(verifyDependency({ ...base, manifests }));
      continue;
    }

    if (claim.rule === "R3") {
      let license;
      if (claim.license && typeof claim.license === "object") {
        license = claim.license;
      } else {
        const response = await gateway.getLicense(repo.owner, repo.name, repo.ref);
        license = normalizeLicenseResult(
          response,
          { license: repo.licenseMeta },
          repo.owner,
          repo.name,
          repo.ref
        );
      }
      results.push(verifyLicense({ ...base, license }));
      continue;
    }

    notices.push(`声明“${claim.text}”没有可用的核验规则，已跳过。`);
  }

  return { results, notices };
}

export function buildClaimReport(repo, results) {
  return buildReport({
    repo: {
      owner: repo.owner,
      name: repo.name,
      htmlUrl: repo.htmlUrl,
      defaultBranch: repo.defaultBranch,
      commitSha: repo.commitSha,
      ref: repo.ref,
      evidencePinned: repo.evidencePinned,
      queriedAt: repo.queriedAt,
    },
    results,
  });
}
