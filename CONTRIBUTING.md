# Contributing to Claimgate

Thanks for helping make agent "done" mean something.

## Setup

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

Use Node 20+ and pnpm 9+.

## Project map

- `packages/core` — evidence packs, runner, policy
- `packages/cli` — user-facing CLI
- `packages/mcp` — MCP tools (`verify`, `status`, `list_gates` only)
- `packages/adapters/*` — gate implementations
- `examples/false-green-demo` — must fail `claimgate verify`

## Pull requests

1. Keep diffs focused (one concern per PR).
2. Add/adjust tests for adapters and policy.
3. Run `pnpm lint && pnpm typecheck && pnpm test`.
4. Do not expand MCP beyond 3 tools without an issue + major version discussion.
5. Never commit secrets or real `.env` values.

## Good First Issues

Ideal starters (file issues with label `good first issue`):

1. **Adapter: Playwright** — fail if `test.skip` / `fixme` newly introduced.
2. **CLI: `claimgate pack show <id>`** — pretty-print a pack from `.claimgate/packs`.
3. **Vitest: JSON reporter metrics** — parse vitest `--reporter=json` for pass/fail counts.
4. **Docs: GIF** — record `examples/false-green-demo` verify failure for README.
5. **Action: pnpm cache** — harden `action/action.yml` for npm-only repos.
6. **Config: `$schema`** — publish JSON Schema for `claimgate.yaml` autocomplete.
7. **Baseline: explicit lock** — `claimgate baseline freeze` to pin test file list.

## Labels

See [docs/LABELS.md](./docs/LABELS.md).

## Code of conduct

[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
