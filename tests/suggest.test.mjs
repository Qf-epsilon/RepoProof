import test from "node:test";
import assert from "node:assert/strict";

import {
  extractRepoUrl,
  suggestClaimsFromText,
  suggestFromResume,
} from "../src/core/suggest.js";
import { TEMPLATES } from "../src/core/constants.js";

test("描述提取: 完整地址与中文标点", () => {
  const text =
    "使用 FastAPI 构建后端。仓库：https://github.com/owner/repo，欢迎查看。";
  assert.equal(extractRepoUrl(text), "https://github.com/owner/repo");
});

test("描述提取: .git 后缀与 /tree 路径", () => {
  assert.equal(
    extractRepoUrl("https://github.com/owner/repo.git"),
    "https://github.com/owner/repo"
  );
  assert.equal(
    extractRepoUrl("https://github.com/owner/repo/tree/main/app"),
    "https://github.com/owner/repo"
  );
});

test("描述提取: 省略协议", () => {
  assert.equal(
    extractRepoUrl("项目见 github.com/owner/repo。"),
    "https://github.com/owner/repo"
  );
});

test("描述提取: 非 GitHub 或缺失时返回 null", () => {
  assert.equal(extractRepoUrl("https://gitlab.com/owner/repo"), null);
  assert.equal(extractRepoUrl("没有链接"), null);
  assert.equal(extractRepoUrl(""), null);
});

test("描述提取: 英文句号结尾不进入 repo 名", () => {
  assert.equal(
    extractRepoUrl("See https://github.com/owner/repo."),
    "https://github.com/owner/repo"
  );
});

test("声明建议: 框架、测试与许可证", () => {
  const claims = suggestClaimsFromText(
    "使用 FastAPI 构建后端，包含 pytest 单元测试，采用 MIT 许可证。"
  );
  assert.deepEqual(
    claims.map((claim) => `${claim.template}:${claim.object}`),
    ["framework:fastapi", "tests:tests/", "license:MIT"]
  );
});

test("声明建议: MIT 不匹配 commit 中的字母", () => {
  const claims = suggestClaimsFromText("每次 commit 都写清楚说明。");
  assert.equal(claims.some((claim) => claim.template === "license"), false);
});

test("声明建议: Apache 2.0 归一为 SPDX", () => {
  const claims = suggestClaimsFromText("采用 Apache License 2.0。");
  assert.equal(claims[0].template, "license");
  assert.equal(claims[0].object, "Apache-2.0");
});

test("声明建议: Docker Compose 不再建议 Dockerfile", () => {
  const claims = suggestClaimsFromText("使用 Docker Compose 编排服务。");
  assert.deepEqual(
    claims.map((claim) => claim.object),
    ["docker-compose.yml"]
  );
});

test("声明建议: 同一对象不重复添加", () => {
  const claims = suggestClaimsFromText("FastAPI 和 fastapi 都在描述里。");
  assert.equal(claims.filter((claim) => claim.object === "fastapi").length, 1);
});

test("声明建议: 最多 6 条", () => {
  const claims = suggestClaimsFromText(
    "FastAPI + Django + Flask + React + Vue + Express + Docker + Redis + MIT"
  );
  assert.equal(claims.length, 6);
});

test("声明建议: 无关键词时为空", () => {
  assert.deepEqual(suggestClaimsFromText("参与了一个课程项目。"), []);
});

test("描述提取: 仓库地址与声明一次返回", () => {
  const result = suggestFromResume(
    "使用 React 和 TypeScript，采用 MIT。https://github.com/owner/repo"
  );
  assert.equal(result.repoUrl, "https://github.com/owner/repo");
  assert.deepEqual(
    result.claims.map((claim) => claim.object),
    ["react", "typescript", "MIT"]
  );
});

test("声明建议: 每条建议的模板都存在于 TEMPLATES", () => {
  const ids = new Set(TEMPLATES.map((template) => template.id));
  const samples = [
    "FastAPI",
    "Docker Compose",
    "GitHub Actions",
    "README 文档",
    "Redis",
    "pytest",
    "Apache 2.0",
  ];
  for (const text of samples) {
    for (const claim of suggestClaimsFromText(text)) {
      assert.ok(ids.has(claim.template), `${claim.template} 不是可用的模板`);
    }
  }
});