export function parseGoMod(text) {
  const lines = text.split(/\r?\n/);
  const dependencies = [];
  let inRequireBlock = false;

  lines.forEach((original, index) => {
    const withoutComment = original.replace(/\/\/.*$/, "").trim();
    if (!withoutComment) return;

    if (withoutComment === "require (") {
      inRequireBlock = true;
      return;
    }
    if (inRequireBlock && withoutComment === ")") {
      inRequireBlock = false;
      return;
    }

    let match = null;
    if (inRequireBlock) {
      match = withoutComment.match(/^(\S+)\s+(\S+)/);
    } else {
      match = withoutComment.match(/^require\s+(\S+)\s+(\S+)/);
    }
    if (!match) return;

    const indirect = /\/\/\s*indirect/.test(original);
    dependencies.push({
      name: match[1],
      normalized: match[1].toLowerCase(),
      version: match[2],
      group: indirect ? "require-indirect" : "require",
      groupLabel: indirect ? "require (indirect)" : "require",
      line: index + 1,
      snippet: original.trim(),
    });
  });

  return {
    ok: true,
    format: "go.mod",
    dependencies,
    unsupported: [],
  };
}
