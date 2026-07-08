# Configuration

Run:

```bash
npx msw-inspector init
```

This creates `msw-inspector.config.cjs` in the current directory.

## Supported files

`msw-inspector` automatically looks for these files, in this order:

1. `msw-inspector.config.cjs`
2. `msw-inspector.config.js`
3. `msw-inspector.config.mjs`
4. `msw-inspector.config.json`

Use a custom path with:

```bash
npx msw-inspector --config ./config/msw-inspector.cjs
```

TypeScript config files are not loaded directly yet. Use `.cjs`, `.js`, `.mjs`, or `.json` so the published CLI can load config without requiring a project-specific transpiler.

## Example

```js
/** @type {import('msw-inspector-cli').MswInspectorConfig} */
module.exports = {
  handlers: [
    'src/mocks/**/*.{ts,tsx,js,jsx}',
    'mocks/**/*.{ts,tsx,js,jsx}',
  ],
  sources: [
    'src/**/*.{ts,tsx,js,jsx}',
    'app/**/*.{ts,tsx,js,jsx}',
  ],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    '**/*.d.ts',
  ],
  baseUrl: 'http://localhost:3000',
}
```

## API wrapper helpers

Most real apps wrap `fetch` or `axios` behind small helpers. Teach the scanner those wrappers explicitly:

```js
module.exports = {
  apiWrappers: [
    { name: 'api.get', method: 'GET', urlArg: 0 },
    { name: 'api.post', method: 'POST', urlArg: 0 },
    { name: 'api.delete', method: 'DELETE', urlArg: 0 },
  ],
}
```

That detects:

```ts
api.get('/api/user')
api.post('/api/checkout', body)
api.delete('/api/session')
```

For generic helpers:

```js
module.exports = {
  apiWrappers: [
    { name: 'request', urlArg: 0, methodFrom: 'options.method', optionsArg: 1 },
  ],
}
```

That detects:

```ts
request('/api/billing', { method: 'POST' })
```

For object-style helpers:

```js
module.exports = {
  apiWrappers: [
    { name: 'request', urlFrom: 'arg.url', methodFrom: 'arg.method' },
  ],
}
```

That detects:

```ts
request({ url: '/api/billing', method: 'POST' })
```

## CLI overrides

CLI flags override the config file:

```bash
npx msw-inspector \
  --handlers "mocks/**/*.{ts,tsx}" \
  --sources "src/**/*.{ts,tsx}" \
  --base-url "https://api.example.com"
```

Use config for normal project setup. Use flags for CI experiments, one-off scans, or debugging a narrower file set.
