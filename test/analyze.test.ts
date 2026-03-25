import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { analyzeProject } from '../src/core/analyze'

describe('analyzeProject', () => {
  it('builds a mock coverage report across handlers and API calls', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'msw-inspector-analyze-'))
    const mocksDir = path.join(cwd, 'src', 'mocks')
    const apiDir = path.join(cwd, 'src', 'api')

    await mkdir(mocksDir, { recursive: true })
    await mkdir(apiDir, { recursive: true })

    await writeFile(
      path.join(mocksDir, 'handlers.ts'),
      `
        import { http } from 'msw'

        export const handlers = [
          http.get('/users/:id', () => null),
          http.post('/checkout', () => null),
        ]
      `,
      'utf8',
    )

    await writeFile(
      path.join(apiDir, 'client.ts'),
      `
        import axios from 'axios'

        export async function run() {
          await fetch('https://api.example.com/users/123?include=profile')
          await axios.post('/checkout')
          await fetch('/billing')
        }
      `,
      'utf8',
    )

    const report = await analyzeProject({
      cwd,
      handlerGlobs: ['src/mocks/**/*.ts'],
      sourceGlobs: ['src/api/**/*.ts'],
    })

    expect(report.schemaVersion).toBe(1)
    expect(report.summary).toEqual({
      mockedCalls: 2,
      totalCalls: 3,
      usedHandlers: 2,
      totalHandlers: 2,
      staleHandlers: 0,
      unmockedCalls: 1,
      percentage: 66.7,
    })
    expect(report.unmockedCallIds).toHaveLength(1)
    expect(report.matches).toEqual([
      { callId: report.apiCalls[0]?.id, handlerId: report.handlers[0]?.id },
      { callId: report.apiCalls[1]?.id, handlerId: report.handlers[1]?.id },
    ])
  })
})
