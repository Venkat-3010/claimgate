# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-07-21

### Added

- Monorepo: `@claimgate/config`, `@claimgate/core`, `@claimgate/cli`, `@claimgate/mcp`
- Adapters: vitest, drizzle, env, typescript/command, agent-rules
- CLI: `init`, `verify`, `status`, `list-gates`
- Evidence packs bound to git HEAD with skip/delete baselines
- MCP server with exactly three tools: `verify`, `status`, `list_gates`
- Composite GitHub Action under `action/`
- Example `examples/false-green-demo`
- Docker image + Compose stub
- OSS meta: LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, ROADMAP, AGENTS.md
