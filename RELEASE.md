# Releasing Claimgate to npm

Packages under `@claimgate/*` are published publicly. The root `claimgate` workspace is **private** and is never published.

## Prerequisites

```bash
# Must succeed before publish
npm whoami
```

If that fails:

```bash
npm login
# or: npm adduser
```

Confirm you can publish the `@claimgate` scope (org membership or unscoped first publish of the scope).

## One-command publish (recommended)

From the repo root, after a green CI locally:

```bash
pnpm install
pnpm lint && pnpm test && pnpm build
pnpm pack:check
pnpm -r --filter "./packages/**" publish --access public --no-git-checks
```

`pnpm` rewrites `workspace:*` dependencies to the published versions automatically.

## Packages published

| Package | Bin / notes |
| --- | --- |
| `@claimgate/config` | Zod schema for `claimgate.yaml` |
| `@claimgate/core` | Packs, policy, runner |
| `@claimgate/adapter-vitest` | Vitest gate |
| `@claimgate/adapter-drizzle` | Drizzle gate |
| `@claimgate/adapter-env` | Env-contract gate |
| `@claimgate/adapter-typescript` | Typecheck + `command` gate |
| `@claimgate/adapter-agent-rules` | AGENTS.md / rules gate |
| `@claimgate/cli` | `claimgate` binary |
| `@claimgate/mcp` | `claimgate-mcp` binary |

Publish **bottom-up** if publishing package-by-package: `config` → `core` → adapters → `cli` / `mcp`.

## Dry-run pack checks

```bash
pnpm pack:check
# or per package:
pnpm --filter @claimgate/core exec npm pack --dry-run
pnpm --filter @claimgate/cli exec npm pack --dry-run
pnpm --filter @claimgate/mcp exec npm pack --dry-run
```

Inspect the file list: `dist/`, `bin/` (cli/mcp), no `src/`, no fixtures unless intentional.

## Version bumps

Bump all publishable package versions together for a coordinated release (currently `0.1.0`). Update `CHANGELOG.md` and `packages/cli` / MCP `VERSION` constants if present.

## After publish

```bash
pnpm add -D @claimgate/cli
pnpm exec claimgate --help
npx -y @claimgate/mcp   # MCP stdio server
```

Tag the release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Not published

- Root workspace (`private: true`)
- `examples/*`
- GitHub Action under `action/` (consumed via `uses: Venkat-3010/claimgate/action@…`)
