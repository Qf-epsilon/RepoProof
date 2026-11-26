import { DEPRECATED_SPDX, STATE, SUPPORTED_SPDX } from "../constants.js";
import { makeResult } from "../state.js";
import { buildBlobUrl, isSafeGithubUrl } from "../url.js";

function canonicalSpdx(value) {
  const raw = String(value || "").trim();
  if (!raw) return { ok: false, reason: "empty" };
  const upper = raw.toUpperCase();
  const supported = SUPPORTED_SPDX.find((item) => item.toUpperCase() === upper);
  if (supported) return { ok: true, value: supported };
  if (DEPRECATED_SPDX[raw]) {
    return {
      ok: false,
      reason: "deprecated",
      suggestion: DEPRECATED_SPDX[raw],
    };
  }
  return { ok: false, reason: "unsupported" };
}

export function verifyLicense({
  claimId,
  claimText,
  object,
  owner,
  repo,
  ref,
  license,
}) {
  const declaredRaw = String(object || "").trim();
  const base = { claimId, claimText, object: declaredRaw, rule: "R3" };
  const declared = canonicalSpdx(declaredRaw);

  if (!declared.ok) {
    const detail =
      declared.reason === "deprecated"
        ? `“${declaredRaw}”是已弃用的 SPDX 标识，建议改用 ${declared.suggestion}。`
        : declared.reason === "empty"
          ? "没有提供 SPDX 标识。"
          : `“${declaredRaw}”不在 MVP 支持的 SPDX 列表中。`;
    return makeResult({
      ...base,
      state: STATE.UNABLE,
      explanation: `${detail} 本次不给出许可证一致性结论。`,
      supports: [],
      doesNotSupport: ["许可证一致", "许可证冲突"],
    });
  }

  if (!license.ok) {
    if (license.error?.kind === "not_found") {
      return makeResult({
        ...base,
        state: STATE.INSUFFICIENT,
        explanation:
          "GitHub 未识别出可用的 SPDX 许可证元数据。这不等于项目没有许可证。",
        supports: [],
        doesNotSupport: ["无许可证", "许可证不合规"],
      });
    }
    return makeResult({
      ...base,
      state: STATE.UNABLE,
      explanation: "读取许可证元数据失败，未完成核验。",
      supports: [],
      doesNotSupport: ["任何关于许可证有无或一致性的结论"],
    });
  }

  const observedRaw = license.spdxId;
  if (!observedRaw || String(observedRaw).toUpperCase() === "NOASSERTION") {
    return makeResult({
      ...base,
      state: STATE.INSUFFICIENT,
      explanation:
        "GitHub 未识别出可用的 SPDX 许可证元数据（可能是自定义许可证或识别失败）。这不等于项目没有许可证。",
      supports: [],
      doesNotSupport: ["无许可证", "许可证不合规"],
    });
  }

  const observed = canonicalSpdx(observedRaw);
  const observedValue = observed.ok ? observed.value : String(observedRaw);
  const path = license.path || "LICENSE";
  const url =
    license.htmlUrl && isSafeGithubUrl(license.htmlUrl)
      ? license.htmlUrl
      : buildBlobUrl(owner, repo, ref, path);

  const evidence = {
    type: "license",
    source: "license",
    path,
    url,
    declaredSpdx: declared.value,
    observedSpdx: observedValue,
  };

  if (declared.value === observedValue) {
    return makeResult({
      ...base,
      state: STATE.FOUND,
      explanation: `声明为 ${declared.value}，GitHub 识别的许可证也是 ${observedValue}。`,
      supports: [`许可证元数据与声明一致：${observedValue}`],
      doesNotSupport: ["许可证适用性", "许可证合规性", "个人贡献"],
      evidence: [evidence],
    });
  }

  return makeResult({
    ...base,
    state: STATE.INCONSISTENT,
    explanation: `声明为 ${declared.value}，GitHub 识别为 ${observedValue}。两侧信息均可复查。`,
    supports: [`已确认的许可证元数据与声明不同：${observedValue}`],
    doesNotSupport: ["功能是否实现", "个人贡献", "其他元数据是否冲突"],
    evidence: [evidence],
  });
}
