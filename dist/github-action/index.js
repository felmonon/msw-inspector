"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/github-action/index.ts
var github_action_exports = {};
__export(github_action_exports, {
  readCoverageReport: () => readCoverageReport,
  renderJobSummary: () => renderJobSummary,
  renderStickyComment: () => renderStickyComment,
  run: () => run,
  upsertStickyComment: () => upsertStickyComment,
  writeJobSummary: () => writeJobSummary
});
module.exports = __toCommonJS(github_action_exports);
var import_promises = require("fs/promises");
var import_promises2 = require("fs/promises");
var core = __toESM(require("@actions/core"));
var github = __toESM(require("@actions/github"));
var COMMENT_MARKER = "<!-- msw-inspector-comment -->";
var DEFAULT_COMMENT_TITLE = "MSW mock coverage";
var DEFAULT_COMMENT_LIMIT = 8;
async function readCoverageReport(summaryFile) {
  const raw = await (0, import_promises2.readFile)(summaryFile, "utf8");
  const parsed = JSON.parse(raw);
  if (!isCoverageReport(parsed)) {
    throw new Error(`Invalid coverage report in ${summaryFile}. Expected analyzer JSON output.`);
  }
  return parsed;
}
function renderJobSummary(report) {
  const lines = [];
  lines.push("## MSW mock coverage");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("| --- | ---: |");
  lines.push(`| Coverage | ${report.summary.percentage}% |`);
  lines.push(`| Mocked API calls | ${report.summary.mockedCalls} / ${report.summary.totalCalls} |`);
  lines.push(`| Used handlers | ${report.summary.usedHandlers} / ${report.summary.totalHandlers} |`);
  lines.push(`| Unmocked API calls | ${report.summary.unmockedCalls} |`);
  lines.push(`| Stale handlers | ${report.summary.staleHandlers} |`);
  if (report.unsupported.length > 0) {
    lines.push("");
    lines.push(`Unsupported patterns skipped: ${report.unsupported.length}`);
  }
  return `${lines.join("\n")}
`;
}
function renderStickyComment(report, title = DEFAULT_COMMENT_TITLE, limit = DEFAULT_COMMENT_LIMIT) {
  const unmocked = takeLabels(report.apiCalls, report.unmockedCallIds, formatApiCall, limit);
  const stale = takeLabels(report.handlers, report.staleHandlerIds, formatHandler, limit);
  const unsupported = report.unsupported.slice(0, limit).map(formatUnsupported);
  const lines = [];
  lines.push(COMMENT_MARKER);
  lines.push(`## ${title}`);
  lines.push("");
  lines.push(`Coverage: **${report.summary.percentage}%** (${report.summary.mockedCalls}/${report.summary.totalCalls})`);
  lines.push(`Handlers used: **${report.summary.usedHandlers}** / ${report.summary.totalHandlers}`);
  lines.push(`Unmocked API calls: **${report.summary.unmockedCalls}**`);
  lines.push(`Stale handlers: **${report.summary.staleHandlers}**`);
  if (unmocked.length > 0) {
    lines.push("");
    lines.push("### Unmocked API calls");
    lines.push(...unmocked.map((value) => `- ${value}`));
  }
  if (stale.length > 0) {
    lines.push("");
    lines.push("### Stale handlers");
    lines.push(...stale.map((value) => `- ${value}`));
  }
  if (unsupported.length > 0) {
    lines.push("");
    lines.push("### Unsupported patterns");
    lines.push(...unsupported.map((value) => `- ${value}`));
  }
  return `${lines.join("\n")}
`;
}
async function writeJobSummary(report) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }
  await (0, import_promises.appendFile)(summaryPath, renderJobSummary(report), "utf8");
}
async function upsertStickyComment(report, options) {
  const number = github.context.issue.number;
  if (!number) {
    core.warning("Skipping PR comment because no issue or pull request number is available.");
    return void 0;
  }
  const token = options.githubToken || core.getInput("github-token");
  if (!token) {
    core.warning("Skipping PR comment because no GitHub token was provided.");
    return void 0;
  }
  const octokit = github.getOctokit(token);
  const body = renderStickyComment(report, options.commentTitle, options.commentLimit);
  const existing = await findStickyComment(octokit, number);
  if (existing) {
    await octokit.rest.issues.updateComment({
      ...github.context.repo,
      comment_id: existing.id,
      body
    });
    return existing.html_url;
  }
  const created = await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: number,
    body
  });
  return created.data.html_url;
}
async function run() {
  try {
    const options = readActionOptions();
    const report = await readCoverageReport(options.summaryFile);
    await writeJobSummary(report);
    core.setOutput("coverage-pct", String(report.summary.percentage));
    core.setOutput("mocked-calls", String(report.summary.mockedCalls));
    core.setOutput("total-calls", String(report.summary.totalCalls));
    core.setOutput("unmocked-count", String(report.summary.unmockedCalls));
    core.setOutput("stale-count", String(report.summary.staleHandlers));
    core.setOutput("covered-handlers", String(report.summary.usedHandlers));
    core.setOutput("total-handlers", String(report.summary.totalHandlers));
    core.setOutput("uncovered-count", String(report.summary.unmockedCalls));
    if (options.comment) {
      const commentUrl = await upsertStickyComment(report, options);
      if (commentUrl) {
        core.setOutput("comment-url", commentUrl);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
  }
}
function readActionOptions() {
  const summaryFile = core.getInput("summary-file", { required: true });
  return {
    summaryFile,
    comment: core.getBooleanInput("comment"),
    commentTitle: core.getInput("comment-title") || DEFAULT_COMMENT_TITLE,
    githubToken: core.getInput("github-token"),
    commentLimit: Number(core.getInput("comment-limit")) || DEFAULT_COMMENT_LIMIT
  };
}
async function findStickyComment(octokit, issueNumber) {
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    ...github.context.repo,
    issue_number: issueNumber,
    per_page: 100
  });
  const comment = comments.find((entry) => typeof entry.body === "string" && entry.body.includes(COMMENT_MARKER));
  if (!comment) {
    return void 0;
  }
  return {
    id: comment.id,
    html_url: comment.html_url
  };
}
function takeLabels(items, ids, formatter, limit) {
  const byId = /* @__PURE__ */ new Map();
  for (const item of items) {
    const id = getId(item);
    if (id) {
      byId.set(id, item);
    }
  }
  return ids.map((id) => byId.get(id)).filter((item) => Boolean(item)).slice(0, limit).map(formatter);
}
function formatHandler(handler) {
  return `${handler.method} ${handler.pattern.normalized}`;
}
function formatApiCall(call) {
  return `${call.method} ${call.pattern.normalized}`;
}
function formatUnsupported(item) {
  return `${item.kind}: ${item.expressionText} (${item.reason})`;
}
function getId(item) {
  return item.id;
}
function isCoverageReport(value) {
  if (!isObject(value)) {
    return false;
  }
  const candidate = value;
  const summary = candidate.summary;
  return candidate.schemaVersion === 1 && Array.isArray(candidate.handlers) && Array.isArray(candidate.apiCalls) && Array.isArray(candidate.unsupported) && Array.isArray(candidate.staleHandlerIds) && Array.isArray(candidate.unmockedCallIds) && isObject(summary) && typeof summary.percentage === "number" && typeof summary.mockedCalls === "number" && typeof summary.totalCalls === "number" && typeof summary.usedHandlers === "number" && typeof summary.totalHandlers === "number" && typeof summary.staleHandlers === "number" && typeof summary.unmockedCalls === "number";
}
function isObject(value) {
  return typeof value === "object" && value !== null;
}
if (require.main === module) {
  void run();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  readCoverageReport,
  renderJobSummary,
  renderStickyComment,
  run,
  upsertStickyComment,
  writeJobSummary
});
