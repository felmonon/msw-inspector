import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { scanHandlers } from '../src/core/scan-handlers'

const fixturesDir = path.join(process.cwd(), 'test/fixtures/handlers')

describe('scanHandlers', () => {
  it('extracts static msw handlers and flags unsupported ones', async () => {
    const result = await scanHandlers({
      cwd: fixturesDir,
      handlerGlobs: ['src/**/*.{ts,tsx,js,jsx,mts,mjs,cjs}'],
    })

    expect(result.handlers).toHaveLength(7)
    expect(result.unsupported).toHaveLength(1)

    expect(result.handlers.map((handler) => [handler.source, handler.method, handler.pattern.normalized])).toEqual([
      ['msw-http', 'GET', '/users/:id'],
      ['msw-rest', 'POST', 'https://api.example.com/v1/orders'],
      ['msw-http', 'DELETE', '/search/active'],
      ['msw-rest', 'GET', '/https?:\\/\\/example\\.com\\/legacy\\/.*/'],
      ['msw-rest', 'ALL', '/health'],
      ['msw-http', 'HEAD', 'https://api.example.com/logs'],
      ['msw-http', 'PUT', '/dynamic'],
    ])

    expect(result.unsupported.map((item) => item.reason)).toEqual([
      'bare new URL() is not supported; use .href or .toString()',
    ])
  })

  it('resolves relative handlers against a configured baseUrl', async () => {
    const result = await scanHandlers({
      cwd: fixturesDir,
      baseUrl: 'https://api.example.com/v2/',
      handlerGlobs: ['src/**/*.{ts,tsx,js,jsx,mts,mjs,cjs}'],
    })

    expect(result.handlers.map((handler) => [handler.method, handler.pattern.normalized])).toContainEqual([
      'GET',
      'https://api.example.com/users/:id',
    ])
    expect(result.handlers.map((handler) => [handler.method, handler.pattern.normalized])).toContainEqual([
      'DELETE',
      'https://api.example.com/search/active',
    ])
  })
})
