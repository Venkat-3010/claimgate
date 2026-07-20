# Show HN — ready to paste

## Title

Show HN: Claimgate – don't trust the agent, trust the evidence

## Body

AI coding agents keep telling me "tests pass" and "env is fine" while quietly introducing false greens: `it.skip` on the failing case, deleted flaky suites, schema changes without migrations, missing secrets in `.env`.

CI only proves the pipeline ran. It does not prove the agent's "done" matches the repo.

**Claimgate** re-runs independent gates, writes an evidence pack bound to git HEAD, and ships a GitHub Action so merge never trusts a local pack alone.

What it catches today:

- New Vitest skips / deleted test files (vs last pack baseline)
- Drizzle schema without migrations
- Env-contract drift (`.env.example` keys missing from runtime env)
- Typecheck / arbitrary command exit codes
- Missing `AGENTS.md` / agent-rules files

Try the false-green demos:

```
git clone https://github.com/Venkat-3010/claimgate
cd claimgate && pnpm install && pnpm build
cd examples/agent-cheat-checkout && pnpm verify   # expected FAIL
cd ../clean-green-api && pnpm verify              # expected PASS
```

MCP for Cursor/Claude: exactly three tools — `verify`, `status`, `list_gates`.

Repo: https://github.com/Venkat-3010/claimgate  
MIT. Looking for adapter contributors (Jest, Playwright, Prisma) — see good first issues.
