import test from "node:test";
import assert from "node:assert/strict";

import { EXAMPLE_SNAPSHOT } from "../src/data/example-snapshot.js";
import { createSnapshotGateway } from "../src/adapters/snapshot.js";
import { BOUNDARY, STATE } from "../src/core/constants.js";
import { buildReport } from "../src/core/report.js";
import { buildInventory } from "../src/core/rules/r4.js";
import { verifyDependency } from "../src/core/rules/r2.js";
import { verifyLicense } from "../src/core/rules/r3.js";
import { verifyPath } from "../src/core/rules/r1.js";
import { makeResult, sortResults, summarize } from "../src/core/state.js";
import {
  buildContentsApiUrl,
  buildRawUrl,
  parseRepoUrl,
} from "../src/core/url.js";

const RAW = EXAMPLE_SNAPSHOT.raw;
const REPO = EXAMPLE_SNAPSHOT.repo;
const SHA = REPO.commitSha;

function okContents(kind = "file") {
  return {
    ok: true,
    kind,
    htmlUrl: "https://github.com/example/repo/blob/sha/path",
    rateLimit: null,
  };
}

function errContents(kind) {
  return { ok: false, error: { kind, status: 0, rateLimit: null }, rateLimit: null };
}

function verifyR1(object, contents) {
  return verifyPath({
    claimId: "t",
    claimText: "测试声明",
    object,
    owner: "example",
    repo: "repo",
    ref: "sha",
    contents,
  });
}

test("URL: 解析标准 GitHub 仓库地址", () => {
  assert.deepEqual(parseRepoUrl("https://github.com/fastapi/full-stack-fastapi-template"), {
    owner: "fastapi",
    repo: "full-stack-fastapi-template",
    canonicalUrl: "https://github.com/fastapi/full-stack-fastapi-template",
  });
});

test("URL: 接受 .git 后缀和 /tree 路径", () => {
  const parsed = parseRepoUrl("https://github.com/owner/repo.git/tree/main/app");
  assert.equal(parsed.owner, "owner");
  assert.equal(parsed.repo, "repo");
});

test("URL: 拒绝非 GitHub 域名", () => {
  assert.throws(() => parseRepoUrl("https://gitlab.com/owner/repo"), /github\.com/);
});

test("URL: 路径逐段编码，保留斜杠", () => {
  const url = buildContentsApiUrl("o", "r", "docs/中文 文件.md", "a/b");
  assert.match(url, /docs\/%E4%B8%AD%E6%96%87%20%E6%96%87%E4%BB%B6\.md/);
  assert.match(url, /ref=a%2Fb/);
});

test("URL: raw 地址使用固定 ref", () => {
  const url = buildRawUrl("o", "r", "abc123", "backend/pyproject.toml");
  assert.equal(url, "https://raw.githubusercontent.com/o/r/abc123/backend/pyproject.toml");
});

test("R1: 文件 200 -> 发现公开证据", () => {
  const result = verifyR1("backend/pyproject.toml", okContents("file"));
  assert.equal(result.state, STATE.FOUND);
  assert.equal(result.evidence[0].type, "path");
});

test("R1: 路径 404 -> 公开证据不足，不写文件不存在", () => {
  const result = verifyR1("tests/", errContents("not_found"));
  assert.equal(result.state, STATE.INSUFFICIENT);
  assert.match(result.explanation, /不代表文件不存在/);
  assert.equal(result.evidence.length, 0);
});

test("R1: 429 -> 无法完成核验", () => {
  const result = verifyR1(".github/workflows/", errContents("rate_limited"));
  assert.equal(result.state, STATE.UNABLE);
});

test("R2: pyproject.toml 命中 fastapi（含 extras）", () => {
  const result = verifyDependency({
    claimId: "t",
    claimText: "项目使用 FastAPI",
    object: "fastapi",
    owner: "o",
    repo: "r",
    ref: SHA,
    manifests: [{ path: "backend/pyproject.toml", text: RAW["backend/pyproject.toml"] }],
  });
  assert.equal(result.state, STATE.FOUND);
  assert.match(result.evidence[0].snippet, /fastapi\[standard\]/);
});

test("R2: PEP 735 dependency-groups 命中 pytest", () => {
  const result = verifyDependency({
    claimId: "t",
    claimText: "项目包含测试工具",
    object: "pytest",
    owner: "o",
    repo: "r",
    ref: SHA,
    manifests: [{ path: "backend/pyproject.toml", text: RAW["backend/pyproject.toml"] }],
  });
  assert.equal(result.state, STATE.FOUND);
  assert.match(result.evidence[0].group, /dependency-groups\.dev/);
});

test("R2: package.json 命中 devDependencies", () => {
  const result = verifyDependency({
    claimId: "t",
    claimText: "项目使用 Vite",
    object: "vite",
    owner: "o",
    repo: "r",
    ref: SHA,
    manifests: [{ path: "frontend/package.json", text: RAW["frontend/package.json"] }],
  });
  assert.equal(result.state, STATE.FOUND);
  assert.equal(result.evidence[0].group, "开发依赖");
});

test("R2: requirements.txt 命中带 extras 的包", () => {
  const result = verifyDependency({
    claimId: "t",
    claimText: "项目使用 uvicorn",
    object: "uvicorn",
    owner: "o",
    repo: "r",
    ref: SHA,
    manifests: [{ path: "requirements.txt", text: "uvicorn[standard]>=0.20\nfastapi==0.110.0\n" }],
  });
  assert.equal(result.state, STATE.FOUND);
  assert.match(result.evidence[0].snippet, /uvicorn\[standard\]/);
});

test("R2: 清单可读但未声明 -> 公开证据不足", () => {
  const result = verifyDependency({
    claimId: "t",
    claimText: "项目使用不存在包",
    object: "not-a-real-package",
    owner: "o",
    repo: "r",
    ref: SHA,
    manifests: [{ path: "requirements.txt", text: "fastapi==0.110.0\n" }],
  });
  assert.equal(result.state, STATE.INSUFFICIENT);
});

test("R2: 清单不可读且无命中 -> 无法完成核验", () => {
  const result = verifyDependency({
    claimId: "t",
    claimText: "项目使用 fastapi",
    object: "fastapi",
    owner: "o",
    repo: "r",
    ref: SHA,
    manifests: [{ path: "requirements.txt", error: { kind: "rate_limited" } }],
  });
  assert.equal(result.state, STATE.UNABLE);
});

test("R2: 多清单中一个命中、一个不可读 -> 发现证据并说明缺口", () => {
  const result = verifyDependency({
    claimId: "t",
    claimText: "项目使用 fastapi",
    object: "fastapi",
    owner: "o",
    repo: "r",
    ref: SHA,
    manifests: [
      { path: "backend/pyproject.toml", text: RAW["backend/pyproject.toml"] },
      { path: "frontend/package.json", error: { kind: "rate_limited" } },
    ],
  });
  assert.equal(result.state, STATE.FOUND);
  assert.match(result.explanation, /未能读取/);
});

test("R2: Maven 坐标按 artifactId 匹配", () => {
  const pom = `<project><dependencies><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency></dependencies></project>`;
  const result = verifyDependency({
    claimId: "t",
    claimText: "项目使用 Spring Boot Web",
    object: "spring-boot-starter-web",
    owner: "o",
    repo: "r",
    ref: SHA,
    manifests: [{ path: "pom.xml", text: pom }],
  });
  assert.equal(result.state, STATE.FOUND);
});

test("R2: go.mod 的 require 块命中", () => {
  const gomod = "module example.com/app\n\ngo 1.22\n\nrequire (\n  github.com/gin-gonic/gin v1.10.0\n  golang.org/x/text v0.14.0 // indirect\n)\n";
  const result = verifyDependency({
    claimId: "t",
    claimText: "项目使用 Gin",
    object: "github.com/gin-gonic/gin",
    owner: "o",
    repo: "r",
    ref: SHA,
    manifests: [{ path: "go.mod", text: gomod }],
  });
  assert.equal(result.state, STATE.FOUND);
});

test("R3: SPDX 相同 -> 发现公开证据", () => {
  const result = verifyLicense({
    claimId: "t",
    claimText: "项目采用 MIT",
    object: "MIT",
    owner: "o",
    repo: "r",
    ref: SHA,
    license: { ok: true, spdxId: "MIT", path: "LICENSE", htmlUrl: "https://github.com/o/r/blob/sha/LICENSE" },
  });
  assert.equal(result.state, STATE.FOUND);
});

test("R3: SPDX 冲突 -> 元数据不一致", () => {
  const result = verifyLicense({
    claimId: "t",
    claimText: "项目采用 Apache-2.0",
    object: "Apache-2.0",
    owner: "o",
    repo: "r",
    ref: SHA,
    license: { ok: true, spdxId: "MIT", path: "LICENSE", htmlUrl: "https://github.com/o/r/blob/sha/LICENSE" },
  });
  assert.equal(result.state, STATE.INCONSISTENT);
});

test("R3: license null -> 公开证据不足", () => {
  const result = verifyLicense({
    claimId: "t",
    claimText: "项目采用 MIT",
    object: "MIT",
    owner: "o",
    repo: "r",
    ref: SHA,
    license: { ok: true, spdxId: null, path: "", htmlUrl: "" },
  });
  assert.equal(result.state, STATE.INSUFFICIENT);
});

test("R3: NOASSERTION -> 公开证据不足", () => {
  const result = verifyLicense({
    claimId: "t",
    claimText: "项目采用 MIT",
    object: "MIT",
    owner: "o",
    repo: "r",
    ref: SHA,
    license: { ok: true, spdxId: "NOASSERTION", path: "LICENSE", htmlUrl: "" },
  });
  assert.equal(result.state, STATE.INSUFFICIENT);
});

test("R3: 弃用 SPDX -> 无法完成核验", () => {
  const result = verifyLicense({
    claimId: "t",
    claimText: "项目采用 GPL-2.0",
    object: "GPL-2.0",
    owner: "o",
    repo: "r",
    ref: SHA,
    license: { ok: true, spdxId: "MIT", path: "LICENSE", htmlUrl: "" },
  });
  assert.equal(result.state, STATE.UNABLE);
  assert.match(result.explanation, /GPL-2\.0-only/);
});

test("R4: 完整树分类并给出清单路径", () => {
  const inventory = buildInventory({
    owner: REPO.owner,
    repo: REPO.name,
    ref: SHA,
    tree: EXAMPLE_SNAPSHOT.tree,
  });
  assert.equal(inventory.ok, true);
  const manifests = inventory.categories.find((item) => item.id === "manifests");
  const tests = inventory.categories.find((item) => item.id === "tests");
  const ci = inventory.categories.find((item) => item.id === "ci");
  assert.ok(manifests.count >= 4);
  assert.ok(tests.count > 0);
  assert.ok(ci.count > 0);
  assert.ok(inventory.manifestPaths.includes("backend/pyproject.toml"));
});

test("R4: truncated -> 整块无法完成核验", () => {
  const inventory = buildInventory({
    owner: "o",
    repo: "r",
    ref: SHA,
    tree: { ok: true, truncated: true, entries: [] },
  });
  assert.equal(inventory.ok, false);
  assert.equal(inventory.state, STATE.UNABLE);
});

test("状态排序: 不一致 -> 不足 -> 无法核验 -> 发现", () => {
  const results = [
    makeResult({ claimId: "1", claimText: "", object: "", rule: "R1", state: STATE.FOUND, explanation: "", order: 0 }),
    makeResult({ claimId: "2", claimText: "", object: "", rule: "R1", state: STATE.UNABLE, explanation: "", order: 1 }),
    makeResult({ claimId: "3", claimText: "", object: "", rule: "R1", state: STATE.INSUFFICIENT, explanation: "", order: 2 }),
    makeResult({ claimId: "4", claimText: "", object: "", rule: "R1", state: STATE.INCONSISTENT, explanation: "", order: 3 }),
  ];
  assert.deepEqual(sortResults(results).map((r) => r.state), [
    STATE.INCONSISTENT,
    STATE.INSUFFICIENT,
    STATE.UNABLE,
    STATE.FOUND,
  ]);
});

test("报告: 汇总四态并保留边界原文", () => {
  const results = [
    makeResult({ claimId: "1", claimText: "", object: "", rule: "R1", state: STATE.FOUND, explanation: "", order: 0 }),
    makeResult({ claimId: "2", claimText: "", object: "", rule: "R1", state: STATE.INSUFFICIENT, explanation: "", order: 1 }),
  ];
  const summary = summarize(results);
  assert.equal(summary.found, 1);
  assert.equal(summary.insufficient, 1);

  const report = buildReport({
    repo: { owner: "o", name: "r", commitSha: SHA },
    results,
    generatedAt: "2026-11-25T00:00:00Z",
  });
  assert.equal(report.boundary, BOUNDARY);
  assert.equal(report.reportVersion, 1);
  assert.equal(report.summary.found, 1);
});

test("快照网关: 示例四态数据可复现", async () => {
  const gateway = createSnapshotGateway(EXAMPLE_SNAPSHOT);
  const repo = await gateway.getRepo();
  assert.equal(repo.data.commitSha, SHA);

  const tests = await gateway.getContents("o", "r", "tests/");
  assert.equal(tests.ok, false);
  assert.equal(tests.error.kind, "not_found");

  const ci = await gateway.getContents("o", "r", ".github/workflows/");
  assert.equal(ci.ok, false);
  assert.equal(ci.error.kind, "rate_limited");

  const raw = await gateway.getRaw("o", "r", SHA, "backend/pyproject.toml");
  assert.equal(raw.ok, true);
  assert.match(raw.text, /fastapi/);
});
