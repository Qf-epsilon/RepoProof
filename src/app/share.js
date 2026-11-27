import { BOUNDARY, STATE_META } from "../core/constants.js";
import { sortResults, summarize } from "../core/state.js";
import { isSafeGithubUrl } from "../core/url.js";

const VERSION = 1;
const MAX_ENCODED = 24000;
const MAX_CLAIMS = 20;
const MAX_EVIDENCE = 6;
const MAX_ITEMS = 8;
const RULES = new Set(["R1", "R2", "R3"]);
const EVIDENCE_TYPES = new Set(["path", "manifest", "license"]);

function clip(value, max) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max) : text;
}

function clipList(list, maxItems = MAX_ITEMS, maxLen = 200) {
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, maxItems)
    .map((item) => clip(item, maxLen))
    .filter(Boolean);
}

function base64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function compactEvidence(item) {
  const type = EVIDENCE_TYPES.has(item?.type) ? item.type : "path";
  const out = { t: type };
  if (item?.path) out.p = clip(item.path, 200);
  if (item?.url && isSafeGithubUrl(item.url)) out.u = item.url;
  if (type === "path" && item?.kind) out.k = clip(item.kind, 20);
  if (type === "manifest") {
    if (Number.isFinite(item?.line)) out.l = Math.max(0, Math.floor(item.line));
    if (item?.package) out.q = clip(item.package, 100);
    if (item?.group) out.g = clip(item.group, 50);
  }
  if (type === "license") {
    if (item?.declaredSpdx) out.d = clip(item.declaredSpdx, 40);
    if (item?.observedSpdx) out.o = clip(item.observedSpdx, 40);
  }
  if (item?.snippet) out.s = clip(item.snippet, 160);
  return out;
}

function expandEvidence(item, index) {
  const type = EVIDENCE_TYPES.has(item?.t) ? item.t : "path";
  const evidence = {
    type,
    source: type,
    path: clip(item?.p, 200) || (type === "license" ? "LICENSE" : ""),
  };
  if (item?.u && isSafeGithubUrl(item.u)) evidence.url = item.u;
  if (type === "path" && item?.k) evidence.kind = clip(item.k, 20);
  if (type === "manifest") {
    if (Number.isFinite(item?.l)) evidence.line = Math.max(0, Math.floor(item.l));
    if (item?.q) evidence.package = clip(item.q, 100);
    if (item?.g) evidence.group = clip(item.g, 50);
  }
  if (type === "license") {
    if (item?.d) evidence.declaredSpdx = clip(item.d, 40);
    if (item?.o) evidence.observedSpdx = clip(item.o, 40);
  }
  if (item?.s) evidence.snippet = clip(item.s, 160);
  if (!evidence.path && !evidence.url) return null;
  evidence.order = index;
  return evidence;
}

export function encodeShare(report, mode = "live") {
  if (!report || !report.repo || !Array.isArray(report.claims)) return null;
  const repo = report.repo;
  if (!isSafeGithubUrl(repo.htmlUrl)) return null;
  const claims = report.claims.slice(0, MAX_CLAIMS);
  if (claims.length === 0) return null;

  const payload = {
    v: VERSION,
    m: mode === "example" ? "example" : mode === "case" ? "case" : "live",
    g: clip(report.generatedAt, 40),
    r: {
      o: clip(repo.owner, 100),
      n: clip(repo.name, 100),
      u: repo.htmlUrl,
      s: clip(repo.commitSha, 60),
      f: clip(repo.ref, 60),
      b: clip(repo.defaultBranch, 60),
      p: Boolean(repo.evidencePinned),
      at: clip(repo.queriedAt, 40),
    },
    c: claims.map((claim) => ({
      i: clip(claim.claimId, 40),
      t: clip(claim.claimText, 300),
      r: claim.rule,
      o: clip(claim.object, 200),
      s: claim.state,
      e: clip(claim.explanation, 400),
      y: clipList(claim.supports),
      x: clipList(claim.doesNotSupport),
      v: (claim.evidence || []).slice(0, MAX_EVIDENCE).map(compactEvidence),
    })),
  };

  const encoded = base64UrlEncode(JSON.stringify(payload));
  return encoded.length > MAX_ENCODED ? null : encoded;
}

function decodeClaims(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_CLAIMS) return null;

  const claims = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    if (!RULES.has(entry.r)) return;
    if (!STATE_META[entry.s]) return;
    if (!entry.t) return;

    claims.push({
      claimId: clip(entry.i, 40) || `shared-${index + 1}`,
      claimText: clip(entry.t, 300),
      object: clip(entry.o, 200),
      rule: entry.r,
      state: entry.s,
      explanation: clip(entry.e, 400),
      supports: clipList(entry.y),
      doesNotSupport: clipList(entry.x),
      evidence: Array.isArray(entry.v)
        ? entry.v.slice(0, MAX_EVIDENCE).map(expandEvidence).filter(Boolean)
        : [],
      order: index,
    });
  });

  return claims.length > 0 ? claims : null;
}

export function decodeShare(encoded) {
  if (typeof encoded !== "string" || !encoded) return null;
  if (encoded.length > MAX_ENCODED) return null;

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded));
  } catch {
    return null;
  }

  if (!payload || payload.v !== VERSION || !payload.r) return null;
  if (!isSafeGithubUrl(payload.r.u)) return null;

  const claims = decodeClaims(payload.c);
  if (!claims) return null;

  const sorted = sortResults(claims);
  const repo = {
    owner: clip(payload.r.o, 100),
    name: clip(payload.r.n, 100),
    htmlUrl: payload.r.u,
    commitSha: clip(payload.r.s, 60),
    ref: clip(payload.r.f, 60),
    defaultBranch: clip(payload.r.b, 60),
    evidencePinned: Boolean(payload.r.p),
    queriedAt: clip(payload.r.at, 40),
  };

  return {
    mode:
      payload.m === "example"
        ? "example"
        : payload.m === "case"
          ? "case"
          : "live",
    report: {
      reportVersion: 1,
      generatedAt: clip(payload.g, 40) || new Date().toISOString(),
      repo,
      claims: sorted,
      summary: summarize(sorted),
      boundary: BOUNDARY,
    },
  };
}

export function buildShareLink(location, encoded) {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#r=${encoded}`;
}