# Roadmap

Honest gaps vs a full SaaS / platform vision.

## Shipped in 0.1

- CLI verify + evidence packs
- Vitest / Drizzle / env / typescript / agent-rules adapters
- MCP (3 tools)
- GitHub Action (composite)
- False-green + clean-green examples
- Monorepo CI
- README SVG terminal demo (`docs/assets/demo.svg`)
- Launch drafts under `docs/launch/`
- npm publish prep (`publishConfig`, [RELEASE.md](./RELEASE.md)) — **not yet published** until `npm whoami` + scoped publish
- Good first issues: Jest / Playwright / Prisma adapters

## Near-term

- [ ] First npm publish of `@claimgate/*` (see RELEASE.md)
- [ ] JSON Schema for `claimgate.yaml` (`$schema` autocomplete)
- [ ] Richer vitest JSON reporter metrics
- [ ] Playwright / Jest / Prisma adapters ([#1](https://github.com/Venkat-3010/claimgate/issues/1), [#2](https://github.com/Venkat-3010/claimgate/issues/2), [#3](https://github.com/Venkat-3010/claimgate/issues/3))
- [ ] `claimgate baseline freeze` for explicit inventories
- [ ] Optional recorded GIF/asciinema alongside the SVG demo

## Later

- [ ] **Minimal web dashboard** — SQLite run history (deferred; CLI path prioritized)
- [ ] **Hosted SaaS** — org policies, attestations, SSO
- [ ] **Agent Receipts export** — signed portable claims for auditors
- [ ] Better Auth (only if dashboard needs auth)
- [ ] OpenAPI HTTP API (none in 0.1 — CLI/MCP only)
- [ ] Multi-language adapters (Python pytest, Go test, etc.)

## Non-goals (for now)

- Replacing CI
- Trusting agent-submitted packs for merge without replay
- Storing secret env values in packs
- Product Hunt account ops / posting launch drafts (drafts only in-repo)
