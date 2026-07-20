# Roadmap

Honest gaps vs a full SaaS / platform vision.

## Shipped in 0.1

- CLI verify + evidence packs
- Vitest / Drizzle / env / typescript / agent-rules adapters
- MCP (3 tools)
- GitHub Action (composite)
- False-green example
- Monorepo CI

## Near-term

- [ ] Publish packages to npm under `@claimgate/*` and `claimgate` bin
- [ ] JSON Schema for `claimgate.yaml` (`$schema` autocomplete)
- [ ] Richer vitest JSON reporter metrics
- [ ] Playwright / Jest adapters
- [ ] `claimgate baseline freeze` for explicit inventories
- [ ] Replace README GIF placeholder with real recording

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
