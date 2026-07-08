# CI delta reporting

The CLI writes the current report:

```bash
npx msw-inspector --report-file msw-inspector.json --format json
```

The GitHub Action can compare that report against a previous report if you provide `baseline-file`.

```yaml
- uses: felmonon/msw-inspector-action@v1
  with:
    summary-file: msw-inspector.json
    baseline-file: baseline-msw-inspector.json
    comment: true
    annotate: true
```

When a baseline is present, the action reports:

- coverage percentage-point delta
- new unmocked API call count
- new stale handler count

It also exposes outputs:

```yaml
coverage-delta
new-unmocked-count
new-stale-count
```

## Where the baseline comes from

`msw-inspector` does not fetch old artifacts by itself. Keep that step explicit so the action stays predictable.

Common options:

1. Download the previous report from a workflow artifact.
2. Store the report in your CI cache.
3. Generate a baseline from the target branch before checking the PR branch.

Example target-branch baseline:

```yaml
- uses: actions/checkout@v4
  with:
    ref: ${{ github.base_ref }}
- run: npm ci
- run: npx msw-inspector --report-file baseline-msw-inspector.json --format json

- uses: actions/checkout@v4
- run: npm ci
- run: npx msw-inspector --report-file msw-inspector.json --format json

- uses: felmonon/msw-inspector-action@v1
  with:
    summary-file: msw-inspector.json
    baseline-file: baseline-msw-inspector.json
    comment: true
    annotate: true
```

For strict gates, keep the CLI as the source of failure:

```bash
npx msw-inspector --fail-on-unmocked --min-coverage 90
```

The action is for summaries, annotations, comments, and deltas.
