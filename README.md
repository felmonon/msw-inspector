# msw-inspector

Find gaps in your API mock coverage before they reach CI.

MSW handlers drift. API calls get added without mocks, and old mocks stay behind after the code moves on. `msw-inspector` scans both sides, compares them, and reports what is covered, what is not, and what looks stale.

## Install

```bash
npm install -D msw-inspector-cli
```

The npm package is published as `msw-inspector-cli` because the original `msw-inspector` name is already taken on the registry. The installed binary remains `msw-inspector`.

## CLI

Run it from the project root:

```bash
npx msw-inspector
```

Or run it without installing first:

```bash
npx msw-inspector-cli
```

Useful flags:

```bash
npx msw-inspector \
  --handlers "src/**/*.{ts,tsx,js,jsx,mts,mjs,cjs}" \
  --sources "src/**/*.{ts,tsx,js,jsx,mts,mjs,cjs}" \
  --exclude "**/dist/**" "**/*.d.ts" \
  --report-file msw-inspector.json \
  --format text
```

The CLI prints a human-readable summary by default. Use `--format json` when you want the full report for CI or a downstream action.

## Output

Text output looks like this:

```bash
✓ 23 handlers found
✓ 31 API calls found
✗ 8 unmocked endpoints
✗ 3 stale mocks

Coverage: 74% (23/31)
```

The JSON report written by `--report-file` includes:

```json
{
  "schemaVersion": 1,
  "summary": {
    "mockedCalls": 23,
    "totalCalls": 31,
    "usedHandlers": 20,
    "totalHandlers": 23,
    "staleHandlers": 3,
    "unmockedCalls": 8,
    "percentage": 74.2
  }
}
```

## Supported patterns

The first release is intentionally narrow:

- `msw` `http.*` handlers
- legacy `msw` `rest.*` handlers
- handler matchers from string literals, static template literals, static `const`s, `new URL(...).href`, `new URL(...).toString()`, and `String(new URL(...))`
- `fetch(...)`, `window.fetch(...)`, `globalThis.fetch(...)`
- common `axios` call shapes, including `axios.get(...)`, `axios.request(...)`, `axios(...)`, and same-file `axios.create(...)` instances

## GitHub Action

The repo ships with a thin GitHub Action wrapper. It reads the JSON report that the CLI already produced, writes a job summary, and can optionally upsert one sticky PR comment.

Because the repository includes `action.yml` and branding metadata, you can publish this Action to the GitHub Marketplace once you cut a tagged release.

```yaml
name: msw coverage

on:
  pull_request:
  push:

jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx msw-inspector --report-file msw-inspector.json --format json
      - uses: felmonon/msw-inspector@v1
        with:
          summary-file: msw-inspector.json
          comment: true
```

The action does not compute a baseline delta yet. It publishes the current report cleanly and predictably.

## Limitations

- It does not try to infer custom wrapper helpers.
- It does not resolve cross-file constants or imported axios instances.
- It does not analyze GraphQL, WebSocket, or SSE handlers.
- It reports dynamic or ambiguous patterns as unsupported instead of guessing.

## Local Development

```bash
npm install
npm test
npm run typecheck
npm run build
```

If you are changing the scanning logic, keep the test fixtures small and explicit. The tool is more useful when it stays opinionated.
