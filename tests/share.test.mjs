import test from "node:test";
import assert from "node:assert/strict";

import {
  buildShareLink,
  decodeShare,
  encodeShare,
} from "../src/app/share.js";
import { BOUNDARY, STATE } from "../src/core/constants.js";

function claim(overrides = {}) {
  return {
    claimId: "c1",
    claimText: "使用 FastAPI 构建后端",
    object: "fastapi",
    rule: "R2",
    state: STATE.FOUND,
    explanation: "在依赖清单中找到声明。",
    supports: ["依赖清单里声明了该包"],
    doesNotSupport: ["实际调用", "个人贡献"],
    evidence: [
      {
        type: "manifest",
        source: "manifest",
        path: "backend/pyproject.toml",
        line: 12,
        package: "fastapi",
        group: "dependencies",
        url: "https://github.com/owner/repo/blob/sha/backend/pyproject.toml#L12",
        snippet: "fastapi>=0.115",
      },
    ],
    order: 0,
    ...overrides,
  };
}

function report(overrides = {}) {
  return {
    reportVersion: 1,
    generatedAt: "2026-11-27T10:00:00.000Z",
    repo: {
      owner: "owner",
      name: "repo",
      htmlUrl: "https://github.com/owner/repo",
      defaultBranch: "main",
      commitSha: "abcdef1234567890",
      ref: "abcdef1234567890",
      evidencePinned: true,
      queriedAt: "2026-11-27T09:59:00.000Z",
    },
    claims: [claim()],
    summary: { found: 1, insufficient: 0, inconsistent: 0, unable: 0 },
    boundary: "旧边界文案",
    ...overrides,
  };
}

function encodeRaw(payload) {
  const text = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

test("分享链接: 编解码保留声明、证据与边界", () => {
  const encoded = encodeShare(report(), "live");
  assert.ok(encoded);

  const shared = decodeShare(encoded);
  assert.equal(shared.mode, "live");
  assert.equal(shared.report.boundary, BOUNDARY);
  assert.equal(shared.report.claims.length, 1);

  const [decoded] = shared.report.claims;
  assert.equal(decoded.claimText, "使用 FastAPI 构建后端");
  assert.equal(decoded.state, STATE.FOUND);
  assert.equal(decoded.evidence[0].url, claim().evidence[0].url);
  assert.equal(decoded.evidence[0].line, 12);
  assert.equal(decoded.evidence[0].package, "fastapi");
});

test("分享链接: 汇总按声明重算，不信任外部数据", () => {
  const encoded = encodeShare(
    report({
      claims: [
        claim({ claimId: "a", state: STATE.INSUFFICIENT }),
        claim({ claimId: "b", object: "tests/", rule: "R1", state: STATE.UNABLE }),
      ],
    }),
    "live"
  );
  const shared = decodeShare(encoded);
  assert.deepEqual(shared.report.summary, {
    found: 0,
    insufficient: 1,
    inconsistent: 0,
    unable: 1,
  });
});

test("分享链接: 非 GitHub 证据链接不进入结果", () => {
  const unsafe = claim({
    evidence: [
      {
        type: "path",
        path: "README.md",
        kind: "file",
        url: "javascript:alert(1)",
      },
    ],
  });
  const shared = decodeShare(encodeShare(report({ claims: [unsafe] }), "live"));
  assert.ok(shared);
  assert.equal(shared.report.claims[0].evidence[0].url, undefined);
});

test("分享链接: 仓库地址不是 GitHub 时拒绝生成", () => {
  const encoded = encodeShare(
    report({
      repo: {
        owner: "owner",
        name: "repo",
        htmlUrl: "https://example.com/owner/repo",
        defaultBranch: "main",
        commitSha: "",
        ref: "main",
        evidencePinned: false,
        queriedAt: "",
      },
    }),
    "live"
  );
  assert.equal(encoded, null);
});

test("分享链接: 版本不符或损坏时返回 null", () => {
  const payload = {
    v: 2,
    m: "live",
    r: { u: "https://github.com/owner/repo" },
    c: [{ t: "声明", r: "R1", o: "README.md", s: "found" }],
  };
  assert.equal(decodeShare(encodeRaw(payload)), null);
  assert.equal(decodeShare("not-base64!!"), null);
  assert.equal(decodeShare(""), null);
});

test("分享链接: 非法声明被跳过，全非法时返回 null", () => {
  const mixed = {
    v: 1,
    m: "live",
    r: { o: "owner", n: "repo", u: "https://github.com/owner/repo" },
    c: [
      { i: "ok", t: "有文档", r: "R1", o: "README.md", s: "found" },
      { i: "bad-state", t: "坏状态", r: "R1", o: "x", s: "weird" },
      { i: "bad-rule", t: "坏规则", r: "R9", o: "x", s: "found" },
    ],
  };
  const shared = decodeShare(encodeRaw(mixed));
  assert.equal(shared.report.claims.length, 1);
  assert.equal(shared.report.claims[0].claimId, "ok");

  const allBad = { ...mixed, c: [mixed.c[1], mixed.c[2]] };
  assert.equal(decodeShare(encodeRaw(allBad)), null);
});

test("分享链接: 内容超长时拒绝生成", () => {
  const big = Array.from({ length: 20 }, (_, index) =>
    claim({
      claimId: `c${index}`,
      claimText: "很长的声明".repeat(50),
      supports: Array.from({ length: 8 }, () => "支持说明".repeat(50)),
      doesNotSupport: Array.from({ length: 8 }, () => "边界说明".repeat(50)),
      evidence: [
        {
          type: "manifest",
          path: "package.json",
          package: "react",
          group: "dependencies",
          line: 1,
          url: "https://github.com/owner/repo/blob/sha/package.json#L1",
          snippet: "x".repeat(200),
        },
      ],
    })
  );
  assert.equal(encodeShare(report({ claims: big }), "live"), null);
});

test("分享链接: 地址带 #r= 片段", () => {
  const link = buildShareLink(
    { origin: "https://example.org", pathname: "/app/" },
    "abc_-123"
  );
  assert.equal(link, "https://example.org/app/#r=abc_-123");
});

test("分享链接: 案例模式来源被保留", () => {
  const encoded = encodeShare(report(), "case");
  const shared = decodeShare(encoded);
  assert.equal(shared.mode, "case");
  assert.equal(shared.report.claims.length, 1);
});