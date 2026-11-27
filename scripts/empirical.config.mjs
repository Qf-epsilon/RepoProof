import { CASES } from "./cases.config.mjs";

export const EMPIRICAL_REPOS = [
  ...CASES.map((entry) => ({ ...entry })),
  {
    slug: "fastapi-template",
    repo: "fastapi/full-stack-fastapi-template",
    label: "FastAPI 全栈模板",
    note: "官方全栈模板：后端依赖清单可直接核对 FastAPI。",
    source: "example",
    claims: [
      { id: "c1", text: "项目使用 FastAPI 构建后端", template: "framework", rule: "R2", object: "fastapi" },
      { id: "c2", text: "项目包含自动化测试", template: "tests", rule: "R1", object: "tests/" },
      { id: "c3", text: "项目配置了 CI 流水线", template: "ci", rule: "R1", object: ".github/workflows/" },
      { id: "c4", text: "项目采用 MIT 许可证", template: "license", rule: "R3", object: "MIT" },
      { id: "c5", text: "项目有完整文档", template: "docs", rule: "R1", object: "README.md" },
    ],
  },
  {
    slug: "requests",
    repo: "psf/requests",
    label: "HTTP 库：psf/requests",
    note: "老牌 Python 库：tests/、docs/ 与 Apache-2.0 都在固定提交中。",
    claims: [
      { id: "c1", text: "项目包含自动化测试", template: "tests", rule: "R1", object: "tests/" },
      { id: "c2", text: "项目配置了 CI 流水线", template: "ci", rule: "R1", object: ".github/workflows/" },
      { id: "c3", text: "项目采用 Apache-2.0 许可证", template: "license", rule: "R3", object: "Apache-2.0" },
      { id: "c4", text: "项目有完整文档", template: "docs", rule: "R1", object: "README.md" },
      { id: "c5", text: "项目有 docs 目录", template: "docs", rule: "R1", object: "docs/" },
    ],
  },
  {
    slug: "click",
    repo: "pallets/click",
    label: "命令行框架：pallets/click",
    note: "src 布局的 Python 项目：入口路径与测试目录都可复查。",
    claims: [
      { id: "c1", text: "项目包含自动化测试", template: "tests", rule: "R1", object: "tests/" },
      { id: "c2", text: "项目配置了 CI 流水线", template: "ci", rule: "R1", object: ".github/workflows/" },
      { id: "c3", text: "项目采用 BSD-3-Clause 许可证", template: "license", rule: "R3", object: "BSD-3-Clause" },
      { id: "c4", text: "项目有 Readme 文档", template: "docs", rule: "R1", object: "README.md" },
      { id: "c5", text: "入口文件为 src/click/core.py", template: "entry", rule: "R1", object: "src/click/core.py" },
    ],
  },
  {
    slug: "typer",
    repo: "tiangolo/typer",
    label: "命令行工具：tiangolo/typer",
    note: "依赖清单里能直接核对 rich，用于演示 R2 的边界。",
    claims: [
      { id: "c1", text: "项目包含自动化测试", template: "tests", rule: "R1", object: "tests/" },
      { id: "c2", text: "项目配置了 CI 流水线", template: "ci", rule: "R1", object: ".github/workflows/" },
      { id: "c3", text: "项目采用 MIT 许可证", template: "license", rule: "R3", object: "MIT" },
      { id: "c4", text: "项目有 Readme 文档", template: "docs", rule: "R1", object: "README.md" },
      { id: "c5", text: "使用 rich 渲染终端输出", template: "framework", rule: "R2", object: "rich" },
    ],
  },
  {
    slug: "got",
    repo: "sindresorhus/got",
    label: "HTTP 客户端：sindresorhus/got",
    note: "测试目录是 test/：按 tests/ 核验会得到“公开证据不足”。",
    claims: [
      { id: "c1", text: "项目包含自动化测试", template: "tests", rule: "R1", object: "tests/" },
      { id: "c2", text: "项目配置了 CI 流水线", template: "ci", rule: "R1", object: ".github/workflows/" },
      { id: "c3", text: "项目采用 MIT 许可证", template: "license", rule: "R3", object: "MIT" },
      { id: "c4", text: "项目有 Readme 文档", template: "docs", rule: "R1", object: "readme.md" },
      { id: "c5", text: "使用 cacheable-request 处理缓存", template: "framework", rule: "R2", object: "cacheable-request" },
    ],
  },
];