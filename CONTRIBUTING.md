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

Labeled [`good first issue`](https://github.com/Venkat-3010/claimgate/labels/good%20first%20issue) + [`help wanted`](https://github.com/Venkat-3010/claimgate/labels/help%20wanted):

1. **[Adapter: Jest](https://github.com/Venkat-3010/claimgate/issues/1)** — skips + deleted tests (mirror Vitest adapter).
2. **[Adapter: Playwright](https://github.com/Venkat-3010/claimgate/issues/2)** — `test.skip` / `fixme` + deleted specs.
3. **[Adapter: Prisma](https://github.com/Venkat-3010/claimgate/issues/3)** — schema without migrations (mirror Drizzle).

Template for adapters: `packages/adapters/vitest` (test inventory) or `packages/adapters/drizzle` (schema/migration).

Other starter ideas (file a new issue if you pick one up):

- CLI: `claimgate pack show <id>` — pretty-print a pack from `.claimgate/packs`
- Vitest: richer JSON reporter metrics
- Config: publish JSON Schema for `claimgate.yaml` autocomplete
- Baseline: `claimgate baseline freeze` to pin test file list

## Labels

See [docs/LABELS.md](./docs/LABELS.md).

## Releasing

See [RELEASE.md](./RELEASE.md). Do not publish unless `npm whoami` succeeds.

## Code of conduct

[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
