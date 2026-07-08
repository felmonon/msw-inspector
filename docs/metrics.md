# Adoption metrics

You cannot see exact user counts for a CLI package. Use public signals instead.

## npm downloads

```bash
curl https://api.npmjs.org/downloads/point/last-week/msw-inspector-cli
curl https://api.npmjs.org/downloads/point/last-month/msw-inspector-cli
curl https://api.npmjs.org/downloads/range/last-month/msw-inspector-cli
```

Also check package metadata:

```bash
npm view msw-inspector-cli
npm view msw-inspector-cli version
npm view msw-inspector-cli time
```

## GitHub signals

Check:

- stars
- forks
- watchers
- issues opened by people other than the maintainer
- PRs from contributors
- dependents, if GitHub detects any
- release downloads, if you attach release assets later

## Better private signals

Do not add telemetry by default. Developer tools earn trust by being quiet.

Better options:

- ask users to open issues with fixtures
- add a `--version` and `--debug` output users can paste into issues
- document an optional `DEBUG=msw-inspector:*` mode later
- use npm downloads and GitHub issues as the main public feedback loop

## Simple weekly scorecard

```text
Week of: YYYY-MM-DD
npm weekly downloads:
GitHub stars:
GitHub forks:
New issues:
New external PRs:
False positive reports:
False negative reports:
Most requested framework:
Most requested API wrapper shape:
Next release target:
```

The early goal is not huge numbers. The early goal is evidence that real MSW users understand the problem and can run the tool without help.
