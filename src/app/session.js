export function createCachedGateway(gateway) {
  const cache = new Map();
  const stats = { requests: 0, cached: 0, rateLimit: null };

  function remember(result) {
    if (result && result.rateLimit) stats.rateLimit = result.rateLimit;
    return result;
  }

  function cached(key, run) {
    if (cache.has(key)) {
      stats.cached += 1;
      return cache.get(key);
    }
    const promise = Promise.resolve()
      .then(run)
      .then((result) => {
        stats.requests += 1;
        return remember(result);
      })
      .catch((error) => {
        cache.delete(key);
        throw error;
      });
    cache.set(key, promise);
    return promise;
  }

  return {
    snapshotMeta: gateway.snapshotMeta || null,

    stats() {
      return { ...stats };
    },

    getRepo(owner, repo) {
      return cached(`repo:${owner}/${repo}`, () => gateway.getRepo(owner, repo));
    },

    resolveRef(owner, repo, branch) {
      return cached(`ref:${owner}/${repo}@${branch}`, () =>
        gateway.resolveRef(owner, repo, branch)
      );
    },

    getContents(owner, repo, path, ref) {
      return cached(`contents:${owner}/${repo}@${ref}/${path}`, () =>
        gateway.getContents(owner, repo, path, ref)
      );
    },

    getTree(owner, repo, ref) {
      return cached(`tree:${owner}/${repo}@${ref}`, () =>
        gateway.getTree(owner, repo, ref)
      );
    },

    getLicense(owner, repo, ref) {
      return cached(`license:${owner}/${repo}@${ref}`, () =>
        gateway.getLicense(owner, repo, ref)
      );
    },

    getRaw(owner, repo, ref, path) {
      return cached(`raw:${owner}/${repo}@${ref}/${path}`, () =>
        gateway.getRaw(owner, repo, ref, path)
      );
    },
  };
}
