# Demo blueprint

A public demo repo makes adoption easier than a long explanation. Suggested repo name:

```text
felmonon/msw-inspector-demo
```

## What the demo should show

The demo should intentionally contain:

1. one covered endpoint
2. one unmocked endpoint
3. one stale handler
4. a GitHub Action comment
5. a screenshot or pasted sample output in the README

## Minimal files

```text
src/api/user.ts
src/api/billing.ts
src/mocks/handlers.ts
msw-inspector.config.cjs
.github/workflows/msw-inspector.yml
```

## Covered call

```ts
// src/api/user.ts
export async function loadUser() {
  const response = await fetch('/api/user')
  return response.json()
}
```

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/user', () => HttpResponse.json({ id: 'user-1' })),
  http.get('/api/stale', () => HttpResponse.json({ ok: true })),
]
```

## Unmocked call

```ts
// src/api/billing.ts
export async function createCheckout() {
  const response = await fetch('/api/create-checkout-session', { method: 'POST' })
  return response.json()
}
```

## Config

```js
/** @type {import('msw-inspector-cli').MswInspectorConfig} */
module.exports = {
  handlers: ['src/mocks/**/*.{ts,tsx}'],
  sources: ['src/**/*.{ts,tsx}'],
  baseUrl: 'http://localhost:3000',
}
```

## Expected output

```text
✓ 2 handlers found
✓ 2 API calls found
✗ 1 unmocked endpoints
✗ 1 stale mocks

Coverage: 50% (1/2)
```

This demo should be linked from the main README once it exists.
