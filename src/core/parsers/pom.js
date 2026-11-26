import {
  countLinesBefore,
  decodeXmlEntities,
  normalizePackageName,
} from "./util.js";

function removeComments(xml) {
  return xml.replace(/<!--[\s\S]*?-->/g, "");
}

function stripDependencyManagement(xml) {
  return xml.replace(
    /<(?:[\w.-]+:)?dependencyManagement\b[^>]*>[\s\S]*?<\/(?:[\w.-]+:)?dependencyManagement>/g,
    ""
  );
}

function childText(block, tag) {
  const re = new RegExp(
    `<(?:[\\w.-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${tag}>`,
    "i"
  );
  const match = block.match(re);
  return match ? decodeXmlEntities(match[1].trim()) : "";
}

export function parsePom(text) {
  const xml = stripDependencyManagement(removeComments(text));
  const dependencies = [];
  const unsupported = [];
  const depRe =
    /<(?:[\w.-]+:)?dependency\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?dependency>/gi;

  let match;
  while ((match = depRe.exec(xml)) !== null) {
    const block = match[1];
    const groupId = childText(block, "groupId");
    const artifactId = childText(block, "artifactId");
    const scope = childText(block, "scope");
    const line = countLinesBefore(text, match.index);

    if (!groupId || !artifactId) {
      unsupported.push({
        line,
        snippet: block.trim().slice(0, 120),
        reason: "依赖块缺少 groupId 或 artifactId",
      });
      continue;
    }
    if (groupId.includes("${") || artifactId.includes("${")) {
      unsupported.push({
        line,
        snippet: `${groupId}:${artifactId}`,
        reason: "Maven 属性占位符不在 MVP 解析范围内",
      });
      continue;
    }

    dependencies.push({
      name: `${groupId}:${artifactId}`,
      normalized: normalizePackageName(`${groupId}:${artifactId}`),
      version: childText(block, "version"),
      group: scope === "test" ? "maven-test" : "maven",
      groupLabel: scope === "test" ? "Maven test scope" : "Maven dependency",
      line,
      snippet: `${groupId}:${artifactId}`,
    });
  }

  return {
    ok: true,
    format: "pom.xml",
    dependencies,
    unsupported,
  };
}
