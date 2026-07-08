#!/usr/bin/env node

import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { Command } from 'commander'
import { analyzeProject } from './core/analyze'
import { DEFAULT_INIT_CONFIG_FILE, INIT_CONFIG_CONTENT, loadConfig } from './core/config'
import { formatCoverageReport } from './core/format'

const program = new Command()

program
  .name('msw-inspector')
  .description('Find gaps in your MSW mock coverage.')

program
  .command('init')
  .description('Create a starter msw-inspector config file.')
  .option('--force', 'Overwrite an existing config file.')
  .option('--cwd <cwd>', 'Working directory to initialize.', process.cwd())
  .action(async (options) => {
    const outputPath = path.resolve(options.cwd, DEFAULT_INIT_CONFIG_FILE)
    const exists = await fileExists(outputPath)

    if (exists && !options.force) {
      throw new Error(`${DEFAULT_INIT_CONFIG_FILE} already exists. Re-run with --force to overwrite it.`)
    }

    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, INIT_CONFIG_CONTENT, 'utf8')
    process.stdout.write(`Created ${path.relative(options.cwd, outputPath) || DEFAULT_INIT_CONFIG_FILE}\n`)
  })

program
  .option('--config <path>', 'Path to a msw-inspector config file.')
  .option('--handlers <globs...>', 'Override handler file globs.')
  .option('--sources <globs...>', 'Override source file globs.')
  .option('--exclude <globs...>', 'Exclude file globs.')
  .option('--base-url <url>', 'Resolve relative handlers and calls against this base URL.')
  .option('--format <format>', 'Output format: text or json.', 'text')
  .option('--report-file <path>', 'Write the JSON report to a file.')
  .option('--min-coverage <percentage>', 'Fail if API mock coverage drops below this percentage.')
  .option('--fail-on-unmocked', 'Fail if any API call is unmocked.')
  .option('--fail-on-stale', 'Fail if any stale handler is found.')
  .option('--cwd <cwd>', 'Working directory to inspect.', process.cwd())
  .action(async (options) => {
    const loaded = await loadConfig(options.cwd, options.config)
    const config = loaded.config

    const report = await analyzeProject({
      cwd: options.cwd,
      baseUrl: options.baseUrl ?? config.baseUrl,
      handlerGlobs: options.handlers ?? config.handlers,
      sourceGlobs: options.sources ?? config.sources,
      excludeGlobs: options.exclude ?? config.exclude,
      apiWrappers: config.apiWrappers,
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

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
