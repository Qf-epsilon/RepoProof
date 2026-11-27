import { createSnapshotGateway } from "../adapters/snapshot.js";
import { CASES } from "../data/cases/index.js";
import { createCachedGateway } from "./session.js";
import { buildClaimReport, loadRepository, verifyClaims } from "./usecases.js";

const byId = new Map(CASES.map((snapshot) => [snapshot.meta.id, snapshot]));

export function listCases() {
  return CASES.map((snapshot) => ({
    id: snapshot.meta.id,
    label: snapshot.meta.label,
    note: snapshot.meta.note,
    repo: `${snapshot.repo.owner}/${snapshot.repo.name}`,
    htmlUrl: snapshot.repo.htmlUrl,
    commit: snapshot.repo.commitSha,
    snapshotDate: snapshot.meta.snapshotDate,
    claimCount: snapshot.claims.length,
    expected: snapshot.meta.expectedSummary,
  }));
}

export async function runCase(id) {
  const snapshot = byId.get(id);
  if (!snapshot) {
    return { ok: false, error: { kind: "input", message: "未知案例。" } };
  }

  const gateway = createCachedGateway(createSnapshotGateway(snapshot));
  const loaded = await loadRepository(gateway, snapshot.repo.htmlUrl);
  if (!loaded.ok) return loaded;

  const { results, notices } = await verifyClaims({
    gateway,
    repo: loaded.repo,
    claims: snapshot.claims,
    inventory: loaded.inventory,
  });

  return {
    ok: true,
    mode: "case",
    caseId: id,
    meta: snapshot.meta,
    repo: loaded.repo,
    inventory: loaded.inventory,
    license: loaded.license,
    notices: [`案例快照固定到提交 ${snapshot.repo.commitSha.slice(0, 7)}，本次核验不发起网络请求。`, ...loaded.notices, ...notices],
    gateway,
    claims: snapshot.claims,
    results,
    report: buildClaimReport(loaded.repo, results),
    stats: gateway.stats(),
  };
}