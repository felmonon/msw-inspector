# Playwright + MSW Quickstart

This example shows how to point `msw-inspector` at a Playwright project that
keeps MSW handlers under `src/mocks/` and browser tests under `e2e/` or
`tests/`.

## Minimal handler file

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/user", () => {
    return HttpResponse.json({ id: "user-1", name: "Ada" });
  }),
];
```

## Minimal app API-call file

```ts
// src/api/user.ts
export async function loadUser() {
  const response = await fetch("/api/user");
  if (!response.ok) {
    throw new Error("Failed to load user");
  }
  return response.json();
}
```

## Minimal Playwright test file

```ts
// e2e/user.spec.ts
import { expect, test } from "@playwright/test";

test("shows the current user", async ({ page }) => {
  await page.goto("/users");
  await expect(page.getByText("Ada")).toBeVisible();
});
```

## Run the inspector

Install the package:

```bash
npm install -D msw-inspector-cli
```

Then run the binary from your project root:

```bash
npx msw-inspector \
  --handlers "src/mocks/**/*.{ts,tsx,js,jsx}" \
  --sources "src/**/*.{ts,tsx,js,jsx}" "e2e/**/*.{ts,tsx,js,jsx}" "tests/**/*.{ts,tsx,js,jsx}" \
  --exclude "**/node_modules/**" "**/dist/**" "**/playwright-report/**" "**/test-results/**" "**/*.d.ts" \
  --base-url "http://localhost:3000" \
  --format text
```

Use `--handlers` for files that export `http.*` or `rest.*` MSW handlers. Use
`--sources` for application files and Playwright tests that make `fetch` or
supported `axios` calls. Including both the app source and the browser tests is
useful when tests call API helpers directly or cover routes that trigger API
calls from the page.

The `--base-url` option helps when handlers and app calls stay relative, such as
`/api/user`, but the Playwright server runs at a concrete origin.

## CI gate

For CI, write a JSON report and enable the gates that should fail the job:

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
      - run: |
          npx msw-inspector \
            --handlers "src/mocks/**/*.{ts,tsx,js,jsx}" \
            --sources "src/**/*.{ts,tsx,js,jsx}" "e2e/**/*.{ts,tsx,js,jsx}" "tests/**/*.{ts,tsx,js,jsx}" \
            --exclude "**/node_modules/**" "**/dist/**" "**/playwright-report/**" "**/test-results/**" "**/*.d.ts" \
            --base-url "http://localhost:3000" \
            --report-file msw-inspector.json \
            --format json \
            --min-coverage 80 \
            --fail-on-unmocked \
            --fail-on-empty
```

## Read the result

An unmocked call means `msw-inspector` found a request in `--sources` that has no
matching handler in `--handlers`. Add a handler or narrow the source glob if the
call is outside the mocked test surface.

A stale handler means a handler exists but no scanned source currently calls
that route. Remove it if it is obsolete, or expand the source glob if another
test helper still uses it.
