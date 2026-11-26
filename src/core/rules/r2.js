import { STATE } from "../constants.js";
import { dependencyMatches, resolveAliases } from "../alias.js";
import { parseManifest } from "../parsers/index.js";
import { makeResult } from "../state.js";
import { buildBlobUrl, buildRawUrl } from "../url.js";

export function verifyDependency({
  claimId,
  claimText,
  object,
  owner,
  repo,
  ref,
  manifests,
}) {
  const target = String(object || "").trim();
  const base = { claimId, claimText, object: target, rule: "R2" };
  const { candidates, aliasUsed } = resolveAliases(target);

  if (!target) {
    return makeResult({
      ...base,
      state: STATE.UNABLE,
      explanation: "没有提供要核验的包名。",
    });
  }

  if (!Array.isArray(manifests) || manifests.length === 0) {
    return makeResult({
      ...base,
      state: STATE.INSUFFICIENT,
      explanation:
        "没有可核验的依赖清单：仓库清点未发现清单文件，且这条声明没有指定清单路径。清单缺失不等于依赖未使用。",
      supports: [],
      doesNotSupport: ["依赖未声明", "依赖未使用"],
    });
  }

  const hits = [];
  const unreadable = [];
  const unsupportedLines = [];

  for (const manifest of manifests) {
    if (!manifest || manifest.error) {
      unreadable.push({
        path: manifest?.path || "(unknown)",
        kind: manifest?.error?.kind || "server",
      });
      continue;
    }

    const parsed = parseManifest(manifest.path, manifest.text ?? "");
    if (!parsed.ok) {
      unreadable.push({ path: manifest.path, kind: "parse" });
      continue;
    }

    if (parsed.unsupported?.length) {
      unsupportedLines.push(...parsed.unsupported.map((item) => ({ ...item, path: manifest.path })));
    }

    for (const dependency of parsed.dependencies) {
      if (!dependencyMatches(candidates, dependency)) continue;
      hits.push({
        manifestPath: manifest.path,
        dependency,
      });
    }
  }

  const aliasNote = aliasUsed
    ? `按别名将“${target}”归一化为 ${candidates.join(" / ")}。`
    : "";

  if (hits.length > 0) {
    const evidence = hits.slice(0, 8).map(({ manifestPath, dependency }) => ({
      type: "manifest",
      source: "raw",
      path: manifestPath,
      line: dependency.line,
      snippet: dependency.snippet,
      package: dependency.name,
      group: dependency.groupLabel,
      url: buildBlobUrl(owner, repo, ref, manifestPath, dependency.line),
      rawUrl: buildRawUrl(owner, repo, ref, manifestPath),
    }));

    const first = hits[0];
    const readabilityNote =
      unreadable.length > 0
        ? ` 另有 ${unreadable.length} 个清单未能读取，未纳入本次判断。`
        : "";

    return makeResult({
      ...base,
      state: STATE.FOUND,
      explanation:
        `${aliasNote}在 ${first.manifestPath} 的 ${first.dependency.groupLabel} 中发现 ` +
        `${first.dependency.name}${first.dependency.version ? `（${first.dependency.version}）` : ""}。` +
        readabilityNote,
      supports: [`依赖清单声明了 ${first.dependency.name}`],
      doesNotSupport: ["实际调用", "运行时使用", "个人贡献"],
      evidence,
    });
  }

  if (unreadable.length > 0) {
    const detail = unreadable.map((item) => item.path).join("、");
    return makeResult({
      ...base,
      state: STATE.UNABLE,
      explanation: `清单 ${detail} 无法读取或解析，不能把未读完的清单当作“未声明”。`,
      supports: [],
      doesNotSupport: ["依赖未声明", "依赖未使用"],
    });
  }

  const caveat =
    unsupportedLines.length > 0
      ? ` 另有 ${unsupportedLines.length} 行不在 MVP 解析范围内，未参与判断。`
      : "";

  return makeResult({
    ...base,
    state: STATE.INSUFFICIENT,
    explanation:
      `${aliasNote}所选清单可读取，但没有发现对 ${target} 的声明。` +
      `清单未声明不等于未使用。${caveat}`,
    supports: [],
    doesNotSupport: ["依赖未使用", "运行时没有该依赖"],
  });
}
