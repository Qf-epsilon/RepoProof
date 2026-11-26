export const STATE = Object.freeze({
  FOUND: "found",
  INSUFFICIENT: "insufficient",
  INCONSISTENT: "inconsistent",
  UNABLE: "unable",
});

export const STATE_META = Object.freeze({
  inconsistent: {
    label: "元数据不一致",
    short: "不一致",
    tone: "danger",
    order: 1,
    description: "已确认的客观元数据与明确声明冲突。",
  },
  insufficient: {
    label: "公开证据不足",
    short: "证据不足",
    tone: "warn",
    order: 2,
    description: "当前公开材料无法支持这条声明，不代表声明为假。",
  },
  unable: {
    label: "无法完成核验",
    short: "没查成",
    tone: "neutral",
    order: 3,
    description: "数据获取或完整性不足，不能得出任何核验结论。",
  },
  found: {
    label: "发现公开证据",
    short: "有证据",
    tone: "positive",
    order: 4,
    description: "找到可访问的客观材料，不代表功能实现或个人贡献。",
  },
});

export const BOUNDARY =
  "RepoProof 只核对当前公开仓库中可访问的材料。公开证据不足，不代表项目没有实现；本工具不判断个人贡献或功能真实性。";

export const TEMPLATES = Object.freeze([
  {
    id: "framework",
    label: "使用 X 框架/库",
    rule: "R2",
    objectLabel: "包名",
    placeholder: "fastapi",
    defaultObject: "fastapi",
  },
  {
    id: "tests",
    label: "包含自动化测试",
    rule: "R1",
    objectLabel: "测试路径",
    placeholder: "tests/",
    defaultObject: "tests/",
  },
  {
    id: "ci",
    label: "有 CI 流水线",
    rule: "R1",
    objectLabel: "工作流路径",
    placeholder: ".github/workflows/",
    defaultObject: ".github/workflows/",
  },
  {
    id: "docker",
    label: "使用 Docker 部署",
    rule: "R1",
    objectLabel: "容器配置文件",
    placeholder: "Dockerfile",
    defaultObject: "Dockerfile",
  },
  {
    id: "license",
    label: "采用 X 许可证",
    rule: "R3",
    objectLabel: "SPDX 标识",
    placeholder: "MIT",
    defaultObject: "MIT",
  },
  {
    id: "docs",
    label: "有完整文档",
    rule: "R1",
    objectLabel: "文档路径",
    placeholder: "README.md",
    defaultObject: "README.md",
  },
  {
    id: "entry",
    label: "入口文件为 X",
    rule: "R1",
    objectLabel: "文件路径",
    placeholder: "src/main.py",
    defaultObject: "src/main.py",
  },
  {
    id: "storage",
    label: "数据存储使用 X",
    rule: "R2",
    objectLabel: "包名",
    placeholder: "sqlalchemy",
    defaultObject: "sqlalchemy",
  },
]);

export const SUPPORTED_SPDX = Object.freeze([
  "0BSD",
  "AGPL-3.0-only",
  "AGPL-3.0-or-later",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC0-1.0",
  "GPL-2.0-only",
  "GPL-2.0-or-later",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
  "ISC",
  "LGPL-2.1-only",
  "LGPL-2.1-or-later",
  "LGPL-3.0-only",
  "LGPL-3.0-or-later",
  "MIT",
  "MPL-2.0",
  "Unlicense",
]);

export const DEPRECATED_SPDX = Object.freeze({
  "GPL-2.0": "GPL-2.0-only",
  "GPL-2.0+": "GPL-2.0-or-later",
  "GPL-3.0": "GPL-3.0-only",
  "GPL-3.0+": "GPL-3.0-or-later",
  "LGPL-2.1": "LGPL-2.1-only",
  "LGPL-2.1+": "LGPL-2.1-or-later",
  "LGPL-3.0": "LGPL-3.0-only",
  "LGPL-3.0+": "LGPL-3.0-or-later",
  "AGPL-3.0": "AGPL-3.0-only",
  "AGPL-3.0+": "AGPL-3.0-or-later",
});
