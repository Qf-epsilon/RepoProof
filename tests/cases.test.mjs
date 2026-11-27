import test from "node:test";
import assert from "node:assert/strict";

import { listCases, runCase } from "../src/app/cases.js";
import { CASES } from "../src/data/cases/index.js";
import { STATE } from "../src/core/constants.js";
import { summarize } from "../src/core/state.js";
import { createSnapshotGateway } from "../src/adapters/snapshot.js";

test("案例库: 至少 3 个案例且 id 唯一", () => {
  const list = listCases();
  assert.ok(list.length >= 3);
  const ids = new Set(list.map((item) => item.id));
  assert.equal(ids.size, list.length);
});

for (const snapshot of CASES) {
  const info = snapshot.meta;

  test(`案例 ${info.id}: 快照可复现且与录制结果一致`, async () => {
    const result = await runCase(info.id);
    assert.equal(result.ok, true);
    assert.equal(result.repo.commitSha, snapshot.repo.commitSha);
    assert.equal(result.results.length, snapshot.claims.length);
    assert.deepEqual(summarize(result.results), info.expectedSummary);
    assert.deepEqual(
      result.results.map((item) => ({ id: item.claimId, state: item.state })),
      info.expectedStates
    );
    for (const item of result.results) {
      assert.ok(Object.values(STATE).includes(item.state));
      for (const evidence of item.evidence || []) {
        if (evidence.url) {
          assert.match(evidence.url, /^https:\/\/(github\.com|raw\.githubusercontent\.com)\//);
        }
      }
    }
  });
}

test("案例库: 未知案例返回错误", async () => {
  const result = await runCase("does-not-exist");
  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "input");
});

test("快照网关: 429 由数据配置，而非写死路径", async () => {
  const snapshot = structuredClone(CASES[1]);
  snapshot.simulated = { rateLimitedPaths: ["package.json"] };
  const gateway = createSnapshotGateway(snapshot);
  const limited = await gateway.getContents("o", "r", "package.json");
  assert.equal(limited.ok, false);
  assert.equal(limited.error.kind, "rate_limited");
  const normal = await gateway.getContents("o", "r", "Readme.md");
  assert.equal(normal.ok, true);
});