import test from "node:test";
import assert from "node:assert/strict";

import { createCachedGateway } from "../src/app/session.js";
import { loadRepository, verifyClaims, buildClaimReport } from "../src/app/usecases.js";
import { buildEvidenceSheet, evidenceSheetFilename } from "../src/app/export.js";
import { runExample } from "../src/app/example.js";
import { STATE } from "../src/core/constants.js";

const SHA = "abc1234567890";

function fakeGateway(overrides = {}) {
  const calls = [];
  const base = {
    calls,
    async getRepo(owner, repo) {
      calls.push(["getRepo", owner, repo]);
      return {
        ok: true,
        data: {
          owner,
          name: repo,
          defaultBranch: "main",
          private: false,
          htmlUrl: `https://github.com/${owner}/${repo}`,
          lastCommitAt: "2026-11-01T00:00:00Z",
          license: { spdxId: "MIT", name: "MIT License" },
        },
      };
    },
    async resolveRef() {
      calls.push(["resolveRef"]);
      return { ok: true, sha: SHA };
    },
    async getContents() {
      calls.push(["getContents"]);
      return { ok: true, kind: "dir", htmlUrl: "" };
    },
    async getTree() {
      calls.push(["getTree"]);
      return {
        ok: true,
        truncated: false,
        entries: [
          { path: "requirements.txt", type: "blob" },
          { path: "tests/test_app.py", type: "blob" },
        ],
      };
    },
    async getLicense() {
      calls.push(["getLicense"]);
      return {
        ok: true,
        spdxId: "MIT",
        path: "LICENSE",
        htmlUrl: `https://github.com/o/r/blob/${SHA}/LICENSE`,
      };
    },
    async getRaw(_owner, _repo, _ref, path) {
      calls.push(["getRaw", path]);
      return { ok: true, text: "fastapi==0.115.0\npytest==8.0.0\n" };
    },
  };
  return Object.assign(base, overrides);
}

test("loadRepository: 非法地址 -> input 错误", async () => {
  const result = await loadRepository(fakeGateway(), "https://gitlab.com/a/b");
  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "input");
});

test("loadRepository: 仓库 404 -> not_found 文案", async () => {
  const gateway = fakeGateway({
    async getRepo() {
      return { ok: false, error: { kind: "not_found", status: 404 } };
    },
  });
  const result = await loadRepository(gateway, "https://github.com/a/b");
  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "not_found");
  assert.match(result.error.message, /不是公开仓库/);
});

test("loadRepository: 私有仓库 -> private 错误", async () => {
  const gateway = fakeGateway({
    async getRepo(owner, repo) {
      return {
        ok: true,
        data: {
          owner,
          name: repo,
          defaultBranch: "main",
          private: true,
          htmlUrl: `https://github.com/${owner}/${repo}`,
          license: null,
        },
      };
    },
  });
  const result = await loadRepository(gateway, "https://github.com/a/b");
  assert.equal(result.ok, false);
  assert.equal(result.error.kind, "private");
});

test("loadRepository: 固定 SHA、清点清单、读取许可证", async () => {
  const result = await loadRepository(fakeGateway(), "https://github.com/o/r");
  assert.equal(result.ok, true);
  assert.equal(result.repo.commitSha, SHA);
  assert.equal(result.repo.ref, SHA);
  assert.equal(result.repo.evidencePinned, true);
  assert.equal(result.inventory.ok, true);
  assert.deepEqual(result.inventory.manifestPaths, ["requirements.txt"]);
  assert.equal(result.license.ok, true);
  assert.equal(result.license.spdxId, "MIT");
  assert.equal(result.notices.length, 0);
});

test("loadRepository: 许可证证据固定到当前 SHA", async () => {
  const gateway = fakeGateway({
    async getLicense() {
      return {
        ok: true,
        spdxId: "MIT",
        path: "LICENSE",
        htmlUrl: "https://github.com/o/r/blob/main/LICENSE",
      };
    },
  });
  const result = await loadRepository(gateway, "https://github.com/o/r");
  assert.equal(result.license.ok, true);
  assert.equal(result.license.htmlUrl, `https://github.com/o/r/blob/${SHA}/LICENSE`);
});

test("loadRepository: SHA 解析失败 -> 回退分支并写明缺口", async () => {
  const gateway = fakeGateway({
    async resolveRef() {
      return { ok: false, error: { kind: "rate_limited", status: 429 } };
    },
  });
  const result = await loadRepository(gateway, "https://github.com/o/r");
  assert.equal(result.ok, true);
  assert.equal(result.repo.evidencePinned, false);
  assert.equal(result.repo.ref, "main");
  assert.ok(result.notices.some((item) => item.includes("未固定")));
});

test("loadRepository: 许可证 API 失败 -> 回退仓库元数据", async () => {
  const gateway = fakeGateway({
    async getLicense() {
      return { ok: false, error: { kind: "server", status: 500 } };
    },
  });
  const result = await loadRepository(gateway, "https://github.com/o/r");
  assert.equal(result.ok, true);
  assert.equal(result.license.ok, true);
  assert.equal(result.license.spdxId, "MIT");
  assert.match(result.license.htmlUrl, new RegExp(`/blob/${SHA}/LICENSE`));
});

test("verifyClaims: R1 / R2 / R3 分别走对应数据源", async () => {
  const gateway = fakeGateway();
  const loaded = await loadRepository(gateway, "https://github.com/o/r");
  const claims = [
    { id: "c1", text: "包含自动化测试", rule: "R1", object: "tests/" },
    { id: "c2", text: "使用 FastAPI", rule: "R2", object: "fastapi" },
    { id: "c3", text: "采用 MIT", rule: "R3", object: "MIT" },
  ];
  const { results } = await verifyClaims({
    gateway,
    repo: loaded.repo,
    claims,
    inventory: loaded.inventory,
  });

  assert.equal(results.length, 3);
  assert.equal(results[0].state, STATE.FOUND);
  assert.equal(results[1].state, STATE.FOUND);
  assert.equal(results[1].evidence[0].path, "requirements.txt");
  assert.equal(results[1].evidence[0].line, 1);
  assert.equal(results[2].state, STATE.FOUND);
  assert.ok(gateway.calls.some((call) => call[0] === "getRaw" && call[1] === "requirements.txt"));
});

test("verifyClaims: R2 指定清单路径优先于自动清点", async () => {
  const gateway = fakeGateway();
  const loaded = await loadRepository(gateway, "https://github.com/o/r");
  await verifyClaims({
    gateway,
    repo: loaded.repo,
    claims: [
      {
        id: "c1",
        text: "使用 FastAPI",
        rule: "R2",
        object: "fastapi",
        manifests: ["backend/pyproject.toml"],
      },
    ],
    inventory: loaded.inventory,
  });
  const rawCalls = gateway.calls.filter((call) => call[0] === "getRaw");
  assert.deepEqual(rawCalls.map((call) => call[1]), ["backend/pyproject.toml"]);
});

test("verifyClaims: R2 无清单可用 -> 证据不足，不当作未声明", async () => {
  const gateway = fakeGateway({
    async getTree() {
      return { ok: true, truncated: false, entries: [{ path: "README.md", type: "blob" }] };
    },
  });
  const loaded = await loadRepository(gateway, "https://github.com/o/r");
  const { results } = await verifyClaims({
    gateway,
    repo: loaded.repo,
    claims: [{ id: "c1", text: "使用 FastAPI", rule: "R2", object: "fastapi" }],
    inventory: loaded.inventory,
  });
  assert.equal(results[0].state, STATE.INSUFFICIENT);
  assert.ok(results[0].doesNotSupport.includes("依赖未使用"));
});

test("buildClaimReport: 只按四态计数并保留边界", async () => {
  const gateway = fakeGateway();
  const loaded = await loadRepository(gateway, "https://github.com/o/r");
  const { results } = await verifyClaims({
    gateway,
    repo: loaded.repo,
    claims: [
      { id: "c1", text: "包含测试", rule: "R1", object: "tests/" },
      { id: "c2", text: "采用 Apache-2.0", rule: "R3", object: "Apache-2.0" },
    ],
    inventory: loaded.inventory,
  });
  const report = buildClaimReport(loaded.repo, results);
  assert.deepEqual(report.summary, { found: 1, insufficient: 0, inconsistent: 1, unable: 0 });
  assert.equal(report.repo.commitSha, SHA);
  assert.ok(report.boundary.includes("不判断个人贡献"));
  assert.deepEqual(Object.keys(report.summary).sort(), [
    "found",
    "inconsistent",
    "insufficient",
    "unable",
  ]);
});

test("createCachedGateway: 相同请求只发一次", async () => {
  const gateway = fakeGateway();
  const cached = createCachedGateway(gateway);
  await cached.getRepo("o", "r");
  await cached.getRepo("o", "r");
  await cached.getRaw("o", "r", SHA, "requirements.txt");
  await cached.getRaw("o", "r", SHA, "requirements.txt");
  assert.equal(gateway.calls.filter((call) => call[0] === "getRepo").length, 1);
  assert.equal(gateway.calls.filter((call) => call[0] === "getRaw").length, 1);
});

test("runExample: 快照复现四态且固定到 commit", async () => {
  const result = await runExample();
  assert.equal(result.ok, true);
  assert.equal(result.repo.evidencePinned, true);
  assert.equal(result.report.claims.length, 4);
  const states = new Set(result.report.claims.map((claim) => claim.state));
  assert.deepEqual(
    [...states].sort(),
    ["found", "inconsistent", "insufficient", "unable"]
  );
  assert.equal(result.stats.requests > 0, true);
});

test("证据单: 四态、固定提交与边界写入 Markdown", async () => {
  const example = await runExample();
  const sheet = buildEvidenceSheet({
    report: example.report,
    mode: "example",
    siteUrl: "https://repoproof.test",
  });
  assert.match(sheet, /^# RepoProof 证据单/);
  assert.ok(sheet.includes("示例快照"));
  assert.ok(sheet.includes(example.report.repo.commitSha));
  assert.ok(sheet.includes("（证据链接固定到该提交）"));
  assert.ok(!sheet.includes("未找到公开证据"));
  assert.ok(sheet.includes(example.report.boundary));
  assert.ok(sheet.includes("由 RepoProof 生成：https://repoproof.test"));
  assert.match(
    sheet,
    /https:\/\/github\.com\/fastapi\/full-stack-fastapi-template\/blob\/77e550a/
  );

  const labels = ["元数据不一致", "公开证据不足", "无法完成核验", "发现公开证据"];
  const positions = labels.map((label) => sheet.indexOf(label));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test("证据单: 文件名用短 SHA，未固定时回退分支", async () => {
  const example = await runExample();
  assert.equal(
    evidenceSheetFilename(example.report.repo),
    "repoproof-fastapi-full-stack-fastapi-template-77e550a.md"
  );
  assert.equal(
    evidenceSheetFilename({ owner: "o", name: "r", evidencePinned: false, ref: "main" }),
    "repoproof-o-r-main.md"
  );

  const sheet = buildEvidenceSheet({
    report: {
      generatedAt: "2026-11-25T00:00:00Z",
      repo: {
        owner: "o",
        name: "r",
        ref: "main",
        evidencePinned: false,
        queriedAt: "2026-11-25T00:00:00Z",
      },
      summary: { found: 0, insufficient: 0, inconsistent: 0, unable: 0 },
      claims: [],
      boundary: "边界",
    },
  });
  assert.ok(sheet.includes("未能固定到提交"));
  assert.ok(sheet.includes("GitHub 公开 API"));
});
