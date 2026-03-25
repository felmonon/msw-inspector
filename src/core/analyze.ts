import { buildCoverageReport } from './compare'
import { scanApiCalls } from './scan-api-calls'
import { scanHandlers } from './scan-handlers'
import type { AnalyzerOptions, CoverageReport } from './types'

export async function analyzeProject(options: AnalyzerOptions): Promise<CoverageReport> {
  const [handlerResult, apiCallResult] = await Promise.all([
    scanHandlers(options),
    scanApiCalls(options),
  ])

  return buildCoverageReport({
    handlers: handlerResult.handlers,
    apiCalls: apiCallResult.apiCalls,
    unsupported: [...handlerResult.unsupported, ...apiCallResult.unsupported],
  })
}
