export const CASES = [
  {
    slug: "xunyun-jingchuan",
    repo: "bufan528/xunyun-jingchuan",
    label: "个人小程序：xunyun-jingchuan",
    note: "作者自己的公开仓库：2 条找到公开证据，3 条公开证据不足。",
    claims: [
      { id: "c1", text: "项目有完整文档", template: "docs", rule: "R1", object: "README.md" },
      { id: "c2", text: "入口文件为 miniprogram/app.js", template: "entry", rule: "R1", object: "miniprogram/app.js" },
      { id: "c3", text: "项目包含自动化测试", template: "tests", rule: "R1", object: "tests/" },
      { id: "c4", text: "项目配置了 CI 流水线", template: "ci", rule: "R1", object: ".github/workflows/" },
      { id: "c5", text: "项目采用 MIT 许可证", template: "license", rule: "R3", object: "MIT" },
    ],
  },
  {
    slug: "express",
    repo: "expressjs/express",
    label: "Node.js 框架：expressjs/express",
    note: "测试放在 test/ 而不是 tests/：路径没找到只记“公开证据不足”。",
    claims: [
      { id: "c1", text: "项目包含自动化测试", template: "tests", rule: "R1", object: "tests/" },
      { id: "c2", text: "项目配置了 CI 流水线", template: "ci", rule: "R1", object: ".github/workflows/" },
      { id: "c3", text: "项目采用 MIT 许可证", template: "license", rule: "R3", object: "MIT" },
      { id: "c4", text: "项目有 Readme 文档", template: "docs", rule: "R1", object: "Readme.md" },
      { id: "c5", text: "使用 supertest 做接口测试", template: "framework", rule: "R2", object: "supertest" },
    ],
  },
  {
    slug: "chalk",
    repo: "chalk/chalk",
    label: "命令行配色库：chalk/chalk",
    note: "小型 JS 仓库：README、CI、许可证都能在固定提交中点开。",
    claims: [
      { id: "c1", text: "项目包含自动化测试", template: "tests", rule: "R1", object: "tests/" },
      { id: "c2", text: "项目配置了 CI 流水线", template: "ci", rule: "R1", object: ".github/workflows/" },
      { id: "c3", text: "项目采用 MIT 许可证", template: "license", rule: "R3", object: "MIT" },
      { id: "c4", text: "项目有 readme 文档", template: "docs", rule: "R1", object: "readme.md" },
      { id: "c5", text: "入口文件为 source/index.js", template: "entry", rule: "R1", object: "source/index.js" },
    ],
  },
];