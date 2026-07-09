import type { CoverageReport } from '../src/core/types'
import { describe, expect, it } from 'vitest'

import { renderJobSummary, renderStickyComment } from '../src/github-action/index'

const report = {
  schemaVersion: 1,
  handlers: [
    {
      id: 'handler-1',
      method: 'GET',
      pattern: {
        raw: '/users/:id',
        kind: 'path',
        normalized: '/users/:id',
        pathname: '/users/:id',
        origin: null,
      },
      location: { filePath: 'src/mocks/users.ts', line: 1, column: 1 },
      source: 'msw-http' as const,
    },
    {
      id: 'handler-2',
      method: 'POST',
      pattern: {
        raw: '/checkout',
        kind: 'path',
        normalized: '/checkout',
        pathname: '/checkout',
        origin: null,
      },
      location: { filePath: 'src/mocks/checkout.ts', line: 2, column: 1 },
      source: 'msw-http' as const,
    },
  ],
  apiCalls: [
    {
      id: 'call-1',
      method: 'GET',
      pattern: {
        raw: '/users/:id',
        kind: 'path',
        normalized: '/users/:id',
        pathname: '/users/:id',
        origin: null,
      },
      location: { filePath: 'src/api/users.ts', line: 4, column: 10 },
      source: 'fetch' as const,
    },
    {
      id: 'call-2',
      method: 'POST',
      pattern: {
        raw: '/payments',
        kind: 'path',
        normalized: '/payments',
        pathname: '/payments',
        origin: null,
      },
      location: { filePath: 'src/api/payments.ts', line: 7, column: 12 },
      source: 'axios' as const,
    },
  ],
  matches: [
    { callId: 'call-1', handlerId: 'handler-1' },
  ],
  mockedCallIds: ['call-1'],
  usedHandlerIds: ['handler-1'],
  staleHandlerIds: ['handler-2'],
  unmockedCallIds: ['call-2'],
  ambiguousCallIds: [],
  unsupported: [],
  summary: {
    mockedCalls: 1,
    totalCalls: 2,
    usedHandlers: 1,
    totalHandlers: 2,
    staleHandlers: 1,
    unmockedCalls: 1,
    ambiguousCalls: 0,
    percentage: 50,
  },
} satisfies CoverageReport

describe('github action formatting', () => {
  it('renders a job summary with verdict, bar, and footer', () => {
    const markdown = renderJobSummary(report)
    expect(markdown).toContain('## \u{1F534} MSW mock coverage: 50% (1/2)')
    expect(markdown).toContain('`\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1` 50%')
    expect(markdown).toContain('| Unmocked | Ambiguous | Stale handlers | Handlers used |')
    expect(markdown).toContain('| 1 | 0 | 1 | 1/2 |')
    expect(markdown).toContain('[msw-inspector](https://github.com/felmonon/msw-inspector)')
  })

  it('renders a sticky comment with marker, collapsible sections, and footer', () => {
    const markdown = renderStickyComment(report, 'Coverage report', 5)
    expect(markdown).toContain('<!-- msw-inspector-comment -->')
    expect(markdown).toContain('## \u{1F534} Coverage report: 50% (1/2)')
    expect(markdown).toContain('<summary>Unmocked API calls (1)</summary>')
    expect(markdown).toContain('- `POST /payments` \u2014 src/api/payments.ts:7')
    expect(markdown).toContain('<summary>Stale handlers (1)</summary>')
    expect(markdown).toContain('- `POST /checkout` \u2014 src/mocks/checkout.ts:2')
    expect(markdown).toContain('[report an issue](https://github.com/felmonon/msw-inspector/issues)')
  })

  it('uses a green verdict and omits empty sections when everything is covered', () => {
    const covered = {
      ...report,
      staleHandlerIds: [],
      unmockedCallIds: [],
      mockedCallIds: ['call-1', 'call-2'],
      usedHandlerIds: ['handler-1', 'handler-2'],
      summary: { ...report.summary, mockedCalls: 2, unmockedCalls: 0, staleHandlers: 0, usedHandlers: 2, percentage: 100 },
    }
    const markdown = renderStickyComment(covered)
    expect(markdown).toContain('## \u{1F7E2} MSW mock coverage: 100% (2/2)')
    expect(markdown).not.toContain('<details>')
  })

  it('collapses overflow into a remainder line', () => {
    const markdown = renderStickyComment(report, 'Coverage report', 0)
    expect(markdown).not.toContain('<details>')
  })
})
