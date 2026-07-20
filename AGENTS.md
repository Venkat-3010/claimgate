# AGENTS.md

Instructions for AI coding agents working in this repository.

## Product

Claimgate re-verifies agent claims with independent gates and evidence packs.
Tagline: **Don't trust the agent. Trust the evidence.**

## Rules

1. Keep MCP tools at **exactly three**: `verify`, `status`, `list_gates`.
2. Prefer extending adapters over new packages unless a clean boundary exists.
3. Strict TypeScript — **no `any`**.
4. Do not commit secrets; env adapter must never log values.
5. `examples/false-green-demo` must **fail** `claimgate verify`.
6. CI must re-run gates; do not treat local packs as merge authority.
7. Follow linear coding: smallest correct change, no drive-by refactors.

## Commands

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm exec claimgate --help
```

## Layout

See README monorepo layout. Packages under `packages/`; adapters under `packages/adapters/*`.
