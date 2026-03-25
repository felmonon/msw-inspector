import pc from 'picocolors'

import type { CoverageReport } from './types'

export function formatCoverageReport(report: CoverageReport): string {
  const lines = [
    `${pc.green('✓')} ${report.handlers.length} handlers found`,
    `${pc.green('✓')} ${report.apiCalls.length} API calls found`,
    `${report.summary.unmockedCalls > 0 ? pc.red('✗') : pc.green('✓')} ${report.summary.unmockedCalls} unmocked endpoints`,
    `${report.summary.staleHandlers > 0 ? pc.red('✗') : pc.green('✓')} ${report.summary.staleHandlers} stale mocks`,
    '',
    `Coverage: ${report.summary.percentage}% (${report.summary.mockedCalls}/${report.summary.totalCalls})`,
  ]

  if (report.unsupported.length > 0) {
    lines.push('', `${pc.yellow('!')} ${report.unsupported.length} unsupported patterns skipped`)
  }

  return lines.join('\n')
}
