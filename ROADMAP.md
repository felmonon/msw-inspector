# Roadmap

`msw-inspector` is a small developer-tooling project. The roadmap should stay grounded in real MSW usage, especially cases where mock coverage silently drifts away from production API calls.

## v0.2 focus

### Adoption

- [x] Add copy-paste examples for common stacks such as Vite, Next.js, Vitest, Playwright, and React Query.
- [x] Document how to run the CLI in CI before using the GitHub Action.
- [x] Show one minimal demo layout with handlers, app code, and an expected JSON report.
- [x] Add `msw-inspector init` so first-time setup does not require memorizing globs.
- [x] Add config file support for repeatable team setup.

### Scanner precision

- [x] Improve terminal output so users can find the exact file and code shape to fix.
- [ ] Add regression fixtures for common `fetch`, `axios`, `http.*`, `rest.*`, and configured wrapper patterns.
- [x] Add limited configured wrapper-helper support without turning the analyzer into a runtime evaluator.
- [ ] Add more explicit unsupported-pattern messages for common dynamic URL shapes.

### GitHub Action

- [x] Keep the action output stable and predictable.
- [x] Add optional baseline/delta reporting when a previous JSON report is provided.
- [x] Add optional GitHub annotations for unmocked calls, stale handlers, and unsupported patterns.
- [x] Improve docs around sticky comments and summary-file usage.

## v0.3 candidates

- Create and link a live public demo repository.
- Add fixture coverage for wrapper helpers.
- Add a `--print-config` debug command.
- Add richer unsupported-pattern categories.
- Add monorepo/Turborepo/pnpm workspace examples.
- Explore a scoped package name if adoption grows.

## Good first issue candidates

- Add a framework-specific docs example.
- Add a small scanner fixture for a supported static URL pattern.
- Improve one CLI error message.
- Document one limitation with a clear example and workaround.
- Add a wrapper-helper fixture for `api.get('/path')`.

## Non-goals

- Runtime interception or browser automation.
- Guessing dynamic URLs that cannot be resolved statically.
- Replacing MSW, OpenAPI, or contract-testing tools.
- Large rewrites without a failing test or user-facing reason.

## How priorities are chosen

Issues are prioritized when they meet at least one of these criteria:

- They reproduce a real MSW drift problem.
- They reduce false positives or false negatives.
- They make CI adoption easier.
- They make the first contribution path clearer.
