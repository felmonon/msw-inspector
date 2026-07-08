# React Query / TanStack Query Quickstart

`msw-inspector` does not need to understand React Query itself. It scans the fetcher functions that your queries call.

## Query code

```ts
// src/api/user.ts
export async function loadUser() {
  const response = await fetch('/api/user')
  if (!response.ok) {
    throw new Error('Failed to load user')
  }
  return response.json()
}
```

```tsx
// src/features/user/use-user.tsx
import { useQuery } from '@tanstack/react-query'
import { loadUser } from '../../api/user'

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: loadUser,
  })
}
```

## Handler file

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({ id: 'user-1', name: 'Ada' })
  }),
]
```

## Config

```js
/** @type {import('msw-inspector-cli').MswInspectorConfig} */
module.exports = {
  handlers: ['src/mocks/**/*.{ts,tsx,js,jsx}'],
  sources: ['src/**/*.{ts,tsx,js,jsx}'],
  baseUrl: 'http://localhost:3000',
}
```

## With a custom API helper

If your query functions use a helper:

```ts
api.get('/api/user')
api.post('/api/checkout')
```

add wrapper rules:

```js
module.exports = {
  handlers: ['src/mocks/**/*.{ts,tsx,js,jsx}'],
  sources: ['src/**/*.{ts,tsx,js,jsx}'],
  baseUrl: 'http://localhost:3000',
  apiWrappers: [
    { name: 'api.get', method: 'GET', urlArg: 0 },
    { name: 'api.post', method: 'POST', urlArg: 0 },
  ],
}
```

## Run

```bash
npx msw-inspector
```

Use `--format json --report-file msw-inspector.json` in CI.
