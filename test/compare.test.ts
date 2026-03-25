import { describe, expect, it } from 'vitest'

import { buildCoverageReport } from '../src/core/compare'
import { createPathPattern } from '../src/core/normalize'
import type { ApiCallRecord, HandlerRecord } from '../src/core/types'

function handler(input: Partial<HandlerRecord> & Pick<HandlerRecord, 'id'>): HandlerRecord {
  return {
    id: input.id,
    method: input.method ?? 'GET',
    pattern: input.pattern ?? createPathPattern('/users/:id'),
    location: input.location ?? { filePath: 'handlers.ts', line: 1, column: 1 },
    source: input.source ?? 'msw-http',
  }
}

function call(input: Partial<ApiCallRecord> & Pick<ApiCallRecord, 'id'>): ApiCallRecord {
  return {
    id: input.id,
    method: input.method ?? 'GET',
    pattern: input.pattern ?? createPathPattern('/users/123'),
    location: input.location ?? { filePath: 'api.ts', line: 1, column: 1 },
    source: input.source ?? 'fetch',
  }
}

describe('buildCoverageReport', () => {
  it('matches parametrized handlers against concrete API calls', () => {
    const report = buildCoverageReport({
      handlers: [handler({ id: 'h1' })],
      apiCalls: [call({ id: 'c1' })],
    })

    expect(report.summary.percentage).toBe(100)
    expect(report.matches).toEqual([{ callId: 'c1', handlerId: 'h1' }])
    expect(report.unmockedCallIds).toEqual([])
    expect(report.staleHandlerIds).toEqual([])
  })

  it('treats unmatched handlers as stale and unmatched calls as unmocked', () => {
    const report = buildCoverageReport({
      handlers: [handler({ id: 'h1', pattern: createPathPattern('/users/:id') })],
      apiCalls: [call({ id: 'c1', pattern: createPathPattern('/projects/123') })],
    })

    expect(report.summary.mockedCalls).toBe(0)
    expect(report.summary.unmockedCalls).toBe(1)
    expect(report.summary.staleHandlers).toBe(1)
    expect(report.unmockedCallIds).toEqual(['c1'])
    expect(report.staleHandlerIds).toEqual(['h1'])
  })

  it('allows absolute API calls to match relative handlers by pathname', () => {
    const report = buildCoverageReport({
      handlers: [handler({ id: 'h1', pattern: createPathPattern('/users/:id') })],
      apiCalls: [call({ id: 'c1', pattern: createPathPattern('https://api.example.com/users/123?active=1') })],
    })

    expect(report.summary.mockedCalls).toBe(1)
    expect(report.matches).toEqual([{ callId: 'c1', handlerId: 'h1' }])
  })

  it('supports ALL handlers across different methods', () => {
    const report = buildCoverageReport({
      handlers: [handler({ id: 'h1', method: 'ALL', pattern: createPathPattern('/health') })],
      apiCalls: [call({ id: 'c1', method: 'POST', pattern: createPathPattern('/health') })],
    })

    expect(report.summary.mockedCalls).toBe(1)
  })

  it('matches wildcard handlers using MSW-style coercion', () => {
    const report = buildCoverageReport({
      handlers: [handler({ id: 'h1', pattern: createPathPattern('https://api.example.com/users/*') })],
      apiCalls: [call({ id: 'c1', pattern: createPathPattern('https://api.example.com/users/123') })],
    })

    expect(report.summary.mockedCalls).toBe(1)
  })
})
