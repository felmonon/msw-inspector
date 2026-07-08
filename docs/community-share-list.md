# Community share checklist

Share only after the README, demo, CI, and npm release are ready.

## Best places to share

- MSW GitHub Discussions, if the maintainers allow tooling posts
- Vitest community spaces
- Playwright community spaces
- React Query / TanStack community spaces
- Frontend testing newsletters
- Dev.to
- Hacker News Show HN
- Reddit communities focused on JavaScript, TypeScript, frontend, and testing

## What to ask for

Do not ask for stars first. Ask for fixtures.

Good ask:

> If this misses your API helper shape, send me a tiny fixture and I will add scanner coverage.

Bad ask:

> Please star my repo.

## Best feedback questions

- What stack are you using?
- Are your API calls direct `fetch`/Axios, or wrapped?
- Did the scanner miss a real call?
- Did it report a false positive?
- Would you fail CI on unmocked calls, stale handlers, or only coverage percentage?

## Launch order

1. Publish npm release.
2. Create demo repo.
3. Add demo link to README.
4. Post short announcement.
5. Reply to every real technical comment.
6. Convert repeated questions into docs.
7. Convert missed patterns into tests.
