# False-green demo

This example looks "green" to a careless agent:

1. **Vitest** exits 0 because the only failing scenario is behind `it.skip`
2. **Drizzle** schema defines `invoices` with **no migrations**
3. **Env** contract requires `STRIPE_SECRET_KEY` but `runtime.env` omits it

Run from the monorepo root after `pnpm install && pnpm build`:

```bash
cd examples/false-green-demo
pnpm exec claimgate verify
```

Expected: **FAIL** with findings for skipped tests, missing migration, and env drift.
