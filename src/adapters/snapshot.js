import { buildBlobUrl, buildTreeUrl } from "../core/url.js";

function cleanPath(path) {
  return String(path || "").replace(/^\/+|\/+$/g, "");
}

export function createSnapshotGateway(snapshot) {
  const { owner, name, commitSha } = snapshot.repo;
  const rateLimitedPaths = new Set(
    ((snapshot.simulated && snapshot.simulated.rateLimitedPaths) || []).map(cleanPath)
  );
  const fileEntries = new Map(
    snapshot.tree.entries
      .filter((entry) => entry.type === "blob")
      .map((entry) => [entry.path, entry])
  );

  return {
    snapshotMeta: snapshot.meta,

    async getRepo() {
      return { ok: true, data: snapshot.repo, rateLimit: null };
    },

    async resolveRef() {
      return { ok: true, sha: commitSha, rateLimit: null };
    },

    async getContents(_owner, _repo, path) {
      const clean = cleanPath(path);
      if (rateLimitedPaths.has(clean)) {
        return {
          ok: false,
          error: {
            kind: "rate_limited",
            status: 429,
            rateLimit: { remaining: "0" },
            message: "快照模拟 429，用于演示“无法完成核验”。",
          },
          rateLimit: { remaining: "0" },
        };
      }

      const file = fileEntries.get(clean);
      if (file) {
        return {
          ok: true,
          kind: "file",
          htmlUrl: buildBlobUrl(owner, name, commitSha, clean),
          rateLimit: null,
        };
      }

      const dirPrefix = clean ? `${clean}/` : "";
      const hasDir = snapshot.tree.entries.some(
        (entry) => entry.type === "blob" && entry.path.startsWith(dirPrefix)
      );
      if (hasDir) {
        return {
          ok: true,
          kind: "dir",
          htmlUrl: buildTreeUrl(owner, name, commitSha, clean),
          rateLimit: null,
        };
      }

      return {
        ok: false,
        error: { kind: "not_found", status: 404, rateLimit: null, message: "" },
        rateLimit: null,
      };
    },

    async getTree() {
      return {
        ok: true,
        truncated: Boolean(snapshot.tree.truncated),
        entries: snapshot.tree.entries,
        rateLimit: null,
      };
    },

    async getLicense() {
      return { ...snapshot.license, rateLimit: null };
    },

    async getRaw(_owner, _repo, _ref, path) {
      const clean = cleanPath(path);
      const text = snapshot.raw[clean];
      if (typeof text === "string") {
        return { ok: true, text, rateLimit: null };
      }
      return {
        ok: false,
        error: { kind: "not_found", status: 404, rateLimit: null, message: "" },
        rateLimit: null,
      };
    },
  };
}
