import { STATE } from "../constants.js";
import { makeResult } from "../state.js";
import { buildBlobUrl, buildTreeUrl, isSafeGithubUrl } from "../url.js";

function evidenceUrl(contents, owner, repo, ref, path) {
  if (contents.htmlUrl && isSafeGithubUrl(contents.htmlUrl)) {
    return contents.htmlUrl;
  }
  return contents.kind === "dir"
    ? buildTreeUrl(owner, repo, ref, path)
    : buildBlobUrl(owner, repo, ref, path);
}

export function verifyPath({ claimId, claimText, object, owner, repo, ref, contents }) {
  const path = String(object || "").trim();
  const base = { claimId, claimText, object: path, rule: "R1" };

  if (!path) {
    return makeResult({
      ...base,
      state: STATE.UNABLE,
      explanation: "没有提供要核验的路径。",
    });
  }

  if (!contents.ok) {
    const kind = contents.error?.kind || "server";
    if (kind === "not_found") {
      return makeResult({
        ...base,
        state: STATE.INSUFFICIENT,
        explanation:
          "在指定路径未找到可访问证据。这不代表文件不存在，也不代表功能没有实现。",
        supports: [],
        doesNotSupport: ["文件不存在", "功能未实现", "个人贡献"],
      });
    }
    return makeResult({
      ...base,
      state: STATE.UNABLE,
      explanation:
        kind === "rate_limited"
          ? "GitHub 请求受限，未完成核验。请稍后重试或使用示例数据。"
          : "读取该路径失败，未完成核验。",
      supports: [],
      doesNotSupport: ["任何关于文件是否存在或功能是否实现的结论"],
    });
  }

  const kindLabel =
    contents.kind === "dir" ? "目录" : contents.kind === "submodule" ? "子模块" : "文件";
  const explanation =
    contents.kind === "submodule"
      ? `该路径指向子模块，已确认可访问，但本工具不继续展开子模块内容。`
      : `该${kindLabel}可通过 GitHub 公开接口访问。`;

  return makeResult({
    ...base,
    state: STATE.FOUND,
    explanation,
    supports: [`指定${kindLabel}路径可访问`],
    doesNotSupport: ["内容质量", "功能是否实现", "个人贡献"],
    evidence: [
      {
        type: "path",
        source: "contents",
        path,
        url: evidenceUrl(contents, owner, repo, ref, path),
        kind: contents.kind,
      },
    ],
  });
}
