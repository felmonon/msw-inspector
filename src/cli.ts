#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { Command } from 'commander'
import { analyzeProject } from './core/analyze'
import { DEFAULT_EXCLUDE_GLOBS, DEFAULT_HANDLER_GLOBS, DEFAULT_SOURCE_GLOBS } from './core/defaults'
import { formatCoverageReport } from './core/format'

const program = new Command()

program
  .name('msw-inspector')
  .description('Find gaps between your MSW handlers and your actual API usage.')
  .option('--handlers <globs...>', 'Override handler file globs.', DEFAULT_HANDLER_GLOBS)
  .option('--sources <globs...>', 'Override source file globs.', DEFAULT_SOURCE_GLOBS)
  .option('--exclude <globs...>', 'Exclude file globs.', DEFAULT_EXCLUDE_GLOBS)
  .option('--format <format>', 'Output format: text or json.', 'text')
  .option('--report-file <path>', 'Write the JSON report to a file.')
  .option('--min-coverage <percentage>', 'Fail if API mock coverage drops below this percentage.')
  .option('--fail-on-unmocked', 'Fail if any API call is unmocked.')
  .option('--fail-on-stale', 'Fail if any stale handler is found.')
  .option('--cwd <cwd>', 'Working directory to inspect.', process.cwd())
  .action(async (options) => {
    const report = await analyzeProject({
      cwd: options.cwd,
      handlerGlobs: options.handlers,
      sourceGlobs: options.sources,
      excludeGlobs: options.exclude,
    })

    const json = JSON.stringify(report, null, 2)
    if (options.reportFile) {
      const outputPath = path.resolve(options.cwd, options.reportFile)
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, `${json}\n`, 'utf8')
    }

    if (options.format === 'json') {
      process.stdout.write(`${json}\n`)
    } else {
      process.stdout.write(`${formatCoverageReport(report)}\n`)
    }

    const minCoverage = options.minCoverage ? Number(options.minCoverage) : null
    const shouldFail =
      (typeof minCoverage === 'number' && Number.isFinite(minCoverage) && report.summary.percentage < minCoverage) ||
      (options.failOnUnmocked && report.summary.unmockedCalls > 0) ||
      (options.failOnStale && report.summary.staleHandlers > 0)

    if (shouldFail) {
      process.exitCode = 1
    }
  })

program.parseAsync().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
