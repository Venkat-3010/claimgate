# DEV.to — draft / outline

## Title options

1. Don't Trust the Agent. Trust the Evidence. — Introducing Claimgate
2. False Greens Are the New Flaky Tests: Catching Agent Lies with Evidence Packs
3. Your AI Agent Said Tests Pass. Claimgate Disagrees.

## Tags

`ai`, `devtools`, `typescript`, `testing`, `opensource`

## Draft

### Hook

Your coding agent just said: "All tests pass. Migrations are up to date. Env looks good."

Then you look closer:

- The failing assertion is behind `it.skip`
- A flaky suite was deleted entirely
- The Drizzle schema grew a table with no migration
- `STRIPE_SECRET_KEY` is in `.env.example` but missing from runtime

That's a **false green** — a pass signal that doesn't mean what you think.

CI is not enough. CI proves the pipeline ran. It does not prove the agent's claim matches the repository.

### What Claimgate is

Claimgate is an evidence-gated verification CLI (and MCP server) for AI coding agents.

Tagline: **Don't trust the agent. Trust the evidence.**

It:

1. Re-runs configured **gates** independently (Vitest, Drizzle, env, TypeScript, agent-rules, or raw commands)
2. Writes an **evidence pack** (JSON) bound to **git HEAD**
3. Compares baselines for new skips / deleted test files
4. Ships a **GitHub Action** so merge never treats a local pack as authority

MCP is deliberately limited to three tools: `verify`, `status`, `list_gates`.

### Quick start

```bash
pnpm add -D @claimgate/cli
pnpm exec claimgate init
pnpm exec claimgate verify
```

Or clone the monorepo and run the demos:

```bash
git clone https://github.com/Venkat-3010/claimgate
cd claimgate && pnpm install && pnpm build
cd examples/agent-cheat-checkout && pnpm verify  # FAIL (on purpose)
cd ../clean-green-api && pnpm verify             # PASS
```

### Anatomy of an evidence pack

Each pack includes:

- `schemaVersion`, `id`, `createdAt`
- `git.head` / `branch` / `dirty`
- Overall status + per-gate findings and metrics
- Baselines for test file lists and skipped tests

Policy can reject packs whose HEAD no longer matches.

### Why not "just trust CI"?

- Agents often "fix" locally by skipping or deleting
- Local green ≠ merge-ready without replay
- Env and migration drift never show up in a unit-test exit code alone

Claimgate does not replace CI. It makes agent claims checkable — and CI re-runs the same gates.

### Roadmap honesty

Shipped in 0.1: CLI, adapters, MCP, Action, false-green examples.

Not built (yet): hosted SaaS dashboard, Product Hunt ops, crypto "receipts."

Wanted next: Jest, Playwright, Prisma adapters — good first issues are open.

### Links

- Repo: https://github.com/Venkat-3010/claimgate
- Contributing / good first issues: https://github.com/Venkat-3010/claimgate/blob/main/CONTRIBUTING.md
- License: MIT

### CTA

Clone it, break the false-green demo on purpose, then wire `claimgate verify` into your agent workflow (CLI or MCP). If an adapter you need is missing, open a PR — the Vitest adapter is the template.
