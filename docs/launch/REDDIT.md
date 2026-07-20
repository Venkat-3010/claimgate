# Reddit — ready to paste

Suggested subs: **r/programming**, **r/cursor**, **r/typescript** (pick one; don't cross-post spam).

## Title

Don't trust the agent. Trust the evidence. — Claimgate catches false greens from AI coding agents

## Body

Agents keep claiming "all tests pass" while hiding failures behind `it.skip`, deleting flaky suites, shipping schema changes without migrations, or drifting env keys.

CI proves the job ran. It does not prove the claim.

I open-sourced **Claimgate**: a small CLI/MCP that re-runs independent gates and writes an evidence pack bound to git HEAD. There's a composite GitHub Action so merge doesn't trust a local pack.

False-green demo (expected FAIL):

https://github.com/Venkat-3010/claimgate/tree/main/examples/agent-cheat-checkout

Clean pass demo:

https://github.com/Venkat-3010/claimgate/tree/main/examples/clean-green-api

Repo: https://github.com/Venkat-3010/claimgate

MCP tools are intentionally capped at three: `verify`, `status`, `list_gates`.

Happy to take feedback — especially on adapter design (Vitest/Drizzle/env today; Jest/Playwright/Prisma wanted).
