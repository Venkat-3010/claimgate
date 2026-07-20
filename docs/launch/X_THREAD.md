# X / Twitter thread — ready to paste

1/
AI agents love saying "tests pass."

Meanwhile: it.skip on the failure, deleted suite, schema with no migration, missing Stripe key.

That's a false green.

2/
CI proves the pipeline ran.
It does not prove the agent's "done" matches the repo.

3/
I built Claimgate — evidence-gated verification for coding agents.

Re-run gates. Write a pack bound to git HEAD. GitHub Action replays in CI.

Don't trust the agent. Trust the evidence.

4/
Demos in the repo:

✅ examples/clean-green-api → PASS
❌ examples/agent-cheat-checkout → FAIL (skipped test + env drift)

5/
MCP for Cursor/Claude: exactly 3 tools — verify, status, list_gates.

https://github.com/Venkat-3010/claimgate

MIT. PRs welcome for Jest / Playwright / Prisma adapters.
