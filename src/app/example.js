import { createSnapshotGateway } from "../adapters/snapshot.js";
import { EXAMPLE_SNAPSHOT } from "../data/example-snapshot.js";
import { createCachedGateway } from "./session.js";
import { buildClaimReport, loadRepository, verifyClaims } from "./usecases.js";

export async function runExample() {
  const gateway = createCachedGateway(createSnapshotGateway(EXAMPLE_SNAPSHOT));
  const loaded = await loadRepository(gateway, EXAMPLE_SNAPSHOT.repo.htmlUrl);
  if (!loaded.ok) return loaded;

  const { results, notices } = await verifyClaims({
    gateway,
    repo: loaded.repo,
    claims: EXAMPLE_SNAPSHOT.claims,
    inventory: loaded.inventory,
  });

  return {
    ok: true,
    mode: "example",
    meta: EXAMPLE_SNAPSHOT.meta,
    repo: loaded.repo,
    inventory: loaded.inventory,
    license: loaded.license,
    notices: [...loaded.notices, ...notices],
    results,
    report: buildClaimReport(loaded.repo, results),
    stats: gateway.stats(),
  };
}
