# Why not OpenAPI, Pact, or contract testing?

`msw-inspector` is not a replacement for MSW, OpenAPI, Pact, schema validation, or contract tests.

It solves a smaller problem:

> Did the frontend add API calls that our MSW mock layer forgot to cover?

## Use OpenAPI when

- you need a formal API schema
- you want request/response validation
- backend and frontend teams share a contract
- generated clients or docs matter

## Use Pact or contract testing when

- provider/consumer compatibility matters
- you need runtime verification between services
- teams release independently and need compatibility guarantees

## Use `msw-inspector` when

- your frontend tests use MSW
- new API calls quietly appear without handlers
- old handlers remain after product code stops calling them
- you want a fast static CI check before tests hide mock drift

## How they work together

A healthy setup can use all of them:

1. OpenAPI describes the backend contract.
2. MSW mocks the frontend test surface.
3. Contract tests verify provider/consumer compatibility.
4. `msw-inspector` checks whether your app's visible API calls are actually covered by MSW handlers.

That narrow job is the point. The tool should stay small, predictable, and easy to run in CI.
