import {
  buildCommitApiUrl,
  buildContentsApiUrl,
  buildLicenseApiUrl,
  buildRawUrl,
  buildRefApiUrl,
  buildRepoApiUrl,
  buildTreeApiUrl,
  buildTreeUrl,
} from "../core/url.js";

function readRateLimit(headers) {
  return {
    limit: headers.get("x-ratelimit-limit"),
    remaining: headers.get("x-ratelimit-remaining"),
    reset: headers.get("x-ratelimit-reset"),
    used: headers.get("x-ratelimit-used"),
    resource: headers.get("x-ratelimit-resource"),
    retryAfter: headers.get("retry-after"),
  };
}

function errorResult(kind, status, rateLimit, message) {
  return {
    ok: false,
    error: { kind, status, rateLimit, message: message || "" },
    rateLimit,
  };
}

async function request(url, mode = "json") {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: mode === "text" ? "text/plain" : "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch (error) {
    return errorResult("network", 0, null, error.message);
  }

  const rateLimit = readRateLimit(response.headers);

  if (response.status === 404) {
    return errorResult("not_found", 404, rateLimit);
  }
  if (response.status === 403 || response.status === 429) {
    const kind =
      response.status === 429 ||
      rateLimit.remaining === "0" ||
      Boolean(rateLimit.retryAfter)
        ? "rate_limited"
        : "forbidden";
    return errorResult(kind, response.status, rateLimit);
  }
  if (response.status >= 500) {
    return errorResult("server", response.status, rateLimit);
  }
  if (!response.ok) {
    return errorResult("http", response.status, rateLimit);
  }

  if (mode === "text") {
    try {
      return { ok: true, text: await response.text(), rateLimit };
    } catch (error) {
      return errorResult("parse", response.status, rateLimit, error.message);
    }
  }

  try {
    return { ok: true, data: await response.json(), rateLimit };
  } catch (error) {
    return errorResult("parse", response.status, rateLimit, error.message);
  }
}

export function createGithubGateway() {
  return {
    async getRepo(owner, repo) {
      const res = await request(buildRepoApiUrl(owner, repo));
      if (!res.ok) return res;
      const data = res.data;
      return {
        ok: true,
        rateLimit: res.rateLimit,
        data: {
          owner,
          name: repo,
          defaultBranch: data.default_branch,
          private: Boolean(data.private),
          htmlUrl: data.html_url,
          lastCommitAt: data.pushed_at || null,
          license: data.license
            ? { spdxId: data.license.spdx_id, name: data.license.name }
            : null,
        },
      };
    },

    async resolveRef(owner, repo, branch) {
      const refRes = await request(buildRefApiUrl(owner, repo, branch));
      if (refRes.ok && refRes.data?.object?.sha) {
        return { ok: true, sha: refRes.data.object.sha, rateLimit: refRes.rateLimit };
      }
      if (refRes.ok) {
        return errorResult("parse", 200, refRes.rateLimit, "ref 响应缺少 commit SHA");
      }
      if (refRes.error?.kind !== "not_found") return refRes;

      const commitRes = await request(buildCommitApiUrl(owner, repo, branch));
      if (!commitRes.ok) return commitRes;
      if (!commitRes.data?.sha) {
        return errorResult("parse", 200, commitRes.rateLimit, "commit 响应缺少 SHA");
      }
      return { ok: true, sha: commitRes.data.sha, rateLimit: commitRes.rateLimit };
    },

    async getContents(owner, repo, path, ref) {
      const res = await request(buildContentsApiUrl(owner, repo, path, ref));
      if (!res.ok) return res;

      if (Array.isArray(res.data)) {
        return {
          ok: true,
          kind: "dir",
          htmlUrl: buildTreeUrl(owner, repo, ref, path),
          rateLimit: res.rateLimit,
        };
      }

      const type = res.data?.type;
      return {
        ok: true,
        kind: type === "submodule" ? "submodule" : "file",
        htmlUrl: res.data?.html_url || "",
        rateLimit: res.rateLimit,
      };
    },

    async getTree(owner, repo, ref) {
      const res = await request(buildTreeApiUrl(owner, repo, ref));
      if (!res.ok) return res;
      return {
        ok: true,
        truncated: Boolean(res.data?.truncated),
        entries: Array.isArray(res.data?.tree) ? res.data.tree : [],
        rateLimit: res.rateLimit,
      };
    },

    async getLicense(owner, repo, ref) {
      const res = await request(buildLicenseApiUrl(owner, repo, ref));
      if (!res.ok) return res;
      return {
        ok: true,
        spdxId: res.data?.license?.spdx_id ?? null,
        path: res.data?.path || "",
        htmlUrl: res.data?.html_url || "",
        rateLimit: res.rateLimit,
      };
    },

    async getRaw(owner, repo, ref, path) {
      return request(buildRawUrl(owner, repo, ref, path), "text");
    },
  };
}
