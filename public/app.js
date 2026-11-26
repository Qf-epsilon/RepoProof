import { createGithubGateway } from "/src/adapters/github.js";
import { createCachedGateway } from "/src/app/session.js";
import { buildClaimReport, loadRepository, verifyClaims } from "/src/app/usecases.js";
import { buildEvidenceSheet, evidenceSheetFilename } from "/src/app/export.js";
import { runExample } from "/src/app/example.js";
import {
  BOUNDARY,
  STATE_META,
  SUPPORTED_SPDX,
  TEMPLATES,
} from "/src/core/constants.js";
import { isSafeGithubUrl } from "/src/core/url.js";

const $ = (id) => document.getElementById(id);

const EVIDENCE_TYPE = {
  R1: "路径存在性",
  R2: "依赖清单",
  R3: "许可证元数据（SPDX）",
};

const STATE_SHORT = {
  inconsistent: "声明与元数据冲突",
  insufficient: "当前材料无法支持",
  unable: "请求失败或数据不全",
  found: "找到可访问材料",
};

const INVENTORY_FOOT = {
  manifests: "不代表依赖被调用。",
  tests: "不代表覆盖率。",
  ci: "不代表流水线通过。",
  container: "不代表镜像可用。",
  docs: "不代表内容准确。",
  entry: "不代表它就是入口。",
};

const SUGGESTIONS = [
  { re: /fastapi/i, template: "framework", object: "fastapi", text: "项目使用 FastAPI 构建后端" },
  { re: /django/i, template: "framework", object: "django", text: "项目使用 Django 构建后端" },
  { re: /flask/i, template: "framework", object: "flask", text: "项目使用 Flask 构建后端" },
  { re: /spring\s*boot/i, template: "framework", object: "spring-boot-starter-web", text: "使用 Spring Boot Web" },
  { re: /\breact\b/i, template: "framework", object: "react", text: "前端使用 React" },
  { re: /\bvue\b/i, template: "framework", object: "vue", text: "前端使用 Vue" },
  { re: /pytest|自动化测试|单元测试/i, template: "tests", object: "tests/", text: "项目包含自动化测试" },
  { re: /docker/i, template: "docker", object: "Dockerfile", text: "使用 Docker 部署" },
  { re: /github\s*actions|流水线|\bci\b/i, template: "ci", object: ".github/workflows/", text: "项目配置了 CI 流水线" },
  { re: /postgres(ql)?/i, template: "storage", object: "postgresql", text: "数据存储使用 PostgreSQL" },
  { re: /mongo(db)?/i, template: "storage", object: "mongoose", text: "数据存储使用 MongoDB" },
  { re: /prisma/i, template: "storage", object: "prisma", text: "数据存储使用 Prisma" },
  { re: /redis/i, template: "storage", object: "redis", text: "数据存储使用 Redis" },
];

const state = {
  mode: "live",
  gateway: null,
  loaded: null,
  claims: [],
  nextId: 1,
  results: null,
  report: null,
};

function el(tag, options = {}) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      if (value !== undefined && value !== null) node.setAttribute(key, value);
    }
  }
  return node;
}

function safeLink(url, label, className = "mono") {
  if (!url || !isSafeGithubUrl(url)) {
    return el("span", { className, text: label });
  }
  const a = el("a", {
    className,
    text: label,
    attrs: { href: url, target: "_blank", rel: "noopener noreferrer" },
  });
  return a;
}

function formatTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortSha(sha) {
  return sha ? sha.slice(0, 7) : "";
}

function quotaText(loaded) {
  if (state.mode === "example") return "示例数据，不消耗配额";
  const rateLimit = loaded.stats && loaded.stats.rateLimit;
  if (!rateLimit || rateLimit.remaining == null) return "未获取";
  const suffix = rateLimit.remaining === "0" ? "（已达上限）" : "";
  return `剩余 ${rateLimit.remaining}/${rateLimit.limit || "?"}${suffix}`;
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const STAT_DEFS = [
  ["inconsistent", "元数据不一致"],
  ["insufficient", "公开证据不足"],
  ["unable", "无法完成核验"],
  ["found", "发现公开证据"],
];

const STATE_LEGEND_ORDER = ["inconsistent", "insufficient", "unable", "found"];

let activeTransition = null;
let copyTimer = null;

function transitionView(update) {
  if (!document.startViewTransition || reduceMotion.matches) {
    update();
    return;
  }

  if (activeTransition) {
    activeTransition.skipTransition();
    activeTransition = null;
  }

  const transition = document.startViewTransition(update);
  activeTransition = transition;
  transition.ready.catch(() => {});
  transition.finished
    .catch(() => {})
    .finally(() => {
      if (activeTransition === transition) activeTransition = null;
    });
}

function showView(name) {
  const update = () => {
    for (const view of ["home", "repo", "results"]) {
      $("view-" + view).hidden = view !== name;
    }
    $("reset-button").hidden = name === "home";
    document.body.dataset.view = name;
  };

  transitionView(update);

  requestAnimationFrame(() => {
    const view = $("view-" + name);
    if (!view || view.hidden) return;
    view.setAttribute("tabindex", "-1");
    view.focus({ preventScroll: true });
  });
}

function syncChrome() {
  document.body.dataset.scrolled = String(window.scrollY > 8);
  const banner = $("example-banner");
  if (!banner.hidden) {
    const height = banner.offsetHeight;
    document.documentElement.style.setProperty("--banner-h", `${height}px`);
    document.body.dataset.example = "true";
  } else {
    document.documentElement.style.setProperty("--banner-h", "0px");
    document.body.dataset.example = "false";
  }
}

function setExampleMode(enabled, text = "") {
  const banner = $("example-banner");
  if (enabled) {
    $("example-banner-text").textContent = text;
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
  syncChrome();
}

function startLoading(text) {
  $("repo-content").hidden = true;
  const box = $("repo-loading");
  box.hidden = false;
  box.setAttribute("aria-busy", "true");
  $("repo-loading-text").textContent = text;
  clearTimeout(startLoading.stage);
  startLoading.stage = setTimeout(() => {
    $("repo-loading-text").textContent = "正在读取目录与许可证…";
  }, 1100);
}

function stopLoading() {
  clearTimeout(startLoading.stage);
  const box = $("repo-loading");
  box.hidden = true;
  box.setAttribute("aria-busy", "false");
}

function setHomeError(message) {
  const box = $("home-error");
  box.textContent = message || "";
  box.hidden = !message;
}

function setVerifyError(message) {
  const box = $("verify-error");
  box.textContent = message || "";
  box.hidden = !message;
}

function setResultsError(message) {
  const box = $("results-error");
  box.textContent = message || "";
  box.hidden = !message;
}

let sheetStatusTimer = null;
function setSheetStatus(message) {
  const status = $("sheet-status");
  status.textContent = message || "";
  clearTimeout(sheetStatusTimer);
  if (message) {
    sheetStatusTimer = setTimeout(() => {
      status.textContent = "";
    }, 6000);
  }
}

function showNotices(container, notices) {
  container.textContent = "";
  if (!notices || notices.length === 0) {
    container.hidden = true;
    return;
  }
  const title = el("strong", { text: "说明" });
  const list = el("ul");
  for (const notice of notices) list.append(el("li", { text: notice }));
  container.append(title, list);
  container.hidden = false;
}

function renderLegends() {
  for (const host of document.querySelectorAll("[data-state-legend]")) {
    host.textContent = "";
    for (const key of STATE_LEGEND_ORDER) {
      const meta = STATE_META[key];
      const li = el("li");
      li.append(el("span", { className: "dot", attrs: { "data-tone": meta.tone } }));
      const body = el("div");
      body.append(el("strong", { text: meta.label }));
      body.append(el("p", { text: STATE_SHORT[key] || meta.description }));
      li.append(body);
      host.append(li);
    }
  }
}

function renderRepoHead(loaded) {
  const heading = $("repo-title");
  const { repo } = loaded;
  heading.textContent = "";
  const name = `${repo.owner}/${repo.name}`;
  if (isSafeGithubUrl(repo.htmlUrl)) {
    heading.append(
      el("a", {
        text: name,
        attrs: { href: repo.htmlUrl, target: "_blank", rel: "noopener noreferrer" },
      })
    );
  } else {
    heading.append(document.createTextNode(name));
  }
  heading.append(el("span", { className: "visibility", text: "公开仓库" }));
}

function renderOverview(container, loaded) {
  container.textContent = "";
  const { repo, license, inventory } = loaded;
  const rows = [
    ["默认分支", repo.defaultBranch],
    ["提交", null],
    ["许可证", license.ok ? license.spdxId || "(未识别)" : "未识别出可用 SPDX"],
    ["最近推送", repo.lastCommitAt ? formatTime(repo.lastCommitAt) : "本次未获取"],
    ["查询时间", formatTime(repo.queriedAt)],
    ["文件数", inventory.ok ? String(inventory.totalFiles) : "清点不完整"],
    ["数据来源", state.mode === "example" ? "示例快照，无网络请求" : "GitHub 公开 API"],
    ["API 配额", quotaText(loaded)],
  ];

  for (const [label, value] of rows) {
    const item = el("div", { className: "meta-item" });
    item.append(el("dt", { text: label }));
    if (label === "提交") {
      const dd = el("dd");
      if (repo.evidencePinned) {
        const shaButton = el("button", {
          className: "sha-copy",
          text: shortSha(repo.commitSha),
          attrs: {
            type: "button",
            title: "点击复制完整 commit SHA",
            "aria-label": `复制完整 commit SHA ${repo.commitSha}`,
          },
        });
        shaButton.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(repo.commitSha);
            shaButton.dataset.copied = "true";
            shaButton.textContent = "已复制";
            setTimeout(() => {
              shaButton.dataset.copied = "false";
              shaButton.textContent = shortSha(repo.commitSha);
            }, 1500);
          } catch {
            shaButton.title = repo.commitSha;
          }
        });
        dd.append(shaButton);
        dd.append(el("span", { className: "pinned-note", text: "已固定" }));
      } else {
        dd.append(el("span", { className: "mono", text: repo.defaultBranch }));
        dd.append(el("span", { className: "pinned-note", text: "未固定" }));
      }
      item.append(dd);
    } else {
      const dd = el("dd");
      if (label === "默认分支") {
        dd.append(el("span", { className: "mono", text: value }));
      } else {
        dd.textContent = value;
      }
      item.append(dd);
    }
    container.append(item);
  }
}

function renderInventory(container, loaded) {
  container.textContent = "";
  const inventory = loaded.inventory;
  if (!inventory || inventory.ok === false) {
    const box = el("div", { className: "inventory-unable" });
    box.append(el("strong", { text: "无法完成自动清点" }));
    box.append(el("p", { text: inventory ? inventory.message : "仓库目录数据不可用。" }));
    container.append(box);
    return;
  }

  const table = el("table", { className: "data-table inventory-table" });
  const thead = el("thead");
  const headRow = el("tr");
  for (const label of ["类别", "数量", "文件（前 3 条）", "边界"]) {
    headRow.append(el("th", { text: label }));
  }
  thead.append(headRow);
  const tbody = el("tbody");

  for (const category of inventory.categories) {
    const row = el("tr");
    row.append(el("td", { text: category.label }));
    row.append(
      el("td", {
        className: "cell-count",
        text: String(category.count),
      })
    );

    const files = el("td", { className: "cell-files" });
    if (category.count === 0) {
      files.append(el("span", { className: "file-more", text: "本次清点未发现" }));
    } else {
      for (const sample of category.samples) {
        const line = el("div");
        line.append(safeLink(sample.url, sample.path, "file-link"));
        files.append(line);
      }
      const hidden = category.count - category.samples.length;
      if (category.hasMore || hidden > 0) {
        files.append(
          el("span", {
            className: "file-more",
            text: hidden > 0 ? `另有 ${hidden} 条未列出` : "仅列出前 3 条",
          })
        );
      }
    }
    row.append(files);
    row.append(
      el("td", { className: "cell-boundary", text: INVENTORY_FOOT[category.id] || "" })
    );
    tbody.append(row);
  }

  table.append(thead, tbody);
  const wrap = el("div", { className: "table-wrap table-card" });
  wrap.append(table);
  container.append(wrap);
}

function templateById(id) {
  return TEMPLATES.find((template) => template.id === id) || TEMPLATES[0];
}

function defaultClaimText(templateId, object) {
  const map = {
    framework: () => `使用 ${object}`,
    tests: () => "包含自动化测试",
    ci: () => "有 CI 流水线",
    docker: () => "使用 Docker 部署",
    license: () => `采用 ${object} 许可证`,
    docs: () => "有完整文档",
    entry: () => `入口文件为 ${object}`,
    storage: () => `数据存储使用 ${object}`,
  };
  const build = map[templateId] || (() => `使用 ${object}`);
  return build();
}

function addClaim({
  templateId,
  template: templateKey,
  object,
  text,
  source = "manual",
  manifests = null,
}) {
  const template = templateById(templateId || templateKey);
  const value = String(object || "").trim();
  if (!value) return false;
  if (state.claims.some((claim) => claim.rule === template.rule && claim.object === value)) {
    return false;
  }
  state.claims.push({
    id: `c${state.nextId++}`,
    text: (text || defaultClaimText(template.id, value)).trim(),
    template: template.id,
    rule: template.rule,
    object: value,
    manifests,
    source,
  });
  return true;
}

function renderClaims() {
  const list = $("claim-list");
  list.textContent = "";
  $("claim-empty").hidden = state.claims.length > 0;

  for (const claim of state.claims) {
    const item = el("li", { className: "claim-item" });
    if (claim.source === "suggested") item.classList.add("is-suggested");

    const main = el("div", { className: "claim-main" });
    main.append(el("p", { className: "claim-text", text: claim.text }));

    const meta = el("div", { className: "claim-meta" });
    meta.append(el("span", { className: "rule-tag", text: claim.rule }));
    meta.append(el("span", { className: "mono", text: claim.object }));
    if (claim.source === "suggested") {
      meta.append(el("span", { className: "suggested-tag", text: "建议" }));
    }
    main.append(meta);

    if (claim.rule === "R2") {
      const inventory = state.loaded?.inventory;
      const paths = inventory && inventory.ok ? inventory.manifestPaths : [];
      if (paths.length > 1 || claim.manifests) {
        const select = el("select", { className: "claim-manifest-select" });
        select.append(new Option("自动：全部清单", ""));
        for (const path of paths) select.append(new Option(path, path));
        if (claim.manifests && claim.manifests.length === 1) {
          select.value = claim.manifests[0];
        }
        select.addEventListener("change", () => {
          claim.manifests = select.value ? [select.value] : null;
          renderScope();
        });
        main.append(select);
      }
    }

    item.append(main);

    const remove = el("button", {
      className: "claim-remove",
      text: "删除",
      attrs: { type: "button" },
    });
    remove.addEventListener("click", () => {
      state.claims = state.claims.filter((entry) => entry.id !== claim.id);
      renderClaims();
    });
    item.append(remove);
    list.append(item);
  }
  renderScope();
}

function renderScope() {
  const scope = $("scope");
  scope.textContent = "";
  const loaded = state.loaded;
  const empty = $("scope-empty");
  if (!loaded || state.claims.length === 0) {
    scope.hidden = true;
    empty.hidden = false;
    $("verify-button").disabled = true;
    $("verify-status").textContent = "";
    return;
  }

  scope.hidden = false;
  empty.hidden = true;
  const repoRef = loaded.repo.evidencePinned
    ? `提交 ${shortSha(loaded.repo.commitSha)}`
    : `分支 ${loaded.repo.ref}（未固定）`;
  scope.append(el("p", { className: "scope-repo", text: repoRef }));

  const list = el("ol");
  for (const claim of state.claims) {
    const li = el("li");
    li.append(el("span", { text: claim.text }));
    li.append(el("br"));
    li.append(
      el("span", {
        className: "mono",
        text: `${claim.rule} · ${claim.object}`,
      })
    );
    list.append(li);
  }
  scope.append(list);

  $("verify-button").disabled = false;
  const requests = state.claims.reduce(
    (sum, claim) => sum + (claim.rule === "R2" ? (claim.manifests?.length || 1) : 1),
    0
  );
  $("verify-status").textContent = `共 ${state.claims.length} 条声明，预计 ${requests} 次请求`;
}

function suggestClaims() {
  const text = $("claim-text").value || "";
  if (!text.trim()) {
    setVerifyError("先粘贴一段项目描述，再提取建议。");
    return;
  }
  setVerifyError("");

  const suggestions = [];
  for (const rule of SUGGESTIONS) {
    if (rule.re.test(text)) suggestions.push(rule);
  }
  for (const spdx of SUPPORTED_SPDX) {
    const pattern = new RegExp(spdx.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (pattern.test(text)) {
      suggestions.push({ template: "license", object: spdx, text: `采用 ${spdx} 许可证` });
      break;
    }
  }

  let added = 0;
  for (const item of suggestions) {
    if (addClaim({ ...item, source: "suggested" })) added += 1;
  }
  renderClaims();
  if (added === 0) {
    setVerifyError(
      suggestions.length === 0
        ? "没有从这段描述里匹配到可核验的字面关键词。可以手动添加核验对象。"
        : "建议的对象已在列表中，无需重复添加。"
    );
  }
}

async function handleLoad(input) {
  setHomeError("");
  startLoading("正在读取仓库信息…");
  showView("repo");

  const gateway = createCachedGateway(createGithubGateway());
  const loaded = await loadRepository(gateway, input);
  if (!loaded.ok) {
    stopLoading();
    showView("home");
    setHomeError(loaded.error.message);
    return;
  }

  state.mode = "live";
  state.gateway = gateway;
  state.loaded = loaded;
  state.claims = [];
  state.nextId = 1;
  state.results = null;
  state.report = null;

  setExampleMode(false);
  stopLoading();
  $("repo-content").hidden = false;
  renderRepoHead(loaded);
  renderOverview($("repo-overview"), loaded);
  showNotices($("notices"), loaded.notices);
  renderInventory($("inventory"), loaded);
  renderClaims();
  $("claim-text").value = "";
  $("verify-error").hidden = true;
  syncChrome();
}

async function handleExample() {
  setHomeError("");
  startLoading("正在载入示例数据…");
  showView("repo");
  setExampleMode(false);

  const loaded = await runExample();
  if (!loaded.ok) {
    stopLoading();
    showView("home");
    setHomeError("示例数据加载失败，请刷新页面。");
    return;
  }

  state.mode = "example";
  state.gateway = null;
  state.loaded = loaded;
  state.claims = loaded.report.claims.map((claim, index) => ({
    id: claim.claimId,
    text: claim.claimText,
    rule: claim.rule,
    object: claim.object,
    manifests: null,
    template: "example",
    source: "example",
    order: index,
  }));
  state.nextId = state.claims.length + 1;
  state.results = loaded.results;
  state.report = loaded.report;

  setExampleMode(
    true,
    `示例数据 · ${loaded.meta.snapshotDate} 快照 · 不发起网络请求`
  );

  stopLoading();
  $("repo-content").hidden = false;
  renderRepoHead(loaded);
  renderOverview($("repo-overview"), loaded);
  showNotices($("notices"), loaded.notices);
  renderInventory($("inventory"), loaded);
  renderClaims();
  renderResults();
  showView("results");
  scrollTop();
}

async function handleVerify() {
  if (state.claims.length === 0) return;
  if (state.mode === "example") {
    renderResults();
    showView("results");
    return;
  }

  $("verify-button").disabled = true;
  $("verify-status").textContent = "正在核验…";
  setVerifyError("");

  const claimed = state.claims.map((claim, index) => ({ ...claim, order: index }));
  try {
    const { results, notices } = await verifyClaims({
      gateway: state.gateway,
      repo: state.loaded.repo,
      claims: claimed,
      inventory: state.loaded.inventory,
    });
    state.results = results;
    state.report = buildClaimReport(state.loaded.repo, results);
    state.verifyNotices = notices;
    renderResults();
    showView("results");
    scrollTop();
  } catch (error) {
    setVerifyError("核验过程中出现未知错误，请稍后重试或先看示例。");
    console.error(error);
  } finally {
    $("verify-button").disabled = false;
    $("verify-status").textContent = "";
  }
}

function currentSheet() {
  if (!state.report) return null;
  return {
    text: buildEvidenceSheet({
      report: state.report,
      mode: state.mode,
      siteUrl: location.origin,
    }),
    filename: evidenceSheetFilename(state.report.repo),
  };
}

function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-1000px";
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

async function copySheet() {
  const sheet = currentSheet();
  if (!sheet) return;
  let copied = false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(sheet.text);
      copied = true;
    } catch {
      copied = false;
    }
  }
  if (!copied) copied = fallbackCopy(sheet.text);
  setSheetStatus(copied ? "已复制证据单（Markdown）" : "复制失败，可改用“下载 .md”。");

  const button = $("copy-sheet");
  const label = $("copy-sheet-label");
  clearTimeout(copyTimer);
  button.dataset.copied = String(copied);
  label.textContent = copied ? "已复制" : "复制证据单";
  if (copied) {
    copyTimer = setTimeout(() => {
      button.dataset.copied = "false";
      label.textContent = "复制证据单";
    }, 1600);
  }
}

function downloadSheet() {
  const sheet = currentSheet();
  if (!sheet) return;
  const blob = new Blob([sheet.text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = sheet.filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setSheetStatus("已开始下载证据单。");
}

async function handleReverify() {
  if (state.mode !== "live" || !state.loaded || state.claims.length === 0) return;
  const button = $("reverify-button");
  button.disabled = true;
  button.textContent = "正在重新核验…";
  setResultsError("");
  try {
    const claimed = state.claims.map((claim, index) => ({ ...claim, order: index }));
    const { results, notices } = await verifyClaims({
      gateway: state.gateway,
      repo: state.loaded.repo,
      claims: claimed,
      inventory: state.loaded.inventory,
    });
    state.results = results;
    state.report = buildClaimReport(state.loaded.repo, results);
    state.verifyNotices = notices;
    renderResults();
  } catch (error) {
    setResultsError("重新核验失败，请稍后重试或先看示例数据。");
    console.error(error);
  } finally {
    button.disabled = false;
    button.textContent = "重新核验";
  }
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
}

function renderStats(summary, total) {
  const host = $("results-stats");
  host.textContent = "";
  host.append(el("span", { className: "stat-total", text: `共 ${total} 条声明` }));
  for (const [key, label] of STAT_DEFS) {
    const cell = el("div", { className: "stat", attrs: { "data-state": key } });
    cell.append(el("span", { className: "num", text: String(summary[key]) }));
    const caption = el("span", { className: "label" });
    caption.append(
      el("i", {
        className: "dot",
        attrs: { "data-tone": STATE_META[key].tone, "aria-hidden": "true" },
      })
    );
    caption.append(document.createTextNode(label));
    cell.append(caption);
    host.append(cell);
  }
}

function renderResults() {
  const report = state.report;
  if (!report) return;

  const summary = report.summary;
  renderStats(summary, report.claims.length);
  $("results-summary").textContent =
    `共 ${report.claims.length} 条声明：` +
    `${summary.inconsistent} 条元数据不一致，` +
    `${summary.insufficient} 条公开证据不足，` +
    `${summary.unable} 条无法完成核验，` +
    `${summary.found} 条发现公开证据。`;

  const live = state.mode === "live";
  $("reverify-button").hidden = !live;
  $("results-example").hidden = !live;
  setResultsError("");
  $("sheet-status").textContent = "";
  clearTimeout(copyTimer);
  $("copy-sheet").dataset.copied = "false";
  $("copy-sheet-label").textContent = "复制证据单";

  const repo = state.loaded.repo;
  $("results-meta").textContent =
    `${repo.owner}/${repo.name} · ` +
    `${repo.evidencePinned ? "提交 " + shortSha(repo.commitSha) : "分支 " + repo.defaultBranch} · ` +
    `${formatTime(repo.queriedAt)} · ` +
    `${state.mode === "example" ? "示例数据（429 为模拟）" : "GitHub 公开 API"}`;

  const notices = [...(state.loaded.notices || []), ...(state.verifyNotices || [])];
  showNotices($("results-notices"), notices);
  state.verifyNotices = [];

  const context = $("results-context");
  const body = $("results-context-body");
  body.textContent = "";
  const overview = el("dl", { className: "overview" });
  renderOverview(overview, state.loaded);
  const inventoryHost = el("div");
  renderInventory(inventoryHost, state.loaded);
  body.append(overview, inventoryHost);
  context.hidden = false;
  context.open = false;

  const list = $("results-list");
  list.textContent = "";
  report.claims.forEach((result, index) => {
    list.append(renderResultRow(result, index));
  });
}

function renderResultRow(result, index = 0) {
  const meta = STATE_META[result.state];
  const card = el("article", {
    className: "result-card",
    attrs: { "data-state": result.state },
  });
  card.style.setProperty("--i", String(Math.min(index, 6)));
  const head = el("div", { className: "result-head" });
  const headText = el("div");
  headText.append(el("p", { className: "result-claim", text: result.claimText }));
  const objectLine = el("p", { className: "result-object" });
  objectLine.append(el("span", { className: "rule-tag", text: result.rule }));
  objectLine.append(document.createTextNode(" "));
  objectLine.append(el("span", { className: "mono", text: result.object || "(空)" }));
  objectLine.append(document.createTextNode(` · ${EVIDENCE_TYPE[result.rule] || result.rule}`));
  headText.append(objectLine);
  head.append(headText);

  const badge = el("span", {
    className: "status",
    attrs: { "data-tone": meta.tone },
  });
  badge.append(el("span", { className: "dot", attrs: { "aria-hidden": "true" } }));
  badge.append(el("span", { text: meta.label }));
  head.append(badge);
  card.append(head);

  card.append(el("p", { className: "result-explanation", text: result.explanation }));

  if (result.rule === "R3" && result.evidence?.[0]) {
    const evidence = result.evidence[0];
    const compare = el("p", { className: "compare" });
    const declared = el("span");
    declared.append(el("span", { className: "compare-label", text: "声明 " }));
    declared.append(el("code", { text: evidence.declaredSpdx || result.object }));
    const observed = el("span");
    observed.append(el("span", { className: "compare-label", text: "GitHub 识别 " }));
    observed.append(el("code", { text: evidence.observedSpdx || "未识别" }));
    compare.append(
      declared,
      el("span", { className: "arrow", text: "→", attrs: { "aria-hidden": "true" } }),
      observed
    );
    card.append(compare);
  }

  const supports = el("div", { className: "supports" });
  const yes = el("section");
  yes.append(el("h4", { text: "支持什么" }));
  const yesList = el("ul");
  if (result.supports?.length) {
    for (const item of result.supports) yesList.append(el("li", { text: item }));
  } else {
    yesList.append(el("li", { text: "无。" }));
  }
  yes.append(yesList);

  const no = el("section");
  no.append(el("h4", { text: "不支持什么" }));
  const noList = el("ul");
  if (result.doesNotSupport?.length) {
    for (const item of result.doesNotSupport) noList.append(el("li", { text: item }));
  } else {
    noList.append(el("li", { text: "仅限本条证据的范围。" }));
  }
  no.append(noList);
  supports.append(yes, no);
  card.append(supports);

  if (result.evidence?.length) {
    const evidence = el("div", { className: "evidence" });
    evidence.append(el("h4", { text: "证据" }));
    const ul = el("ul");
    for (const item of result.evidence) {
      const li = el("li");
      let label;
      if (item.type === "manifest") {
        label = `${item.path}:${item.line} · ${item.package} (${item.group})`;
      } else if (item.type === "license") {
        label = item.path || "LICENSE";
      } else {
        label = `${item.path}${item.kind === "dir" ? "/" : ""}`;
      }
      li.append(safeLink(item.url, label));
      if (item.snippet) {
        li.append(el("code", { className: "snippet", text: item.snippet }));
      }
      ul.append(li);
    }
    evidence.append(ul);
    card.append(evidence);
  }

  return card;
}

function resetAll() {
  state.mode = "live";
  state.gateway = null;
  state.loaded = null;
  state.claims = [];
  state.nextId = 1;
  state.results = null;
  state.report = null;
  state.verifyNotices = [];

  setExampleMode(false);
  stopLoading();
  $("repo-content").hidden = true;
  $("repo-title").textContent = "仓库";
  $("claim-text").value = "";
  $("claim-list").textContent = "";
  $("inventory").textContent = "";
  $("scope").hidden = true;
  $("scope-empty").hidden = false;
  $("results-list").textContent = "";
  $("results-stats").textContent = "";
  $("results-context").hidden = true;
  $("verify-error").hidden = true;
  $("verify-status").textContent = "";
  $("verify-button").disabled = true;
  $("repo-url").value = "";
  setResultsError("");
  setSheetStatus("");
  setHomeError("");
  showView("home");
  scrollTop();
}

function initTemplates() {
  const select = $("template-select");
  for (const template of TEMPLATES) {
    select.append(new Option(`${template.label}（${template.rule}）`, template.id));
  }
  const spdxList = $("spdx-options");
  for (const spdx of SUPPORTED_SPDX) {
    const option = document.createElement("option");
    option.value = spdx;
    spdxList.append(option);
  }

  const syncPlaceholder = () => {
    const template = templateById(select.value);
    const input = $("object-input");
    input.placeholder = `${template.objectLabel}，例如 ${template.placeholder}`;
    if (!input.value) input.value = template.defaultObject;
  };
  select.addEventListener("change", () => {
    $("object-input").value = templateById(select.value).defaultObject;
    syncPlaceholder();
  });
  $("object-input").value = templateById(select.value).defaultObject;
  syncPlaceholder();
}

function bindEvents() {
  $("repo-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = $("repo-url").value.trim();
    if (!value) {
      setHomeError("请输入公开 GitHub 仓库地址");
      return;
    }
    handleLoad(value);
  });

  $("example-button").addEventListener("click", () => handleExample());
  $("example-header").addEventListener("click", () => handleExample());
  $("reset-button").addEventListener("click", () => resetAll());
  $("exit-example").addEventListener("click", () => resetAll());
  $("results-reset").addEventListener("click", () => resetAll());
  $("back-button").addEventListener("click", () => {
    showView("repo");
    scrollTop();
  });
  $("copy-sheet").addEventListener("click", () => copySheet());
  $("download-sheet").addEventListener("click", () => downloadSheet());
  $("reverify-button").addEventListener("click", () => handleReverify());
  $("results-example").addEventListener("click", () => handleExample());

  window.addEventListener(
    "scroll",
    () => {
      document.body.dataset.scrolled = String(window.scrollY > 8);
    },
    { passive: true }
  );

  window.addEventListener("resize", syncChrome);

  $("suggest-button").addEventListener("click", () => suggestClaims());

  $("add-claim-button").addEventListener("click", () => {
    const templateId = $("template-select").value;
    const object = $("object-input").value.trim();
    if (!object) {
      setVerifyError("请输入要核验的对象。");
      return;
    }
    const added = addClaim({
      templateId,
      object,
      text: defaultClaimText(templateId, object),
    });
    if (!added) {
      setVerifyError("这条核验对象已在列表中。");
      return;
    }
    setVerifyError("");
    $("object-input").value = templateById(templateId).defaultObject;
    renderClaims();
  });

  $("verify-button").addEventListener("click", () => handleVerify());
}


function init() {
  $("boundary-text").textContent = BOUNDARY;
  renderLegends();
  initTemplates();
  bindEvents();
  showView("home");
  syncChrome();
}

init();
