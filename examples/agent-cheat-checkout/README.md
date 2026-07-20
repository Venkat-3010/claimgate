# Agent-cheat checkout

Looks "green" to a careless agent:

1. **Vitest** exits 0 because the promo regression is behind `it.skip`
2. **Env** contract requires `STRIPE_SECRET_KEY` and `CHECKOUT_WEBHOOK_SECRET` but `runtime.env` omits both

**Expected:** `claimgate verify` **FAIL**

```bash
pnpm install && pnpm build
cd examples/agent-cheat-checkout
pnpm verify
```
