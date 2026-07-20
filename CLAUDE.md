# CLAUDE.md

This file provides guidance to Claude Code / Claude when working with Claimgate.

- Read `AGENTS.md` first.
- Stack: pnpm workspaces, Turborepo, TypeScript strict, Zod, Vitest, Biome.
- Entry points: `packages/cli`, `packages/mcp`, `packages/core`.
- When changing gate behavior, update adapter tests and the false-green example if relevant.
- Do not add a fourth MCP tool without an explicit human decision.
