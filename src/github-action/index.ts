import { appendFile } from 'node:fs/promises'
import { readFile } from 'node:fs/promises'

import * as core from '@actions/core'
import * as github from '@actions/github'

import { version as PACKAGE_VERSION } from '../../package.json'

import type {
  ApiCallRecord,
  CoverageReport,
  HandlerRecord,
  UnsupportedPattern,
} from '../core/types'

const COMMENT_MARKER = '<!-- msw-inspector-comment -->'
const DEFAULT_COMMENT_TITLE = 'MSW mock coverage'
const DEFAULT_COMMENT_LIMIT = 8

export interface GitHubActionOptions {
  summaryFile: string
  comment: boolean
  commentTitle: string
  githubToken: string
  commentLimit: number
}

export async function readCoverageReport(summaryFile: string): Promise<CoverageReport> {
  const raw = await readFile(summaryFile, 'utf8')
  const parsed = JSON.parse(raw) as unknown

  if (!isCoverageReport(parsed)) {
    throw new Error(`Invalid coverage report in ${summaryFile}. Expected analyzer JSON output.`)
  }

  return parsed
}

const REPO_URL = 'https://github.com/felmonon/msw-inspector'

function verdictEmoji(report: CoverageReport): string {
  if (report.summary.unmockedCalls > 0) {
    return '\u{1F534}'
  }

  if ((report.summary.ambiguousCalls ?? 0) > 0 || report.summary.staleHandlers > 0) {
    return '\u{1F7E1}'
  }

  return '\u{1F7E2}'
}

function coverageBar(percentage: number): string {
  const filled = Math.max(0, Math.min(10, Math.round(percentage / 10)))
  return `\`${'\u25B0'.repeat(filled)}${'\u25B1'.repeat(10 - filled)}\` ${percentage}%`
}

function footer(): string {
  return `\u{1F6E1} [msw-inspector](${REPO_URL}) v${PACKAGE_VERSION} \u00B7 [docs](${REPO_URL}#readme) \u00B7 [report an issue](${REPO_URL}/issues)`
}

export function renderJobSummary(report: CoverageReport): string {
  const lines: string[] = []
  lines.push(`## ${verdictEmoji(report)} MSW mock coverage: ${report.summary.percentage}% (${report.summary.mockedCalls}/${report.summary.totalCalls})`)
  lines.push('')
  lines.push(coverageBar(report.summary.percentage))
  lines.push('')
  lines.push('| Unmocked | Ambiguous | Stale handlers | Handlers used |')
  lines.push('| ---: | ---: | ---: | ---: |')
  lines.push(`| ${report.summary.unmockedCalls} | ${report.summary.ambiguousCalls ?? 0} | ${report.summary.staleHandlers} | ${report.summary.usedHandlers}/${report.summary.totalHandlers} |`)

  if (report.unsupported.length > 0) {
    lines.push('')
    lines.push(`Unsupported patterns skipped: ${report.unsupported.length}`)
  }

  lines.push('')
  lines.push(footer())

  return `${lines.join('\n')}\n`
}

export function renderStickyComment(report: CoverageReport, title = DEFAULT_COMMENT_TITLE, limit = DEFAULT_COMMENT_LIMIT): string {
  const lines: string[] = []
  lines.push(COMMENT_MARKER)
  lines.push(`## ${verdictEmoji(report)} ${title}: ${report.summary.percentage}% (${report.summary.mockedCalls}/${report.summary.totalCalls})`)
  lines.push('')
  lines.push(coverageBar(report.summary.percentage))
  lines.push('')
  lines.push('| Unmocked | Ambiguous | Stale handlers | Handlers used |')
  lines.push('| ---: | ---: | ---: | ---: |')
  lines.push(`| ${report.summary.unmockedCalls} | ${report.summary.ambiguousCalls ?? 0} | ${report.summary.staleHandlers} | ${report.summary.usedHandlers}/${report.summary.totalHandlers} |`)

  lines.push(...detailsSection('Unmocked API calls', takeLabels(report.apiCalls, report.unmockedCallIds, formatApiCall, limit), report.unmockedCallIds.length))
  lines.push(...detailsSection('Ambiguous API calls', takeLabels(report.apiCalls, report.ambiguousCallIds ?? [], formatApiCall, limit), (report.ambiguousCallIds ?? []).length))
  lines.push(...detailsSection('Stale handlers', takeLabels(report.handlers, report.staleHandlerIds, formatHandler, limit), report.staleHandlerIds.length))
  lines.push(...detailsSection('Unsupported patterns', report.unsupported.slice(0, limit).map(formatUnsupported), report.unsupported.length))

  lines.push('')
  lines.push('---')
  lines.push(footer())

  return `${lines.join('\n')}\n`
}

function detailsSection(title: string, items: string[], total: number): string[] {
  if (items.length === 0) {
    return []
  }

  const lines = ['', '<details>', `<summary>${title} (${total})</summary>`, '']
  lines.push(...items.map((value) => `- ${value}`))
  if (total > items.length) {
    lines.push(`- \u2026 and ${total - items.length} more`)
  }
  lines.push('', '</details>')
  return lines
}

export async function writeJobSummary(report: CoverageReport): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) {
    return
  }

  await appendFile(summaryPath, renderJobSummary(report), 'utf8')
}

export async function upsertStickyComment(
  report: CoverageReport,
  options: GitHubActionOptions,
): Promise<string | undefined> {
  const number = github.context.issue.number
  if (!number) {
    core.warning('Skipping PR comment because no issue or pull request number is available.')
    return undefined
  }

  const token = options.githubToken || core.getInput('github-token')
  if (!token) {
    core.warning('Skipping PR comment because no GitHub token was provided.')
    return undefined
  }

  const octokit = github.getOctokit(token)
  const body = renderStickyComment(report, options.commentTitle, options.commentLimit)
  const existing = await findStickyComment(octokit, number)

  if (existing) {
    await octokit.rest.issues.updateComment({
      ...github.context.repo,
      comment_id: existing.id,
      body,
    })
    return existing.html_url
  }

  const created = await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: number,
    body,
  })

  return created.data.html_url
}

export async function run(): Promise<void> {
  try {
    const options = readActionOptions()
    const report = await readCoverageReport(options.summaryFile)

    await writeJobSummary(report)

    core.setOutput('coverage-pct', String(report.summary.percentage))
    core.setOutput('mocked-calls', String(report.summary.mockedCalls))
    core.setOutput('total-calls', String(report.summary.totalCalls))
    core.setOutput('unmocked-count', String(report.summary.unmockedCalls))
    core.setOutput('ambiguous-count', String(report.summary.ambiguousCalls ?? 0))
    core.setOutput('stale-count', String(report.summary.staleHandlers))
    core.setOutput('covered-handlers', String(report.summary.usedHandlers))
    core.setOutput('total-handlers', String(report.summary.totalHandlers))
    core.setOutput('uncovered-count', String(report.summary.unmockedCalls))

    if (options.comment) {
      const commentUrl = await upsertStickyComment(report, options)
      if (commentUrl) {
        core.setOutput('comment-url', commentUrl)
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.setFailed(message)
  }
}

function readActionOptions(): GitHubActionOptions {
  const summaryFile = core.getInput('summary-file', { required: true })
  return {
    summaryFile,
    comment: core.getBooleanInput('comment'),
    commentTitle: core.getInput('comment-title') || DEFAULT_COMMENT_TITLE,
    githubToken: core.getInput('github-token'),
    commentLimit: Number(core.getInput('comment-limit')) || DEFAULT_COMMENT_LIMIT,
  }
}

async function findStickyComment(
  octokit: ReturnType<typeof github.getOctokit>,
  issueNumber: number,
): Promise<{ id: number; html_url: string } | undefined> {
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    ...github.context.repo,
    issue_number: issueNumber,
    per_page: 100,
  })

  const comment = comments.find((entry) => typeof entry.body === 'string' && entry.body.includes(COMMENT_MARKER))
  if (!comment) {
    return undefined
  }

  return {
    id: comment.id,
    html_url: comment.html_url,
  }
}

function takeLabels<T extends { id: string }>(
  items: readonly T[],
  ids: string[],
  formatter: (item: T) => string,
  limit: number,
): string[] {
  const byId = new Map<string, T>()
  for (const item of items) {
    const id = getId(item)
    if (id) {
      byId.set(id, item)
    }
  }

  return ids
    .map((id) => byId.get(id))
    .filter((item): item is T => Boolean(item))
    .slice(0, limit)
    .map(formatter)
}

function formatHandler(handler: HandlerRecord): string {
  return `\`${handler.method} ${handler.pattern.normalized}\` \u2014 ${handler.location.filePath}:${handler.location.line}`
}

function formatApiCall(call: ApiCallRecord): string {
  return `\`${call.method} ${call.pattern.normalized}\` \u2014 ${call.location.filePath}:${call.location.line}`
}

function formatUnsupported(item: UnsupportedPattern): string {
  return `\`${item.expressionText}\` \u2014 ${item.location.filePath}:${item.location.line} (${item.reason})`
}

function getId<T extends { id: string }>(item: T): string {
  return item.id
}

function isCoverageReport(value: unknown): value is CoverageReport {
  if (!isObject(value)) {
    return false
  }

  const candidate = value as Record<string, unknown>
  const summary = candidate.summary

  return (
    candidate.schemaVersion === 1 &&
    Array.isArray(candidate.handlers) &&
    Array.isArray(candidate.apiCalls) &&
    Array.isArray(candidate.unsupported) &&
    Array.isArray(candidate.staleHandlerIds) &&
    Array.isArray(candidate.unmockedCallIds) &&
    isObject(summary) &&
    typeof summary.percentage === 'number' &&
    typeof summary.mockedCalls === 'number' &&
    typeof summary.totalCalls === 'number' &&
    typeof summary.usedHandlers === 'number' &&
    typeof summary.totalHandlers === 'number' &&
    typeof summary.staleHandlers === 'number' &&
    typeof summary.unmockedCalls === 'number'
  )
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

if (require.main === module) {
  void run()
}
