// 由 scripts/record-snapshot.mjs 生成，请勿手改。
// 来源：chalk/chalk @ 72110019e147683f60e13fa0ff5c14a0c27cd9fe
// 快照日期：2026-11-27
export const CASE_CHALK = {
  "meta": {
    "id": "chalk",
    "label": "命令行配色库：chalk/chalk",
    "note": "小型 JS 仓库：README、CI、许可证都能在固定提交中点开。",
    "snapshotDate": "2026-11-27",
    "sourceRepo": "chalk/chalk",
    "commit": "72110019e147683f60e13fa0ff5c14a0c27cd9fe",
    "expectedSummary": {
      "found": 4,
      "insufficient": 1,
      "inconsistent": 0,
      "unable": 0
    },
    "expectedStates": [
      {
        "id": "c1",
        "state": "insufficient"
      },
      {
        "id": "c2",
        "state": "found"
      },
      {
        "id": "c3",
        "state": "found"
      },
      {
        "id": "c4",
        "state": "found"
      },
      {
        "id": "c5",
        "state": "found"
      }
    ]
  },
  "repo": {
    "owner": "chalk",
    "name": "chalk",
    "defaultBranch": "main",
    "commitSha": "72110019e147683f60e13fa0ff5c14a0c27cd9fe",
    "private": false,
    "htmlUrl": "https://github.com/chalk/chalk",
    "lastCommitAt": "2026-10-22T21:24:45Z",
    "license": {
      "spdxId": "MIT",
      "name": "MIT License"
    }
  },
  "tree": {
    "ok": true,
    "truncated": false,
    "entries": [
      {
        "path": ".editorconfig",
        "type": "blob"
      },
      {
        "path": ".gitattributes",
        "type": "blob"
      },
      {
        "path": ".github",
        "type": "tree"
      },
      {
        "path": ".github/funding.yml",
        "type": "blob"
      },
      {
        "path": ".github/security.md",
        "type": "blob"
      },
      {
        "path": ".github/workflows",
        "type": "tree"
      },
      {
        "path": ".github/workflows/main.yml",
        "type": "blob"
      },
      {
        "path": ".gitignore",
        "type": "blob"
      },
      {
        "path": ".npmrc",
        "type": "blob"
      },
      {
        "path": "benchmark.js",
        "type": "blob"
      },
      {
        "path": "code-of-conduct.md",
        "type": "blob"
      },
      {
        "path": "contributing.md",
        "type": "blob"
      },
      {
        "path": "examples",
        "type": "tree"
      },
      {
        "path": "examples/rainbow.js",
        "type": "blob"
      },
      {
        "path": "examples/screenshot.js",
        "type": "blob"
      },
      {
        "path": "license",
        "type": "blob"
      },
      {
        "path": "media",
        "type": "tree"
      },
      {
        "path": "media/logo.png",
        "type": "blob"
      },
      {
        "path": "media/logo.svg",
        "type": "blob"
      },
      {
        "path": "media/screenshot.png",
        "type": "blob"
      },
      {
        "path": "package.json",
        "type": "blob"
      },
      {
        "path": "readme.md",
        "type": "blob"
      },
      {
        "path": "source",
        "type": "tree"
      },
      {
        "path": "source/index.d.ts",
        "type": "blob"
      },
      {
        "path": "source/index.js",
        "type": "blob"
      },
      {
        "path": "source/utilities.js",
        "type": "blob"
      },
      {
        "path": "source/vendor",
        "type": "tree"
      },
      {
        "path": "source/vendor/ansi-styles",
        "type": "tree"
      },
      {
        "path": "source/vendor/ansi-styles/index.d.ts",
        "type": "blob"
      },
      {
        "path": "source/vendor/ansi-styles/index.js",
        "type": "blob"
      },
      {
        "path": "source/vendor/supports-color",
        "type": "tree"
      },
      {
        "path": "source/vendor/supports-color/browser.d.ts",
        "type": "blob"
      },
      {
        "path": "source/vendor/supports-color/browser.js",
        "type": "blob"
      },
      {
        "path": "source/vendor/supports-color/index.d.ts",
        "type": "blob"
      },
      {
        "path": "source/vendor/supports-color/index.js",
        "type": "blob"
      },
      {
        "path": "test",
        "type": "tree"
      },
      {
        "path": "test/_fixture.js",
        "type": "blob"
      },
      {
        "path": "test/_force-color-fixture.js",
        "type": "blob"
      },
      {
        "path": "test/chalk.js",
        "type": "blob"
      },
      {
        "path": "test/force-color.js",
        "type": "blob"
      },
      {
        "path": "test/instance.js",
        "type": "blob"
      },
      {
        "path": "test/level.js",
        "type": "blob"
      },
      {
        "path": "test/no-color-support.js",
        "type": "blob"
      },
      {
        "path": "test/visible.js",
        "type": "blob"
      }
    ]
  },
  "license": {
    "ok": true,
    "spdxId": "MIT",
    "path": "license",
    "htmlUrl": "https://github.com/chalk/chalk/blob/72110019e147683f60e13fa0ff5c14a0c27cd9fe/license"
  },
  "raw": {
    "package.json": "{\n\t\"name\": \"chalk\",\n\t\"version\": \"6.0.1\",\n\t\"description\": \"Terminal string styling done right\",\n\t\"license\": \"MIT\",\n\t\"repository\": \"chalk/chalk\",\n\t\"funding\": \"https://github.com/chalk/chalk?sponsor=1\",\n\t\"type\": \"module\",\n\t\"exports\": {\n\t\t\"types\": \"./source/index.d.ts\",\n\t\t\"default\": \"./source/index.js\"\n\t},\n\t\"imports\": {\n\t\t\"#ansi-styles\": \"./source/vendor/ansi-styles/index.js\",\n\t\t\"#supports-color\": {\n\t\t\t\"node\": \"./source/vendor/supports-color/index.js\",\n\t\t\t\"default\": \"./source/vendor/supports-color/browser.js\"\n\t\t}\n\t},\n\t\"sideEffects\": false,\n\t\"engines\": {\n\t\t\"node\": \">=22\"\n\t},\n\t\"scripts\": {\n\t\t\"test\": \"xo && c8 node --test 'test/[!_]*.js' && tsc --noEmit --types node source/index.d.ts\",\n\t\t\"bench\": \"node --experimental-bench --bench benchmark.js\"\n\t},\n\t\"files\": [\n\t\t\"source\"\n\t],\n\t\"keywords\": [\n\t\t\"color\",\n\t\t\"colour\",\n\t\t\"colors\",\n\t\t\"terminal\",\n\t\t\"console\",\n\t\t\"cli\",\n\t\t\"string\",\n\t\t\"ansi\",\n\t\t\"style\",\n\t\t\"styles\",\n\t\t\"tty\",\n\t\t\"formatting\",\n\t\t\"rgb\",\n\t\t\"256\",\n\t\t\"shell\",\n\t\t\"xterm\",\n\t\t\"log\",\n\t\t\"logging\",\n\t\t\"command-line\",\n\t\t\"text\"\n\t],\n\t\"devDependencies\": {\n\t\t\"@types/node\": \"^26.6.3\",\n\t\t\"ansi-styles\": \"^7.0.0\",\n\t\t\"c8\": \"^12.0.0\",\n\t\t\"color-convert\": \"^3.1.3\",\n\t\t\"execa\": \"^10.0.1\",\n\t\t\"log-update\": \"^8.0.0\",\n\t\t\"typescript\": \"^6.0.3\",\n\t\t\"xo\": \"^5.0.1\",\n\t\t\"yoctodelay\": \"^2.0.0\"\n\t},\n\t\"xo\": [\n\t\t{\n\t\t\t\"ignores\": [\n\t\t\t\t\"source/vendor\"\n\t\t\t]\n\t\t},\n\t\t{\n\t\t\t\"rules\": {\n\t\t\t\t\"unicorn/prefer-string-slice\": \"off\",\n\t\t\t\t\"@typescript-eslint/consistent-type-imports\": \"off\",\n\t\t\t\t\"@typescript-eslint/consistent-type-exports\": \"off\",\n\t\t\t\t\"@typescript-eslint/consistent-type-definitions\": \"off\",\n\t\t\t\t\"unicorn/expiring-todo-comments\": \"off\",\n\t\t\t\t\"no-warning-comments\": \"off\"\n\t\t\t}\n\t\t}\n\t],\n\t\"c8\": {\n\t\t\"reporter\": [\n\t\t\t\"text\",\n\t\t\t\"lcov\"\n\t\t],\n\t\t\"exclude\": [\n\t\t\t\"source/vendor\"\n\t\t]\n\t}\n}\n"
  },
  "claims": [
    {
      "id": "c1",
      "text": "项目包含自动化测试",
      "template": "tests",
      "rule": "R1",
      "object": "tests/"
    },
    {
      "id": "c2",
      "text": "项目配置了 CI 流水线",
      "template": "ci",
      "rule": "R1",
      "object": ".github/workflows/"
    },
    {
      "id": "c3",
      "text": "项目采用 MIT 许可证",
      "template": "license",
      "rule": "R3",
      "object": "MIT"
    },
    {
      "id": "c4",
      "text": "项目有 readme 文档",
      "template": "docs",
      "rule": "R1",
      "object": "readme.md"
    },
    {
      "id": "c5",
      "text": "入口文件为 source/index.js",
      "template": "entry",
      "rule": "R1",
      "object": "source/index.js"
    }
  ]
};
