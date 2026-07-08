import pc from 'picocolors'

import type { ApiCallRecord, CoverageReport, HandlerRecord, UnsupportedPattern } from './types'

const DEFAULT_DETAIL_LIMIT = 5

export function formatCoverageReport(report: CoverageReport): string {
  const lines = [
    `${pc.green('✓')} ${report.handlers.length} handlers found`,
    `${pc.green('✓')} ${report.apiCalls.length} API calls found`,
    `${report.summary.unmockedCalls > 0 ? pc.red('✗') : pc.green('✓')} ${report.summary.unmockedCalls} unmocked endpoints`,
    `${report.summary.staleHandlers > 0 ? pc.red('✗') : pc.green('✓')} ${report.summary.staleHandlers} stale mocks`,
    '',
    `Coverage: ${report.summary.percentage}% (${report.summary.mockedCalls}/${report.summary.totalCalls})`,
  ]

  appendUnmockedDetails(lines, report)
  appendStaleDetails(lines, report)
  appendUnsupportedDetails(lines, report)

  return lines.join('\n')
}

function appendUnmockedDetails(lines: string[], report: CoverageReport): void {
  const calls = takeByIds(report.apiCalls, report.unmockedCallIds, DEFAULT_DETAIL_LIMIT)
  if (calls.length === 0) {
    return
  }

  lines.push('', pc.bold('Unmocked API calls'))
  for (const call of calls) {
    lines.push(`  ${pc.red('✗')} ${formatApiCall(call)}`)
    lines.push(`    Found in: ${formatLocation(call.location)}`)
    lines.push('    Suggested handler:')
    lines.push(...indentLines(suggestHandler(call), 6))
  }

  appendRemaining(lines, report.unmockedCallIds.length, calls.length)
}

function appendStaleDetails(lines: string[], report: CoverageReport): void {
  const handlers = takeByIds(report.handlers, report.staleHandlerIds, DEFAULT_DETAIL_LIMIT)
  if (handlers.length === 0) {
    return
  }

  lines.push('', pc.bold('Stale handlers'))
  for (const handler of handlers) {
    lines.push(`  ${pc.yellow('!')} ${formatHandler(handler)}`)
    lines.push(`    Defined in: ${formatLocation(handler.location)}`)
    lines.push('    Remove it if it is obsolete, or expand --sources if another file still calls it.')
  }

  appendRemaining(lines, report.staleHandlerIds.length, handlers.length)
}

function appendUnsupportedDetails(lines: string[], report: CoverageReport): void {
  if (report.unsupported.length === 0) {
    return
  }

  lines.push('', `${pc.yellow('!')} ${report.unsupported.length} unsupported patterns skipped`)
  for (const pattern of report.unsupported.slice(0, DEFAULT_DETAIL_LIMIT)) {
    lines.push(`  ${formatUnsupported(pattern)}`)
    lines.push(`    Fix: simplify the URL shape, add a wrapper rule, or exclude the file if it is outside your test surface.`)
  }

  appendRemaining(lines, report.unsupported.length, Math.min(report.unsupported.length, DEFAULT_DETAIL_LIMIT))
}

function takeByIds<T extends { id: string }>(items: T[], ids: string[], limit: number): T[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  return ids
    .map((id) => byId.get(id))
    .filter((item): item is T => Boolean(item))
    .slice(0, limit)
}

function suggestHandler(call: ApiCallRecord): string[] {
  const method = call.method === 'UNKNOWN' ? 'all' : call.method.toLowerCase()
  const target = call.pattern.pathname ?? call.pattern.normalized

  return [
    `http.${method}('${target}', () => {`,
    '  return HttpResponse.json({})',
    '})',
  ]
}

function formatApiCall(call: ApiCallRecord): string {
  return `${call.method} ${call.pattern.normalized}`
}

function formatHandler(handler: HandlerRecord): string {
  return `${handler.method} ${handler.pattern.normalized}`
}

function formatUnsupported(item: UnsupportedPattern): string {
  return `${item.location.filePath}:${item.location.line}:${item.location.column} (${item.kind}) — ${item.reason}`
}

function formatLocation(location: { filePath: string; line: number; column: number }): string {
  return `${location.filePath}:${location.line}:${location.column}`
}

function indentLines(lines: string[], spaces: number): string[] {
  const prefix = ' '.repeat(spaces)
  return lines.map((line) => `${prefix}${line}`)
}

function appendRemaining(lines: string[], total: number, shown: number): void {
  const remaining = total - shown
  if (remaining > 0) {
    lines.push(`  ...and ${remaining} more`)
  }
}
