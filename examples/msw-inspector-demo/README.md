# msw-inspector demo

A tiny copy-paste demo for showing what `msw-inspector` catches.

This demo intentionally includes:

- one covered API call
- one unmocked API call
- one stale MSW handler
- one config file
- one GitHub Actions workflow

## What this proves

`msw-inspector` is useful when tests still pass but the mock surface has drifted.

In this demo:

- `GET /api/user` is covered by an MSW handler.
- `POST /api/create-checkout-session` is called by app code but has no handler.
- `GET /api/stale` has a handler but no app code calls it.

## Run

```bash
npm install
npm run inspect
```

Expected shape:

```text
✓ 2 handlers found
✓ 2 API calls found
✗ 1 unmocked endpoints
✗ 1 stale mocks

Coverage: 50% (1/2)

Unmocked API calls
  ✗ POST http://localhost:3000/api/create-checkout-session
    Found in: src/api/billing.ts:2:26
    Suggested handler:
      http.post('/api/create-checkout-session', () => {
        return HttpResponse.json({})
      })
```

## CI

The workflow in `.github/workflows/msw-inspector.yml` writes a JSON report and publishes a PR comment/annotation through the GitHub Action.

## Copy into a standalone repo

To make the public demo repo:

```bash
gh repo create felmonon/msw-inspector-demo --public --clone
cp -R examples/msw-inspector-demo/* msw-inspector-demo/
cp -R examples/msw-inspector-demo/.github msw-inspector-demo/
cd msw-inspector-demo
git add .
git commit -m "Create msw-inspector demo"
git push origin main
```

Then link the standalone repo from the main README.
