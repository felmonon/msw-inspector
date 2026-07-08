# Demo launch notes

Use this folder as the source for a standalone `felmonon/msw-inspector-demo` repo.

## Demo story

This project has two app API calls and two handlers.

Covered:

```ts
fetch('/api/user')
```

Matched by:

```ts
http.get('/api/user', ...)
```

Unmocked:

```ts
fetch('/api/create-checkout-session', { method: 'POST' })
```

Stale:

```ts
http.get('/api/stale', ...)
```

That gives a clean demo output: one covered call, one unmocked call, one stale handler, 50% coverage.

## Screenshot asset

Use `../../assets/msw-inspector-demo-output.svg` in the main repo README, launch post, or social cards.
